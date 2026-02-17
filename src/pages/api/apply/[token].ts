import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";

/**
 * Public API endpoint — NO authentication required.
 * GET  /api/apply/:token → Fetch job details if link is valid
 * (CV upload is handled by /api/apply/:token/upload)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { token } = req.query;
  if (!token || typeof token !== "string") {
    return res.status(400).json({ error: "Token is required" });
  }

  try {
    const link = await prisma.jobApplicationLink.findUnique({
      where: { token },
      include: {
        jobPost: {
          select: {
            id: true,
            jobTitle: true,
            companyName: true,
            location: true,
            jobType: true,
            experienceLevel: true,
            salaryRange: true,
            skillsRequired: true,
            jobDescription: true,
            keyResponsibilities: true,
            qualifications: true,
            benefits: true,
            isActive: true,
          },
        },
      },
    });

    if (!link) {
      return res.status(404).json({
        error: "INVALID",
        message: "This application link is invalid or does not exist.",
      });
    }

    // Check status
    if (link.status === "CLOSED") {
      return res.status(410).json({
        error: "CLOSED",
        message:
          "This application link has been closed. The maximum number of applications has been reached.",
      });
    }

    if (link.status === "EXPIRED") {
      return res.status(410).json({
        error: "EXPIRED",
        message: "This application link has expired.",
      });
    }

    // Check time-based expiry
    const now = new Date();
    if (now > link.expiresAt) {
      // Auto-expire the link
      await prisma.jobApplicationLink.update({
        where: { id: link.id },
        data: { status: "EXPIRED" },
      });
      return res.status(410).json({
        error: "EXPIRED",
        message: "This application link has expired.",
      });
    }

    // Check CV limit
    if (link.currentCvCount >= link.maxCvLimit) {
      await prisma.jobApplicationLink.update({
        where: { id: link.id },
        data: { status: "CLOSED" },
      });
      return res.status(410).json({
        error: "CLOSED",
        message:
          "This application link has been closed. The maximum number of applications has been reached.",
      });
    }

    // Check if job is still active
    if (!link.jobPost.isActive) {
      return res.status(410).json({
        error: "JOB_INACTIVE",
        message: "This job posting is no longer active.",
      });
    }

    return res.status(200).json({
      valid: true,
      job: link.jobPost,
      remaining: link.maxCvLimit - link.currentCvCount,
      expiresAt: link.expiresAt,
    });
  } catch (error: any) {
    console.error("Error validating apply token:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

