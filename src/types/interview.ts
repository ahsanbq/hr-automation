/**
 * TypeScript types and Zod schemas for AI Interview system
 */

import { z } from "zod";

// Enums
export enum InterviewStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum ShortlistStatus {
  PENDING = "PENDING",
  SHORTLISTED = "SHORTLISTED",
  REJECTED = "REJECTED",
  NOT_SHORTLISTED = "NOT_SHORTLISTED",
}

export enum Difficulty {
  EASY = "EASY",
  MEDIUM = "MEDIUM",
  HARD = "HARD",
}

// Types
export interface Interview {
  id: string;
  title: string;
  description?: string;
  duration: number;
  status: InterviewStatus;
  attempted: boolean;
  sessionStart?: string;
  sessionEnd?: string;
  scheduledAt?: string;
  notes?: string;
  shortlistStatus?: ShortlistStatus;
  percentage?: number;
  candidateEmail?: string;
  sessionPassword?: string;
  sessionPasswordHash?: string;
  jobPostId: string;
  resumeId: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
  questions?: Question[];
  interviewAttempts?: InterviewAttempt[];
  interviewer?: {
    id: number;
    name: string;
    email: string;
  };
  jobPost?: {
    id: string;
    jobTitle: string;
    companyName: string;
  };
  resume?: {
    id: string;
    candidateName: string;
    candidateEmail: string;
    matchScore?: number;
  };
}

export interface Question {
  id: string;
  interviewId: string;
  type: string;
  question: string;
  options?: any;
  correct?: any;
  points: number;
  order: number;
}

export interface InterviewAttempt {
  id: string;
  interviewId: string;
  interviewerId: number;
  status: string;
  score?: number;
  maxScore?: number;
  timeSpent?: number;
  startedAt: string;
  submittedAt?: string;
  completedAt?: string;
  violations: number;
}

export interface MCQQuestion {
  id: string;
  type: string;
  question: string;
  options?: any;
  correct?: any;
  correctAnswer?: any;
  points: number;
  order: number;
  category?: string;
  difficulty?: string;
}

export interface CandidateAnswer {
  questionId: string;
  answer: any;
  timeSpent?: number;
}

// Zod schemas for validation
export const GenerateTemplateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  topics: z.array(z.string()).min(1, "At least one topic is required"),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  numberOfQuestions: z.number().min(1).max(50).default(5),
  duration: z.number().min(5).max(180).default(30), // minutes
  jobPostId: z.string().optional(),
});

export const QuestionSelectionSchema = z.object({
  templateIds: z.array(z.string()).min(1, "At least one template is required"),
  questionIds: z.array(z.string()).min(1, "At least one question is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  duration: z.number().min(5).max(180).default(30),
  candidateEmail: z.string().email("Valid email is required"),
  candidateName: z.string().min(1, "Candidate name is required"),
});

export const SendTestSchema = z.object({
  interviewId: z.string(),
  candidateEmail: z.string().email(),
  candidateName: z.string(),
  message: z.string().optional(),
});

// TypeScript types
export type GenerateTemplateRequest = z.infer<typeof GenerateTemplateSchema>;
export type QuestionSelectionRequest = z.infer<typeof QuestionSelectionSchema>;
export type SendTestRequest = z.infer<typeof SendTestSchema>;

export interface QuestionTemplate {
  id: string;
  question: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "ESSAY" | "FILL_BLANK";
  options?: string[];
  correct?: any;
  points: number;
  order: number;
  topic?: string;
  difficulty?: string;
}

export interface InterviewTemplate {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  questions: QuestionTemplate[];
  totalQuestions: number;
  duration: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

export interface QuestionResult {
  id: string;
  question: string;
  candidateAnswer: any;
  correctAnswer: any;
  isCorrect: boolean;
  pointsEarned: number;
  timeSpent: number; // in seconds
}

export interface InterviewResult {
  attemptId: string;
  interviewId: string;
  candidateEmail: string;
  candidateName: string;
  status: string;
  score: number;
  totalQuestions: number;
  answeredQuestions: number;
  timeSpent: number;
  completedAt: string;
  results: QuestionResult[];
}

// OpenAI API types
export interface OpenAIGenerateRequest {
  topics: string[];
  difficulty: string;
  numberOfQuestions: number;
}

export interface OpenAIGenerateResponse {
  success: boolean;
  questions: Array<{
    question: string;
    options: string[];
    answer: string;
    topic: string;
    difficulty: string;
  }>;
  totalQuestions: number;
  topicsCovered: string[];
  message: string;
  error?: string;
}
