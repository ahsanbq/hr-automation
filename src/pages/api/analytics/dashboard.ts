import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // Get current user's company ID from JWT token (for now using default)
    const companyId = 1; // TODO: Extract from JWT token

    // Fast DB health check: if unreachable, return empty analytics so UI renders
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (dbErr: any) {
      return res.status(200).json({
        success: true,
        data: {
          summary: {
            totalJobs: 0,
            totalResumes: 0,
            totalInterviews: 0,
            totalMeetings: 0,
            totalMCQTemplates: 0,
            avgMatchScore: 0,
            avgInterviewScore: 0,
            conversionRates: {
              applicationToInterview: 0,
              interviewToMeeting: 0,
              interviewCompletion: 0,
            },
          },
          recent: { jobs: [], resumes: [], interviews: [], meetings: [] },
          analytics: {
            topSkills: [],
            experienceLevels: [],
            jobTypes: [],
            meetingTypes: [],
            interviewStatus: [],
            resumeRecommendations: [],
            weeklyActivity: [],
            monthlyTrends: [],
          },
        },
      });
    }

    // Parallel queries for better performance
    const [
      totalJobs,
      totalResumes,
      totalInterviews,
      totalMeetings,
      totalMCQTemplates,
      recentJobs,
      recentResumes,
      recentInterviews,
      recentMeetings,
      jobStats,
      resumeStats,
      interviewStats,
      meetingStats,
      topSkills,
      experienceLevels,
      jobTypes,
      meetingTypes,
      interviewTypes,
      // placeholders for activity data (computed below)
      // weeklyActivity,
      // monthlyTrends,
    ] = await Promise.all([
      // Total counts
      prisma.jobPost.count({
        where: { companyId },
      }),
      prisma.resume.count({
        where: { JobPost: { companyId } },
      }),
      prisma.interview.count({
        where: { jobPost: { companyId } },
      }),
      prisma.meetings.count({
        where: { JobPost: { companyId } },
      }),
      prisma.mCQTemplate.count({
        where: { companyId },
      }),

      // Recent records
      prisma.jobPost.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          jobTitle: true,
          companyName: true,
          location: true,
          createdAt: true,
          _count: { select: { Resume: true } },
        },
      }),
      prisma.resume.findMany({
        where: { JobPost: { companyId } },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          candidateName: true,
          candidateEmail: true,
          matchScore: true,
          recommendation: true,
          createdAt: true,
          JobPost: { select: { jobTitle: true } },
        },
      }),
      prisma.interview.findMany({
        where: { jobPost: { companyId } },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          attempted: true,
          candidateEmail: true,
          createdAt: true,
          jobPost: { select: { jobTitle: true } },
          _count: { select: { questions: true } },
        },
      }),
      prisma.meetings.findMany({
        where: { JobPost: { companyId } },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          meetingType: true,
          status: true,
          meetingTime: true,
          createdAt: true,
          JobPost: { select: { jobTitle: true } },
          Resume: { select: { candidateName: true } },
        },
      }),

      // Statistics
      prisma.jobPost.groupBy({
        by: ["jobType"],
        where: { companyId },
        _count: { jobType: true },
      }),
      prisma.resume.groupBy({
        by: ["recommendation"],
        where: { JobPost: { companyId } },
        _count: { recommendation: true },
      }),
      prisma.interview.groupBy({
        by: ["status"],
        where: { jobPost: { companyId } },
        _count: { status: true },
      }),
      prisma.meetings.groupBy({
        by: ["status", "meetingType"],
        where: { JobPost: { companyId } },
        _count: { status: true },
      }),

      // Top skills
      prisma.resume.findMany({
        where: { JobPost: { companyId } },
        select: { skills: true },
        take: 100,
      }),

      // Experience levels
      prisma.resume.groupBy({
        by: ["experienceYears"],
        where: { JobPost: { companyId } },
        _count: { experienceYears: true },
      }),

      // Job types
      prisma.jobPost.groupBy({
        by: ["jobType"],
        where: { companyId },
        _count: { jobType: true },
      }),

      // Meeting types
      prisma.meetings.groupBy({
        by: ["meetingType"],
        where: { JobPost: { companyId } },
        _count: { meetingType: true },
      }),

      // Interview types
      prisma.interview.groupBy({
        by: ["status"],
        where: { jobPost: { companyId } },
        _count: { status: true },
      }),

      // Placeholders so Promise.all arity matches (we'll compute after)
      Promise.resolve(null),
      Promise.resolve(null),
    ]);

    // Weekly activity and Monthly trends with guards
    let weeklyActivity: Array<{ date: string; type: string; count: number }> =
      [];
    let monthlyTrends: Array<{ month: string; jobs_created: number }> = [];
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);

      const [jobsLastWeek, resumesLastWeek] = await Promise.all([
        prisma.jobPost.findMany({
          where: { companyId, createdAt: { gte: sevenDaysAgo } },
          select: { createdAt: true },
        }),
        prisma.resume.findMany({
          where: { createdAt: { gte: sevenDaysAgo }, JobPost: { companyId } },
          select: { createdAt: true },
        }),
      ]);

      const formatDate = (d: Date) =>
        new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();

      const jobCountsByDate: Record<string, number> = {};
      jobsLastWeek.forEach((j) => {
        const key = formatDate(new Date(j.createdAt));
        jobCountsByDate[key] = (jobCountsByDate[key] || 0) + 1;
      });

      const resumeCountsByDate: Record<string, number> = {};
      resumesLastWeek.forEach((r) => {
        const key = formatDate(new Date(r.createdAt));
        resumeCountsByDate[key] = (resumeCountsByDate[key] || 0) + 1;
      });

      const allDates = Array.from(
        new Set([
          ...Object.keys(jobCountsByDate),
          ...Object.keys(resumeCountsByDate),
        ])
      ).sort();
      weeklyActivity = allDates.flatMap((dateKey) => {
        const jobCount = jobCountsByDate[dateKey] || 0;
        const resumeCount = resumeCountsByDate[dateKey] || 0;
        return [
          { date: dateKey, type: "job", count: jobCount },
          { date: dateKey, type: "resume", count: resumeCount },
        ];
      });

      // Monthly trends (last 6 months)
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(now.getMonth() - 6);

      const jobsLastSixMonths = await prisma.jobPost.findMany({
        where: { companyId, createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      });

      const monthKey = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthlyBuckets: Record<string, number> = {};
      jobsLastSixMonths.forEach((j) => {
        const key = monthKey(new Date(j.createdAt));
        monthlyBuckets[key] = (monthlyBuckets[key] || 0) + 1;
      });
      monthlyTrends = Object.entries(monthlyBuckets)
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([key, count]) => ({ month: key, jobs_created: count }));
    } catch (e) {
      weeklyActivity = [];
      monthlyTrends = [];
    }

    // Process top skills
    const skillCounts: { [key: string]: number } = {};
    topSkills.forEach((resume) => {
      resume.skills.forEach((skill: string) => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
    });
    const topSkillsList = Object.entries(skillCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));

    // Process experience levels
    const experienceData = experienceLevels.map((item) => ({
      level: item.experienceYears
        ? `${item.experienceYears} years`
        : "Not specified",
      count: item._count.experienceYears,
    }));

    // Process job types
    const jobTypeData = jobStats.map((item) => ({
      type: item.jobType,
      count: item._count.jobType,
    }));

    // Process meeting types
    const meetingTypeData = meetingTypes.map((item) => ({
      type: item.meetingType || "Not specified",
      count: item._count.meetingType,
    }));

    // Process interview status
    const interviewStatusData = interviewStats.map((item) => ({
      status: item.status,
      count: item._count.status,
    }));

    // Process resume recommendations
    const resumeRecommendationData = resumeStats.map((item) => ({
      recommendation: item.recommendation || "Not specified",
      count: item._count.recommendation,
    }));

    // Calculate averages and metrics
    const avgMatchScore = await prisma.resume.aggregate({
      where: { JobPost: { companyId }, matchScore: { not: null } },
      _avg: { matchScore: true },
    });

    const totalInterviewAttempts = await prisma.interviewAttempt.count({
      where: { interview: { jobPost: { companyId } } },
    });

    const completedInterviews = await prisma.interviewAttempt.count({
      where: {
        interview: { jobPost: { companyId } },
        status: "COMPLETED",
      },
    });

    const avgInterviewScore = await prisma.interviewAttempt.aggregate({
      where: {
        interview: { jobPost: { companyId } },
        score: { not: null },
      },
      _avg: { score: true },
    });

    // Calculate conversion rates
    const conversionRates = {
      applicationToInterview:
        totalResumes > 0 ? (totalInterviews / totalResumes) * 100 : 0,
      interviewToMeeting:
        totalInterviews > 0 ? (totalMeetings / totalInterviews) * 100 : 0,
      interviewCompletion:
        totalInterviewAttempts > 0
          ? (completedInterviews / totalInterviewAttempts) * 100
          : 0,
    };

    return res.status(200).json({
      success: true,
      data: {
        // Summary stats
        summary: {
          totalJobs,
          totalResumes,
          totalInterviews,
          totalMeetings,
          totalMCQTemplates,
          avgMatchScore: avgMatchScore._avg.matchScore || 0,
          avgInterviewScore: avgInterviewScore._avg.score || 0,
          conversionRates,
        },

        // Recent activity
        recent: {
          jobs: recentJobs,
          resumes: recentResumes,
          interviews: recentInterviews,
          meetings: recentMeetings,
        },

        // Analytics data
        analytics: {
          topSkills: topSkillsList,
          experienceLevels: experienceData,
          jobTypes: jobTypeData,
          meetingTypes: meetingTypeData,
          interviewStatus: interviewStatusData,
          resumeRecommendations: resumeRecommendationData,
          weeklyActivity: weeklyActivity,
          monthlyTrends: monthlyTrends,
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching analytics data:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch analytics data",
      details: error.message,
    });
  }
}
