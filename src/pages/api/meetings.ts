import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // Get all jobs with their meetings
    const jobs = await prisma.jobPost.findMany({
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
