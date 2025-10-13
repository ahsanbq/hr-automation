/**
 * API endpoint to generate MCQ template using OpenAI API
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import {
  GenerateTemplateSchema,
  type OpenAIGenerateResponse,
} from "@/types/interview";

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
    const validatedData = GenerateTemplateSchema.parse(req.body);
    const {
      title,
      description,
      topics,
      difficulty,
      numberOfQuestions,
      duration,
      jobPostId,
    } = validatedData;

    // Generate questions using external API
    const generateResponse = await fetch(
      "https://ai.synchro-hire.com/generate-mcq-questions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          topics,
          difficulty: difficulty.toLowerCase(), // Convert to lowercase for external API
          number_of_questions: numberOfQuestions,
        }),
      }
    );

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      console.error("External API error:", generateResponse.status, errorText);
      return res.status(500).json({
        error: "Failed to generate questions",
        details: `External API returned ${generateResponse.status}: ${errorText}`,
      });
    }

    const generateData: OpenAIGenerateResponse = await generateResponse.json();

    if (!generateData.success || !generateData.questions) {
      return res.status(500).json({
        error: "Failed to generate questions",
        details: generateData.error || "Invalid response from generation API",
      });
    }

    // Create interview template in database
    const interview = await prisma.interview.create({
      data: {
        title,
        description: description || "",
        duration,
        status: "DRAFT",
        jobPostId: jobPostId || "", // Use empty string if not provided
        resumeId: "", // Empty for templates
        userId: user.userId,
        questions: {
          create: generateData.questions.map((question, index) => ({
            type: "MULTIPLE_CHOICE",
            question: question.question,
            options: question.options,
            correct: question.answer,
            points: 1,
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
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: `Successfully generated ${generateData.questions.length} questions`,
      template: {
        id: interview.id,
        title: interview.title,
        description: interview.description,
        createdAt: interview.createdAt.toISOString(),
        questions: interview.questions.map((q) => ({
          id: q.id,
          question: q.question,
          type: q.type,
          options: q.options,
          correct: q.correct,
          points: q.points,
          order: q.order,
        })),
        totalQuestions: interview.questions.length,
        duration: interview.duration,
        status: interview.status,
      },
    });
  } catch (error: any) {
    console.error("Generate template error:", error);

    if (error.name === "ZodError") {
      return res.status(400).json({
        error: "Validation error",
        details: error.errors,
      });
    }

    return res.status(500).json({
      error: "Failed to generate template",
      details: error.message,
    });
  }
}
