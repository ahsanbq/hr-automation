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
    return await handleGetShortlistedCandidates(req, res, user!);
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGetShortlistedCandidates(
  req: NextApiRequest,
  res: NextApiResponse,
  user: { id: number; type: string; companyId?: number }
) {
  const { jobPostId, limit = "50" } = req.query;

  // Build where clause
  const where: any = {
    status: "COMPLETED",
    shortlistStatus: "SHORTLISTED",
  };

  // Company-based filtering for non-admin users
  if (user.type !== "ADMIN") {
    where.jobPost = {
      companyId: user.companyId,
    };
  }

  if (jobPostId) {
    where.jobPostId = jobPostId as string;
  }

  const limitNum = Math.min(parseInt(limit as string), 100); // Cap at 100

  // Get shortlisted candidates with their interview results
  const shortlistedCandidates = await prisma.interview.findMany({
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
          skills: true,
          education: true,
          summary: true,
          location: true,
          linkedinUrl: true,
          githubUrl: true,
          currentJobTitle: true,
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
    orderBy: [{ createdAt: "desc" }],
    take: limitNum,
  });

  // Transform data for meeting module compatibility
  const transformedCandidates = shortlistedCandidates.map((interview) => ({
    interviewId: interview.id,
    candidate: {
      id: interview.resume?.id,
      name: interview.resume?.candidateName,
      email: interview.resume?.candidateEmail,
      phone: interview.resume?.candidatePhone,
      matchScore: interview.resume?.matchScore,
      experienceYears: interview.resume?.experienceYears,
      skills: interview.resume?.skills || [],
      education: interview.resume?.education,
      summary: interview.resume?.summary,
      location: interview.resume?.location,
      linkedinUrl: interview.resume?.linkedinUrl,
      githubUrl: interview.resume?.githubUrl,
      currentJobTitle: interview.resume?.currentJobTitle,
    },
    job: {
      id: interview.jobPost?.id,
      title: interview.jobPost?.jobTitle,
      company: interview.jobPost?.companyName,
      location: interview.jobPost?.location,
      skillsRequired: interview.jobPost?.skillsRequired,
    },
    interview: {
      id: interview.id,
      title: interview.title,
      score: 0, // totalScore doesn't exist in Interview model
      percentage: 0, // percentage doesn't exist in Interview model
      duration: interview.duration,
      completedAt: interview.sessionEnd,
      interviewer: interview.user?.name,
    },
    performance: {
      totalQuestions: interview.questions?.length || 0,
      correctAnswers:
        interview.interviewAttempts?.[0]?.answers?.filter((a) => a.isCorrect)
          .length || 0,
      categories: {}, // Question model doesn't have categories
      difficulties: {}, // Question model doesn't have difficulties
    },
  }));

  // Calculate summary statistics
  const stats = {
    totalShortlisted: shortlistedCandidates.length,
    averageScore: 0, // percentage doesn't exist in Interview model
    scoreRange: {
      min: 0,
      max: 0,
    },
    topPerformers: 0, // percentage doesn't exist in Interview model
    byJob: shortlistedCandidates.reduce((acc, i) => {
      const jobTitle = i.jobPost?.jobTitle || "Unknown";
      acc[jobTitle] = (acc[jobTitle] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  return res.status(200).json({
    candidates: transformedCandidates,
    stats,
    totalCount: shortlistedCandidates.length,
  });
}
