import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { getCached, invalidateCache } from "@/lib/job-cache";

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

    const { jobId } = req.query;
    const companyId = user.companyId!;

    // If jobId is provided, return meetings for that specific job only
    if (jobId) {
      const cacheKey = `meetings:job:${jobId}`;
      const meetings = await getCached(cacheKey, async () => {
        return prisma.meetings.findMany({
          where: {
            jobId: jobId as string,
            JobPost: { companyId },
          },
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
        });
      });

      return res.status(200).json({
        success: true,
        meetings,
      });
    }

    // Otherwise, return all jobs with meeting counts (no meeting data — lazy loaded)
    const cacheKey = `meetings:all:${companyId}`;
    const jobs = await getCached(cacheKey, async () => {
      return prisma.jobPost.findMany({
        where: {
          companyId,
        },
        select: {
          id: true,
          jobTitle: true,
          companyName: true,
          location: true,
          jobType: true,
          experienceLevel: true,
          isActive: true,
          createdAt: true,
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
    });

    return res.status(200).json({
      success: true,
      jobs,
    });
  } catch (error: any) {
    console.error("Error fetching meetings:", error);
    return res.status(500).json({
      error: "Failed to fetch meetings",
      details: error.message,
    });
  }
}
