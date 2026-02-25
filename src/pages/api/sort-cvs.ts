import type { NextApiRequest, NextApiResponse } from "next";
import { AIResumeService } from "@/lib/ai-resume-service";

function makeFallback(paths: string[]) {
  return paths.map((p, idx) => ({
    resume_path: p,
    success: false,
    candidate: {
      name: `Candidate ${idx + 1}`,
      email: "",
      phone: "",
      skills: [] as string[],
      experience_years: 0,
      education: "",
      match_score: 50,
      summary: "AI service unavailable; provisional score assigned.",
      linkedin_url: "",
      github_url: "",
    },
    analysis: {
      file_name:
        typeof p === "string" ? p.split("/").pop() || "cv.pdf" : "cv.pdf",
      processing_time: 0,
      file_size_mb: 0,
      match_score: 50,
      matched_skills: [] as string[],
      recommendation: "Consider",
    },
  }));
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { resume_paths, job_req } = req.body || {};

    if (
      !resume_paths ||
      !Array.isArray(resume_paths) ||
      resume_paths.length === 0
    ) {
      return res.status(400).json({
        error: "resume_paths is required and must be a non-empty array",
      });
    }
    if (!job_req) {
      return res.status(400).json({ error: "job_req is required" });
    }

    try {
      // Use v3-background for batch processing, v2 for single
      if (resume_paths.length === 1) {
        // Single CV → use v2 directly
        const response = await AIResumeService.analyzeResumes({
          resume_paths,
          job_req,
        });
        if (response && response.analyses) {
          return res
            .status(200)
            .json({ success: true, analyses: response.analyses });
        }
        return res
          .status(502)
          .json({ error: "Invalid response format from CV sorting service" });
      } else {
        // Batch → use v3-background
        const results = await AIResumeService.analyzeResumesBackground({
          resume_paths,
          job_req,
        });
        if (results && results.analyses) {
          return res
            .status(200)
            .json({ success: true, analyses: results.analyses });
        }
        return res
          .status(502)
          .json({ error: "Invalid response format from CV sorting service" });
      }
    } catch (err: any) {
      console.error("CV Sorting API Error:", err?.message);
      // Graceful fallback with provisional scores
      return res
        .status(200)
        .json({ success: true, analyses: makeFallback(resume_paths) });
    }
  } catch (error: any) {
    console.error("CV Sorting API Error:", error);
    try {
      const paths: string[] = Array.isArray((req.body || {}).resume_paths)
        ? (req.body as any).resume_paths
        : [];
      return res
        .status(200)
        .json({ success: true, analyses: makeFallback(paths) });
    } catch {
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}
