export type OfferStatus =
  | "PENDING"
  | "SENT"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED"
  | "WITHDRAWN";

export interface OfferLetter {
  id: string;
  jobPostId: string;
  resumeId: string;
  createdById: number;
  offerDate: string;
  joiningDate?: string;
  offeredPosition: string;
  salary: string;
  status: OfferStatus;
  notes?: string;
  pdfUrl?: string;
  sentAt?: string;
  respondedAt?: string;
  responseNotes?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  jobPost?: {
    id: string;
    jobTitle: string;
    companyName: string;
    location: string;
  };
  resume?: {
    id: string;
    candidateName: string;
    candidateEmail?: string;
    candidatePhone?: string;
  };
  createdBy?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface CreateOfferLetterRequest {
  jobPostId: string;
  resumeId: string;
  offeredPosition: string;
  salary: string;
  joiningDate?: string;
  notes?: string;
}

export interface UpdateOfferLetterRequest {
  offeredPosition?: string;
  salary?: string;
  joiningDate?: string;
  notes?: string;
  status?: OfferStatus;
  responseNotes?: string;
}

export interface OfferLetterWithDetails extends OfferLetter {
  jobPost: {
    id: string;
    jobTitle: string;
    companyName: string;
    location: string;
    jobType: string;
    experienceLevel: string;
    salaryRange?: string;
    skillsRequired: string[];
    jobDescription?: string;
    keyResponsibilities: string[];
    qualifications: string[];
    benefits: string[];
  };
  resume: {
    id: string;
    candidateName: string;
    candidateEmail?: string;
    candidatePhone?: string;
    currentJobTitle?: string;
    education?: string;
    experienceYears?: number;
    skills: string[];
    summary?: string;
    linkedinUrl?: string;
    githubUrl?: string;
    matchScore?: number;
  };
  createdBy: {
    id: number;
    name: string;
    email: string;
  };
  // Assessment data
  mcqResults?: {
    score: number;
    totalQuestions: number;
    completedAt: string;
  };
  meetingNotes?: {
    summary: string;
    rating: string;
    notes: string;
    completedAt: string;
  };
}
