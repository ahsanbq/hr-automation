// API endpoint to save AI Interview question templates
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "POST") {
    return handleCreate(req, res, user);
  } else if (req.method === "GET") {
    return handleList(req, res, user);
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}

async function handleCreate(
  req: NextApiRequest,
  res: NextApiResponse,
  user: any
) {
  try {
    const {
      title,
      description,
      questionType,
      questions,
      jobPostId,
      difficulty,
      totalQuestions,
    } = req.body;

    // Validation
    if (!title || !questionType || !questions || questions.length === 0) {
      return res.status(400).json({
        error: "Title, question type, and questions are required",
      });
    }

    if (!user.companyId) {
      return res.status(400).json({ error: "Company ID is required" });
    }

    // Create AI Interview Template
    const template = await prisma.aIInterviewTemplate.create({
      data: {
        title,
        description,
        questionType,
        questions: questions, // JSON array
        jobPostId: jobPostId || null,
        difficulty: difficulty || null,
        totalQuestions: totalQuestions || questions.length,
        companyId: user.companyId,
        createdById: user.userId,
      },
    });

    return res.status(201).json({
      success: true,
      message: "AI Interview template created successfully",
      template,
    });
  } catch (error: any) {
    console.error("Create AI template error:", error);
    return res.status(500).json({
      error: "Failed to create template",
      details: error.message,
    });
  }
}

async function handleList(
  req: NextApiRequest,
  res: NextApiResponse,
  user: any
) {
  try {
    if (!user.companyId) {
      return res.status(400).json({ error: "Company ID is required" });
    }

    const templates = await prisma.aIInterviewTemplate.findMany({
      where: {
        companyId: user.companyId,
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      templates,
    });
  } catch (error: any) {
    console.error("List AI templates error:", error);
    return res.status(500).json({
      error: "Failed to fetch templates",
      details: error.message,
    });
  }
}
