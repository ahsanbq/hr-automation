// API Route: Generate Technical Interview Questions
// POST /api/interview/generate-technical

import type { NextApiRequest, NextApiResponse } from "next";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  mapJobPostToTechnicalRequest,
  QuestionDifficulty,
} from "@/types/ai-interview";
import { generateTechnicalQuestions } from "@/lib/ai-interview-service";

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

    const { jobPostId } = req.body;
    const { difficulty, num_questions } = req.query;

    // Validate required fields
    if (
      !jobPostId ||
      typeof jobPostId !== "string" ||
      jobPostId.trim() === ""
    ) {
      return res
        .status(400)
        .json({ error: "jobPostId is required and must be a valid string" });
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

    // Map database data to AI request format
    const aiRequest = mapJobPostToTechnicalRequest(jobPost);

    // Call AI service
    const aiResponse = await generateTechnicalQuestions(
      aiRequest,
      difficulty as QuestionDifficulty,
      numQuestionsInt,
    );

    return res.status(200).json({
      success: true,
      data: aiResponse,
      jobPost: {
        id: jobPost.id,
        title: jobPost.jobTitle,
        company: jobPost.companyName,
      },
    });
  } catch (error: any) {
    console.error("Error in generate-technical API:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate technical questions",
    });
  }
}
