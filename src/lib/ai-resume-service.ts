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
  education: string | any[];
  match_score: number;
  summary: string;
  location: string | null;
  linkedin_url: string;
  github_url: string;
  github_username?: string;
  current_job_title: string | null;
  processing_method: string;
  analysis_timestamp: string;
  portfolio_url?: string | null;
  work_experience?: any[];
  projects?: any[];
  certifications?: any[];
  publications?: any[];
  languages?: any[];
  awards?: any[];
  volunteer_experience?: any[];
  interests?: any[];
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
  filter?: {
    experience?: number;
    degree?: string[];
    institute?: string[];
    certificate?: string[];
    skills?: string[];
  };
}

export interface ResumeAnalysisResponse {
  analyses: ResumeAnalysisItem[];
  success: boolean;
}

// Background job response from v3-background endpoint
export interface BackgroundJobResponse {
  message: string;
  job_id: string;
  status: string;
  total_files: number;
  check_status_url: string;
}

// Analysis results from polling endpoint
export interface AnalysisResultsResponse {
  job_id: string;
  status: string;
  summary?: {
    total_files: number;
    successful: number;
    failed: number;
    processing_time: number;
  };
  analyses: ResumeAnalysisItem[];
}

export class AIResumeService {
  private static readonly AI_API_BASE = "https://ai.synchro-hire.com";

  /**
   * Parse a value that may be a JSON-stringified array OR a plain
   * comma/newline-separated string into a clean string[].
   */
  private static parseToArray(
    value: string | null | undefined,
    separator: "," | "\n" = ",",
  ): string[] {
    if (!value) return [];
    // Try JSON first — fields are stored as JSON.stringify(array) in the DB
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item: any) =>
            typeof item === "object" ? JSON.stringify(item) : String(item),
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
    request: ResumeAnalysisRequest,
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
    maxRetries = 2,
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
          lastError.message,
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
      "\n",
    );
    const qualificationsArray = this.parseToArray(jobPost.qualifications, "\n");
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

  /**
   * Submit a background analysis job via v3-background endpoint.
   * Returns the job_id for polling.
   */
  static async submitBackgroundAnalysis(
    request: ResumeAnalysisRequest,
  ): Promise<BackgroundJobResponse> {
    console.log("🚀 Submitting background analysis job:", {
      url: `${this.AI_API_BASE}/analyze-resumes-v3-background`,
      resume_count: request.resume_paths.length,
    });

    const response = await fetch(
      `${this.AI_API_BASE}/analyze-resumes-v3-background`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      },
    );

    if (!response.ok) {
      let errorDetails = response.statusText;
      try {
        const errorBody = await response.text();
        errorDetails = `${response.statusText}: ${errorBody}`;
      } catch {}
      throw new Error(
        `v3-background API failed (${response.status}): ${errorDetails}`,
      );
    }

    const result: BackgroundJobResponse = await response.json();
    console.log("✅ Background job submitted:", result.job_id);
    return result;
  }

  /**
   * Poll for analysis results by job_id.
   * Returns null if still processing, or the full results when complete.
   */
  static async getAnalysisResults(
    jobId: string,
  ): Promise<AnalysisResultsResponse | null> {
    const url = `${this.AI_API_BASE}/get-analysis-results/${jobId}`;
    const response = await fetch(url);

    if (!response.ok) {
      // 404 or other error means results aren't ready yet
      if (response.status === 404) return null;
      let errorDetails = response.statusText;
      try {
        const errorBody = await response.text();
        errorDetails = `${response.statusText}: ${errorBody}`;
      } catch {}
      throw new Error(
        `Get analysis results failed (${response.status}): ${errorDetails}`,
      );
    }

    const result: AnalysisResultsResponse = await response.json();

    // Check if analyses are actually populated (completed)
    if (
      result.status === "completed" &&
      result.analyses &&
      result.analyses.length > 0
    ) {
      return result;
    }

    // Still processing
    return null;
  }

  /**
   * Full background analysis flow: submit job, then poll until results are ready.
   * Uses v3-background for submission and get-analysis-results for polling.
   * onProgress callback is called with intermediate status updates.
   */
  static async analyzeResumesBackground(
    request: ResumeAnalysisRequest,
    onProgress?: (msg: string) => void,
  ): Promise<AnalysisResultsResponse> {
    // Step 1: Submit the background job
    const job = await this.submitBackgroundAnalysis(request);
    const jobId = job.job_id;
    onProgress?.(`Background job submitted: ${jobId}`);

    // Step 2: Poll GET /get-analysis-results/{job_id} every 1 second
    const maxPolls = 300; // 5 minutes max
    for (let i = 0; i < maxPolls; i++) {
      await new Promise((r) => setTimeout(r, 1000));

      try {
        const results = await this.getAnalysisResults(jobId);
        if (results) {
          console.log(
            `✅ Background analysis complete for job ${jobId} after ${i + 1}s`,
          );
          onProgress?.(`Analysis complete after ${i + 1}s`);
          return results;
        }
        if (i % 5 === 0) {
          onProgress?.(`Still processing... (${i + 1}s elapsed)`);
        }
      } catch (pollError) {
        console.warn(`⚠️ Poll attempt ${i + 1} error:`, pollError);
        // Continue polling on transient errors
      }
    }

    throw new Error(
      `Background analysis timed out after ${maxPolls}s for job ${jobId}`,
    );
  }
}
