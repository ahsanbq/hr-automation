/**
 * Simple API endpoint to send MCQ from candidate table
 * Used when HR selects MCQ template from dropdown in candidate table
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { sendMCQInvitation } from "@/lib/email";
import { SessionPasswordService } from "@/lib/session-password-service";
import { z } from "zod";

const SendMCQSimpleSchema = z.object({
  candidateEmail: z.string().email("Valid email is required"),
  candidateName: z.string().min(1, "Candidate name is required"),
  questionId: z.string().min(1, "Question ID is required"),
  message: z.string().optional(),
  duration: z.number().min(5).max(180).default(30),
  jobId: z.string().optional(),
  resumeId: z.string().optional(),
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
    const validatedData = SendMCQSimpleSchema.parse(req.body);
    const {
      candidateEmail,
      candidateName,
      questionId,
      message,
      duration,
      jobId,
      resumeId,
    } = validatedData;

    // Get the MCQ question
    const question = await prisma.mCQTemplate.findFirst({
      where: {
        id: questionId,
        createdById: user.userId,
        isActive: true,
      },
    });

    if (!question) {
      return res.status(404).json({
        error: "Question not found or not accessible",
      });
    }

    // Validate that we have valid job and resume IDs if provided
    if (jobId) {
      const jobExists = await prisma.jobPost.findUnique({
        where: { id: jobId },
      });
      if (!jobExists) {
        return res.status(400).json({
          error: "Invalid job ID provided",
        });
      }
    }

    if (resumeId) {
      const resumeExists = await prisma.resume.findUnique({
        where: { id: resumeId },
      });
      if (!resumeExists) {
        return res.status(400).json({
          error: "Invalid resume ID provided",
        });
      }
    }

    // Create custom interview for the candidate with single question
    const customInterview = await prisma.interview.create({
      data: {
        title: `MCQ Assessment - ${question.topic} - ${candidateName}`,
        description: `Single question assessment for ${candidateName}`,
        duration: duration,
        status: "DRAFT",
        jobPostId: jobId || "",
        resumeId: resumeId || "",
        userId: user.userId,
        questions: {
          create: [
            {
              type: "MULTIPLE_CHOICE",
              question: question.question,
              options: question.options as any,
              correct: question.correctAnswer as any,
              points: 1,
              order: 1,
            },
          ],
        },
      },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
      },
    });

    // Generate secure session password with bcrypt hash
    const { plainPassword, hashedPassword } =
      await SessionPasswordService.generateHashedPassword();

    // Update interview with candidate information and secure session password
    await prisma.interview.update({
      where: { id: customInterview.id },
      data: {
        candidateEmail,
        sessionPassword: plainPassword, // Keep plain text for email display
        sessionPasswordHash: hashedPassword, // Store bcrypt hash for validation
      },
    });

    // Create interview attempt
    const attempt = await prisma.interviewAttempt.create({
      data: {
        interviewerId: user.userId,
        interviewId: customInterview.id,
        status: "IN_PROGRESS",
      },
    });

    // Update interview status to PUBLISHED
    await prisma.interview.update({
      where: { id: customInterview.id },
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
      1, // Single question
      message
    );

    if (!emailSent) {
      console.error("Failed to send email to candidate");
    }

    return res.status(200).json({
      success: true,
      message: emailSent
        ? "MCQ sent successfully to candidate via email"
        : "MCQ created successfully (email failed to send)",
      emailSent,
      attempt: {
        id: attempt.id,
        candidateEmail,
        candidateName,
        testLink,
        sessionPassword: plainPassword,
        expiresAt: new Date(Date.now() + duration * 60 * 1000).toISOString(),
      },
      interview: {
        id: customInterview.id,
        title: customInterview.title,
        duration,
        totalQuestions: 1,
      },
    });
  } catch (error: any) {
    console.error("Send MCQ simple error:", error);

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
