import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

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

async function callExternalSortAPI(requestBody: any) {
  return axios.post(
    "https://ai.synchro-hire.com/analyze-resumes-v2",
    requestBody,
    {
      headers: { "Content-Type": "application/json" },
      timeout: 120000, // 120s to allow remote processing
    }
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
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

    const requestBody = { resume_paths, job_req };

    try {
      // First attempt
      const response = await callExternalSortAPI(requestBody);
      if (response.data && response.data.success) {
        return res
          .status(200)
          .json({ success: true, analyses: response.data.analyses });
      }
      return res
        .status(502)
        .json({ error: "Invalid response format from CV sorting service" });
    } catch (err: any) {
      // One retry on timeout or 5xx
      const shouldRetry =
        err?.code === "ECONNABORTED" ||
        (err?.response && err.response.status >= 500);
      if (!shouldRetry) {
        // If 404 or other client error from external API, fall back with provisional scores
        if (
          err?.response &&
          (err.response.status === 404 || err.response.status === 400)
        ) {
          return res
            .status(200)
            .json({ success: true, analyses: makeFallback(resume_paths) });
        }
        throw err;
      }
      try {
        const retryRes = await callExternalSortAPI(requestBody);
        if (retryRes.data && retryRes.data.success) {
          return res
            .status(200)
            .json({ success: true, analyses: retryRes.data.analyses });
        }
        return res
          .status(200)
          .json({ success: true, analyses: makeFallback(resume_paths) });
      } catch (retryErr: any) {
        // Graceful fallback
        return res
          .status(200)
          .json({ success: true, analyses: makeFallback(resume_paths) });
      }
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
