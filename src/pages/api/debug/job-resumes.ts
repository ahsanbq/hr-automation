import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { jobId } = req.query;
  if (!jobId || typeof jobId !== "string") {
    return res.status(400).json({ error: "Job ID required" });
  }

  try {
    // Debug: Check user info
    const userInfo = {
      userId: user.userId,
      email: user.email,
      type: user.type,
      companyId: user.companyId,
    };

    // Debug: Check if job exists and user has access
    const job = await prisma.jobPost.findFirst({
      where: {
        id: jobId,
        createdById: user.userId,
      },
      include: {
        companies: true,
        User: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Debug: Check all jobs for this user
    const allUserJobs = await prisma.jobPost.findMany({
      where: {
        createdById: user.userId,
      },
      select: {
        id: true,
        jobTitle: true,
        companyName: true,
        createdById: true,
      },
    });

    // Debug: Check resumes for this job
    const resumes = await prisma.resume.findMany({
      where: { jobPostId: jobId },
      include: {
        User: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Debug: Check all resumes for this user's jobs
    const allUserResumes = await prisma.resume.findMany({
      where: {
        JobPost: {
          createdById: user.userId,
        },
      },
      include: {
        JobPost: {
          select: {
            id: true,
            jobTitle: true,
            createdById: true,
          },
        },
      },
    });

    return res.status(200).json({
      debug: {
        userInfo,
        job,
        allUserJobs,
        resumes,
        allUserResumes,
        jobId,
      },
    });
  } catch (error: any) {
    console.error("Debug error:", error);
    return res.status(500).json({
      error: "Debug failed",
      details: error.message,
    });
  }
}



