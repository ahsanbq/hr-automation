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

  try {
    switch (method) {
      case "POST":
        return await handleSubmitAnswers(req, res, user!);
      case "GET":
        return await handleGetAnswers(req, res, user!);
      default:
        res.setHeader("Allow", ["POST", "GET"]);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleSubmitAnswers(
  req: NextApiRequest,
  res: NextApiResponse,
  user: { id: number; type: string; companyId?: number }
) {
  const { mcqAssessmentId, answers } = req.body;

  // Validate required fields
  if (!mcqAssessmentId || !answers || !Array.isArray(answers)) {
    return res.status(400).json({
      error: "Missing required fields: mcqAssessmentId, answers",
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
          resume: true,
        },
      },
      questions: true,
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

  // Check if assessment is already completed
  if (mcqAssessment.assessmentStage.status === "COMPLETED") {
    return res.status(409).json({
      error: "This assessment has already been completed",
    });
  }

  // Validate answers format and calculate scores
  let totalScore = 0;
  let correctAnswers = 0;
  const processedAnswers: any[] = [];

  for (const answer of answers) {
    const { questionId, selectedAnswer, timeSpent } = answer;

    if (!questionId || selectedAnswer === undefined) {
      return res.status(400).json({
        error: "Each answer must have questionId and selectedAnswer",
      });
    }

    // Find the question
    const question = mcqAssessment.questions.find((q) => q.id === questionId);
    if (!question) {
      return res.status(400).json({
        error: `Question with ID ${questionId} not found`,
      });
    }

    // Check if answer is correct
    const isCorrect = selectedAnswer === question.correctAnswer;
    const pointsEarned = isCorrect ? question.points : 0;

    totalScore += pointsEarned;
    if (isCorrect) correctAnswers++;

    processedAnswers.push({
      mcqAssessmentId,
      questionId,
      selectedAnswer,
      isCorrect,
      pointsEarned,
      timeSpent: timeSpent || null,
    });
  }

  // Calculate percentage
  const totalPossibleScore = mcqAssessment.questions.reduce(
    (sum, q) => sum + q.points,
    0
  );
  const percentage =
    totalPossibleScore > 0 ? (totalScore / totalPossibleScore) * 100 : 0;

  // Submit answers and update assessment status in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Delete existing answers for this assessment (in case of resubmission)
    await tx.mCQAnswer.deleteMany({
      where: { mcqAssessmentId },
    });

    // Create new answers
    const createdAnswers = await tx.mCQAnswer.createMany({
      data: processedAnswers,
    });

    // Update assessment stage status and scores
    const updatedStage = await tx.assessmentStage.update({
      where: { id: mcqAssessment.assessmentStage.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        resultScore: percentage,
        notes: `MCQ Assessment completed. Score: ${totalScore}/${totalPossibleScore} (${percentage.toFixed(
          2
        )}%). Correct answers: ${correctAnswers}/${answers.length}`,
      },
    });

    return { answers: createdAnswers, assessmentStage: updatedStage };
  });

  return res.status(200).json({
    message: "Answers submitted successfully",
    score: {
      totalScore,
      totalPossibleScore,
      percentage: percentage.toFixed(2),
      correctAnswers,
      totalQuestions: answers.length,
    },
    assessmentStage: result.assessmentStage,
  });
}

async function handleGetAnswers(
  req: NextApiRequest,
  res: NextApiResponse,
  user: { id: number; type: string; companyId?: number }
) {
  const { mcqAssessmentId, includeQuestions = "true" } = req.query;

  if (!mcqAssessmentId) {
    return res.status(400).json({ error: "mcqAssessmentId is required" });
  }

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
  if (includeQuestions === "true") {
    include.question = {
      select: {
        id: true,
        question: true,
        options: true,
        correctAnswer: true,
        points: true,
        category: true,
        difficulty: true,
        explanation: true,
      },
    };
  }

  const answers = await prisma.mCQAnswer.findMany({
    where: { mcqAssessmentId: mcqAssessmentId as string },
    include,
    orderBy: { answeredAt: "asc" },
  });

  return res.status(200).json({ answers });
}
