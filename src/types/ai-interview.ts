// AI Interview Question Generation Types

export enum QuestionGenerationType {
  BEHAVIORAL = "BEHAVIORAL",
  TECHNICAL = "TECHNICAL",
  CUSTOMIZED = "CUSTOMIZED",
}

export enum QuestionDifficulty {
  EASY = "Easy",
  MEDIUM = "Medium",
  HARD = "Hard",
}

// ===== BEHAVIORAL QUESTIONS =====
export interface BehavioralQuestionRequest {
  job_requirement: {
    title: string;
    company: string;
    location: string;
    job_type: string;
    experience_level: string;
    skills_required: string[];
    responsibilities: string[];
    qualifications: string[];
    description: string;
    salary_range: string | null;
    benefits: string[] | null;
  };
  number_of_questions: number;
  focus_areas: string[];
  difficulty: QuestionDifficulty;
}

export interface BehavioralQuestion {
  question: string;
  expected_answer_points: string[];
}

export interface BehavioralQuestionResponse {
  success: boolean;
  questions: BehavioralQuestion[];
  message?: string;
}

// ===== TECHNICAL QUESTIONS =====
export interface TechnicalQuestionRequest {
  title: string;
  company: string;
  location: string;
  job_type: string;
  experience_level: string;
  skills_required: string[];
  responsibilities: string[];
  qualifications: string[];
  description: string;
  salary_range: string | null;
  benefits: string[] | null;
}

export interface TechnicalQuestion {
  question: string;
  expected_answer_points: string[];
  difficulty?: string;
}

export interface TechnicalQuestionResponse {
  success: boolean;
  questions: TechnicalQuestion[];
  message?: string;
}

// ===== CUSTOMIZED CANDIDATE-SPECIFIC QUESTIONS =====
export interface CandidateProfile {
  resume_path: string;
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experience_years: number;
  education: string[];
  match_score: number;
  summary: string;
  location: string;
  linkedin_url: string;
  github_url: string;
  portfolio_url: string;
  work_experience: any[];
  projects: any[];
  certifications: string[];
  languages: string[];
  awards: string[];
  volunteer_experience: any[];
  interests: string[];
  processing_method: string;
  analysis_timestamp: string;
}

export interface CustomizedQuestionRequest {
  candidate: CandidateProfile;
  job_requirement: {
    title: string;
    company: string;
    location: string;
    job_type: string;
    experience_level: string;
    skills_required: string[];
    responsibilities: string[];
    qualifications: string[];
    description: string;
    salary_range: string | null;
    benefits: string[] | null;
  };
}

export interface CustomizedQuestion {
  question: string;
  expected_answer_points: string[];
  reasoning?: string;
}

export interface CustomizedQuestionResponse {
  success: boolean;
  questions: CustomizedQuestion[];
  message?: string;
}

// ===== FRONTEND SELECTOR =====
export interface QuestionGeneratorConfig {
  type: QuestionGenerationType;
  number_of_questions: number;
  difficulty: QuestionDifficulty;
  focus_areas?: string[];
}

// ===== DATABASE MAPPERS =====
export interface JobPostData {
  id: string;
  jobTitle: string;
  companyName: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  skillsRequired: string;
  keyResponsibilities: string | null;
  qualifications: string | null;
  jobDescription: string | null;
  salaryRange: string | null;
  benefits: string | null;
}

export interface ResumeData {
  id: string;
  resumeUrl: string;
  s3Key: string | null;
  candidateName: string;
  candidateEmail: string | null;
  candidatePhone: string | null;
  skills: string[];
  experienceYears: number | null;
  education: string | null;
  matchScore: number | null;
  summary: string | null;
  location: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  processingMethod: string | null;
  analysisTimestamp: Date | null;
}

// Helper functions for mapping database data to API request formats
export function mapJobPostToBehavioralRequest(
  jobPost: JobPostData,
  config: QuestionGeneratorConfig
): BehavioralQuestionRequest {
  return {
    job_requirement: {
      title: jobPost.jobTitle,
      company: jobPost.companyName,
      location: jobPost.location,
      job_type: jobPost.jobType,
      experience_level: jobPost.experienceLevel,
      skills_required: parseStringArray(jobPost.skillsRequired),
      responsibilities: parseStringArray(jobPost.keyResponsibilities || ""),
      qualifications: parseStringArray(jobPost.qualifications || ""),
      description: jobPost.jobDescription || "",
      salary_range: jobPost.salaryRange || null,
      benefits: parseStringArray(jobPost.benefits || ""),
    },
    number_of_questions: config.number_of_questions,
    focus_areas: config.focus_areas || [],
    difficulty: config.difficulty,
  };
}

export function mapJobPostToTechnicalRequest(
  jobPost: JobPostData
): TechnicalQuestionRequest {
  return {
    title: jobPost.jobTitle,
    company: jobPost.companyName,
    location: jobPost.location,
    job_type: jobPost.jobType,
    experience_level: jobPost.experienceLevel,
    skills_required: parseStringArray(jobPost.skillsRequired),
    responsibilities: parseStringArray(jobPost.keyResponsibilities || ""),
    qualifications: parseStringArray(jobPost.qualifications || ""),
    description: jobPost.jobDescription || "",
    salary_range: jobPost.salaryRange || null,
    benefits: parseStringArray(jobPost.benefits || ""),
  };
}

export function mapToCustomizedRequest(
  resume: ResumeData,
  jobPost: JobPostData
): CustomizedQuestionRequest {
  return {
    candidate: {
      resume_path: resume.s3Key || resume.resumeUrl,
      name: resume.candidateName,
      email: resume.candidateEmail || "",
      phone: resume.candidatePhone || "",
      skills: resume.skills || [],
      experience_years: resume.experienceYears || 0,
      education: resume.education ? [resume.education] : [],
      match_score: resume.matchScore || 0,
      summary: resume.summary || "",
      location: resume.location || "",
      linkedin_url: resume.linkedinUrl || "",
      github_url: resume.githubUrl || "",
      portfolio_url: "",
      work_experience: [],
      projects: [],
      certifications: [],
      languages: [],
      awards: [],
      volunteer_experience: [],
      interests: [],
      processing_method: resume.processingMethod || "AI Resume Parser",
      analysis_timestamp: resume.analysisTimestamp?.toISOString() || new Date().toISOString(),
    },
    job_requirement: {
      title: jobPost.jobTitle,
      company: jobPost.companyName,
      location: jobPost.location,
      job_type: jobPost.jobType,
      experience_level: jobPost.experienceLevel,
      skills_required: parseStringArray(jobPost.skillsRequired),
      responsibilities: parseStringArray(jobPost.keyResponsibilities || ""),
      qualifications: parseStringArray(jobPost.qualifications || ""),
      description: jobPost.jobDescription || "",
      salary_range: jobPost.salaryRange || null,
      benefits: parseStringArray(jobPost.benefits || ""),
    },
  };
}

// Helper function to parse comma-separated strings or JSON arrays
function parseStringArray(value: string | null): string[] {
  if (!value) return [];
  
  // Try parsing as JSON first
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // If not JSON, split by comma
    return value.split(",").map((s) => s.trim()).filter(Boolean);
  }
  
  return [];
}
