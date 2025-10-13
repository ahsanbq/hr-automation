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
  const { interviewId } = req.query;

  if (!interviewId || typeof interviewId !== "string") {
    return res.status(400).json({ error: "Invalid interview ID" });
  }

  try {
    switch (method) {
      case "GET":
        return await handleGetInterview(req, res, user!, interviewId);
      case "PUT":
        return await handleUpdateInterview(req, res, user!, interviewId);
      case "DELETE":
        return await handleDeleteInterview(req, res, user!, interviewId);
      default:
        res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGetInterview(
  req: NextApiRequest,
  res: NextApiResponse,
  user: { id: number; type: string; companyId?: number },
  interviewId: string
) {
  const { includeQuestions = "true", includeAnswers = "true" } = req.query;

  const include: any = {
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
  };

  if (includeQuestions === "true") {
    include.mcqQuestions = {
      select: {
        id: true,
        question: true,
        options: true,
        correctAnswer: true,
        points: true,
        category: true,
        difficulty: true,
      },
    };
  }

  if (includeAnswers === "true") {
    include.candidateAnswers = {
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
    };
  }

  const where: any = { id: interviewId };

  // Company-based filtering for non-admin users
  if (user.type !== "ADMIN") {
    where.jobPost = {
      companyId: user.companyId,
    };
  }

  const interview = await prisma.interview.findFirst({
    where,
    include,
  });

  if (!interview) {
    return res
      .status(404)
      .json({ error: "Interview not found or access denied" });
  }

  return res.status(200).json({ interview });
}

async function handleUpdateInterview(
  req: NextApiRequest,
  res: NextApiResponse,
  user: { id: number; type: string; companyId?: number },
  interviewId: string
) {
  const {
    title,
    description,
    status,
    notes,
    scheduledAt,
    duration,
    shortlistStatus,
  } = req.body;

  // First, verify the interview exists and user has access
  const existingInterview = await prisma.interview.findFirst({
    where: {
      id: interviewId,
      ...(user.type !== "ADMIN"
        ? {
            jobPost: {
              companyId: user.companyId,
            },
          }
        : {}),
    },
  });

  if (!existingInterview) {
    return res
      .status(404)
      .json({ error: "Interview not found or access denied" });
  }

  // Prepare update data
  const updateData: any = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (status !== undefined) updateData.status = status;
  if (notes !== undefined) updateData.notes = notes;
  // scheduledAt field doesn't exist in Interview model
  if (duration !== undefined) updateData.duration = duration;
  if (shortlistStatus !== undefined)
    updateData.shortlistStatus = shortlistStatus;

  // If status is being updated to PUBLISHED, set completedAt
  if (status === "PUBLISHED" && existingInterview.status !== "PUBLISHED") {
    updateData.sessionEnd = new Date();
  }

  const interview = await prisma.interview.update({
    where: { id: interviewId },
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
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return res.status(200).json({ interview });
}

async function handleDeleteInterview(
  req: NextApiRequest,
  res: NextApiResponse,
  user: { id: number; type: string; companyId?: number },
  interviewId: string
) {
  // First, verify the interview exists and user has access
  const existingInterview = await prisma.interview.findFirst({
    where: {
      id: interviewId,
      ...(user.type !== "ADMIN"
        ? {
            jobPost: {
              companyId: user.companyId,
            },
          }
        : {}),
    },
  });

  if (!existingInterview) {
    return res
      .status(404)
      .json({ error: "Interview not found or access denied" });
  }

  // Only allow deletion if interview is PUBLISHED or ARCHIVED
  if (
    existingInterview.status === "PUBLISHED" ||
    existingInterview.status === "ARCHIVED"
  ) {
    return res.status(400).json({
      error: "Cannot delete interview that is in progress or completed",
    });
  }

  await prisma.interview.delete({
    where: { id: interviewId },
  });

  return res.status(200).json({ message: "Interview deleted successfully" });
}
