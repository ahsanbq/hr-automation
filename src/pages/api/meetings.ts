import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // Get current user and verify authentication
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!user.companyId) {
      return res
        .status(403)
        .json({ error: "User must be associated with a company" });
    }

    // Get jobs with their meetings - filtered by company
    const jobs = await prisma.jobPost.findMany({
      where: {
        companyId: user.companyId, // Filter by company
      },
      include: {
        meetings: {
          include: {
            Resume: {
              select: {
                candidateName: true,
                candidateEmail: true,
                candidatePhone: true,
                matchScore: true,
              },
            },
            User: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            meetingTime: "desc",
          },
        },
        _count: {
          select: {
            meetings: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      jobs: jobs,
    });
  } catch (error: any) {
    console.error("Error fetching meetings:", error);
    return res.status(500).json({
      error: "Failed to fetch meetings",
      details: error.message,
    });
  } finally {
    await prisma.$disconnect();
  }
}
