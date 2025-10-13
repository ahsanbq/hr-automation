/**
 * API endpoint for candidates to submit their answers
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { SessionPasswordService } from "@/lib/session-password-service";
import { z } from "zod";

const SubmitAnswerSchema = z.object({
  questionId: z.string(),
  answer: z.any(),
  timeSpent: z.number().optional(),
});

const SubmitInterviewSchema = z.object({
  answers: z.array(SubmitAnswerSchema),
  sessionPassword: z.string().optional(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { attemptId } = req.query;

  if (!attemptId || typeof attemptId !== "string") {
    return res.status(400).json({ error: "Attempt ID is required" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Validate request body
    const validatedData = SubmitInterviewSchema.parse(req.body);
    const { answers, sessionPassword } = validatedData;

    // Get interview attempt
    const attempt = await prisma.interviewAttempt.findUnique({
      where: { id: attemptId },
      include: {
        interview: {
          include: {
            questions: true,
          },
          select: {
            id: true,
            title: true,
            duration: true,
            status: true,
            sessionPassword: true,
            sessionPasswordHash: true,
            questions: true,
          },
        },
      },
    });

    if (!attempt) {
      return res.status(404).json({
        error: "Interview attempt not found",
      });
    }

    // Verify session password if provided
    if (sessionPassword) {
      // Check if we have a hashed password (new system) or plain text (legacy)
      if (attempt.interview.sessionPasswordHash) {
        // Use bcrypt verification for new system
        const isValidPassword = await SessionPasswordService.verifyPassword(
          sessionPassword,
          attempt.interview.sessionPasswordHash
        );
        if (!isValidPassword) {
          return res.status(401).json({
            error: "Invalid session password",
          });
        }
      } else if (attempt.interview.sessionPassword) {
        // Fallback to plain text comparison for legacy sessions
        if (attempt.interview.sessionPassword !== sessionPassword) {
          return res.status(401).json({
            error: "Invalid session password",
          });
        }
      } else {
        return res.status(401).json({
          error: "Session password required but not found",
        });
      }
    }

    // Check if attempt is still active
    if (attempt.status !== "IN_PROGRESS") {
      return res.status(400).json({
        error: "Interview attempt is no longer active",
        currentStatus: attempt.status,
      });
    }

    // Check if time limit exceeded
    const timeElapsed = Date.now() - attempt.startedAt.getTime();
    const timeLimitMs = attempt.interview.duration * 60 * 1000;

    if (timeElapsed > timeLimitMs) {
      // Auto-expire the attempt
      await prisma.interviewAttempt.update({
        where: { id: attemptId },
        data: { status: "EXPIRED" },
      });

      return res.status(400).json({
        error: "Time limit exceeded",
      });
    }

    // Process answers and calculate scores
    let totalScore = 0;
    const processedAnswers = [];

    for (const answerData of answers) {
      const question = attempt.interview.questions.find(
        (q) => q.id === answerData.questionId
      );

      if (!question) {
        continue; // Skip invalid questions
      }

      // Check if answer is correct
      const isCorrect = checkAnswer(question.correct, answerData.answer);
      const pointsEarned = isCorrect ? question.points : 0;
      totalScore += pointsEarned;

      // Create or update answer
      const answer = await prisma.answer.upsert({
        where: {
          attemptId_questionId: {
            attemptId: attemptId,
            questionId: answerData.questionId,
          },
        },
        update: {
          answer: answerData.answer,
          isCorrect,
          pointsEarned,
        },
        create: {
          attemptId: attemptId,
          questionId: answerData.questionId,
          answer: answerData.answer,
          isCorrect,
          pointsEarned,
        },
      });

      processedAnswers.push(answer);
    }

    // Update attempt status to completed
    const updatedAttempt = await prisma.interviewAttempt.update({
      where: { id: attemptId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        submittedAt: new Date(),
      },
    });

    // Calculate final score
    const maxScore = attempt.interview.questions.reduce(
      (sum, q) => sum + q.points,
      0
    );
    const finalScore = totalScore;
    const percentage = maxScore > 0 ? (finalScore / maxScore) * 100 : 0;

    return res.status(200).json({
      success: true,
      message: "Interview submitted successfully",
      result: {
        attemptId: updatedAttempt.id,
        status: updatedAttempt.status,
        score: finalScore,
        maxScore,
        percentage: Math.round(percentage * 100) / 100,
        totalQuestions: attempt.interview.questions.length,
        answeredQuestions: processedAnswers.length,
        timeSpent: Math.floor(timeElapsed / 1000),
        completedAt: updatedAttempt.completedAt?.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Submit interview error:", error);

    if (error.name === "ZodError") {
      return res.status(400).json({
        error: "Validation error",
        details: error.errors,
      });
    }

    return res.status(500).json({
      error: "Failed to submit interview",
      details: error.message,
    });
  }
}

// Helper function to check if answer is correct
function checkAnswer(correctAnswer: any, candidateAnswer: any): boolean {
  // Handle different answer types
  if (
    typeof correctAnswer === "string" &&
    typeof candidateAnswer === "string"
  ) {
    return (
      correctAnswer.toLowerCase().trim() ===
      candidateAnswer.toLowerCase().trim()
    );
  }

  if (Array.isArray(correctAnswer) && Array.isArray(candidateAnswer)) {
    return (
      JSON.stringify(correctAnswer.sort()) ===
      JSON.stringify(candidateAnswer.sort())
    );
  }

  return JSON.stringify(correctAnswer) === JSON.stringify(candidateAnswer);
}
