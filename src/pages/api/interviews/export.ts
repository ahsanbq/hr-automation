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
    return await handleExportInterviews(req, res, user!);
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleExportInterviews(
  req: NextApiRequest,
  res: NextApiResponse,
  user: { id: number; type: string; companyId?: number }
) {
  const {
    jobPostId,
    interviewerId,
    status,
    shortlistStatus,
    dateFrom,
    dateTo,
    format = "csv",
  } = req.query;

  // Build where clause
  const where: any = {};

  // Company-based filtering for non-admin users
  if (user.type !== "ADMIN") {
    where.jobPost = {
      companyId: user.companyId,
    };
  }

  if (jobPostId) where.jobPostId = jobPostId as string;
  if (interviewerId) where.interviewerId = parseInt(interviewerId as string);
  if (status) where.status = status as string;
  if (shortlistStatus) where.shortlistStatus = shortlistStatus as string;

  // Date filtering
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom as string);
    if (dateTo) where.createdAt.lte = new Date(dateTo as string);
  }

  // Fetch interviews with all related data
  const interviews = await prisma.interview.findMany({
    where,
    include: {
      jobPost: {
        select: {
          id: true,
          jobTitle: true,
          companyName: true,
          location: true,
          skillsRequired: true,
        },
      },
      resume: {
        select: {
          id: true,
          candidateName: true,
          candidateEmail: true,
          candidatePhone: true,
          matchScore: true,
          experienceYears: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      questions: {
        select: {
          id: true,
          question: true,
          options: true,
          correct: true,
          points: true,
        },
      },
      interviewAttempts: {
        include: {
          answers: {
            include: {
              question: {
                select: {
                  id: true,
                  question: true,
                  points: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (format === "json") {
    // Return JSON format
    return res.status(200).json({
      interviews,
      exportedAt: new Date().toISOString(),
      totalCount: interviews.length,
    });
  }

  // Default to CSV format
  const csvHeaders = [
    "Interview ID",
    "Candidate Name",
    "Candidate Email",
    "Candidate Phone",
    "Job Title",
    "Company Name",
    "Location",
    "Interviewer Name",
    "Interviewer Email",
    "Status",
    "Shortlist Status",
    "Total Score",
    "Percentage",
    "Duration (minutes)",
    "Scheduled At",
    "Completed At",
    "Created At",
    "Resume Match Score",
    "Experience Years",
    "Questions Count",
    "Correct Answers",
    "Questions by Category",
    "Questions by Difficulty",
  ];

  const csvRows = interviews.map((interview) => {
    const correctAnswers =
      interview.interviewAttempts?.[0]?.answers?.filter((a) => a.isCorrect)
        .length || 0;
    const questionsByCategory =
      interview.questions?.reduce((acc, q) => {
        const category = "Uncategorized"; // Question model doesn't have category
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

    const questionsByDifficulty =
      interview.questions?.reduce((acc, q) => {
        const difficulty = "MEDIUM"; // Question model doesn't have difficulty
        acc[difficulty] = (acc[difficulty] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

    return [
      interview.id,
      interview.resume?.candidateName || "",
      interview.resume?.candidateEmail || "",
      interview.resume?.candidatePhone || "",
      interview.jobPost?.jobTitle || "",
      interview.jobPost?.companyName || "",
      interview.jobPost?.location || "",
      interview.user?.name || "",
      interview.user?.email || "",
      interview.status,
      "NOT_SHORTLISTED", // shortlistStatus doesn't exist in Interview model
      0, // totalScore doesn't exist in Interview model
      0, // percentage doesn't exist in Interview model
      interview.duration || "",
      interview.sessionStart
        ? new Date(interview.sessionStart).toISOString()
        : "",
      interview.sessionEnd ? new Date(interview.sessionEnd).toISOString() : "",
      new Date(interview.createdAt).toISOString(),
      interview.resume?.matchScore || "",
      interview.resume?.experienceYears || "",
      interview.questions?.length || 0,
      correctAnswers,
      JSON.stringify(questionsByCategory),
      JSON.stringify(questionsByDifficulty),
    ];
  });

  // Convert to CSV
  const csvContent = [
    csvHeaders.join(","),
    ...csvRows.map((row) =>
      row
        .map((field) => {
          // Escape CSV fields that contain commas, quotes, or newlines
          const stringField = String(field || "");
          if (
            stringField.includes(",") ||
            stringField.includes('"') ||
            stringField.includes("\n")
          ) {
            return `"${stringField.replace(/"/g, '""')}"`;
          }
          return stringField;
        })
        .join(",")
    ),
  ].join("\n");

  // Set headers for file download
  const filename = `interviews-export-${
    new Date().toISOString().split("T")[0]
  }.csv`;

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  return res.status(200).send(csvContent);
}
