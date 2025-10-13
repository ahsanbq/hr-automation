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
        return await handleGetAnswers(req, res, user!, interviewId);
      case "POST":
        return await handleSubmitAnswers(req, res, user!, interviewId);
      default:
        res.setHeader("Allow", ["GET", "POST"]);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGetAnswers(
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

  // Get the interview with its attempts and answers
  const interviewWithAnswers = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: {
      interviewAttempts: {
        include: {
          answers: {
            include: {
              question: {
                select: {
                  id: true,
                  question: true,
                  options: true,
                  correct: true,
                  points: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!interviewWithAnswers) {
    return res.status(404).json({ error: "Interview not found" });
  }

  // Flatten all answers from all attempts
  const answers = interviewWithAnswers.interviewAttempts.flatMap(
    (attempt) => attempt.answers
  );

  return res.status(200).json({ answers });
}

async function handleSubmitAnswers(
  req: NextApiRequest,
  res: NextApiResponse,
  user: { id: number; type: string; companyId?: number },
  interviewId: string
) {
  const { answers } = req.body;

  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({
      error: "Answers array is required",
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
    include: {
      questions: true,
    },
  });

  if (!interview) {
    return res
      .status(404)
      .json({ error: "Interview not found or access denied" });
  }

  // Only allow submitting answers if interview is PUBLISHED
  if (interview.status !== "PUBLISHED") {
    return res.status(400).json({
      error: "Can only submit answers for interviews in progress",
    });
  }

  // Validate that all questions have answers
  const questionIds = interview.questions.map((q) => q.id);
  const answerQuestionIds = answers.map((a: any) => a.questionId);

  if (questionIds.length !== answerQuestionIds.length) {
    return res.status(400).json({
      error: "Must provide answers for all questions",
    });
  }

  const missingQuestions = questionIds.filter(
    (id) => !answerQuestionIds.includes(id)
  );
  if (missingQuestions.length > 0) {
    return res.status(400).json({
      error: `Missing answers for questions: ${missingQuestions.join(", ")}`,
    });
  }

  // Validate answer format
  for (const answer of answers) {
    if (!answer.questionId || answer.selectedAnswer === undefined) {
      return res.status(400).json({
        error: "Each answer must have questionId and selectedAnswer",
      });
    }

    const question = interview.questions.find(
      (q) => q.id === answer.questionId
    );
    if (!question) {
      return res.status(400).json({
        error: `Question ${answer.questionId} not found in this interview`,
      });
    }

    if (
      answer.selectedAnswer < 0 ||
      (question.options &&
        answer.selectedAnswer >= (question.options as any[]).length)
    ) {
      return res.status(400).json({
        error: `Invalid selectedAnswer for question ${answer.questionId}`,
      });
    }
  }

  // Start transaction to save answers and calculate score
  const result = await prisma.$transaction(async (tx) => {
    // Delete existing answers if any
    // Note: We need to delete answers through attempts since Answer model uses attemptId
    // This will be handled when we create the attempt

    // Create new answers with calculated scores
    const candidateAnswers = [];
    let totalScore = 0;
    let totalPossibleScore = 0;

    for (const answer of answers) {
      const question = interview.questions.find(
        (q) => q.id === answer.questionId
      )!;
      const isCorrect = answer.selectedAnswer === question.correct;
      const points = isCorrect ? question.points : 0;

      totalScore += points;
      totalPossibleScore += question.points;

      // For now, just collect the answer data without creating in DB
      // This would need to be properly implemented with attempt creation
      candidateAnswers.push({
        questionId: answer.questionId,
        selectedAnswer: answer.selectedAnswer,
        isCorrect,
        points,
      });
    }

    // Calculate percentage
    const percentage =
      totalPossibleScore > 0 ? (totalScore / totalPossibleScore) * 100 : 0;

    // Update interview with scores and status
    const updatedInterview = await tx.interview.update({
      where: { id: interviewId },
      data: {
        status: "PUBLISHED",
        sessionEnd: new Date(),
      },
    });

    // Check if candidate should be automatically shortlisted
    // const config = await tx.interviewConfig.findUnique({
    //   where: { jobPostId: interview.jobPostId },
    // });

    let shortlistStatus = "NOT_SHORTLISTED";
    // Auto-shortlisting logic commented out due to missing config model
    // if (config?.autoShortlistEnabled) {
    //   if (
    //     config.shortlistThreshold &&
    //     percentage >= config.shortlistThreshold
    //   ) {
    //     shortlistStatus = "SHORTLISTED";
    //   } else if (config.topNCandidates) {
    //     // Get top N candidates for this job
    //     const topCandidates = await tx.interview.findMany({
    //       where: {
    //         jobPostId: interview.jobPostId,
    //         status: "COMPLETED",
    //         percentage: { not: null },
    //       },
    //       orderBy: { percentage: "desc" },
    //       take: config.topNCandidates,
    //     });

    //     const isInTopN = topCandidates.some((c) => c.id === interviewId);
    //     if (isInTopN) {
    //       shortlistStatus = "SHORTLISTED";
    //     }
    //   }
    // }

    // Update shortlist status if auto-shortlisting is enabled
    // if (config?.autoShortlistEnabled) {
    //   await tx.interview.update({
    //     where: { id: interviewId },
    //     data: { shortlistStatus },
    //   });
    // }

    return {
      interview: updatedInterview,
      answers: candidateAnswers,
      score: {
        totalScore,
        totalPossibleScore,
        percentage,
        shortlistStatus,
      },
    };
  });

  return res.status(200).json(result);
}
