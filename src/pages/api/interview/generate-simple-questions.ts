// API endpoint to generate simple interview questions
// Proxies the request to the external AI API /generate-simple-interview-questions
// and stores generated questions in the Interview record

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { generateSimpleInterviewQuestions } from "@/lib/ai-interview-service";
import type {
  SimpleInterviewQuestionsRequest,
  SimpleQuestionJobRequirement,
  SimpleQuestionCandidate,
} from "@/types/ai-interview";

/**
 * Parse a string value into an array.
 * Handles: JSON arrays stored as strings, comma-separated strings, or plain strings.
 */
function parseToArray(value: string | null | undefined): string[] {
  if (!value) return [];
  // Try parsing as JSON first (handles "[\"a\",\"b\"]" format)
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      // If items are objects, stringify them back (e.g. education objects)
      return parsed.map((item: any) =>
        typeof item === "object" ? JSON.stringify(item) : String(item),
      );
    }
    // If parsed to a non-array, wrap it
    return [String(parsed)];
  } catch {
    // Not JSON — split by comma
    return value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
}

/**
 * Parse education field — can be a JSON array of objects or a plain string.
 * Returns an array of education entries for the AI API.
 */
function parseEducation(value: string | null | undefined): any[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
    return [parsed];
  } catch {
    // Plain string education
    return [{ degree: value }];
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { interviewId, jobPostId, candidateId } = req.body;

    if (!interviewId || !jobPostId || !candidateId) {
      return res.status(400).json({
        error: "Interview ID, Job Post ID, and Candidate ID are required",
      });
    }

    // Get job post data
    const jobPost = await prisma.jobPost.findUnique({
      where: { id: jobPostId },
    });

    if (!jobPost) {
      return res.status(404).json({ error: "Job post not found" });
    }

    // Get candidate (resume) data
    const candidate = await prisma.resume.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    // Verify interview exists
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
    });

    if (!interview) {
      return res.status(404).json({ error: "Interview session not found" });
    }

    // Build the API request body matching the exact shape from the spec
    // IMPORTANT: Parse string fields from DB into actual arrays for the external API
    const jobRequirement: SimpleQuestionJobRequirement = {
      title: jobPost.jobTitle,
      company: jobPost.companyName,
      location: jobPost.location,
      job_type: jobPost.jobType,
      experience_level: jobPost.experienceLevel,
      skills_required: parseToArray(jobPost.skillsRequired),
      responsibilities: parseToArray(jobPost.keyResponsibilities),
      qualifications: parseToArray(jobPost.qualifications),
      description: jobPost.jobDescription || "",
      salary_range: jobPost.salaryRange || null,
      benefits: parseToArray(jobPost.benefits),
    };

    const candidatePayload: SimpleQuestionCandidate = {
      resume_path: candidate.s3Key || candidate.resumeUrl,
      name: candidate.candidateName,
      email: candidate.candidateEmail || "",
      phone: candidate.candidatePhone || "",
      skills: candidate.skills || [],
      experience_years: candidate.experienceYears || 0,
      education: parseEducation(candidate.education),
      match_score: candidate.matchScore || 0,
      summary: candidate.summary || "",
      location: candidate.location || "",
      linkedin_url: candidate.linkedinUrl || "",
      github_url: candidate.githubUrl || "",
      github_username: "",
      portfolio_url: "",
      current_job_title: candidate.currentJobTitle || "",
      work_experience: [],
      projects: [],
      certifications: [],
      publications: [],
      languages: [],
      awards: [],
      volunteer_experience: [],
      interests: [],
      processing_method: candidate.processingMethod || "AI Resume Parser",
      analysis_timestamp:
        candidate.analysisTimestamp?.toISOString() || new Date().toISOString(),
    };

    const apiRequest: SimpleInterviewQuestionsRequest = {
      jobRequirement,
      candidate: candidatePayload,
    };

    // Call the external AI API
    const apiResponse = await generateSimpleInterviewQuestions(apiRequest);

    if (!apiResponse || !apiResponse.questions || apiResponse.questions.length === 0) {
      return res.status(500).json({
        error: "AI API returned no questions",
      });
    }

    // Delete any existing questions for this interview (in case of re-generation)
    await prisma.question.deleteMany({
      where: { interviewId },
    });

    // Store generated questions in the Question table
    // API returns questions as plain strings: ["question1", "question2", ...]
    const createdQuestions = await Promise.all(
      apiResponse.questions.map((q: string, index: number) => {
        return prisma.question.create({
          data: {
            interviewId,
            type: "ESSAY",
            question: q,
            correct: "",
            points: 1,
            order: index + 1,
          },
        });
      }),
    );

    return res.status(200).json({
      success: true,
      message: `Generated ${createdQuestions.length} questions successfully`,
      data: {
        questions: apiResponse.questions,
        totalQuestions: createdQuestions.length,
        interviewId,
      },
    });
  } catch (error: any) {
    console.error("Generate simple questions error:", error);
    return res.status(500).json({
      error: "Failed to generate interview questions",
      details: error.message,
    });
  }
}

