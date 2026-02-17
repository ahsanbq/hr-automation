import type { NextApiRequest, NextApiResponse } from "next";
import multer from "multer";
import { prisma } from "@/lib/db";
import { S3Service } from "@/lib/s3-service";
import { AIResumeService } from "@/lib/ai-resume-service";
import crypto from "crypto";

// Configure multer identical to the existing CV parsing module
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "application/rtf",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only PDF, DOC, DOCX, TXT, and RTF files are allowed."
        )
      );
    }
  },
});

export const config = {
  api: { bodyParser: false },
};

interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

interface MulterRequest extends NextApiRequest {
  files?: UploadedFile[];
  file?: UploadedFile;
}

function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

/**
 * POST /api/apply/:token/upload
 * Public endpoint — uploads CV through the same pipeline as CV Parsing module.
 * Concurrency-safe: uses atomic DB increment.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { token } = req.query;
  if (!token || typeof token !== "string") {
    return res.status(400).json({ error: "Token is required" });
  }

  try {
    // ─── 1. Validate Link ──────────────────────────────────────
    const link = await prisma.jobApplicationLink.findUnique({
      where: { token },
      include: {
        jobPost: {
          include: { companies: true },
        },
      },
    });

    if (!link || link.status !== "ACTIVE") {
      return res.status(410).json({
        error: "LINK_INVALID",
        message: "This application link is no longer active.",
      });
    }

    if (new Date() > link.expiresAt) {
      await prisma.jobApplicationLink.update({
        where: { id: link.id },
        data: { status: "EXPIRED" },
      });
      return res.status(410).json({
        error: "EXPIRED",
        message: "This application link has expired.",
      });
    }

    if (link.currentCvCount >= link.maxCvLimit) {
      await prisma.jobApplicationLink.update({
        where: { id: link.id },
        data: { status: "CLOSED" },
      });
      return res.status(410).json({
        error: "CLOSED",
        message: "Maximum number of applications reached.",
      });
    }

    // ─── 2. Run Multer ──────────────────────────────────────
    await runMiddleware(req, res, upload.array("resumes", 1)); // 1 file at a time for public upload
    const multerReq = req as MulterRequest;
    const files = multerReq.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const file = files[0];
    const jobId = link.jobId;
    const jobPost = link.jobPost;

    // ─── 3. Concurrency-safe: Atomic increment + check ────────
    // Use a transaction to atomically check + increment to prevent race conditions
    const updatedLink = await prisma.$transaction(async (tx) => {
      const current = await tx.jobApplicationLink.findUnique({
        where: { id: link.id },
      });

      if (
        !current ||
        current.status !== "ACTIVE" ||
        current.currentCvCount >= current.maxCvLimit
      ) {
        throw new Error("LIMIT_REACHED");
      }

      return tx.jobApplicationLink.update({
        where: { id: link.id },
        data: {
          currentCvCount: { increment: 1 },
          // Auto-close if this is the last allowed upload
          status:
            current.currentCvCount + 1 >= current.maxCvLimit
              ? "CLOSED"
              : "ACTIVE",
        },
      });
    });

    // ─── 4. Upload to S3 (same as CV Parsing module) ────────
    const resumeId = crypto.randomUUID();
    console.log(
      `📁 [PublicLink] Uploading ${file.originalname} for job ${jobId}`
    );

    const uploadResult = await S3Service.uploadResume(
      file.buffer,
      file.originalname,
      jobId,
      resumeId
    );

    if (!uploadResult.success || !uploadResult.url) {
      // Rollback the count increment
      await prisma.jobApplicationLink.update({
        where: { id: link.id },
        data: {
          currentCvCount: { decrement: 1 },
          status: "ACTIVE", // Re-open if was just closed
        },
      });
      return res.status(500).json({
        error: "Failed to upload file to storage",
        details: uploadResult.error,
      });
    }

    // ─── 5. Trigger AI analysis with retry (same pipeline as CV Parsing) ────
    console.log(`🤖 [PublicLink] Analyzing resume for job ${jobId}`);

    const jobReq = AIResumeService.mapJobPostToJobReq(jobPost);

    // Use retry wrapper — will attempt up to 3 times total
    const analysisResponse = await AIResumeService.analyzeResumesWithRetry(
      { resume_paths: [uploadResult.url], job_req: jobReq },
      2 // 2 retries = 3 total attempts
    );

    const analysis = analysisResponse.analyses?.[0];

    if (!analysis || !analysis.success) {
      // AI returned but analysis itself failed — rollback count
      await prisma.jobApplicationLink.update({
        where: { id: link.id },
        data: {
          currentCvCount: { decrement: 1 },
          status: "ACTIVE",
        },
      });
      console.error("❌ [PublicLink] AI analysis returned failure:", analysis);
      return res.status(500).json({
        error: "Resume analysis failed. Please try uploading again.",
      });
    }

    // ─── 6. Save fully-analyzed resume (same as built-in CV Parsing) ─────
    // Convert education array/object to JSON string (DB field is String?)
    let educationStr: string | null = null;
    if (analysis.candidate?.education) {
      if (Array.isArray(analysis.candidate.education)) {
        educationStr = JSON.stringify(analysis.candidate.education);
      } else if (typeof analysis.candidate.education === "string") {
        educationStr = analysis.candidate.education;
      } else {
        educationStr = JSON.stringify(analysis.candidate.education);
      }
    }

    const savedResume = await prisma.resume.create({
      data: {
        id: resumeId,
        resumeUrl: analysis.resume_path || uploadResult.url,
        s3Key: uploadResult.key,
        candidateName: analysis.candidate?.name || "Unknown Candidate",
        candidateEmail: analysis.candidate?.email || null,
        candidatePhone: analysis.candidate?.phone || null,
        matchScore: analysis.candidate?.match_score || null,
        recommendation: analysis.analysis?.recommendation || null,
        skills: analysis.candidate?.skills || [],
        experienceYears: analysis.candidate?.experience_years || null,
        education: educationStr,
        summary: analysis.candidate?.summary || null,
        location: analysis.candidate?.location || null,
        linkedinUrl: analysis.candidate?.linkedin_url || null,
        githubUrl: analysis.candidate?.github_url || null,
        currentJobTitle: analysis.candidate?.current_job_title || null,
        processingMethod:
          analysis.candidate?.processing_method || "PUBLIC_LINK",
        analysisTimestamp: analysis.candidate?.analysis_timestamp
          ? new Date(analysis.candidate.analysis_timestamp)
          : new Date(),
        fileName: analysis.analysis?.file_name || file.originalname,
        fileSizeMb:
          analysis.analysis?.file_size_mb ||
          Number((file.size / 1024 / 1024).toFixed(2)),
        processingTime: analysis.analysis?.processing_time || null,
        matchedSkills: analysis.analysis?.matched_skills || [],
        source: "PUBLIC_LINK",
        jobPostId: jobId,
        uploadedById: null, // Public upload — no authenticated user
        updatedAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Your application has been submitted successfully!",
      resumeId: savedResume.id,
      remaining: updatedLink.maxCvLimit - updatedLink.currentCvCount,
    });
  } catch (error: any) {
    if (error.message === "LIMIT_REACHED") {
      return res.status(410).json({
        error: "CLOSED",
        message: "Maximum number of applications reached.",
      });
    }

    console.error("❌ [PublicLink] Upload error:", error);

    // If the error happened after we incremented the count, rollback
    if (error.message?.includes("AI API failed") || error.message?.includes("analysis")) {
      try {
        const { token: tkn } = req.query;
        if (tkn && typeof tkn === "string") {
          const existingLink = await prisma.jobApplicationLink.findUnique({
            where: { token: tkn },
          });
          if (existingLink && existingLink.currentCvCount > 0) {
            await prisma.jobApplicationLink.update({
              where: { id: existingLink.id },
              data: { currentCvCount: { decrement: 1 }, status: "ACTIVE" },
            });
          }
        }
      } catch (rollbackErr) {
        console.error("❌ [PublicLink] Rollback error:", rollbackErr);
      }
    }

    if (error instanceof Error && error.message.includes("Invalid file type")) {
      return res.status(400).json({ error: error.message });
    }
    if (error instanceof Error && error.message.includes("File too large")) {
      return res.status(400).json({ error: "File size exceeds 10MB limit" });
    }

    return res.status(500).json({
      error: "Failed to process your application. Please try again.",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

