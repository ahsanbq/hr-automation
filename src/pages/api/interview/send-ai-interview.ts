// API endpoint to send AI Interview to candidate
// Supports both legacy flow and new session-based flow

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { SessionPasswordService } from "@/lib/session-password-service";
import { sendAIInterviewInvitation } from "@/lib/email";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      // New flow: interview session already exists
      interviewId,
      // Legacy flow fields (kept for backward compatibility)
      candidateId,
      jobPostId,
      questions,
      questionType,
      duration,
    } = req.body;

    // === NEW FLOW: Send from existing interview session ===
    if (interviewId) {
      const interview = await prisma.interview.findUnique({
        where: { id: interviewId },
        include: {
          jobPost: true,
          resume: true,
          questions: { orderBy: { order: "asc" } },
        },
      });

      if (!interview) {
        return res.status(404).json({ error: "Interview session not found" });
      }

      if (!interview.candidateEmail) {
        return res.status(400).json({ error: "Candidate email is missing" });
      }

      if (interview.questions.length === 0) {
        return res.status(400).json({
          error: "No questions found. Please generate questions first.",
        });
      }

      // Update interview status to PUBLISHED
      await prisma.interview.update({
        where: { id: interviewId },
        data: { status: "PUBLISHED" },
      });

      // Format times for email
      const startTimeStr = interview.sessionStart
        ? new Date(interview.sessionStart).toLocaleString("en-US", {
            dateStyle: "full",
            timeStyle: "short",
          })
        : "Not set";
      const endTimeStr = interview.sessionEnd
        ? new Date(interview.sessionEnd).toLocaleString("en-US", {
            timeStyle: "short",
          })
        : "Not set";

      // Generate the interview link
      const testLink = `https://exam.synchro-hire.com/`;

      // Send email with full interview details
      const emailSent = await sendAIInterviewInvitation(
        interview.candidateEmail,
        interview.resume.candidateName,
        testLink,
        interview.sessionPassword || "",
        interview.jobPost.jobTitle,
        interview.jobPost.companyName,
        interview.duration,
        undefined,
        // New fields for enhanced email
        interview.id,
        interview.title,
        interview.sessionStart?.toISOString(),
        interview.sessionEnd?.toISOString(),
      );

      return res.status(200).json({
        success: true,
        message: emailSent
          ? "AI Interview sent successfully to candidate via email"
          : "AI Interview published (email failed to send)",
        emailSent,
        interview: {
          id: interview.id,
          title: interview.title,
          duration: interview.duration,
          totalQuestions: interview.questions.length,
          sessionStart: interview.sessionStart,
          sessionEnd: interview.sessionEnd,
        },
        candidate: {
          email: interview.candidateEmail,
          name: interview.resume.candidateName,
          testLink,
          sessionPassword: interview.sessionPassword,
        },
      });
    }

    // === LEGACY FLOW: Create interview and send in one step ===
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
        title: "AI Interview",
        description: `AI-generated ${questionType || "ESSAY"} questions (${questions.length} questions)`,
        duration: duration || 30,
        status: "PUBLISHED",
        attempted: false,
        candidateEmail: candidate.candidateEmail,
        sessionPassword: plainPassword, // Plain password for email/display
        sessionPasswordHash: hashedPassword, // Hashed password for validation
        jobPostId: jobPostId,
        resumeId: candidateId,
        userId: user.userId,
        questions: {
          create: questions.map((q: any, index: number) => ({
            type: "ESSAY",
            question: q.question,
            correct: q.expectedAnswer || q.expected_answer_points?.join("; ") || "",
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

    // Generate test link
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
      candidate: {
        email: candidate.candidateEmail,
        name: candidate.candidateName,
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
