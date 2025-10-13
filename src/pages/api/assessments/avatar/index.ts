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
        return await handleGetAvatarAssessments(req, res, user!);
      case "POST":
        return await handleCreateAvatarAssessment(req, res, user!);
      default:
        res.setHeader("Allow", ["GET", "POST"]);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGetAvatarAssessments(
  req: NextApiRequest,
  res: NextApiResponse,
  user: { id: number; type: string; companyId?: number }
) {
  const {
    jobPostId,
    resumeId,
    interviewerId,
    status,
    avatarType,
    page = "1",
    limit = "10",
    includeRecordings = "false",
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Build where clause
  const where: any = {
    type: "AVATAR",
  };

  // Company-based filtering for non-admin users
  if (user.type !== "ADMIN") {
    where.jobPost = {
      companyId: user.companyId,
    };
  }

  if (jobPostId) where.jobPostId = jobPostId as string;
  if (resumeId) where.resumeId = resumeId as string;
  if (interviewerId) where.interviewerId = parseInt(interviewerId as string);
  if (status) where.status = status as string;

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
    avatarAssessment: {
      include: {
        recordings: includeRecordings === "true",
      },
    },
  };

  // Filter by avatar type if provided
  if (avatarType && include.avatarAssessment) {
    include.avatarAssessment.where = {
      avatarType: avatarType as string,
    };
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

async function handleCreateAvatarAssessment(
  req: NextApiRequest,
  res: NextApiResponse,
  user: { id: number; type: string; companyId?: number }
) {
  const {
    jobPostId,
    resumeId,
    interviewerId,
    scheduledAt,
    duration,
    sequenceOrder,
    notes,
    // Avatar-specific fields
    title,
    description,
    avatarType,
    interviewScript,
    recordingEnabled = true,
    timeLimit,
    evaluationCriteria,
  } = req.body;

  // Validate required fields
  if (!jobPostId || !resumeId || !title) {
    return res.status(400).json({
      error: "Missing required fields: jobPostId, resumeId, title",
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

  // Check if Avatar assessment already exists for this resume
  const existingStage = await prisma.assessmentStage.findFirst({
    where: {
      resumeId,
      type: "AVATAR",
    },
  });

  if (existingStage) {
    return res.status(409).json({
      error: "An Avatar assessment already exists for this candidate",
    });
  }

  // Create the assessment stage and avatar assessment in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create the assessment stage
    const assessmentStage = await tx.assessmentStage.create({
      data: {
        type: "AVATAR",
        jobPostId,
        resumeId,
        interviewerId: interviewerId || null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        duration: duration || null,
        sequenceOrder: sequenceOrder || null,
        notes: notes || null,
        status: "PENDING",
      },
    });

    // Create the avatar assessment
    const avatarAssessment = await tx.avatarAssessment.create({
      data: {
        assessmentStageId: assessmentStage.id,
        title,
        description: description || null,
        avatarType: avatarType || null,
        interviewScript: interviewScript || null,
        recordingEnabled,
        timeLimit: timeLimit || null,
        evaluationCriteria: evaluationCriteria || null,
      },
    });

    return { assessmentStage, avatarAssessment };
  });

  // Fetch the complete data with relations
  const completeAssessmentStage = await prisma.assessmentStage.findUnique({
    where: { id: result.assessmentStage.id },
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
      avatarAssessment: {
        include: {
          recordings: true,
        },
      },
    },
  });

  return res.status(201).json({
    assessmentStage: completeAssessmentStage,
    avatarAssessment: result.avatarAssessment,
  });
}



