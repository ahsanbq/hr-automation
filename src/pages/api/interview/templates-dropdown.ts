/**
 * API endpoint to get MCQ questions for dropdown selection
 * Returns individual questions grouped by topic
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

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { topic, difficulty, limit = "100" } = req.query;

    // Build where clause
    const whereClause: any = {
      createdById: user.userId,
      isActive: true,
    };

    if (topic && typeof topic === "string") {
      whereClause.topic = topic;
    }

    if (difficulty && typeof difficulty === "string") {
      whereClause.difficulty = difficulty.toUpperCase();
    }

    // Get individual MCQ questions
    const questions = await prisma.mCQTemplate.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
      take: parseInt(limit as string),
    });

    // Group questions by topic
    const questionsByTopic = questions.reduce((acc, question) => {
      const topic = question.topic;
      if (!acc[topic]) {
        acc[topic] = {
          topic,
          count: 0,
          questions: [],
        };
      }
      acc[topic].count++;
      acc[topic].questions.push({
        value: question.id,
        label: question.question.substring(0, 50) + "...",
        question: question.question,
        options: question.options,
        correctAnswer: question.correctAnswer,
        difficulty: question.difficulty,
        explanation: question.explanation,
        createdAt: question.createdAt.toISOString(),
      });
      return acc;
    }, {} as Record<string, any>);

    // Create dropdown options grouped by topic
    const dropdownOptions = Object.entries(questionsByTopic).map(
      ([topic, data]) => ({
        label: `${topic} (${data.count} questions)`,
        value: topic,
        type: "group",
        children: data.questions.map((q: any) => ({
          value: q.value,
          label: q.label,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          difficulty: q.difficulty,
        })),
      })
    );

    return res.status(200).json({
      success: true,
      options: dropdownOptions,
      questionsByTopic,
      total: questions.length,
      topics: Object.keys(questionsByTopic),
    });
  } catch (error: any) {
    console.error("Get MCQ questions dropdown error:", error);
    return res.status(500).json({
      error: "Failed to fetch MCQ questions for dropdown",
      details: error.message,
    });
  }
}
