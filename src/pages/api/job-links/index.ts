import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import crypto from "crypto";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  switch (req.method) {
    case "GET":
      return handleGet(req, res, user);
    case "POST":
      return handlePost(req, res, user);
    default:
      return res.status(405).json({ error: "Method not allowed" });
  }
}

// GET /api/job-links?jobId=xxx  — list links (optionally filtered by job)
async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  user: any
) {
  try {
    const { jobId } = req.query;

    const where: any = {
      createdById: user.userId,
    };
    if (jobId && typeof jobId === "string") {
      where.jobId = jobId;
    }

    const links = await prisma.jobApplicationLink.findMany({
      where,
      include: {
        jobPost: {
          select: {
            id: true,
            jobTitle: true,
            companyName: true,
            location: true,
            jobType: true,
            experienceLevel: true,
            isActive: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Auto-expire any that are past expiresAt but still ACTIVE
    const now = new Date();
    const toExpire = links.filter(
      (l) => l.status === "ACTIVE" && l.expiresAt < now
    );
    if (toExpire.length > 0) {
      await prisma.jobApplicationLink.updateMany({
        where: { id: { in: toExpire.map((l) => l.id) } },
        data: { status: "EXPIRED" },
      });
      // Update the returned data in-place
      for (const l of links) {
        if (toExpire.some((e) => e.id === l.id)) {
          (l as any).status = "EXPIRED";
        }
      }
    }

    return res.status(200).json({ links });
  } catch (error: any) {
    console.error("Error fetching job links:", error);
    return res.status(500).json({ error: "Failed to fetch job links" });
  }
}

// POST /api/job-links  — create a new link
async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse,
  user: any
) {
  try {
    const { jobId, validityDays, maxCvLimit } = req.body;

    if (!jobId || !validityDays || !maxCvLimit) {
      return res.status(400).json({
        error: "jobId, validityDays, and maxCvLimit are required",
      });
    }

    // Verify job exists and belongs to user's company
    const jobPost = await prisma.jobPost.findFirst({
      where: { id: jobId, createdById: user.userId },
    });

    if (!jobPost) {
      return res.status(404).json({ error: "Job not found or access denied" });
    }

    // Generate a secure, non-guessable token
    const token = crypto.randomBytes(32).toString("hex");

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + Number(validityDays) * 24 * 60 * 60 * 1000
    );

    const link = await prisma.jobApplicationLink.create({
      data: {
        jobId,
        token,
        expiresAt,
        maxCvLimit: Number(maxCvLimit),
        currentCvCount: 0,
        status: "ACTIVE",
        createdById: user.userId,
      },
      include: {
        jobPost: {
          select: {
            id: true,
            jobTitle: true,
            companyName: true,
          },
        },
      },
    });

    const publicUrl = `${
      req.headers.origin || `http://${req.headers.host}`
    }/apply/${token}`;

    return res.status(201).json({
      link,
      publicUrl,
      message: "Application link created successfully",
    });
  } catch (error: any) {
    console.error("Error creating job link:", error);
    return res.status(500).json({ error: "Failed to create job link" });
  }
}

