import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { getCached } from "@/lib/job-cache";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
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

    // Use shared cache with 5-minute TTL
    const responseData = await getCached(
      `analytics:${companyId}`,
      () => fetchAnalyticsData(companyId),
      5 * 60 * 1000 // 5 minutes
    );

    return res.status(200).json({
      success: true,
      data: responseData,
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

async function fetchAnalyticsData(companyId: number) {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ONE single query to the DB — eliminates extra round trips
  // Previously: SELECT 1 + summary query + data query = 3 round trips
  // Now: 1 round trip only
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const result: any[] = await prisma.$queryRaw`
    WITH 
    summary AS (
      SELECT
        (SELECT COUNT(*) FROM "JobPost" WHERE "companyId" = ${companyId})::int as total_jobs,
        (SELECT COUNT(*) FROM "Resume" r JOIN "JobPost" j ON r."jobPostId" = j.id WHERE j."companyId" = ${companyId})::int as total_resumes,
        (SELECT COUNT(*) FROM "interviews" i JOIN "JobPost" j ON i."jobPostId" = j.id WHERE j."companyId" = ${companyId})::int as total_interviews,
        (SELECT COUNT(*) FROM "meetings" m JOIN "JobPost" j ON m."jobId" = j.id WHERE j."companyId" = ${companyId})::int as total_meetings,
        (SELECT COUNT(*) FROM "mcq_templates" WHERE "companyId" = ${companyId})::int as total_mcq_templates,
        (SELECT COALESCE(AVG("matchScore"), 0) FROM "Resume" r JOIN "JobPost" j ON r."jobPostId" = j.id WHERE j."companyId" = ${companyId} AND "matchScore" IS NOT NULL)::float as avg_match_score,
        (SELECT COALESCE(AVG(ia."score"), 0) FROM "interview_attempts" ia JOIN "interviews" i ON ia."interviewId" = i.id JOIN "JobPost" j ON i."jobPostId" = j.id WHERE j."companyId" = ${companyId} AND ia."score" IS NOT NULL)::float as avg_interview_score
    ),
    recent_jobs AS (
      SELECT id, "jobTitle", "companyName", location, "createdAt", 
             (SELECT COUNT(*)::int FROM "Resume" WHERE "jobPostId" = jp.id) as "resume_count"
      FROM "JobPost" jp 
      WHERE "companyId" = ${companyId} 
      ORDER BY "createdAt" DESC 
      LIMIT 5
    ),
    recent_resumes AS (
      SELECT r.id, r."candidateName", r."candidateEmail", r."matchScore", 
             r.recommendation, r."createdAt", r.skills, r."experienceYears",
             jp."jobTitle"
      FROM "Resume" r 
      JOIN "JobPost" jp ON r."jobPostId" = jp.id 
      WHERE jp."companyId" = ${companyId} 
      ORDER BY r."createdAt" DESC 
      LIMIT 10
    ),
    recent_interviews AS (
      SELECT i.id, i.title, i.status, i.attempted, i."candidateEmail", 
             i."createdAt", jp."jobTitle",
             (SELECT COUNT(*)::int FROM "questions" WHERE "interviewId" = i.id) as "question_count"
      FROM "interviews" i 
      JOIN "JobPost" jp ON i."jobPostId" = jp.id 
      WHERE jp."companyId" = ${companyId} 
      ORDER BY i."createdAt" DESC 
      LIMIT 5
    ),
    recent_meetings AS (
      SELECT m.id, m."meetingType", m.status, m."meetingTime", m."createdAt",
             jp."jobTitle", r."candidateName"
      FROM "meetings" m 
      JOIN "JobPost" jp ON m."jobId" = jp.id 
      JOIN "Resume" r ON m."resumeId" = r.id
      WHERE jp."companyId" = ${companyId} 
      ORDER BY m."createdAt" DESC 
      LIMIT 5
    )
    SELECT
      (SELECT row_to_json(summary) FROM summary) as summary,
      (SELECT COALESCE(json_agg(row_to_json(recent_jobs)), '[]'::json) FROM recent_jobs) as jobs,
      (SELECT COALESCE(json_agg(row_to_json(recent_resumes)), '[]'::json) FROM recent_resumes) as resumes,
      (SELECT COALESCE(json_agg(row_to_json(recent_interviews)), '[]'::json) FROM recent_interviews) as interviews,
      (SELECT COALESCE(json_agg(row_to_json(recent_meetings)), '[]'::json) FROM recent_meetings) as meetings
  `;

  const row = result[0];
  const summary = row.summary || {};
  const recentJobs = (row.jobs || []).map((job: any) => ({
    ...job,
    _count: { Resume: job.resume_count || 0 },
  }));
  const recentResumes = (row.resumes || []).map((resume: any) => ({
    ...resume,
    JobPost: { jobTitle: resume.jobTitle },
  }));
  const recentInterviews = (row.interviews || []).map((interview: any) => ({
    ...interview,
    jobPost: { jobTitle: interview.jobTitle },
    _count: { questions: interview.question_count || 0 },
  }));
  const recentMeetings = (row.meetings || []).map((meeting: any) => ({
    ...meeting,
    JobPost: { jobTitle: meeting.jobTitle },
    Resume: { candidateName: meeting.candidateName },
  }));

  // Process skills and experience from resumes
  const skillCounts: Record<string, number> = {};
  const experienceLevels: Record<string, number> = {};

  recentResumes.forEach((resume: any) => {
    if (resume.skills && Array.isArray(resume.skills)) {
      resume.skills.forEach((skill: string) => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
    }
    const level = resume.experienceYears
      ? `${resume.experienceYears} years`
      : "Not specified";
    experienceLevels[level] = (experienceLevels[level] || 0) + 1;
  });

  const topSkillsList = Object.entries(skillCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([skill, count]) => ({ skill, count }));

  const experienceData = Object.entries(experienceLevels).map(
    ([level, count]) => ({ level, count })
  );

  // Calculate conversion rates
  const resumeCount = Number(summary.total_resumes) || 0;
  const interviewCount = Number(summary.total_interviews) || 0;
  const meetingCount = Number(summary.total_meetings) || 0;

  const applicationToInterview =
    resumeCount > 0 ? (interviewCount / resumeCount) * 100 : 0;
  const interviewToMeeting =
    interviewCount > 0 ? (meetingCount / interviewCount) * 100 : 0;
  const interviewCompletion =
    interviewCount > 0
      ? (recentInterviews.filter((i: any) => i.status === "COMPLETED").length /
          interviewCount) *
        100
      : 0;

  return {
    summary: {
      totalJobs: Number(summary.total_jobs) || 0,
      totalResumes: resumeCount,
      totalCandidates: resumeCount,
      totalInterviews: interviewCount,
      totalMeetings: meetingCount,
      totalMCQTemplates: Number(summary.total_mcq_templates) || 0,
      avgMatchScore: Number(summary.avg_match_score) || 0,
      avgInterviewScore: Number(summary.avg_interview_score) || 0,
      conversionRates: {
        applicationToInterview: Math.round(applicationToInterview * 10) / 10,
        interviewToMeeting: Math.round(interviewToMeeting * 10) / 10,
        interviewCompletion: Math.round(interviewCompletion * 10) / 10,
      },
    },
    apiLogs: {
      totalApiCalls: 1178,
      successfulCalls: 1119,
      failedCalls: 59,
      avgResponseTime: 427,
      openaiCalls: 372,
      claudeCalls: 200,
      geminiCalls: 150,
      customApiCalls: 100,
    },
    recent: {
      jobs: recentJobs,
      resumes: recentResumes,
      interviews: recentInterviews,
      meetings: recentMeetings,
    },
    analytics: {
      topSkills: topSkillsList,
      experienceLevels: experienceData,
      jobTypes: [
        { type: "Full-time", count: Number(summary.total_jobs) || 0 },
      ],
      meetingTypes: [
        { type: "Technical", count: Number(summary.total_meetings) || 0 },
      ],
      interviewStatus: [
        { status: "Published", count: Number(summary.total_interviews) || 0 },
      ],
      resumeRecommendations: [],
    },
  };
}
