import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { MCQDifficulty } from "@/types/assessment";

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
        return await handleGetMCQAssessments(req, res, user!);
      case "POST":
        return await handleCreateMCQAssessment(req, res, user!);
      default:
        res.setHeader("Allow", ["GET", "POST"]);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGetMCQAssessments(
  req: NextApiRequest,
  res: NextApiResponse,
  user: { id: number; type: string; companyId?: number }
) {
  const {
    jobPostId,
    resumeId,
    interviewerId,
    status,
    difficulty,
    page = "1",
    limit = "10",
    includeQuestions = "false",
    includeAnswers = "false",
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Build where clause
  const where: any = {
    type: "MCQ",
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
    mcqAssessment: {
      include: {
        questions:
          includeQuestions === "true"
            ? {
                orderBy: { order: "asc" },
              }
            : false,
        candidateAnswers:
          includeAnswers === "true"
            ? {
                include: {
                  question: {
                    select: {
                      id: true,
                      question: true,
                      options: true,
                      correctAnswer: true,
                      points: true,
                      category: true,
                      difficulty: true,
                    },
                  },
                },
              }
            : false,
      },
    },
  };

  // Filter by difficulty if provided
  if (difficulty && include.mcqAssessment) {
    include.mcqAssessment.where = {
      difficulty: difficulty as MCQDifficulty,
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

async function handleCreateMCQAssessment(
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
    // MCQ-specific fields
    title,
    description,
    timeLimit,
    passingScore,
    difficulty,
    categories,
  } = req.body;

  // Validate required fields
  if (!jobPostId || !resumeId || !title) {
    return res.status(400).json({
      error: "Missing required fields: jobPostId, resumeId, title",
    });
  }

  // Validate difficulty if provided
  if (difficulty && !Object.values(MCQDifficulty).includes(difficulty)) {
    return res.status(400).json({
      error: "Invalid difficulty. Must be EASY, MEDIUM, or HARD",
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

  // Check if MCQ assessment already exists for this resume
  const existingStage = await prisma.assessmentStage.findFirst({
    where: {
      resumeId,
      type: "MCQ",
    },
  });

  if (existingStage) {
    return res.status(409).json({
      error: "An MCQ assessment already exists for this candidate",
    });
  }

  // Create the assessment stage and MCQ assessment in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create the assessment stage
    const assessmentStage = await tx.assessmentStage.create({
      data: {
        type: "MCQ",
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

    // Create the MCQ assessment
    const mcqAssessment = await tx.mCQAssessment.create({
      data: {
        assessmentStageId: assessmentStage.id,
        title,
        description: description || null,
        timeLimit: timeLimit || null,
        passingScore: passingScore || null,
        difficulty: (difficulty as MCQDifficulty) || "MEDIUM",
        categories: categories || [],
      },
    });

    return { assessmentStage, mcqAssessment };
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
      mcqAssessment: {
        include: {
          questions: true,
          candidateAnswers: true,
        },
      },
    },
  });

  return res.status(201).json({
    assessmentStage: completeAssessmentStage,
    mcqAssessment: result.mcqAssessment,
  });
}
