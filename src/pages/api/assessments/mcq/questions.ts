import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { MCQDifficulty } from "@/types/assessment";

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

  try {
    switch (method) {
      case "GET":
        return await handleGetQuestions(req, res, user!);
      case "POST":
        return await handleCreateQuestion(req, res, user!);
      case "PUT":
        return await handleUpdateQuestion(req, res, user!);
      case "DELETE":
        return await handleDeleteQuestion(req, res, user!);
      default:
        res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGetQuestions(
  req: NextApiRequest,
  res: NextApiResponse,
  user: { id: number; type: string; companyId?: number }
) {
  const {
    mcqAssessmentId,
    category,
    difficulty,
    includeAnswers = "false",
    page = "1",
    limit = "10",
  } = req.query;

  if (!mcqAssessmentId) {
    return res.status(400).json({ error: "mcqAssessmentId is required" });
  }

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Build where clause
  const where: any = {
    mcqAssessmentId: mcqAssessmentId as string,
  };

  if (category) where.category = category as string;
  if (difficulty) where.difficulty = difficulty as MCQDifficulty;

  // Verify user has access to this assessment
  const mcqAssessment = await prisma.mCQAssessment.findUnique({
    where: { id: mcqAssessmentId as string },
    include: {
      assessmentStage: {
        include: {
          jobPost: {
            select: { companyId: true },
          },
        },
      },
    },
  });

  if (!mcqAssessment) {
    return res.status(404).json({ error: "MCQ assessment not found" });
  }

  // Check company access for non-admin users
  if (
    user.type !== "ADMIN" &&
    mcqAssessment.assessmentStage.jobPost.companyId !== user.companyId
  ) {
    return res.status(403).json({ error: "Access denied" });
  }

  const include: any = {};
  if (includeAnswers === "true") {
    include.answers = true;
  }

  const [questions, total] = await Promise.all([
    prisma.mCQQuestion.findMany({
      where,
      include,
      skip,
      take: limitNum,
      orderBy: { order: "asc" },
    }),
    prisma.mCQQuestion.count({ where }),
  ]);

  return res.status(200).json({
    questions,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
}

async function handleCreateQuestion(
  req: NextApiRequest,
  res: NextApiResponse,
  user: { id: number; type: string; companyId?: number }
) {
  const {
    mcqAssessmentId,
    question,
    options,
    correctAnswer,
    points = 1,
    category,
    difficulty = "MEDIUM",
    explanation,
    order = 0,
  } = req.body;

  // Validate required fields
  if (
    !mcqAssessmentId ||
    !question ||
    !options ||
    correctAnswer === undefined
  ) {
    return res.status(400).json({
      error:
        "Missing required fields: mcqAssessmentId, question, options, correctAnswer",
    });
  }

  // Validate options array
  if (!Array.isArray(options) || options.length < 2) {
    return res.status(400).json({
      error: "Options must be an array with at least 2 items",
    });
  }

  // Validate correct answer index
  if (correctAnswer < 0 || correctAnswer >= options.length) {
    return res.status(400).json({
      error: "correctAnswer must be a valid index in the options array",
    });
  }

  // Validate difficulty
  if (!Object.values(MCQDifficulty).includes(difficulty)) {
    return res.status(400).json({
      error: "Invalid difficulty. Must be EASY, MEDIUM, or HARD",
    });
  }

  // Verify user has access to this assessment
  const mcqAssessment = await prisma.mCQAssessment.findUnique({
    where: { id: mcqAssessmentId },
    include: {
      assessmentStage: {
        include: {
          jobPost: {
            select: { companyId: true },
          },
        },
      },
    },
  });

  if (!mcqAssessment) {
    return res.status(404).json({ error: "MCQ assessment not found" });
  }

  // Check company access for non-admin users
  if (
    user.type !== "ADMIN" &&
    mcqAssessment.assessmentStage.jobPost.companyId !== user.companyId
  ) {
    return res.status(403).json({ error: "Access denied" });
  }

  // Create the question
  const questionRecord = await prisma.mCQQuestion.create({
    data: {
      mcqAssessmentId,
      question,
      options,
      correctAnswer,
      points,
      category: category || null,
      difficulty: difficulty as MCQDifficulty,
      explanation: explanation || null,
      order,
    },
  });

  // Update total questions count
  await prisma.mCQAssessment.update({
    where: { id: mcqAssessmentId },
    data: {
      totalQuestions: {
        increment: 1,
      },
    },
  });

  return res.status(201).json({ question: questionRecord });
}

async function handleUpdateQuestion(
  req: NextApiRequest,
  res: NextApiResponse,
  user: { id: number; type: string; companyId?: number }
) {
  const {
    id,
    question,
    options,
    correctAnswer,
    points,
    category,
    difficulty,
    explanation,
    order,
  } = req.body;

  if (!id) {
    return res.status(400).json({ error: "Question ID is required" });
  }

  // Verify user has access to this question
  const existingQuestion = await prisma.mCQQuestion.findUnique({
    where: { id },
    include: {
      mcqAssessment: {
        include: {
          assessmentStage: {
            include: {
              jobPost: {
                select: { companyId: true },
              },
            },
          },
        },
      },
    },
  });

  if (!existingQuestion) {
    return res.status(404).json({ error: "Question not found" });
  }

  // Check company access for non-admin users
  if (
    user.type !== "ADMIN" &&
    existingQuestion.mcqAssessment.assessmentStage.jobPost.companyId !==
      user.companyId
  ) {
    return res.status(403).json({ error: "Access denied" });
  }

  // Validate options and correct answer if provided
  if (options && (!Array.isArray(options) || options.length < 2)) {
    return res.status(400).json({
      error: "Options must be an array with at least 2 items",
    });
  }

  if (correctAnswer !== undefined && options) {
    if (correctAnswer < 0 || correctAnswer >= options.length) {
      return res.status(400).json({
        error: "correctAnswer must be a valid index in the options array",
      });
    }
  }

  // Build update data
  const updateData: any = {};
  if (question !== undefined) updateData.question = question;
  if (options !== undefined) updateData.options = options;
  if (correctAnswer !== undefined) updateData.correctAnswer = correctAnswer;
  if (points !== undefined) updateData.points = points;
  if (category !== undefined) updateData.category = category;
  if (difficulty !== undefined) {
    if (!Object.values(MCQDifficulty).includes(difficulty)) {
      return res.status(400).json({
        error: "Invalid difficulty. Must be EASY, MEDIUM, or HARD",
      });
    }
    updateData.difficulty = difficulty as MCQDifficulty;
  }
  if (explanation !== undefined) updateData.explanation = explanation;
  if (order !== undefined) updateData.order = order;

  const updatedQuestion = await prisma.mCQQuestion.update({
    where: { id },
    data: updateData,
  });

  return res.status(200).json({ question: updatedQuestion });
}

async function handleDeleteQuestion(
  req: NextApiRequest,
  res: NextApiResponse,
  user: { id: number; type: string; companyId?: number }
) {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: "Question ID is required" });
  }

  // Verify user has access to this question
  const existingQuestion = await prisma.mCQQuestion.findUnique({
    where: { id },
    include: {
      mcqAssessment: {
        include: {
          assessmentStage: {
            include: {
              jobPost: {
                select: { companyId: true },
              },
            },
          },
        },
      },
    },
  });

  if (!existingQuestion) {
    return res.status(404).json({ error: "Question not found" });
  }

  // Check company access for non-admin users
  if (
    user.type !== "ADMIN" &&
    existingQuestion.mcqAssessment.assessmentStage.jobPost.companyId !==
      user.companyId
  ) {
    return res.status(403).json({ error: "Access denied" });
  }

  // Delete the question and update total count
  await prisma.$transaction(async (tx) => {
    await tx.mCQQuestion.delete({
      where: { id },
    });

    await tx.mCQAssessment.update({
      where: { id: existingQuestion.mcqAssessmentId },
      data: {
        totalQuestions: {
          decrement: 1,
        },
      },
    });
  });

  return res.status(204).end();
}
