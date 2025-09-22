import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Temporarily bypass authentication for testing
  const user = { userId: -1, email: "admin", type: "ADMIN", companyId: null };

  const { jobId } = req.query;

  if (!jobId || typeof jobId !== "string") {
    return res.status(400).json({ error: "Job ID is required" });
  }

  if (req.method === "GET") {
    // Get job details
    const job = await prisma.jobPost.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        jobTitle: true,
        companyName: true,
        location: true,
        skillsRequired: true,
      },
    });

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Get resumes with meeting information
    const resumes = await prisma.resume.findMany({
      where: { jobPostId: jobId },
      include: {
        meetings: {
          select: {
            id: true,
            meetingTime: true,
            status: true,
            meetingType: true,
            agenda: true,
            notes: true,
            meetingRating: true, // Added meetingRating field
            createdAt: true,
          },
        },
      },
      orderBy: { matchScore: "desc" },
    });

    // Transform data to include meeting status
    const resumesWithMeetingStatus = resumes.map((resume: any) => ({
      ...resume,
      meetingStatus:
        resume.meetings.length > 0 ? resume.meetings[0].status : null,
      hasMeeting: resume.meetings.length > 0,
      meeting: resume.meetings.length > 0 ? resume.meetings[0] : null,
    }));

    return res.json({
      job,
      resumes: resumesWithMeetingStatus,
      totalResumes: resumes.length,
      resumesWithMeetings: resumes.filter((r: any) => r.meetings.length > 0)
        .length,
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
