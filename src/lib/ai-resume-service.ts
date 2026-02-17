// FIXED API FORMAT - These interfaces match the exact external API structure

export interface ResumeAnalysisRequest {
  resume_paths: string[]; // Array of resume URLs - FIXED FORMAT
  job_req: {
    // Job requirements object - FIXED FORMAT
    title: string;
    company: string;
    location: string;
    job_type: string;
    experience_level: string;
    skills_required: string[];
    responsibilities: string[];
    qualifications: string[];
    description: string;
    salary_range?: string;
    benefits?: string[];
  };
}

// FIXED RESPONSE FORMAT - Exact structure from external API
export interface CandidateData {
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

export interface AnalysisData {
  file_name: string;
  processing_method: string;
  processing_time: number;
  file_size_mb: number;
  match_score: number;
  matched_skills: string[];
  recommendation: string;
}

export interface ResumeAnalysisItem {
  resume_path: string;
  success: boolean;
  candidate: CandidateData;
  analysis: AnalysisData;
}

export interface ResumeAnalysisResponse {
  analyses: ResumeAnalysisItem[];
  success: boolean;
}

export class AIResumeService {
  private static readonly AI_API_BASE = "https://ai.synchro-hire.com";

  /**
   * Parse a value that may be a JSON-stringified array OR a plain
   * comma/newline-separated string into a clean string[].
   */
  private static parseToArray(
    value: string | null | undefined,
    separator: "," | "\n" = ","
  ): string[] {
    if (!value) return [];
    // Try JSON first — fields are stored as JSON.stringify(array) in the DB
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item: any) =>
            typeof item === "object" ? JSON.stringify(item) : String(item)
          )
          .filter(Boolean);
      }
      return [String(parsed)];
    } catch {
      // Not valid JSON — fall back to splitting by separator
      return value
        .split(separator)
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  static async analyzeResumes(
    request: ResumeAnalysisRequest
  ): Promise<ResumeAnalysisResponse> {
    console.log("🤖 Sending request to AI API:", {
      url: `${this.AI_API_BASE}/analyze-resumes-v2`,
      requestBody: JSON.stringify(request, null, 2),
    });

    const response = await fetch(`${this.AI_API_BASE}/analyze-resumes-v2`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      // Try to get detailed error information
      let errorDetails = response.statusText;
      try {
        const errorBody = await response.text();
        errorDetails = `${response.statusText}: ${errorBody}`;
      } catch (e) {
        // If we can't read the error body, just use status text
      }

      console.error("❌ AI API Error Details:", {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        requestBody: JSON.stringify(request, null, 2),
      });

      throw new Error(`AI API failed: ${errorDetails}`);
    }

    const result = await response.json();
    console.log("✅ AI API Success:", result);
    return result;
  }

  /**
   * Retry wrapper — attempts the AI call up to `maxRetries` times.
   */
  static async analyzeResumesWithRetry(
    request: ResumeAnalysisRequest,
    maxRetries = 2
  ): Promise<ResumeAnalysisResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        const result = await this.analyzeResumes(request);
        // If the API returned but individual analyses failed, still return
        // so the caller can handle per-resume success/failure.
        return result;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(
          `⚠️ AI analysis attempt ${attempt}/${maxRetries + 1} failed:`,
          lastError.message
        );
        if (attempt <= maxRetries) {
          // Wait before retrying (1s, then 2s)
          await new Promise((r) => setTimeout(r, attempt * 1000));
        }
      }
    }

    throw lastError || new Error("AI analysis failed after retries");
  }

  // Convert JobPost to the EXACT format expected by external AI API
  static mapJobPostToJobReq(jobPost: any): ResumeAnalysisRequest["job_req"] {
    const skillsArray = this.parseToArray(jobPost.skillsRequired, ",");
    const responsibilitiesArray = this.parseToArray(
      jobPost.keyResponsibilities,
      "\n"
    );
    const qualificationsArray = this.parseToArray(
      jobPost.qualifications,
      "\n"
    );
    const benefitsArray = this.parseToArray(jobPost.benefits, "\n");

    return {
      title: jobPost.jobTitle,
      company: jobPost.companyName,
      location: jobPost.location,
      job_type: jobPost.jobType,
      experience_level: jobPost.experienceLevel,
      skills_required: skillsArray,
      responsibilities: responsibilitiesArray,
      qualifications: qualificationsArray,
      description: jobPost.jobDescription || "",
      salary_range: jobPost.salaryRange || undefined,
      benefits: benefitsArray.length > 0 ? benefitsArray : undefined,
    };
  }
}
