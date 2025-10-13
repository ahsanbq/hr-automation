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

  try {
    switch (method) {
      case "GET":
        return await handleGetInterviews(req, res, user!);
      case "POST":
        return await handleCreateInterview(req, res, user!);
      default:
        res.setHeader("Allow", ["GET", "POST"]);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGetInterviews(
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
    page = "1",
    limit = "10",
    includeQuestions = "false",
    includeAnswers = "false",
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

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

  // Build include clause
  const include: any = {
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
    interviewAttempts: {
      select: {
        id: true,
        status: true,
        score: true,
        maxScore: true,
        timeSpent: true,
        startedAt: true,
        submittedAt: true,
        completedAt: true,
        violations: true,
        answers: {
          include: {
            question: {
              select: {
                id: true,
                question: true,
                options: true,
                correct: true,
                points: true,
              },
            },
          },
        },
      },
    },
  };

  if (includeQuestions === "true") {
    include.questions = {
      select: {
        id: true,
        type: true,
        question: true,
        options: true,
        correct: true,
        points: true,
        order: true,
      },
    };
  }

  if (includeAnswers === "true") {
    include.answers = {
      include: {
        question: {
          select: {
            id: true,
            type: true,
            question: true,
            options: true,
            correct: true,
            points: true,
            order: true,
          },
        },
      },
    };
  }

  const [interviews, total] = await Promise.all([
    prisma.interview.findMany({
      where,
      include,
      skip,
      take: limitNum,
      orderBy: { createdAt: "desc" },
    }),
    prisma.interview.count({ where }),
  ]);

  return res.status(200).json({
    interviews,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
}

async function handleCreateInterview(
  req: NextApiRequest,
  res: NextApiResponse,
  user: { id: number; type: string; companyId?: number }
) {
  const {
    title,
    description,
    jobPostId,
    resumeId,
    interviewerId,
    duration,
    scheduledAt,
  } = req.body;

  // Validate required fields
  if (!title || !jobPostId || !resumeId || !interviewerId) {
    return res.status(400).json({
      error:
        "Missing required fields: title, jobPostId, resumeId, interviewerId",
    });
  }

  // Verify job post exists and user has access
  const jobPost = await prisma.jobPost.findFirst({
    where: {
      id: jobPostId,
      ...(user.type !== "ADMIN" ? { companyId: user.companyId } : {}),
    },
  });

  if (!jobPost) {
    return res
      .status(404)
      .json({ error: "Job post not found or access denied" });
  }

  // Verify resume exists and belongs to the job post
  const resume = await prisma.resume.findFirst({
    where: {
      id: resumeId,
      jobPostId: jobPostId,
    },
  });

  if (!resume) {
    return res
      .status(404)
      .json({ error: "Resume not found for this job post" });
  }

  // Verify interviewer exists
  const interviewer = await prisma.user.findUnique({
    where: { id: interviewerId },
  });

  if (!interviewer) {
    return res.status(404).json({ error: "Interviewer not found" });
  }

  // Check if interview already exists for this resume
  const existingInterview = await prisma.interview.findFirst({
    where: { resumeId },
  });

  if (existingInterview) {
    return res.status(409).json({
      error: "An interview already exists for this candidate",
    });
  }

  // Create the interview
  const interview = await prisma.interview.create({
    data: {
      title,
      description,
      jobPostId,
      resumeId,
      userId: interviewerId,
      duration,
      status: "DRAFT",
    },
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
    },
  });

  return res.status(201).json({ interview });
}
