/**
 * API endpoint to save MCQ questions to database
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { questions, jobId, title, description } = req.body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: "Questions array is required" });
    }

    if (!jobId) {
      return res.status(400).json({ error: "Job ID is required" });
    }

    // Verify job exists and user has access
    const job = await prisma.jobPost.findFirst({
      where: {
        id: jobId,
        ...(user.companyId && { companyId: user.companyId }),
      },
    });

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Create MCQ assessment stage
    const assessmentStage = await prisma.assessmentStage.create({
      data: {
        type: "MCQ",
        jobPostId: jobId,
        resumeId: "", // Will be set when assigned to specific candidate
        status: "PENDING",
        sequenceOrder: 1,
        duration: 30, // Default 30 minutes
        notes: description || "",
        metadata: {
          title: title || "MCQ Test",
          totalQuestions: questions.length,
          topics: [...new Set(questions.map((q) => q.topic))],
        },
      },
    });

    // Create MCQ assessment details
    const mcqAssessment = await prisma.mCQAssessment.create({
      data: {
        assessmentStageId: assessmentStage.id,
        title: title || "MCQ Test",
        description: description || "",
        totalQuestions: questions.length,
        timeLimit: 30, // Default 30 minutes
        passingScore: 60, // Default 60%
      },
    });

    // Create MCQ questions
    const mcqQuestions = await Promise.all(
      questions.map((question, index) =>
        prisma.mCQQuestion.create({
          data: {
            mcqAssessmentId: mcqAssessment.id,
            question: question.question,
            options: question.options,
            correctAnswer: question.answer,
            explanation: "", // Can be added later
            category: question.topic,
            difficulty: question.difficulty,
            order: index + 1,
            points: 1, // Default 1 point per question
          },
        })
      )
    );

    return res.status(201).json({
      success: true,
      message: `Successfully saved ${questions.length} MCQ questions`,
      data: {
        assessmentStageId: assessmentStage.id,
        mcqAssessmentId: mcqAssessment.id,
        questionsCount: mcqQuestions.length,
      },
    });
  } catch (error: any) {
    console.error("Error saving MCQ questions:", error);
    return res.status(500).json({
      error: "Failed to save MCQ questions",
      details: error.message,
    });
  }
}
