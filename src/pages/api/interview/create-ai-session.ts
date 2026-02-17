// API endpoint to create an AI Interview session
// Step in the new Create AI Interview modal flow

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { SessionPasswordService } from "@/lib/session-password-service";

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
      jobPostId,
      candidateId,
      sessionStart, // ISO datetime string — start of the exam window
      sessionEnd, // ISO datetime string — end of the exam window
      duration, // Exam duration in minutes (1-20)
    } = req.body;

    // Validation
    if (!jobPostId || !candidateId) {
      return res.status(400).json({
        error: "Job Post ID and Candidate ID are required",
      });
    }

    if (!sessionStart || !sessionEnd) {
      return res.status(400).json({
        error: "Session start and end dates are required",
      });
    }

    if (!duration || duration < 1 || duration > 20) {
      return res.status(400).json({
        error: "Exam duration must be between 1 and 20 minutes",
      });
    }

    const startDate = new Date(sessionStart);
    const endDate = new Date(sessionEnd);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        error: "Invalid session start or end date format",
      });
    }

    if (endDate <= startDate) {
      return res.status(400).json({
        error: "Session end must be after session start",
      });
    }

    // Get candidate info
    const candidate = await prisma.resume.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    if (!candidate.candidateEmail) {
      return res.status(400).json({ error: "Candidate email is required" });
    }

    // Get job info
    const jobPost = await prisma.jobPost.findUnique({
      where: { id: jobPostId },
    });

    if (!jobPost) {
      return res.status(404).json({ error: "Job post not found" });
    }

    // Generate session password
    const { plainPassword, hashedPassword } =
      await SessionPasswordService.generateHashedPassword();

    // Create Interview record
    const interview = await prisma.interview.create({
      data: {
        title: "AI Interview",
        description: `AI Interview for ${jobPost.jobTitle} - ${candidate.candidateName}`,
        duration: Math.round(duration), // exam duration in minutes (1-20)
        status: "DRAFT",
        attempted: false,
        candidateEmail: candidate.candidateEmail,
        sessionPassword: plainPassword, // Plain password for email/display
        sessionPasswordHash: hashedPassword, // Hashed password for validation
        sessionStart: startDate,
        sessionEnd: endDate,
        jobPostId,
        resumeId: candidateId,
        userId: user.userId,
      },
      include: {
        jobPost: true,
        resume: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "AI Interview session created successfully",
      interview: {
        id: interview.id,
        title: interview.title,
        duration: interview.duration,
        sessionStart: interview.sessionStart,
        sessionEnd: interview.sessionEnd,
        candidateEmail: interview.candidateEmail,
        sessionPassword: plainPassword, // Return plain password for display/email only
        jobTitle: interview.jobPost.jobTitle,
        companyName: interview.jobPost.companyName,
        candidateName: interview.resume.candidateName,
      },
    });
  } catch (error: any) {
    console.error("Create AI session error:", error);
    return res.status(500).json({
      error: "Failed to create AI interview session",
      details: error.message,
    });
  }
}
