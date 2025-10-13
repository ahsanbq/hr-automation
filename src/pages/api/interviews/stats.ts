import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    id: number;
    email: string;
    type: string;
    companyId?: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    (req as AuthenticatedRequest).user = decoded;
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const { method } = req;
  const { user } = req as AuthenticatedRequest;

  if (method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${method} not allowed` });
  }

  try {
    return await handleGetStats(req, res, user!);
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGetStats(
  req: NextApiRequest,
  res: NextApiResponse,
  user: { id: number; type: string; companyId?: number }
) {
  const { jobPostId, dateFrom, dateTo } = req.query;

  // Build where clause
  const where: any = {};

  // Company-based filtering for non-admin users
  if (user.type !== "ADMIN") {
    where.jobPost = {
      companyId: user.companyId,
    };
  }

  if (jobPostId) where.jobPostId = jobPostId as string;

  // Date filtering
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom as string);
    if (dateTo) where.createdAt.lte = new Date(dateTo as string);
  }

  // Get basic stats
  const [
    totalInterviews,
    pendingInterviews,
    completedInterviews,
    shortlistedCandidates,
    averageScoreResult,
    topPerformers,
  ] = await Promise.all([
    prisma.interview.count({ where }),
    prisma.interview.count({
      where: { ...where, status: "DRAFT" },
    }),
    prisma.interview.count({
      where: { ...where, status: "PUBLISHED" },
    }),
    // shortlistStatus doesn't exist in Interview model
    Promise.resolve(0),
    prisma.interview.aggregate({
      where: {
        ...where,
        status: "PUBLISHED",
      },
      _count: { id: true },
    }),
    prisma.interview.findMany({
      where: {
        ...where,
        status: "PUBLISHED",
      },
      include: {
        jobPost: {
          select: {
            id: true,
            jobTitle: true,
            companyName: true,
          },
        },
        resume: {
          select: {
            id: true,
            candidateName: true,
            candidateEmail: true,
            matchScore: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  // Get status distribution
  const statusDistribution = await prisma.interview.groupBy({
    by: ["status"],
    where,
    _count: { status: true },
  });

  // Get shortlist distribution - commented out as shortlistStatus doesn't exist
  // const shortlistDistribution = await prisma.interview.groupBy({
  //   by: ["shortlistStatus"],
  //   where: { ...where, status: "PUBLISHED" },
  //   _count: { shortlistStatus: true },
  // });

  // Get score distribution - commented out as percentage doesn't exist
  // const scoreRanges = [
  //   { range: "90-100%", min: 90, max: 100 },
  //   { range: "80-89%", min: 80, max: 89 },
  //   { range: "70-79%", min: 70, max: 79 },
  //   { range: "60-69%", min: 60, max: 69 },
  //   { range: "Below 60%", min: 0, max: 59 },
  // ];

  // const scoreDistribution = await Promise.all(
  //   scoreRanges.map(async (range) => {
  //     const count = await prisma.interview.count({
  //       where: {
  //         ...where,
  //         status: "PUBLISHED",
  //         percentage: {
  //           gte: range.min,
  //           lte: range.max,
  //         },
  //       },
  //     });
  //     return { range: range.range, count };
  //   })
  // );

  // Get recent activity
  const recentActivity = await prisma.interview.findMany({
    where,
    include: {
      jobPost: {
        select: {
          jobTitle: true,
          companyName: true,
        },
      },
      resume: {
        select: {
          candidateName: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  const stats = {
    overview: {
      totalInterviews,
      pendingInterviews,
      completedInterviews,
      shortlistedCandidates,
      averageScore: 0, // percentage doesn't exist in Interview model
    },
    distributions: {
      status: statusDistribution.map((item) => ({
        status: item.status,
        count: item._count.status,
      })),
      shortlist: [], // shortlistStatus doesn't exist in Interview model
      scores: [], // percentage doesn't exist in Interview model
    },
    topPerformers: topPerformers.map((interview) => ({
      id: interview.id,
      candidateName: interview.resume?.candidateName,
      candidateEmail: interview.resume?.candidateEmail,
      jobTitle: interview.jobPost?.jobTitle,
      companyName: interview.jobPost?.companyName,
      score: 0, // percentage doesn't exist in Interview model
      matchScore: interview.resume?.matchScore,
      shortlistStatus: "NOT_SHORTLISTED", // shortlistStatus doesn't exist in Interview model
      completedAt: interview.sessionEnd,
    })),
    recentActivity: recentActivity.map((interview) => ({
      id: interview.id,
      candidateName: interview.resume?.candidateName,
      jobTitle: interview.jobPost?.jobTitle,
      companyName: interview.jobPost?.companyName,
      status: interview.status,
      shortlistStatus: "NOT_SHORTLISTED", // shortlistStatus doesn't exist in Interview model
      updatedAt: interview.updatedAt,
    })),
  };

  return res.status(200).json({ stats });
}
