/**
 * API endpoint to send MCQ test to candidates
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { SessionPasswordService } from "@/lib/session-password-service";
import { SendTestSchema } from "@/types/interview";

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
    const validatedData = SendTestSchema.parse(req.body);
    const { interviewId, candidateEmail, candidateName, message } =
      validatedData;

    // Verify interview exists and belongs to user
    const interview = await prisma.interview.findFirst({
      where: {
        id: interviewId,
        userId: user.userId,
      },
      include: {
        questions: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    if (!interview) {
      return res.status(404).json({
        error: "Interview not found or not accessible",
      });
    }

    // Check if attempt already exists for this candidate
    const existingAttempt = await prisma.interviewAttempt.findFirst({
      where: {
        interviewId,
      },
    });

    if (existingAttempt) {
      return res.status(400).json({
        error: "Test already sent to this candidate",
        attemptId: existingAttempt.id,
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

    // Create interview attempt
    const attempt = await prisma.interviewAttempt.create({
      data: {
        interviewerId: user.userId,
        interviewId,
        status: "IN_PROGRESS",
      },
    });

    // Update interview status to PUBLISHED if it's DRAFT
    if (interview.status === "DRAFT") {
      await prisma.interview.update({
        where: { id: interviewId },
        data: { status: "PUBLISHED" },
      });
    }

    // Generate test link
    const testLink = `https://exam.synchro-hire.com/`;

    // TODO: Send email notification to candidate
    // This would integrate with your email service (Nodemailer, SendGrid, etc.)
    console.log(`Test sent to ${candidateEmail}: ${testLink}`);

    return res.status(200).json({
      success: true,
      message: "Test sent successfully to candidate",
      attempt: {
        id: attempt.id,
        interviewId: attempt.interviewId,
        candidateEmail: candidateEmail,
        candidateName: candidateName,
        status: attempt.status,
        testLink,
        sessionPassword: plainPassword,
        expiresAt: new Date(
          Date.now() + interview.duration * 60 * 1000
        ).toISOString(),
      },
      interview: {
        id: interview.id,
        title: interview.title,
        duration: interview.duration,
        totalQuestions: interview.questions.length,
      },
    });
  } catch (error: any) {
    console.error("Send test error:", error);

    if (error.name === "ZodError") {
      return res.status(400).json({
        error: "Validation error",
        details: error.errors,
      });
    }

    return res.status(500).json({
      error: "Failed to send test",
      details: error.message,
    });
  }
}

// Note: generateSessionPassword() function removed - now using SessionPasswordService
