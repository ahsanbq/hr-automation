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
    return await handleGetAssessmentStats(req, res, user!);
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGetAssessmentStats(
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

  // Get all assessment stages
  const assessmentStages = await prisma.assessmentStage.findMany({
    where,
    select: {
      id: true,
      type: true,
      status: true,
      resultScore: true,
      completedAt: true,
      createdAt: true,
    },
  });

  // Calculate statistics
  const totalStages = assessmentStages.length;
  const pendingStages = assessmentStages.filter(
    (s) => s.status === "PENDING"
  ).length;
  const inProgressStages = assessmentStages.filter(
    (s) => s.status === "IN_PROGRESS"
  ).length;
  const completedStages = assessmentStages.filter(
    (s) => s.status === "COMPLETED"
  ).length;
  const cancelledStages = assessmentStages.filter(
    (s) => s.status === "CANCELLED"
  ).length;

  // Calculate average score
  const completedWithScores = assessmentStages.filter(
    (s) => s.status === "COMPLETED" && s.resultScore !== null
  );
  const averageScore =
    completedWithScores.length > 0
      ? completedWithScores.reduce((sum, s) => sum + (s.resultScore || 0), 0) /
        completedWithScores.length
      : 0;

  // Calculate completion rate
  const completionRate =
    totalStages > 0 ? (completedStages / totalStages) * 100 : 0;

  // Stages by type
  const stagesByType = {
    MCQ: assessmentStages.filter((s) => s.type === "MCQ").length,
    AVATAR: assessmentStages.filter((s) => s.type === "AVATAR").length,
    MANUAL: assessmentStages.filter((s) => s.type === "MANUAL").length,
  };

  // Top performers (completed stages with highest scores)
  const topPerformers = assessmentStages
    .filter((s) => s.status === "COMPLETED" && s.resultScore !== null)
    .sort((a, b) => (b.resultScore || 0) - (a.resultScore || 0))
    .slice(0, 5)
    .map((stage) => ({
      stageId: stage.id,
      type: stage.type,
      resultScore: stage.resultScore,
      completedAt: stage.completedAt,
    }));

  // Recent activity (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentActivity = assessmentStages
    .filter((s) => s.createdAt >= sevenDaysAgo)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 10)
    .map((stage) => ({
      stageId: stage.id,
      type: stage.type,
      status: stage.status,
      createdAt: stage.createdAt,
    }));

  // Performance trends (monthly)
  const monthlyTrends = await getMonthlyTrends(where);

  // Assessment type distribution
  const typeDistribution = {
    MCQ: {
      total: stagesByType.MCQ,
      completed: assessmentStages.filter(
        (s) => s.type === "MCQ" && s.status === "COMPLETED"
      ).length,
      averageScore: getAverageScoreForType(assessmentStages, "MCQ"),
    },
    AVATAR: {
      total: stagesByType.AVATAR,
      completed: assessmentStages.filter(
        (s) => s.type === "AVATAR" && s.status === "COMPLETED"
      ).length,
      averageScore: getAverageScoreForType(assessmentStages, "AVATAR"),
    },
    MANUAL: {
      total: stagesByType.MANUAL,
      completed: assessmentStages.filter(
        (s) => s.type === "MANUAL" && s.status === "COMPLETED"
      ).length,
      averageScore: getAverageScoreForType(assessmentStages, "MANUAL"),
    },
  };

  const stats = {
    totalStages,
    pendingStages,
    inProgressStages,
    completedStages,
    cancelledStages,
    averageScore: Math.round(averageScore * 100) / 100,
    completionRate: Math.round(completionRate * 100) / 100,
    stagesByType,
    topPerformers,
    recentActivity,
    monthlyTrends,
    typeDistribution,
  };

  return res.status(200).json({ stats });
}

async function getMonthlyTrends(where: any) {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyData = await prisma.assessmentStage.groupBy({
    by: ["createdAt"],
    where: {
      ...where,
      createdAt: {
        gte: sixMonthsAgo,
      },
    },
    _count: {
      id: true,
    },
  });

  // Group by month and sum counts
  const monthlyTrends = monthlyData.reduce((acc, item) => {
    const month = item.createdAt.toISOString().substring(0, 7); // YYYY-MM format
    acc[month] = (acc[month] || 0) + item._count.id;
    return acc;
  }, {} as Record<string, number>);

  return monthlyTrends;
}

function getAverageScoreForType(stages: any[], type: string): number {
  const typeStages = stages.filter(
    (s) => s.type === type && s.status === "COMPLETED" && s.resultScore !== null
  );
  if (typeStages.length === 0) return 0;

  const average =
    typeStages.reduce((sum, s) => sum + (s.resultScore || 0), 0) /
    typeStages.length;
  return Math.round(average * 100) / 100;
}



