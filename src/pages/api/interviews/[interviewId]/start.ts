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

  if (method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${method} not allowed` });
  }

  try {
    return await handleStartInterview(req, res, user!, interviewId);
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleStartInterview(
  req: NextApiRequest,
  res: NextApiResponse,
  user: { id: number; type: string; companyId?: number },
  interviewId: string
) {
  // First, verify the interview exists and user has access
  const interview = await prisma.interview.findFirst({
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
    include: {
      questions: {
        select: {
          id: true,
          question: true,
          options: true,
          points: true,
          // Note: We don't include correctAnswer here for security
        },
      },
    },
  });

  if (!interview) {
    return res
      .status(404)
      .json({ error: "Interview not found or access denied" });
  }

  // Only allow starting if interview is DRAFT
  if (interview.status !== "DRAFT") {
    return res.status(400).json({
      error: `Cannot start interview with status: ${interview.status}`,
    });
  }

  // Check if interview has questions
  if (interview.questions.length === 0) {
    return res.status(400).json({
      error:
        "Interview has no questions. Please add questions before starting.",
    });
  }

  // Update interview status to IN_PROGRESS
  const updatedInterview = await prisma.interview.update({
    where: { id: interviewId },
    data: {
      status: "PUBLISHED",
    },
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

  return res.status(200).json({
    interview: updatedInterview,
    questions: interview.questions,
    message: "Interview started successfully",
  });
}
