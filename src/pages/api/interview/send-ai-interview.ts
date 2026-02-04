// API endpoint to send AI Interview to candidate
// Similar to send-mcq workflow

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { SessionPasswordService } from "@/lib/session-password-service";
import { sendAIInterviewInvitation } from "@/lib/email";

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
    const {
      candidateId,
      jobPostId,
      questions,
      questionType,
      duration,
      templateId, // Optional: if using saved template
    } = req.body;

    // Validation
    if (!candidateId || !jobPostId || !questions || questions.length === 0) {
      return res.status(400).json({
        error: "Candidate ID, job ID, and questions are required",
      });
    }

    // Get candidate info
    const candidate = await prisma.resume.findUnique({
      where: { id: candidateId },
      include: {
        JobPost: true,
      },
    });

    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    if (!candidate.candidateEmail) {
      return res.status(400).json({ error: "Candidate email is required" });
    }

    // Generate session password
    const { plainPassword, hashedPassword } =
      await SessionPasswordService.generateHashedPassword();

    // Create Interview record
    const interview = await prisma.interview.create({
      data: {
        title: `AI Interview - ${questionType}`,
        description: `AI-generated ${questionType} questions (${questions.length} questions)`,
        duration: duration || 30,
        status: "PUBLISHED",
        attempted: false,
        candidateEmail: candidate.candidateEmail,
        sessionPassword: plainPassword, // For email display
        sessionPasswordHash: hashedPassword, // For validation
        jobPostId: jobPostId,
        resumeId: candidateId,
        userId: user.userId,
        // Store AI questions in Question table
        questions: {
          create: questions.map((q: any, index: number) => ({
            type: "ESSAY", // AI interviews are essay/open-ended questions
            question: q.question,
            correct: q.expectedAnswer || "", // Store expected answer for reference
            points: 1,
            order: index + 1,
          })),
        },
      },
      include: {
        questions: true,
        jobPost: true,
      },
    });

    // Create Interview Attempt
    const attempt = await prisma.interviewAttempt.create({
      data: {
        interviewerId: user.userId,
        interviewId: interview.id,
        status: "IN_PROGRESS",
      },
    });

    // Generate test link (assuming same portal as MCQ)
    const testLink = `https://exam.synchro-hire.com/`;

    // Send email notification
    const emailSent = await sendAIInterviewInvitation(
      candidate.candidateEmail,
      candidate.candidateName,
      testLink,
      plainPassword,
      interview.jobPost.jobTitle,
      interview.jobPost.companyName,
      duration,
      `AI-generated ${questionType} interview questions`
    );

    if (!emailSent) {
      console.error("Failed to send email to candidate");
    }

    return res.status(200).json({
      success: true,
      message: emailSent
        ? "AI Interview sent successfully to candidate via email"
        : "AI Interview created successfully (email failed to send)",
      emailSent,
      interview: {
        id: interview.id,
        title: interview.title,
        duration: interview.duration,
        totalQuestions: questions.length,
        questionType,
      },
      attempt: {
        id: attempt.id,
        candidateEmail: candidate.candidateEmail,
        candidateName: candidate.candidateName,
        testLink,
        sessionPassword: plainPassword,
      },
    });
  } catch (error: any) {
    console.error("Send AI interview error:", error);
    return res.status(500).json({
      error: "Failed to send AI interview",
      details: error.message,
    });
  }
}
