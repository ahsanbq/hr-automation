import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { StageStatus } from "@/types/assessment";

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
  res: NextApiResponse
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
  const { stageId } = req.query;

  if (!stageId || typeof stageId !== "string") {
    return res.status(400).json({ error: "Stage ID is required" });
  }

  try {
    switch (method) {
      case "GET":
        return await handleGetAssessmentStage(req, res, user!, stageId);
      case "PUT":
        return await handleUpdateAssessmentStage(req, res, user!, stageId);
      case "DELETE":
        return await handleDeleteAssessmentStage(req, res, user!, stageId);
      default:
        res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGetAssessmentStage(
  req: NextApiRequest,
  res: NextApiResponse,
  user: { id: number; type: string; companyId?: number },
  stageId: string
) {
  const { includeDetails = "true" } = req.query;

  const include: any = {
    jobPost: {
      select: {
        id: true,
        jobTitle: true,
        companyName: true,
        location: true,
        skillsRequired: true,
        companyId: true,
      },
    },
    resume: {
      select: {
        id: true,
        candidateName: true,
        candidateEmail: true,
        candidatePhone: true,
        matchScore: true,
        experienceYears: true,
      },
    },
    interviewer: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
  };

  if (includeDetails === "true") {
    include.mcqAssessment = {
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
        candidateAnswers: {
          include: {
            question: {
              select: {
                id: true,
                question: true,
                options: true,
                correctAnswer: true,
                points: true,
                category: true,
                difficulty: true,
              },
            },
          },
        },
      },
    };
    include.avatarAssessment = {
      include: {
        recordings: true,
      },
    };
    include.manualMeeting = true;
  }

  const assessmentStage = await prisma.assessmentStage.findUnique({
    where: { id: stageId },
    include,
  });

  if (!assessmentStage) {
    return res.status(404).json({ error: "Assessment stage not found" });
  }

  // Check company access for non-admin users
  if (
    user.type !== "ADMIN" &&
    (assessmentStage.jobPost as any).companyId !== user.companyId
  ) {
    return res.status(403).json({ error: "Access denied" });
  }

  return res.status(200).json({ assessmentStage });
}

async function handleUpdateAssessmentStage(
  req: NextApiRequest,
  res: NextApiResponse,
  user: { id: number; type: string; companyId?: number },
  stageId: string
) {
  const {
    status,
    scheduledAt,
    completedAt,
    resultScore,
    notes,
    metadata,
    duration,
    sequenceOrder,
    // Stage-specific updates
    mcqAssessment,
    avatarAssessment,
    manualMeeting,
  } = req.body;

  // Verify user has access to this assessment stage
  const existingStage = await prisma.assessmentStage.findUnique({
    where: { id: stageId },
    include: {
      jobPost: {
        select: { companyId: true },
      },
    },
  });

  if (!existingStage) {
    return res.status(404).json({ error: "Assessment stage not found" });
  }

  // Check company access for non-admin users
  if (
    user.type !== "ADMIN" &&
    existingStage.jobPost.companyId !== user.companyId
  ) {
    return res.status(403).json({ error: "Access denied" });
  }

  // Validate status if provided
  if (status && !Object.values(StageStatus).includes(status)) {
    return res.status(400).json({
      error:
        "Invalid status. Must be PENDING, IN_PROGRESS, COMPLETED, CANCELLED, or NO_SHOW",
    });
  }

  // Build update data
  const updateData: any = {};
  if (status !== undefined) updateData.status = status as StageStatus;
  if (scheduledAt !== undefined)
    updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
  if (completedAt !== undefined)
    updateData.completedAt = completedAt ? new Date(completedAt) : null;
  if (resultScore !== undefined) updateData.resultScore = resultScore;
  if (notes !== undefined) updateData.notes = notes;
  if (metadata !== undefined) updateData.metadata = metadata;
  if (duration !== undefined) updateData.duration = duration;
  if (sequenceOrder !== undefined) updateData.sequenceOrder = sequenceOrder;

  // Handle stage-specific updates
  let stageSpecificUpdate = null;
  if (mcqAssessment && existingStage.type === "MCQ") {
    stageSpecificUpdate = await prisma.mCQAssessment.update({
      where: { assessmentStageId: stageId },
      data: mcqAssessment,
    });
  } else if (avatarAssessment && existingStage.type === "AVATAR") {
    stageSpecificUpdate = await prisma.avatarAssessment.update({
      where: { assessmentStageId: stageId },
      data: avatarAssessment,
    });
  } else if (manualMeeting && existingStage.type === "MANUAL") {
    stageSpecificUpdate = await prisma.manualMeeting.update({
      where: { assessmentStageId: stageId },
      data: manualMeeting,
    });
  }

  // Update the assessment stage
  const updatedStage = await prisma.assessmentStage.update({
    where: { id: stageId },
    data: updateData,
    include: {
      jobPost: {
        select: {
          id: true,
          jobTitle: true,
          companyName: true,
          location: true,
          skillsRequired: true,
        },
      },
      resume: {
        select: {
          id: true,
          candidateName: true,
          candidateEmail: true,
          candidatePhone: true,
          matchScore: true,
          experienceYears: true,
        },
      },
      interviewer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      mcqAssessment: true,
      avatarAssessment: true,
      manualMeeting: true,
    },
  });

  return res.status(200).json({
    assessmentStage: updatedStage,
    stageSpecificUpdate,
  });
}

async function handleDeleteAssessmentStage(
  req: NextApiRequest,
  res: NextApiResponse,
  user: { id: number; type: string; companyId?: number },
  stageId: string
) {
  // Verify user has access to this assessment stage
  const existingStage = await prisma.assessmentStage.findUnique({
    where: { id: stageId },
    include: {
      jobPost: {
        select: { companyId: true },
      },
    },
  });

  if (!existingStage) {
    return res.status(404).json({ error: "Assessment stage not found" });
  }

  // Check company access for non-admin users
  if (
    user.type !== "ADMIN" &&
    existingStage.jobPost.companyId !== user.companyId
  ) {
    return res.status(403).json({ error: "Access denied" });
  }

  // Delete the assessment stage (cascading will handle related records)
  await prisma.assessmentStage.delete({
    where: { id: stageId },
  });

  return res.status(204).end();
}
