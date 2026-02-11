// API endpoint to sync (replace) questions for an interview session
// Used when user manually adds/deletes questions before sending

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { interviewId, questions } = req.body;

    if (!interviewId) {
      return res.status(400).json({ error: "Interview ID is required" });
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: "Questions array is required" });
    }

    // Verify interview exists
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
    });

    if (!interview) {
      return res.status(404).json({ error: "Interview session not found" });
    }

    // Delete all existing questions for this interview
    await prisma.question.deleteMany({
      where: { interviewId },
    });

    // Re-create questions from the provided list
    const createdQuestions = await Promise.all(
      questions.map((q: string, index: number) =>
        prisma.question.create({
          data: {
            interviewId,
            type: "ESSAY",
            question: q,
            correct: "",
            points: 1,
            order: index + 1,
          },
        }),
      ),
    );

    return res.status(200).json({
      success: true,
      message: `Synced ${createdQuestions.length} questions`,
      totalQuestions: createdQuestions.length,
    });
  } catch (error: any) {
    console.error("Sync questions error:", error);
    return res.status(500).json({
      error: "Failed to sync questions",
      details: error.message,
    });
  }
}

