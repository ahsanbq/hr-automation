import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    id: number;
    email: string;
    type: string;
    companyId?: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    (req as AuthenticatedRequest).user = decoded;
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const { method } = req;
  const { user } = req as AuthenticatedRequest;
  const { assessmentId } = req.query;

  if (!assessmentId || typeof assessmentId !== "string") {
    return res.status(400).json({ error: "Invalid assessment ID" });
  }

  try {
    switch (method) {
      case "POST":
        return await handleUploadRecording(req, res, user!, assessmentId);
      case "GET":
        return await handleGetRecordings(req, res, user!, assessmentId);
      default:
        res.setHeader("Allow", ["POST", "GET"]);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGetRecordings(
  req: NextApiRequest,
  res: NextApiResponse,
  user: { id: number; type: string; companyId?: number },
  assessmentId: string,
) {
  // Verify assessment exists and user has access
  const assessment = await prisma.assessmentStage.findFirst({
    where: {
      id: assessmentId,
      type: "AVATAR",
      ...(user.type !== "ADMIN"
        ? {
            jobPost: {
              companyId: user.companyId,
            },
          }
        : {}),
    },
    include: {
      avatarAssessment: {
        include: {
          recordings: {
            orderBy: {
              uploadedAt: "desc",
            },
          },
        },
      },
    },
  });

  if (!assessment || !assessment.avatarAssessment) {
    return res.status(404).json({ error: "Assessment not found" });
  }

  return res.status(200).json({
    recordings: assessment.avatarAssessment.recordings,
  });
}

async function handleUploadRecording(
  req: NextApiRequest,
  res: NextApiResponse,
  user: { id: number; type: string; companyId?: number },
  assessmentId: string,
) {
  const {
    filename,
    fileSize,
    duration,
    s3Key,
    s3Bucket,
    transcription,
    analysis,
  } = req.body;

  if (!filename) {
    return res.status(400).json({ error: "Filename is required" });
  }

  // Verify assessment exists and user has access
  const assessment = await prisma.assessmentStage.findFirst({
    where: {
      id: assessmentId,
      type: "AVATAR",
      ...(user.type !== "ADMIN"
        ? {
            jobPost: {
              companyId: user.companyId,
            },
          }
        : {}),
    },
    include: {
      avatarAssessment: true,
    },
  });

  if (!assessment || !assessment.avatarAssessment) {
    return res.status(404).json({ error: "Assessment not found" });
  }

  // Create recording record
  const recording = await prisma.avatarRecording.create({
    data: {
      avatarAssessmentId: assessment.avatarAssessment.id,
      filename,
      fileSize: fileSize || null,
      duration: duration || null,
      s3Key: s3Key || null,
      s3Bucket: s3Bucket || null,
      transcription: transcription || null,
      analysis: analysis || null,
    },
  });

  // Update assessment status if needed
  if (assessment.status === "PENDING") {
    await prisma.assessmentStage.update({
      where: { id: assessmentId },
      data: { status: "IN_PROGRESS" },
    });
  }

  return res.status(201).json({
    recording,
    message: "Recording uploaded successfully",
  });
}
