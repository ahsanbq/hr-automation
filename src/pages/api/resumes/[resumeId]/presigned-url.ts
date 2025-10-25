import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../../lib/db";
import { S3Service } from "../../../../lib/s3-service";
import { getUserFromRequest } from "../../../../lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Verify authentication
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { resumeId } = req.query;

    if (!resumeId || typeof resumeId !== "string") {
      return res.status(400).json({ error: "Resume ID is required" });
    }

    // Get resume from database
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      include: {
        JobPost: {
          select: {
            createdById: true,
          },
        },
      },
    });

    if (!resume) {
      return res.status(404).json({ error: "Resume not found" });
    }

    // Check if user has access to this resume
    if (resume.JobPost.createdById !== user.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Check if resume has S3 key
    if (!resume.s3Key) {
      return res.status(400).json({
        error:
          "Resume does not have S3 key. This may be an old resume uploaded before the fix.",
      });
    }

    // Generate fresh presigned URL (valid for 1 hour)
    try {
      const presignedUrl = await S3Service.getPresignedUrl(resume.s3Key, 3600);

      return res.status(200).json({
        success: true,
        presignedUrl,
        expiresIn: 3600, // 1 hour in seconds
      });
    } catch (s3Error) {
      console.error("S3 presigned URL generation failed:", s3Error);
      return res.status(500).json({
        error: "S3 configuration error",
        details:
          "Unable to generate presigned URL. Please check S3 credentials and configuration.",
        s3Error:
          s3Error instanceof Error ? s3Error.message : "Unknown S3 error",
      });
    }
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
