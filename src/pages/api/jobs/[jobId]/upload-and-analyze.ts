import type { NextApiRequest, NextApiResponse } from "next";
import multer from "multer";
import { S3Service } from "@/lib/s3-service";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  AIResumeService,
  ResumeAnalysisRequest,
} from "@/lib/ai-resume-service";

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only resume file types
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

// Disable default body parser to handle multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
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
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Authenticate user
  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { jobId } = req.query;
  if (!jobId || typeof jobId !== "string") {
    return res.status(400).json({ error: "Job ID is required" });
  }

  // Verify job exists and user has access
  const jobPost = await prisma.jobPost.findFirst({
    where: {
      id: jobId,
      createdById: user.userId,
    },
    include: {
      companies: true,
    },
  });

  if (!jobPost) {
    return res.status(404).json({ error: "Job not found or access denied" });
  }

  try {
    // Run multer middleware
    await runMiddleware(req, res, upload.array("resumes", 20)); // Max 20 files

    const multerReq = req as MulterRequest;
    const files = multerReq.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    console.log(`📁 Processing ${files.length} file(s) for job ${jobId}`);

    // Step 1: Upload all files to S3
    const uploadResults = [];
    const failedUploads = [];

    for (const file of files) {
      try {
        // Generate unique resume ID
        const resumeId = crypto.randomUUID();

        console.log(
          `⬆️ Uploading ${file.originalname} (${(
            file.size /
            1024 /
            1024
          ).toFixed(2)}MB)`
        );

        // Upload to S3
        const uploadResult = await S3Service.uploadResume(
          file.buffer,
          file.originalname,
          jobId,
          resumeId
        );

        if (uploadResult.success && uploadResult.url) {
          uploadResults.push({
            resumeId,
            fileName: file.originalname,
            fileSize: file.size,
            s3Url: uploadResult.url,
            s3Key: uploadResult.key,
            success: true,
          });
        } else {
          failedUploads.push({
            fileName: file.originalname,
            error: uploadResult.error || "Upload failed",
          });
        }
      } catch (error) {
        console.error(`❌ Error uploading ${file.originalname}:`, error);
        failedUploads.push({
          fileName: file.originalname,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    if (uploadResults.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No files were successfully uploaded",
        failures: failedUploads,
      });
    }

    // Step 2: Analyze uploaded resumes using AI
    console.log(
      `🤖 Starting AI analysis for ${uploadResults.length} uploaded resumes`
    );

    const resumeUrls = uploadResults.map((result) => result.s3Url);

    // Convert JobPost to format expected by external AI API
    const jobReq = AIResumeService.mapJobPostToJobReq(jobPost);

    // Call external AI API
    const analysisResponse = await AIResumeService.analyzeResumes({
      resume_paths: resumeUrls,
      job_req: jobReq,
    });

    // Step 3: Save analyzed resumes to database
    const savedResumes = [];
    const failedAnalyses = [];

    for (const analysis of analysisResponse.analyses) {
      if (analysis.success) {
        try {
          // Find the corresponding upload result
          const uploadInfo = uploadResults.find(
            (r) => r.s3Url === analysis.resume_path
          );

          const resume = await prisma.resume.create({
            data: {
              id: uploadInfo?.resumeId || crypto.randomUUID(),
              // Map EXACT field names from AI response
              resumeUrl: analysis.resume_path,
              s3Key: uploadInfo?.s3Key, // Store S3 key for generating fresh presigned URLs
              candidateName: analysis.candidate.name,
              candidateEmail: analysis.candidate.email,
              candidatePhone: analysis.candidate.phone,
              matchScore: analysis.candidate.match_score,
              recommendation: analysis.analysis.recommendation,
              skills: analysis.candidate.skills,
              experienceYears: analysis.candidate.experience_years,
              education: analysis.candidate.education,
              summary: analysis.candidate.summary,
              location: analysis.candidate.location,
              linkedinUrl: analysis.candidate.linkedin_url,
              githubUrl: analysis.candidate.github_url,
              currentJobTitle: analysis.candidate.current_job_title,
              processingMethod: analysis.candidate.processing_method,
              analysisTimestamp: new Date(
                analysis.candidate.analysis_timestamp
              ),
              fileName: analysis.analysis.file_name,
              fileSizeMb: analysis.analysis.file_size_mb,
              processingTime: analysis.analysis.processing_time,
              matchedSkills: analysis.analysis.matched_skills,
              jobPostId: jobPost.id,
              uploadedById: user.userId,
              updatedAt: new Date(),
            },
          });
          savedResumes.push(resume);
        } catch (dbError) {
          console.error("Database error saving resume:", dbError);
          failedAnalyses.push({
            resume_path: analysis.resume_path,
            error:
              "Database error: " +
              (dbError instanceof Error ? dbError.message : "Unknown error"),
          });
        }
      } else {
        failedAnalyses.push({
          resume_path: analysis.resume_path,
          error: "Analysis failed",
        });
      }
    }

    // Return comprehensive results
    const response = {
      success: true,
      message: `${
        savedResumes.length
      } resumes uploaded and analyzed successfully${
        failedUploads.length + failedAnalyses.length > 0
          ? `, ${failedUploads.length + failedAnalyses.length} failed`
          : ""
      }`,
      summary: {
        totalFilesUploaded: files.length,
        successfulUploads: uploadResults.length,
        failedUploads: failedUploads.length,
        successfulAnalyses: savedResumes.length,
        failedAnalyses: failedAnalyses.length,
      },
      uploadResults,
      resumes: savedResumes,
      failures: {
        uploads: failedUploads,
        analyses: failedAnalyses,
      },
      aiResponse: analysisResponse,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("❌ Upload and Analyze API Error:", error);

    if (error instanceof Error && error.message.includes("Invalid file type")) {
      return res.status(400).json({ error: error.message });
    }

    if (error instanceof Error && error.message.includes("File too large")) {
      return res.status(400).json({ error: "File size exceeds 10MB limit" });
    }

    return res.status(500).json({
      error: "Internal server error during file upload and analysis",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
