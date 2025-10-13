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
        return await handleGetMCQs(req, res, user!, interviewId);
      case "POST":
        return await handleCreateMCQ(req, res, user!, interviewId);
      default:
        res.setHeader("Allow", ["GET", "POST"]);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGetMCQs(
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
  });

  if (!interview) {
    return res
      .status(404)
      .json({ error: "Interview not found or access denied" });
  }

  const mcqQuestions = await prisma.question.findMany({
    where: { interviewId },
    orderBy: { order: "asc" },
  });

  return res.status(200).json({ questions: mcqQuestions });
}

async function handleCreateMCQ(
  req: NextApiRequest,
  res: NextApiResponse,
  user: { id: number; type: string; companyId?: number },
  interviewId: string
) {
  const {
    question,
    options,
    correctAnswer,
    points = 1.0,
    category,
    difficulty = "MEDIUM",
  } = req.body;

  // Validate required fields
  if (!question || !options || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({
      error: "Question and at least 2 options are required",
    });
  }

  if (
    correctAnswer === undefined ||
    correctAnswer < 0 ||
    correctAnswer >= options.length
  ) {
    return res.status(400).json({
      error: "Valid correctAnswer index is required",
    });
  }

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
  });

  if (!interview) {
    return res
      .status(404)
      .json({ error: "Interview not found or access denied" });
  }

  // Only allow adding questions if interview is DRAFT
  if (interview.status !== "DRAFT") {
    return res.status(400).json({
      error: "Cannot add questions to interview that is not in draft status",
    });
  }

  const mcqQuestion = await prisma.question.create({
    data: {
      interviewId,
      type: "MULTIPLE_CHOICE",
      question,
      options,
      correct: correctAnswer,
      points,
      order: 0, // Will be updated based on existing questions
    },
  });

  return res.status(201).json({ question: mcqQuestion });
}
