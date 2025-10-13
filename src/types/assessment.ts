// Unified Candidate Assessment System Types

export enum StageType {
  MCQ = "MCQ",
  AVATAR = "AVATAR",
  MANUAL = "MANUAL",
}

export enum StageStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  NO_SHOW = "NO_SHOW",
}

export enum MCQDifficulty {
  EASY = "EASY",
  MEDIUM = "MEDIUM",
  HARD = "HARD",
}

// Base Assessment Stage Interface
export interface AssessmentStage {
  id: string;
  type: StageType;
  jobPostId: string;
  resumeId: string;
  interviewerId?: number;
  status: StageStatus;
  scheduledAt?: string;
  completedAt?: string;
  resultScore?: number;
  notes?: string;
  metadata?: any;
  sequenceOrder?: number;
  duration?: number;
  createdAt: string;
  updatedAt: string;

  // Relations
  jobPost?: {
    id: string;
    jobTitle: string;
    companyName: string;
    location: string;
    skillsRequired: string;
  };
  resume?: {
    id: string;
    candidateName: string;
    candidateEmail?: string;
    candidatePhone?: string;
    matchScore?: number;
    experienceYears?: number;
  };
  interviewer?: {
    id: number;
    name: string;
    email: string;
  };

  // Stage-specific data
  mcqAssessment?: MCQAssessment;
  avatarAssessment?: AvatarAssessment;
  manualMeeting?: ManualMeeting;
}

// MCQ Assessment Interfaces
export interface MCQAssessment {
  id: string;
  assessmentStageId: string;
  title: string;
  description?: string;
  totalQuestions: number;
  timeLimit?: number;
  passingScore?: number;
  difficulty: MCQDifficulty;
  categories: string[];
  createdAt: string;
  updatedAt: string;

  questions?: MCQQuestion[];
  candidateAnswers?: MCQAnswer[];
}

export interface MCQQuestion {
  id: string;
  mcqAssessmentId: string;
  question: string;
  options: string[];
  correctAnswer: number; // Index of correct answer (0-based)
  points: number;
  category?: string;
  difficulty: MCQDifficulty;
  explanation?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface MCQAnswer {
  id: string;
  mcqAssessmentId: string;
  questionId: string;
  selectedAnswer?: number; // Index of selected answer (0-based)
  isCorrect?: boolean;
  pointsEarned?: number;
  timeSpent?: number; // Time spent in seconds
  answeredAt: string;
}

// Avatar Assessment Interfaces
export interface AvatarAssessment {
  id: string;
  assessmentStageId: string;
  title: string;
  description?: string;
  avatarType?: string;
  interviewScript?: string;
  recordingEnabled: boolean;
  timeLimit?: number;
  evaluationCriteria?: any;
  createdAt: string;
  updatedAt: string;

  recordings?: AvatarRecording[];
}

export interface AvatarRecording {
  id: string;
  avatarAssessmentId: string;
  filename: string;
  fileSize?: number;
  duration?: number; // Duration in seconds
  s3Key?: string;
  s3Bucket?: string;
  transcription?: string;
  analysis?: any;
  uploadedAt: string;
}

// Manual Meeting Interfaces
export interface ManualMeeting {
  id: string;
  assessmentStageId: string;
  meetingLink?: string;
  agenda?: string;
  meetingType?: "TECHNICAL" | "BEHAVIORAL" | "SITUATIONAL";
  meetingSummary?: string;
  meetingRating?: string;
  createdAt: string;
  updatedAt: string;
}

// API Request/Response Types
export interface CreateAssessmentStageRequest {
  type: StageType;
  jobPostId: string;
  resumeId: string;
  interviewerId?: number;
  scheduledAt?: string;
  duration?: number;
  sequenceOrder?: number;
  notes?: string;
  metadata?: any;
}

export interface UpdateAssessmentStageRequest {
  status?: StageStatus;
  scheduledAt?: string;
  completedAt?: string;
  resultScore?: number;
  notes?: string;
  metadata?: any;
  duration?: number;
}

export interface CreateMCQAssessmentRequest {
  assessmentStageId: string;
  title: string;
  description?: string;
  timeLimit?: number;
  passingScore?: number;
  difficulty?: MCQDifficulty;
  categories?: string[];
}

export interface CreateMCQQuestionRequest {
  mcqAssessmentId: string;
  question: string;
  options: string[];
  correctAnswer: number;
  points?: number;
  category?: string;
  difficulty?: MCQDifficulty;
  explanation?: string;
  order?: number;
}

export interface SubmitMCQAnswersRequest {
  mcqAssessmentId: string;
  answers: {
    questionId: string;
    selectedAnswer: number;
    timeSpent?: number;
  }[];
}

export interface CreateAvatarAssessmentRequest {
  assessmentStageId: string;
  title: string;
  description?: string;
  avatarType?: string;
  interviewScript?: string;
  recordingEnabled?: boolean;
  timeLimit?: number;
  evaluationCriteria?: any;
}

export interface CreateManualMeetingRequest {
  assessmentStageId: string;
  meetingLink?: string;
  agenda?: string;
  meetingType?: "TECHNICAL" | "BEHAVIORAL" | "SITUATIONAL";
  meetingSummary?: string;
  meetingRating?: string;
}

// Filter and Search Types
export interface AssessmentFilters {
  jobPostId?: string;
  resumeId?: string;
  interviewerId?: number;
  type?: StageType;
  status?: StageStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface AssessmentStats {
  totalStages: number;
  pendingStages: number;
  inProgressStages: number;
  completedStages: number;
  cancelledStages: number;
  averageScore: number;
  completionRate: number;
  stagesByType: {
    MCQ: number;
    AVATAR: number;
    MANUAL: number;
  };
}

// Candidate Assessment Timeline
export interface CandidateAssessmentTimeline {
  resumeId: string;
  jobPostId: string;
  candidateName: string;
  stages: {
    stage: AssessmentStage;
    stageType: StageType;
    status: StageStatus;
    resultScore?: number;
    completedAt?: string;
    scheduledAt?: string;
  }[];
  overallStatus: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  totalScore?: number;
  averageScore?: number;
  isShortlisted?: boolean;
}

// Assessment Session Types (for taking assessments)
export interface MCQSession {
  assessmentStage: AssessmentStage;
  mcqAssessment: MCQAssessment;
  questions: MCQQuestion[];
  currentQuestionIndex: number;
  answers: { [questionId: string]: number };
  timeRemaining: number; // in seconds
  isCompleted: boolean;
}

export interface AvatarSession {
  assessmentStage: AssessmentStage;
  avatarAssessment: AvatarAssessment;
  isStarted: boolean;
  timeRemaining: number; // in seconds
  isCompleted: boolean;
}

export interface ManualSession {
  assessmentStage: AssessmentStage;
  manualMeeting: ManualMeeting;
  isStarted: boolean;
  isCompleted: boolean;
}

