// API Route: Generate Customized Candidate-Specific Interview Questions
// POST /api/interview/generate-customized

import type { NextApiRequest, NextApiResponse } from "next";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  mapToCustomizedRequest,
  QuestionDifficulty,
} from "@/types/ai-interview";
import { generateCustomizedQuestions } from "@/lib/ai-interview-service";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Authenticate user
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { jobPostId, resumeId } = req.body;
    const { num_questions, difficulty } = req.query;

    // Validate required fields
    if (
      !jobPostId ||
      typeof jobPostId !== "string" ||
      jobPostId.trim() === ""
    ) {
      return res.status(400).json({
        error: "jobPostId is required and must be a valid string",
      });
    }

    if (!resumeId || typeof resumeId !== "string" || resumeId.trim() === "") {
      return res.status(400).json({
        error: "resumeId is required and must be a valid string",
      });
    }

    if (!difficulty || !num_questions) {
      return res.status(400).json({
        error: "Query parameters 'difficulty' and 'num_questions' are required",
      });
    }

    // Validate difficulty
    const validDifficulties = ["Easy", "Medium", "Hard"];
    if (!validDifficulties.includes(difficulty as string)) {
      return res.status(400).json({
        error: `Invalid difficulty. Must be one of: ${validDifficulties.join(", ")}`,
      });
    }

    const numQuestionsInt = parseInt(num_questions as string, 10);
    if (isNaN(numQuestionsInt) || numQuestionsInt < 1 || numQuestionsInt > 20) {
      return res.status(400).json({
        error: "num_questions must be a number between 1 and 20",
      });
    }

    // Fetch job post from database
    const jobPost = await prisma.jobPost.findUnique({
      where: { id: jobPostId },
      select: {
        id: true,
        jobTitle: true,
        companyName: true,
        location: true,
        jobType: true,
        experienceLevel: true,
        skillsRequired: true,
        keyResponsibilities: true,
        qualifications: true,
        jobDescription: true,
        salaryRange: true,
        benefits: true,
      },
    });

    if (!jobPost) {
      return res.status(404).json({ error: "Job post not found" });
    }

    // Fetch candidate resume from database
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      select: {
        id: true,
        resumeUrl: true,
        s3Key: true,
        candidateName: true,
        candidateEmail: true,
        candidatePhone: true,
        skills: true,
        experienceYears: true,
        education: true,
        matchScore: true,
        summary: true,
        location: true,
        linkedinUrl: true,
        githubUrl: true,
        processingMethod: true,
        analysisTimestamp: true,
      },
    });

    if (!resume) {
      return res.status(404).json({ error: "Resume not found" });
    }

    // Ensure resume belongs to the job post
    const resumeJobCheck = await prisma.resume.findFirst({
      where: {
        id: resumeId,
        jobPostId: jobPostId,
      },
    });

    if (!resumeJobCheck) {
      return res.status(400).json({
        error: "Resume does not belong to the specified job post",
      });
    }

    // Map database data to AI request format
    const aiRequest = mapToCustomizedRequest(resume, jobPost);

    // Call AI service
    const aiResponse = await generateCustomizedQuestions(
      aiRequest,
      numQuestionsInt,
      difficulty as QuestionDifficulty,
    );

    return res.status(200).json({
      success: true,
      data: aiResponse,
      candidate: {
        id: resume.id,
        name: resume.candidateName,
        email: resume.candidateEmail,
        matchScore: resume.matchScore,
      },
      jobPost: {
        id: jobPost.id,
        title: jobPost.jobTitle,
        company: jobPost.companyName,
      },
    });
  } catch (error: any) {
    console.error("Error in generate-customized API:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate customized questions",
    });
  }
}
