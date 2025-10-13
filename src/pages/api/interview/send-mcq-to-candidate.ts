/**
 * Convenient API endpoint to send MCQ to a specific candidate
 * This combines template generation/selection + custom interview creation + sending
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { sendMCQInvitation } from "@/lib/email";
import { SessionPasswordService } from "@/lib/session-password-service";
import { z } from "zod";

const SendMCQToCandidateSchema = z.object({
  candidateEmail: z.string().email("Valid email is required"),
  candidateName: z.string().min(1, "Candidate name is required"),
  message: z.string().optional(),

  // Option 1: Use existing template
  templateId: z.string().optional(),

  // Option 2: Generate new template
  generateNew: z
    .object({
      title: z.string().min(1, "Title is required"),
      description: z.string().optional(),
      topics: z.array(z.string()).min(1, "At least one topic is required"),
      difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
      numberOfQuestions: z.number().min(1).max(50).default(5),
    })
    .optional(),

  // Option 3: Select specific questions
  selectedQuestions: z
    .object({
      templateIds: z
        .array(z.string())
        .min(1, "At least one template is required"),
      questionIds: z
        .array(z.string())
        .min(1, "At least one question is required"),
    })
    .optional(),

  // Interview settings
  interviewTitle: z.string().optional(),
  duration: z.number().min(5).max(180).default(30),
});

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
    const validatedData = SendMCQToCandidateSchema.parse(req.body);
    const {
      candidateEmail,
      candidateName,
      message,
      templateId,
      generateNew,
      selectedQuestions,
      interviewTitle,
      duration,
    } = validatedData;

    let interviewId: string;
    let templateQuestions: any[] = [];

    // Handle different scenarios
    if (templateId) {
      // Scenario 1: Use existing template
      const template = await prisma.interview.findFirst({
        where: {
          id: templateId,
          userId: user.userId,
        },
        include: {
          questions: {
            orderBy: { order: "asc" },
          },
        },
      });

      if (!template) {
        return res.status(404).json({
          error: "Template not found or not accessible",
        });
      }

      interviewId = template.id;
      templateQuestions = template.questions;
    } else if (generateNew) {
      // Scenario 2: Generate new template
      const generateResponse = await fetch(
        "https://ai.synchro-hire.com/generate-mcq-questions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            topics: generateNew.topics,
            difficulty: generateNew.difficulty.toLowerCase(),
            number_of_questions: generateNew.numberOfQuestions,
          }),
        }
      );

      if (!generateResponse.ok) {
        return res.status(500).json({
          error: "Failed to generate questions",
        });
      }

      const generateData = await generateResponse.json();
      if (!generateData.success || !generateData.questions) {
        return res.status(500).json({
          error: "Failed to generate questions",
        });
      }

      // Create new interview template
      const newTemplate = await prisma.interview.create({
        data: {
          title: generateNew.title,
          description: generateNew.description || "",
          duration,
          status: "DRAFT",
          jobPostId: "",
          resumeId: "",
          userId: user.userId,
          questions: {
            create: generateData.questions.map(
              (question: any, index: number) => ({
                type: "MULTIPLE_CHOICE",
                question: question.question,
                options: question.options,
                correct: question.answer,
                points: 1,
                order: index + 1,
              })
            ),
          },
        },
        include: {
          questions: {
            orderBy: { order: "asc" },
          },
        },
      });

      interviewId = newTemplate.id;
      templateQuestions = newTemplate.questions;
    } else if (selectedQuestions) {
      // Scenario 3: Select specific questions from templates
      const templates = await prisma.interview.findMany({
        where: {
          id: { in: selectedQuestions.templateIds },
          userId: user.userId,
        },
        include: {
          questions: {
            where: {
              id: { in: selectedQuestions.questionIds },
            },
            orderBy: { order: "asc" },
          },
        },
      });

      if (templates.length !== selectedQuestions.templateIds.length) {
        return res.status(400).json({
          error: "Some templates not found or not accessible",
        });
      }

      const selectedQuestionsData = templates.flatMap(
        (template) => template.questions
      );

      if (
        selectedQuestionsData.length !== selectedQuestions.questionIds.length
      ) {
        return res.status(400).json({
          error: "Some questions not found in the specified templates",
        });
      }

      // Create custom interview
      const customInterview = await prisma.interview.create({
        data: {
          title: interviewTitle || `Custom Assessment - ${candidateName}`,
          description: `Custom assessment for ${candidateName}`,
          duration,
          status: "DRAFT",
          jobPostId: "",
          resumeId: "",
          userId: user.userId,
          questions: {
            create: selectedQuestionsData.map((question, index) => ({
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
            orderBy: { order: "asc" },
          },
        },
      });

      interviewId = customInterview.id;
      templateQuestions = customInterview.questions;
    } else {
      return res.status(400).json({
        error:
          "Must provide either templateId, generateNew, or selectedQuestions",
      });
    }

    // Generate secure session password with bcrypt hash
    const { plainPassword, hashedPassword } =
      await SessionPasswordService.generateHashedPassword();

    // Update interview with candidate information and secure session password
    await prisma.interview.update({
      where: { id: interviewId },
      data: {
        candidateEmail,
        sessionPassword: plainPassword, // Keep plain text for email display
        sessionPasswordHash: hashedPassword, // Store bcrypt hash for validation
      },
    });

    // Create interview attempt for the candidate
    const attempt = await prisma.interviewAttempt.create({
      data: {
        interviewerId: user.userId,
        interviewId,
        status: "IN_PROGRESS",
      },
    });

    // Update interview status to PUBLISHED
    await prisma.interview.update({
      where: { id: interviewId },
      data: { status: "PUBLISHED" },
    });

    // Generate test link
    const testLink = `https://exam.synchro-hire.com/`;

    // Send email notification to candidate
    const emailSent = await sendMCQInvitation(
      candidateEmail,
      candidateName,
      testLink,
      plainPassword,
      duration,
      templateQuestions.length,
      message
    );

    if (!emailSent) {
      console.error("Failed to send email to candidate");
      // Don't fail the request if email fails, just log it
    }

    return res.status(200).json({
      success: true,
      message: emailSent
        ? "MCQ sent successfully to candidate via email"
        : "MCQ created successfully (email failed to send)",
      emailSent,
      attempt: {
        id: attempt.id,
        interviewId: attempt.interviewId,
        candidateEmail: candidateEmail,
        candidateName: candidateName,
        status: attempt.status,
        testLink,
        sessionPassword: plainPassword,
        expiresAt: new Date(Date.now() + duration * 60 * 1000).toISOString(),
      },
      interview: {
        id: interviewId,
        title: interviewTitle || "MCQ Assessment",
        duration,
        totalQuestions: templateQuestions.length,
      },
    });
  } catch (error: any) {
    console.error("Send MCQ to candidate error:", error);

    if (error.name === "ZodError") {
      return res.status(400).json({
        error: "Validation error",
        details: error.errors,
      });
    }

    return res.status(500).json({
      error: "Failed to send MCQ to candidate",
      details: error.message,
    });
  }
}

// Note: generateSessionPassword() function removed - now using SessionPasswordService
