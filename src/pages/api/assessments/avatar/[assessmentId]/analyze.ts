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
  res: NextApiResponse,
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
  const { assessmentId } = req.query;

  if (!assessmentId || typeof assessmentId !== "string") {
    return res.status(400).json({ error: "Invalid assessment ID" });
  }

  if (method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${method} not allowed` });
  }

  try {
    return await handleAnalyzeInterview(req, res, user!, assessmentId);
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleAnalyzeInterview(
  req: NextApiRequest,
  res: NextApiResponse,
  user: { id: number; type: string; companyId?: number },
  assessmentId: string,
) {
  // Verify assessment exists and user has access
  const assessment = await prisma.assessmentStage.findFirst({
    where: {
      id: assessmentId,
      type: "AVATAR",
      ...(user.type !== "ADMIN"
        ? {
            jobPost: {
              companyId: user.companyId,
            },
          }
        : {}),
    },
    include: {
      avatarAssessment: {
        include: {
          recordings: true,
        },
      },
      jobPost: {
        select: {
          jobTitle: true,
          skillsRequired: true,
          jobDescription: true,
        },
      },
      resume: {
        select: {
          candidateName: true,
          skills: true,
          experienceYears: true,
        },
      },
    },
  });

  if (!assessment || !assessment.avatarAssessment) {
    return res.status(404).json({ error: "Assessment not found" });
  }

  if (assessment.avatarAssessment.recordings.length === 0) {
    return res.status(400).json({
      error: "No recordings available for analysis",
    });
  }

  // TODO: Integrate with AI service for analysis
  // For now, we'll simulate the analysis

  // Simulated AI analysis
  const analysisResults = {
    overallScore: Math.floor(Math.random() * 30) + 70, // Random score between 70-100
    communicationScore: Math.floor(Math.random() * 30) + 70,
    technicalScore: Math.floor(Math.random() * 30) + 65,
    problemSolvingScore: Math.floor(Math.random() * 30) + 70,
    confidenceLevel: Math.floor(Math.random() * 30) + 70,
    strengths: [
      "Clear communication skills",
      "Strong technical knowledge",
      "Good problem-solving approach",
    ],
    improvements: [
      "Could provide more detailed examples",
      "Work on technical depth in certain areas",
    ],
    transcript: "AI-generated transcript of the interview...",
    keyTopics: [
      assessment.jobPost.jobTitle,
      ...assessment.jobPost.skillsRequired.split(",").slice(0, 3),
    ],
    sentiment: "positive",
    recommendation: "Proceed to next round",
  };

  // Calculate average score
  const averageScore =
    (analysisResults.overallScore +
      analysisResults.communicationScore +
      analysisResults.technicalScore +
      analysisResults.problemSolvingScore +
      analysisResults.confidenceLevel) /
    5;

  // Update assessment with results
  await prisma.assessmentStage.update({
    where: { id: assessmentId },
    data: {
      resultScore: averageScore,
      status: "COMPLETED",
      completedAt: new Date(),
      metadata: analysisResults as any,
    },
  });

  // Update recording with analysis
  const latestRecording =
    assessment.avatarAssessment.recordings[
      assessment.avatarAssessment.recordings.length - 1
    ];
  await prisma.avatarRecording.update({
    where: { id: latestRecording.id },
    data: {
      transcription: analysisResults.transcript,
      analysis: analysisResults as any,
    },
  });

  return res.status(200).json({
    success: true,
    analysis: analysisResults,
    resultScore: averageScore,
    message: "Interview analyzed successfully",
  });
}
