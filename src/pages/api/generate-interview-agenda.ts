import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

interface InterviewAgendaRequest {
  resume_path: string;
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experience_years: number;
  education: string;
  match_score: number;
  summary: string;
  location: string | null;
  linkedin_url: string;
  github_url: string;
  current_job_title: string | null;
  processing_method: string;
  analysis_timestamp: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { resumeId, interview_type } = req.body;

    // Validate required fields
    if (!resumeId || !interview_type) {
      return res.status(400).json({
        error: "Missing required fields: resumeId, interview_type",
      });
    }

    // Validate interview_type
    const validInterviewTypes = [
      "Technical",
      "Behavioral",
      "Easy",
      "Complex",
      "Medium",
    ];
    if (!validInterviewTypes.includes(interview_type)) {
      return res.status(400).json({
        error: `Invalid interview_type. Must be one of: ${validInterviewTypes.join(
          ", "
        )}`,
      });
    }

    // Fetch resume data from database
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      include: {
        jobPost: true,
        uploadedBy: true,
      },
    });

    if (!resume) {
      return res.status(404).json({ error: "Resume not found" });
    }

    // Transform database data to external API format
    const requestBody: InterviewAgendaRequest = {
      resume_path: resume.resumeUrl,
      name: resume.candidateName,
      email: resume.candidateEmail || "",
      phone: resume.candidatePhone || "",
      skills: resume.skills || [],
      experience_years: resume.experienceYears || 0,
      education: resume.education || "",
      match_score: resume.matchScore || 0,
      summary: resume.summary || "",
      location: resume.location,
      linkedin_url: resume.linkedinUrl || "",
      github_url: resume.githubUrl || "",
      current_job_title: resume.currentJobTitle,
      processing_method: resume.processingMethod || "vision",
      analysis_timestamp:
        resume.analysisTimestamp?.toISOString() || new Date().toISOString(),
    };

    // Call external AI API with interview_type as query parameter
    const apiUrl = `https://ai.synchro-hire.com/generate-interview-agenda?interview_type=${encodeURIComponent(
      interview_type
    )}`;

    const response = await axios.post(apiUrl, requestBody, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 30000, // 30 second timeout
    });

    if (response.data && response.data.success && response.data.agenda) {
      return res.status(200).json({
        success: true,
        agenda: response.data.agenda,
        resumeId: resumeId,
        interview_type: interview_type,
      });
    } else {
      return res.status(500).json({
        error: "Invalid response format from AI service",
      });
    }
  } catch (error: any) {
    console.error("AI API Error:", error);

    if (error.code === "ECONNABORTED") {
      return res.status(408).json({
        error: "Request timeout. Please try again.",
      });
    }

    if (error.response) {
      // External API returned an error
      return res.status(error.response.status).json({
        error:
          error.response.data?.detail ||
          error.response.data?.message ||
          "External API error",
      });
    }

    if (error.request) {
      // Network error
      return res.status(503).json({
        error: "Unable to connect to AI service. Please try again later.",
      });
    }

    // Other error
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}
