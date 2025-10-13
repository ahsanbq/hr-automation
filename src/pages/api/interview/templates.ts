/**
 * API endpoint to list all interview templates
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import type { InterviewTemplate } from "@/types/interview";

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
    const { status, limit = "50", offset = "0" } = req.query;

    // Build where clause
    const whereClause: any = {
      userId: user.userId,
    };

    if (status && typeof status === "string") {
      whereClause.status = status.toUpperCase();
    }

    // Get templates with questions
    const templates = await prisma.interview.findMany({
      where: whereClause,
      include: {
        questions: {
          orderBy: {
            order: "asc",
          },
          select: {
            id: true,
            question: true,
            type: true,
            options: true,
            correct: true,
            points: true,
            order: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            questions: true,
            interviewAttempts: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    // Transform to response format
    const responseTemplates: InterviewTemplate[] = templates.map(
      (template) => ({
        id: template.id,
        title: template.title,
        description: template.description || undefined,
        createdAt: template.createdAt.toISOString(),
        questions: template.questions.map((q) => ({
          id: q.id,
          question: q.question,
          type: q.type as
            | "MULTIPLE_CHOICE"
            | "TRUE_FALSE"
            | "ESSAY"
            | "FILL_BLANK",
          options: q.options as string[] | undefined,
          correct: q.correct,
          points: q.points,
          order: q.order,
        })),
        totalQuestions: template._count.questions,
        duration: template.duration,
        status: template.status as "DRAFT" | "PUBLISHED" | "ARCHIVED",
      })
    );

    return res.status(200).json({
      success: true,
      templates: responseTemplates,
      total: templates.length,
    });
  } catch (error: any) {
    console.error("List templates error:", error);
    return res.status(500).json({
      error: "Failed to fetch templates",
      details: error.message,
    });
  }
}
