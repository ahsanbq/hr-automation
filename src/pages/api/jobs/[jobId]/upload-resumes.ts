import type { NextApiRequest, NextApiResponse } from "next";
import multer from "multer";
import { S3Service } from "@/lib/s3-service";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

    // Return results
    const response = {
      success: uploadResults.length > 0,
      uploaded: uploadResults.length,
      failed: failedUploads.length,
      results: uploadResults,
      failures: failedUploads,
      message: `${uploadResults.length} file(s) uploaded successfully${
        failedUploads.length > 0 ? `, ${failedUploads.length} failed` : ""
      }`,
    };

    if (uploadResults.length === 0) {
      return res.status(400).json(response);
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("❌ Upload API Error:", error);

    if (error instanceof Error && error.message.includes("Invalid file type")) {
      return res.status(400).json({ error: error.message });
    }

    if (error instanceof Error && error.message.includes("File too large")) {
      return res.status(400).json({ error: "File size exceeds 10MB limit" });
    }

    return res.status(500).json({
      error: "Internal server error during file upload",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
