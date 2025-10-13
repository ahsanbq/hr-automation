/**
 * API endpoint for managing individual MCQ questions
 * Each question is stored as a separate row in MCQTemplate table
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

  try {
    if (req.method === "GET") {
      // Get MCQ questions for the user's company
      const { topic, difficulty, limit = "50", offset = "0" } = req.query;

      // Build where clause
      const whereClause: any = {
        companyId: user.companyId!,
        isActive: true,
      };

      if (topic && typeof topic === "string") {
        whereClause.topic = topic;
      }

      if (difficulty && typeof difficulty === "string") {
        whereClause.difficulty = difficulty.toUpperCase();
      }

      const questions = await prisma.mCQTemplate.findMany({
        where: whereClause,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      });

      // Group questions by topic for easier management
      const questionsByTopic = questions.reduce((acc, question) => {
        const topic = question.topic;
        if (!acc[topic]) {
          acc[topic] = [];
        }
        acc[topic].push({
          id: question.id,
          question: question.question,
          options: question.options,
          correctAnswer: question.correctAnswer,
          topic: question.topic,
          difficulty: question.difficulty,
          explanation: question.explanation,
          isActive: question.isActive,
          createdAt: question.createdAt.toISOString(),
          createdBy: question.createdBy,
        });
        return acc;
      }, {} as Record<string, any[]>);

      return res.status(200).json({
        success: true,
        questions: questions,
        questionsByTopic: questionsByTopic,
        total: questions.length,
        topics: Object.keys(questionsByTopic),
      });
    }

    if (req.method === "POST") {
      const { questions } = req.body;

      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({
          error: "Questions array is required",
        });
      }

      if (!user.companyId) {
        return res.status(400).json({
          error: "User must be associated with a company",
        });
      }

      // Save each question as a separate row
      const savedQuestions = await Promise.all(
        questions.map((question: any) =>
          prisma.mCQTemplate.create({
            data: {
              question: question.question,
              options: question.options,
              correctAnswer: question.answer || question.correctAnswer,
              topic: question.topic,
              difficulty: question.difficulty.toUpperCase(),
              explanation: question.explanation || "",
              companyId: user.companyId!,
              createdById: user.userId,
            },
          })
        )
      );

      return res.status(201).json({
        success: true,
        message: `Successfully saved ${savedQuestions.length} questions`,
        questions: savedQuestions,
      });
    }

    if (req.method === "DELETE") {
      const { questionId } = req.query;

      if (!questionId || typeof questionId !== "string") {
        return res.status(400).json({
          error: "Question ID is required",
        });
      }

      // Verify question belongs to user's company
      const question = await prisma.mCQTemplate.findFirst({
        where: {
          id: questionId,
          companyId: user.companyId!,
        },
      });

      if (!question) {
        return res.status(404).json({
          error: "Question not found or not accessible",
        });
      }

      // Delete question
      await prisma.mCQTemplate.delete({
        where: {
          id: questionId,
        },
      });

      return res.status(200).json({
        success: true,
        message: "Question deleted successfully",
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    console.error("MCQ templates API error:", error);
    return res.status(500).json({
      error: "Failed to process request",
      details: error.message,
    });
  }
}
