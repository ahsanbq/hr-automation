/**
 * API endpoint to create custom interview from selected questions
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { QuestionSelectionSchema } from "@/types/interview";

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
    // Validate request body
    const validatedData = QuestionSelectionSchema.parse(req.body);
    const {
      templateIds,
      questionIds,
      title,
      description,
      duration,
      candidateEmail,
      candidateName,
    } = validatedData;

    // Verify all templates belong to the user
    const templates = await prisma.interview.findMany({
      where: {
        id: { in: templateIds },
        userId: user.userId,
      },
      include: {
        questions: {
          where: {
            id: { in: questionIds },
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    if (templates.length !== templateIds.length) {
      return res.status(400).json({
        error: "Some templates not found or not accessible",
      });
    }

    // Collect all selected questions
    const selectedQuestions = templates.flatMap(
      (template) => template.questions
    );

    if (selectedQuestions.length !== questionIds.length) {
      return res.status(400).json({
        error: "Some questions not found in the specified templates",
      });
    }

    // Create new interview with selected questions
    const customInterview = await prisma.interview.create({
      data: {
        title,
        description: description || "",
        duration,
        status: "DRAFT",
        candidateEmail,
        jobPostId: "", // Will be set when linked to a job
        resumeId: "", // Will be set when linked to a resume
        userId: user.userId,
        questions: {
          create: selectedQuestions.map((question, index) => ({
            type: question.type,
            question: question.question,
            options: question.options as any,
            correct: question.correct as any,
            points: question.points,
            order: index + 1,
          })),
        },
      },
      include: {
        questions: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    // Update interview with candidate information
    await prisma.interview.update({
      where: { id: customInterview.id },
      data: {
        candidateEmail,
      },
    });

    // Create interview attempt for the candidate
    const attempt = await prisma.interviewAttempt.create({
      data: {
        interviewerId: user.userId,
        interviewId: customInterview.id,
        status: "IN_PROGRESS",
      },
    });

    return res.status(201).json({
      success: true,
      message: `Successfully created custom interview with ${selectedQuestions.length} questions`,
      interview: {
        id: customInterview.id,
        title: customInterview.title,
        description: customInterview.description,
        duration: customInterview.duration,
        status: customInterview.status,
        candidateEmail: customInterview.candidateEmail,
        questions: customInterview.questions.map((q) => ({
          id: q.id,
          question: q.question,
          type: q.type,
          options: q.options,
          correct: q.correct,
          points: q.points,
          order: q.order,
        })),
        attemptId: attempt.id,
      },
    });
  } catch (error: any) {
    console.error("Create custom interview error:", error);

    if (error.name === "ZodError") {
      return res.status(400).json({
        error: "Validation error",
        details: error.errors,
      });
    }

    return res.status(500).json({
      error: "Failed to create custom interview",
      details: error.message,
    });
  }
}
