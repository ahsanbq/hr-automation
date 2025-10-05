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

  static async analyzeResumes(
    request: ResumeAnalysisRequest
  ): Promise<ResumeAnalysisResponse> {
    const response = await fetch(`${this.AI_API_BASE}/analyze-resumes-v2`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`AI API failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Convert JobPost to the EXACT format expected by external AI API
  static mapJobPostToJobReq(jobPost: any): ResumeAnalysisRequest["job_req"] {
    // Parse skills from comma-separated string to array
    const skillsArray = jobPost.skillsRequired
      ? jobPost.skillsRequired
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [];

    // Parse responsibilities from newline-separated string to array
    const responsibilitiesArray = jobPost.keyResponsibilities
      ? jobPost.keyResponsibilities
          .split("\n")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [];

    // Parse qualifications from newline-separated string to array
    const qualificationsArray = jobPost.qualifications
      ? jobPost.qualifications
          .split("\n")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [];

    // Parse benefits from newline-separated string to array
    const benefitsArray = jobPost.benefits
      ? jobPost.benefits
          .split("\n")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [];

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
