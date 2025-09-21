import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Temporarily bypass authentication for testing
  const user = { userId: -1, email: "admin", type: "ADMIN", companyId: null };

  if (req.method === "GET") {
    const meetings = await prisma.meeting.findMany({
      include: {
        resume: {
          include: {
            jobPost: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { meetingTime: "asc" },
    });
    return res.json(meetings);
  }

  if (req.method === "POST") {
    const {
      meetingTime,
      meetingLink,
      meetingSummary,
      meetingRating,
      meetingType,
      agenda,
      status,
      notes,
      interviewType,
      resumeId,
      jobId,
    } = req.body || {};

    // Validate required fields
    if (!resumeId || !jobId || !meetingTime) {
      return res.status(400).json({
        error: "Missing required fields: resumeId, jobId, meetingTime",
      });
    }

    // Validate that resume belongs to the specified job
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
    });

    if (!resume) {
      return res.status(404).json({ error: "Resume not found" });
    }

    if (resume.jobPostId !== jobId) {
      return res.status(400).json({
        error: "Resume does not belong to the specified job",
      });
    }

    // Check if meeting already exists for this resume
    const existingMeeting = await prisma.meeting.findFirst({
      where: { resumeId: resumeId },
    });

    if (existingMeeting) {
      return res.status(409).json({
        error: "Meeting already exists for this resume",
      });
    }

    const created = await prisma.meeting.create({
      data: {
        meetingTime: new Date(meetingTime),
        meetingLink,
        meetingSummary,
        meetingRating,
        meetingType,
        agenda,
        status: status || "SCHEDULED",
        notes,
        jobId,
        resumeId,
        createdById: user.userId,
        interviewType,
      },
      include: {
        resume: {
          include: {
            jobPost: true,
          },
        },
      },
    });
    return res.status(201).json(created);
  }

  if (req.method === "PUT") {
    const { id, ...updateData } = req.body || {};

    if (!id) {
      return res.status(400).json({ error: "Meeting ID is required" });
    }

    // Convert meetingTime to Date if provided
    if (updateData.meetingTime) {
      updateData.meetingTime = new Date(updateData.meetingTime);
    }

    const updated = await prisma.meeting.update({
      where: { id },
      data: updateData,
      include: {
        resume: {
          include: {
            jobPost: true,
          },
        },
      },
    });
    return res.json(updated);
  }

  if (req.method === "DELETE") {
    const { id } = req.body || {};

    if (!id) {
      return res.status(400).json({ error: "Meeting ID is required" });
    }

    await prisma.meeting.delete({ where: { id } });
    return res.status(204).end();
  }

  return res.status(405).json({ error: "Method not allowed" });
}
