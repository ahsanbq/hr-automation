/**
 * API endpoint for candidates to get their interview details
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { attemptId } = req.query;

  if (!attemptId || typeof attemptId !== "string") {
    return res.status(400).json({ error: "Attempt ID is required" });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get interview attempt with questions (without correct answers)
    const attempt = await prisma.interviewAttempt.findUnique({
      where: { id: attemptId },
      include: {
        interview: {
          include: {
            questions: {
              orderBy: {
                order: "asc",
              },
              select: {
                id: true,
                type: true,
                question: true,
                options: true,
                points: true,
                order: true,
                // Exclude 'correct' field for security
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      return res.status(404).json({
        error: "Interview not found",
      });
    }

    // Check if attempt is still active
    if (attempt.status !== "IN_PROGRESS") {
      return res.status(400).json({
        error: "Interview is no longer available",
        status: attempt.status,
      });
    }

    // Check if time limit exceeded
    const timeElapsed = Date.now() - attempt.startedAt.getTime();
    const timeLimitMs = attempt.interview.duration * 60 * 1000;
    const remainingTime = Math.max(0, timeLimitMs - timeElapsed);

    if (remainingTime <= 0) {
      // Auto-expire the attempt
      await prisma.interviewAttempt.update({
        where: { id: attemptId },
        data: { status: "EXPIRED" },
      });

      return res.status(400).json({
        error: "Time limit exceeded",
        status: "EXPIRED",
      });
    }

    // Return interview details for candidate
    return res.status(200).json({
      success: true,
      interview: {
        id: attempt.interview.id,
        title: attempt.interview.title,
        description: attempt.interview.description,
        duration: attempt.interview.duration,
        totalQuestions: attempt.interview.questions.length,
        timeRemaining: Math.floor(remainingTime / 1000), // in seconds
        questions: attempt.interview.questions.map((q) => ({
          id: q.id,
          type: q.type,
          question: q.question,
          options: q.options,
          points: q.points,
          order: q.order,
        })),
      },
      candidate: {
        name: attempt.interview.candidateEmail || "Unknown",
        email: attempt.interview.candidateEmail || "Unknown",
      },
      attempt: {
        id: attempt.id,
        status: attempt.status,
        startedAt: attempt.startedAt.toISOString(),
        timeElapsed: Math.floor(timeElapsed / 1000),
      },
    });
  } catch (error: any) {
    console.error("Get interview error:", error);
    return res.status(500).json({
      error: "Failed to get interview details",
      details: error.message,
    });
  }
}
