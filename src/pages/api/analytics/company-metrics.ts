import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // Get current user and company ID from JWT token
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!user.companyId) {
      return res
        .status(403)
        .json({ error: "User must be associated with a company" });
    }

    const companyId = user.companyId;

    // Get comprehensive company-specific analytics
    const [
      companyInfo,
      jobMetrics,
      candidateMetrics,
      interviewMetrics,
      meetingMetrics,
      skillAnalytics,
      timeSeriesData,
      performanceMetrics,
    ] = await Promise.all([
      // 1. Company Information
      prisma.companies.findUnique({
        where: { id: companyId },
        select: {
          name: true,
          address: true,
          country: true,
          website: true,
          createdAt: true,
          _count: {
            select: {
              User: true,
            },
          },
        },
      }),

      // 2. Job Metrics
      prisma.$queryRaw`
        SELECT 
          COUNT(*) as total_jobs,
          COUNT(CASE WHEN jp."isActive" = true THEN 1 END) as active_jobs,
          COUNT(CASE WHEN jp."isActive" = false THEN 1 END) as inactive_jobs,
          AVG(CASE WHEN jp."salaryRange" IS NOT NULL AND jp."salaryRange" != '' AND REGEXP_REPLACE(jp."salaryRange", '[^0-9]', '', 'g') != '' THEN 
            CAST(REGEXP_REPLACE(jp."salaryRange", '[^0-9]', '', 'g') AS BIGINT) 
          END)::numeric as avg_salary,
          COUNT(CASE WHEN jp."createdAt" >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as jobs_last_30_days,
          COUNT(CASE WHEN jp."createdAt" >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as jobs_last_7_days
        FROM "JobPost" jp
        WHERE jp."companyId" = ${companyId}
      `,

      // 3. Candidate Metrics
      prisma.$queryRaw`
        SELECT 
          COUNT(*) as total_candidates,
          COUNT(CASE WHEN r."matchScore" >= 80 THEN 1 END) as high_match_candidates,
          COUNT(CASE WHEN r."matchScore" >= 60 AND r."matchScore" < 80 THEN 1 END) as medium_match_candidates,
          COUNT(CASE WHEN r."matchScore" < 60 THEN 1 END) as low_match_candidates,
          AVG(r."matchScore") as avg_match_score,
          COUNT(CASE WHEN r."createdAt" >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as candidates_last_30_days,
          COUNT(CASE WHEN r."createdAt" >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as candidates_last_7_days
        FROM "Resume" r
        JOIN "JobPost" j ON r."jobPostId" = j.id
        WHERE j."companyId" = ${companyId}
      `,

      // 4. Interview Metrics
      prisma.$queryRaw`
        SELECT 
          COUNT(*) as total_interviews,
          COUNT(CASE WHEN i.status = 'PUBLISHED' THEN 1 END) as published_interviews,
          COUNT(CASE WHEN i.status = 'DRAFT' THEN 1 END) as draft_interviews,
          COUNT(CASE WHEN i.status = 'ARCHIVED' THEN 1 END) as archived_interviews,
          AVG(CASE WHEN ia.score IS NOT NULL THEN ia.score END) as avg_interview_score,
          COUNT(CASE WHEN i."createdAt" >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as interviews_last_30_days
        FROM "interviews" i
        JOIN "JobPost" j ON i."jobPostId" = j.id
        LEFT JOIN "interview_attempts" ia ON i.id = ia."interviewId"
        WHERE j."companyId" = ${companyId}
      `,

      // 5. Meeting Metrics
      prisma.$queryRaw`
        SELECT 
          COUNT(*) as total_meetings,
          COUNT(CASE WHEN m.status = 'SCHEDULED' THEN 1 END) as scheduled_meetings,
          COUNT(CASE WHEN m.status = 'COMPLETED' THEN 1 END) as completed_meetings,
          COUNT(CASE WHEN m.status = 'CANCELLED' THEN 1 END) as cancelled_meetings,
          COUNT(CASE WHEN m."createdAt" >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as meetings_last_30_days
        FROM "meetings" m
        JOIN "JobPost" j ON m."jobId" = j.id
        WHERE j."companyId" = ${companyId}
      `,

      // 6. Skill Analytics
      prisma.$queryRaw`
        WITH skill_counts AS (
          SELECT unnest(skills) as skill, COUNT(*) as count
          FROM "Resume" r
          JOIN "JobPost" j ON r."jobPostId" = j.id
          WHERE j."companyId" = ${companyId} AND skills IS NOT NULL
          GROUP BY unnest(skills)
        )
        SELECT skill, count
        FROM skill_counts
        ORDER BY count DESC
        LIMIT 20
      `,

      // 7. Time Series Data (last 12 months)
      prisma.$queryRaw`
        WITH months AS (
          SELECT generate_series(
            DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months'),
            DATE_TRUNC('month', CURRENT_DATE),
            '1 month'::interval
          ) as month
        )
        SELECT 
          TO_CHAR(months.month, 'YYYY-MM') as month,
          COUNT(j.id) as jobs_created,
          COUNT(r.id) as candidates_added,
          COUNT(i.id) as interviews_conducted,
          COUNT(m.id) as meetings_scheduled
        FROM months
        LEFT JOIN "JobPost" j ON DATE_TRUNC('month', j."createdAt") = months.month AND j."companyId" = ${companyId}
        LEFT JOIN "Resume" r ON DATE_TRUNC('month', r."createdAt") = months.month 
          AND r."jobPostId" IN (SELECT id FROM "JobPost" WHERE "companyId" = ${companyId})
        LEFT JOIN "interviews" i ON DATE_TRUNC('month', i."createdAt") = months.month 
          AND i."jobPostId" IN (SELECT id FROM "JobPost" WHERE "companyId" = ${companyId})
        LEFT JOIN "meetings" m ON DATE_TRUNC('month', m."createdAt") = months.month 
          AND m."jobId" IN (SELECT id FROM "JobPost" WHERE "companyId" = ${companyId})
        GROUP BY months.month
        ORDER BY months.month
      `,

      // 8. Performance Metrics
      prisma.$queryRaw`
        SELECT 
          COUNT(DISTINCT j.id) as total_jobs,
          COUNT(DISTINCT r.id) as total_candidates,
          COUNT(DISTINCT i.id) as total_interviews,
          COUNT(DISTINCT m.id) as total_meetings,
          ROUND(AVG(r."matchScore")::numeric, 2) as avg_match_score,
          ROUND(AVG(ia.score)::numeric, 2) as avg_interview_score,
          COUNT(CASE WHEN r.recommendation = 'HIRE' THEN 1 END) as hire_recommendations,
          COUNT(CASE WHEN r.recommendation = 'NO_HIRE' THEN 1 END) as no_hire_recommendations,
          COUNT(CASE WHEN r.recommendation = 'MAYBE' THEN 1 END) as maybe_recommendations
        FROM "JobPost" j
        LEFT JOIN "Resume" r ON j.id = r."jobPostId"
        LEFT JOIN "interviews" i ON j.id = i."jobPostId"
        LEFT JOIN "meetings" m ON j.id = m."jobId"
        LEFT JOIN "interview_attempts" ia ON i.id = ia."interviewId"
        WHERE j."companyId" = ${companyId}
      `,
    ]);

    // Process and format the data
    const jobMetricsData = (jobMetrics as any)[0];
    const candidateMetricsData = (candidateMetrics as any)[0];
    const interviewMetricsData = (interviewMetrics as any)[0];
    const meetingMetricsData = (meetingMetrics as any)[0];
    const skillAnalyticsData = skillAnalytics as any;
    const timeSeriesDataFormatted = timeSeriesData as any;
    const performanceMetricsData = (performanceMetrics as any)[0];

    // Calculate additional metrics
    const totalJobs = Number(jobMetricsData.total_jobs) || 0;
    const totalCandidates = Number(candidateMetricsData.total_candidates) || 0;
    const totalInterviews = Number(interviewMetricsData.total_interviews) || 0;
    const totalMeetings = Number(meetingMetricsData.total_meetings) || 0;

    const responseData = {
      company: {
        name: companyInfo?.name || "Unknown Company",
        address: companyInfo?.address || "",
        country: companyInfo?.country || "",
        website: companyInfo?.website || "",
        memberCount: companyInfo?._count?.User || 0,
        joinedDate: companyInfo?.createdAt || null,
      },
      jobs: {
        total: totalJobs,
        active: Number(jobMetricsData.active_jobs) || 0,
        inactive: Number(jobMetricsData.inactive_jobs) || 0,
        last30Days: Number(jobMetricsData.jobs_last_30_days) || 0,
        last7Days: Number(jobMetricsData.jobs_last_7_days) || 0,
        avgSalary: Number(jobMetricsData.avg_salary) || 0,
      },
      candidates: {
        total: totalCandidates,
        highMatch: Number(candidateMetricsData.high_match_candidates) || 0,
        mediumMatch: Number(candidateMetricsData.medium_match_candidates) || 0,
        lowMatch: Number(candidateMetricsData.low_match_candidates) || 0,
        avgMatchScore: Number(candidateMetricsData.avg_match_score) || 0,
        last30Days: Number(candidateMetricsData.candidates_last_30_days) || 0,
        last7Days: Number(candidateMetricsData.candidates_last_7_days) || 0,
      },
      interviews: {
        total: totalInterviews,
        published: Number(interviewMetricsData.published_interviews) || 0,
        draft: Number(interviewMetricsData.draft_interviews) || 0,
        archived: Number(interviewMetricsData.archived_interviews) || 0,
        avgScore: Number(interviewMetricsData.avg_interview_score) || 0,
        last30Days: Number(interviewMetricsData.interviews_last_30_days) || 0,
      },
      meetings: {
        total: totalMeetings,
        scheduled: Number(meetingMetricsData.scheduled_meetings) || 0,
        completed: Number(meetingMetricsData.completed_meetings) || 0,
        cancelled: Number(meetingMetricsData.cancelled_meetings) || 0,
        last30Days: Number(meetingMetricsData.meetings_last_30_days) || 0,
      },
      skills: {
        topSkills: skillAnalyticsData.map((skill: any) => ({
          skill: skill.skill,
          count: Number(skill.count),
        })),
      },
      trends: {
        monthlyData: timeSeriesDataFormatted.map((month: any) => ({
          month: month.month,
          jobsCreated: Number(month.jobs_created) || 0,
          candidatesAdded: Number(month.candidates_added) || 0,
          interviewsConducted: Number(month.interviews_conducted) || 0,
          meetingsScheduled: Number(month.meetings_scheduled) || 0,
        })),
      },
      performance: {
        avgMatchScore: Number(performanceMetricsData.avg_match_score) || 0,
        avgInterviewScore:
          Number(performanceMetricsData.avg_interview_score) || 0,
        hireRecommendations:
          Number(performanceMetricsData.hire_recommendations) || 0,
        noHireRecommendations:
          Number(performanceMetricsData.no_hire_recommendations) || 0,
        maybeRecommendations:
          Number(performanceMetricsData.maybe_recommendations) || 0,
      },
      kpis: {
        applicationToInterviewRate:
          totalCandidates > 0 ? (totalInterviews / totalCandidates) * 100 : 0,
        interviewToMeetingRate:
          totalInterviews > 0 ? (totalMeetings / totalInterviews) * 100 : 0,
        interviewCompletionRate:
          totalInterviews > 0
            ? (Number(interviewMetricsData.published_interviews) /
                totalInterviews) *
              100
            : 0,
        meetingCompletionRate:
          totalMeetings > 0
            ? (Number(meetingMetricsData.completed_meetings) / totalMeetings) *
              100
            : 0,
      },
    };

    return res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error: any) {
    console.error("Error fetching company metrics:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch company metrics",
      details: error.message,
    });
  }
}
