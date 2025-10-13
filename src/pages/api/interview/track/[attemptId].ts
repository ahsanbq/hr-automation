/**
 * API endpoint to track candidate progress and results
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import type { InterviewResult, QuestionResult } from "@/types/interview";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { attemptId } = req.query;

  if (!attemptId || typeof attemptId !== "string") {
    return res.status(400).json({ error: "Attempt ID is required" });
  }

  try {
    if (req.method === "GET") {
      // Get attempt details and results
      const attempt = await prisma.interviewAttempt.findFirst({
        where: {
          id: attemptId,
          interviewerId: user.userId, // Ensure user can only access their own attempts
        },
        include: {
          interview: {
            include: {
              questions: {
                orderBy: {
                  order: "asc",
                },
              },
            },
          },
          answers: {
            include: {
              question: true,
            },
            orderBy: {
              answeredAt: "asc",
            },
          },
        },
      });

      if (!attempt) {
        return res.status(404).json({
          error: "Interview attempt not found",
        });
      }

      // Calculate results
      const results: QuestionResult[] = attempt.answers.map((answer) => ({
        id: answer.questionId,
        question: answer.question.question,
        candidateAnswer: answer.answer,
        correctAnswer: answer.question.correct,
        isCorrect: answer.isCorrect || false,
        pointsEarned: answer.pointsEarned || 0,
        timeSpent: 0, // This would need to be calculated from timestamps
      }));

      const totalScore = results.reduce(
        (sum, result) => sum + result.pointsEarned,
        0
      );
      const maxScore = attempt.interview.questions.reduce(
        (sum, q) => sum + q.points,
        0
      );
      const timeSpent = attempt.completedAt
        ? Math.floor(
            (attempt.completedAt.getTime() - attempt.startedAt.getTime()) / 1000
          )
        : Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000);

      const interviewResult: InterviewResult = {
        attemptId: attempt.id,
        interviewId: attempt.interviewId,
        candidateEmail: attempt.interview.candidateEmail || "",
        candidateName: attempt.interview.candidateEmail || "",
        status: attempt.status,
        score: totalScore,
        totalQuestions: attempt.interview.questions.length,
        answeredQuestions: results.length,
        timeSpent,
        completedAt: attempt.completedAt?.toISOString() || "",
        results,
      };

      return res.status(200).json({
        success: true,
        result: interviewResult,
      });
    }

    if (req.method === "PUT") {
      // Update attempt status (e.g., mark as completed)
      const { status } = req.body;

      if (
        !status ||
        ![
          "IN_PROGRESS",
          "COMPLETED",
          "SUBMITTED",
          "EXPIRED",
          "TERMINATED",
        ].includes(status)
      ) {
        return res.status(400).json({
          error: "Invalid status",
        });
      }

      const updatedAttempt = await prisma.interviewAttempt.update({
        where: {
          id: attemptId,
        },
        data: {
          status: status as any,
          completedAt:
            status === "COMPLETED" || status === "SUBMITTED"
              ? new Date()
              : undefined,
          submittedAt: status === "SUBMITTED" ? new Date() : undefined,
        },
      });

      return res.status(200).json({
        success: true,
        message: "Attempt status updated successfully",
        attempt: {
          id: updatedAttempt.id,
          status: updatedAttempt.status,
          completedAt: updatedAttempt.completedAt?.toISOString(),
          submittedAt: updatedAttempt.submittedAt?.toISOString(),
        },
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    console.error("Track interview error:", error);
    return res.status(500).json({
      error: "Failed to track interview",
      details: error.message,
    });
  }
}
