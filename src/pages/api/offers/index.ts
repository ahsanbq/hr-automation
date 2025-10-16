import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = getUserFromRequest(req);

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    switch (req.method) {
      case "GET":
        return await getOffers(req, res, user.userId);
      case "POST":
        return await createOffer(req, res, user.userId);
      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Offers API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function getOffers(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: number
) {
  const { jobId, status } = req.query;

  const where: any = {
    createdById: userId,
  };

  if (jobId) {
    where.jobPostId = jobId as string;
  }

  if (status) {
    where.status = status as string;
  }

  // Check if OfferLetter table exists, if not return empty array
  try {
    const offers = await prisma.offerLetter.findMany({
      where,
      include: {
        jobPost: {
          select: {
            id: true,
            jobTitle: true,
            companyName: true,
            location: true,
          },
        },
        resume: {
          select: {
            id: true,
            candidateName: true,
            candidateEmail: true,
            candidatePhone: true,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({ offers });
  } catch (error: any) {
    // If OfferLetter table doesn't exist, return empty array
    if (
      error.message?.includes("offerLetter") ||
      error.message?.includes("Unknown model")
    ) {
      return res.status(200).json({ offers: [] });
    }
    throw error;
  }
}

async function createOffer(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: number
) {
  const { jobPostId, resumeId, offeredPosition, salary, joiningDate, notes } =
    req.body;

  if (!jobPostId || !resumeId || !offeredPosition || !salary) {
    return res.status(400).json({
      error:
        "Missing required fields: jobPostId, resumeId, offeredPosition, salary",
    });
  }

  // Verify job and resume exist and belong to user
  const job = await prisma.jobPost.findFirst({
    where: {
      id: jobPostId,
      createdById: userId,
    },
  });

  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  const resume = await prisma.resume.findFirst({
    where: {
      id: resumeId,
      jobPostId: jobPostId,
    },
  });

  if (!resume) {
    return res.status(404).json({ error: "Resume not found for this job" });
  }

  // Check if OfferLetter table exists
  try {
    const offer = await prisma.offerLetter.create({
      data: {
        jobPostId,
        resumeId,
        createdById: userId,
        offeredPosition,
        salary,
        joiningDate: joiningDate ? new Date(joiningDate) : null,
        notes,
      },
      include: {
        jobPost: {
          select: {
            id: true,
            jobTitle: true,
            companyName: true,
            location: true,
          },
        },
        resume: {
          select: {
            id: true,
            candidateName: true,
            candidateEmail: true,
            candidatePhone: true,
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
    });

    return res.status(201).json({ offer });
  } catch (error: any) {
    // If OfferLetter table doesn't exist, return error
    if (
      error.message?.includes("offerLetter") ||
      error.message?.includes("Unknown model")
    ) {
      return res.status(503).json({
        error:
          "Offer letter feature not available yet. Database migration required.",
      });
    }
    throw error;
  }
}
