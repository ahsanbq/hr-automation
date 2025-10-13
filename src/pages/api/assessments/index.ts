import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { AssessmentFilters, StageType, StageStatus } from "@/types/assessment";

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
        return await handleGetAssessments(req, res, user!);
      case "POST":
        return await handleCreateAssessment(req, res, user!);
      default:
        res.setHeader("Allow", ["GET", "POST"]);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGetAssessments(
  req: NextApiRequest,
  res: NextApiResponse,
  user: { id: number; type: string; companyId?: number }
) {
  const {
    jobPostId,
    resumeId,
    interviewerId,
    type,
    status,
    dateFrom,
    dateTo,
    page = "1",
    limit = "10",
    includeDetails = "false",
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
  if (resumeId) where.resumeId = resumeId as string;
  if (interviewerId) where.interviewerId = parseInt(interviewerId as string);
  if (type) where.type = type as StageType;
  if (status) where.status = status as StageStatus;

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
    interviewer: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
  };

  // Include stage-specific details if requested
  if (includeDetails === "true") {
    include.mcqAssessment = {
      include: {
        questions: true,
        candidateAnswers: true,
      },
    };
    include.avatarAssessment = {
      include: {
        recordings: true,
      },
    };
    include.manualMeeting = true;
  }

  const [assessmentStages, total] = await Promise.all([
    prisma.assessmentStage.findMany({
      where,
      include,
      skip,
      take: limitNum,
      orderBy: [{ sequenceOrder: "asc" }, { createdAt: "desc" }],
    }),
    prisma.assessmentStage.count({ where }),
  ]);

  return res.status(200).json({
    assessmentStages,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
}

async function handleCreateAssessment(
  req: NextApiRequest,
  res: NextApiResponse,
  user: { id: number; type: string; companyId?: number }
) {
  const {
    type,
    jobPostId,
    resumeId,
    interviewerId,
    scheduledAt,
    duration,
    sequenceOrder,
    notes,
    metadata,
  } = req.body;

  // Validate required fields
  if (!type || !jobPostId || !resumeId) {
    return res.status(400).json({
      error: "Missing required fields: type, jobPostId, resumeId",
    });
  }

  // Validate stage type
  if (!Object.values(StageType).includes(type)) {
    return res.status(400).json({
      error: "Invalid stage type. Must be MCQ, AVATAR, or MANUAL",
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

  // Verify interviewer exists if provided
  if (interviewerId) {
    const interviewer = await prisma.user.findUnique({
      where: { id: interviewerId },
    });

    if (!interviewer) {
      return res.status(404).json({ error: "Interviewer not found" });
    }
  }

  // Check if assessment stage already exists for this resume and type
  const existingStage = await prisma.assessmentStage.findFirst({
    where: {
      resumeId,
      type: type as StageType,
    },
  });

  if (existingStage) {
    return res.status(409).json({
      error: `An assessment stage of type ${type} already exists for this candidate`,
    });
  }

  // Create the assessment stage
  const assessmentStage = await prisma.assessmentStage.create({
    data: {
      type: type as StageType,
      jobPostId,
      resumeId,
      interviewerId: interviewerId || null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      duration: duration || null,
      sequenceOrder: sequenceOrder || null,
      notes: notes || null,
      metadata: metadata || null,
      status: "PENDING",
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
      interviewer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return res.status(201).json({ assessmentStage });
}



