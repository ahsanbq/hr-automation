// API Route: Generate Behavioral Interview Questions
// POST /api/interview/generate-behavioral

import type { NextApiRequest, NextApiResponse } from "next";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  BehavioralQuestionRequest,
  mapJobPostToBehavioralRequest,
  QuestionGeneratorConfig,
  QuestionDifficulty,
} from "@/types/ai-interview";
import { generateBehavioralQuestions } from "@/lib/ai-interview-service";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
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

    const {
      jobPostId,
      number_of_questions,
      focus_areas,
      difficulty,
    }: {
      jobPostId: string;
      number_of_questions: number;
      focus_areas: string[];
      difficulty: QuestionDifficulty;
    } = req.body;

    // Validate required fields
    if (!jobPostId || typeof jobPostId !== 'string' || jobPostId.trim() === '') {
      return res.status(400).json({
        error: "jobPostId is required and must be a valid string",
      });
    }
    
    if (!number_of_questions || !difficulty) {
      return res.status(400).json({
        error: "Missing required fields: number_of_questions, difficulty",
      });
    }

    if (!focus_areas || focus_areas.length === 0) {
      return res.status(400).json({
        error: "focus_areas must be a non-empty array",
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
    const config: QuestionGeneratorConfig = {
      type: "BEHAVIORAL" as any,
      number_of_questions,
      difficulty,
      focus_areas,
    };

    const aiRequest = mapJobPostToBehavioralRequest(jobPost, config);

    // Call AI service
    const aiResponse = await generateBehavioralQuestions(aiRequest);

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
    console.error("Error in generate-behavioral API:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate behavioral questions",
    });
  }
}
