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
      interviewDate,
      startTime,
      endTime,
    } = req.body;

    // Validation
    if (!jobPostId || !candidateId) {
      return res.status(400).json({
        error: "Job Post ID and Candidate ID are required",
      });
    }

    if (!interviewDate || !startTime || !endTime) {
      return res.status(400).json({
        error: "Interview date, start time, and end time are required",
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

    // Build session start/end from date + time
    const sessionStart = new Date(`${interviewDate}T${startTime}`);
    const sessionEnd = new Date(`${interviewDate}T${endTime}`);

    // Calculate duration in minutes
    const durationMs = sessionEnd.getTime() - sessionStart.getTime();
    const duration = Math.max(Math.round(durationMs / 60000), 10);

    // Generate session password
    const { plainPassword, hashedPassword } =
      await SessionPasswordService.generateHashedPassword();

    // Create Interview record with title "AI Interview"
    const interview = await prisma.interview.create({
      data: {
        title: "AI Interview",
        description: `AI Interview for ${jobPost.jobTitle} - ${candidate.candidateName}`,
        duration,
        status: "DRAFT",
        attempted: false,
        candidateEmail: candidate.candidateEmail,
        sessionPassword: plainPassword,
        sessionPasswordHash: hashedPassword,
        sessionStart,
        sessionEnd,
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
        sessionPassword: plainPassword,
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

