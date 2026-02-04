// AI Interview Question Generation Service
// This service handles all AI-powered interview question generation

import {
  BehavioralQuestionRequest,
  BehavioralQuestionResponse,
  TechnicalQuestionRequest,
  TechnicalQuestionResponse,
  CustomizedQuestionRequest,
  CustomizedQuestionResponse,
  QuestionDifficulty,
} from "@/types/ai-interview";

const AI_API_BASE = "https://ai.synchro-hire.com";

/**
 * Generate Behavioral Questions based on job requirements
 * @param request - Job requirement details with focus areas and difficulty
 * @returns Array of behavioral questions with expected answer points
 */
export async function generateBehavioralQuestions(
  request: BehavioralQuestionRequest,
): Promise<BehavioralQuestionResponse> {
  try {
    const response = await fetch(
      `${AI_API_BASE}/generate-behavioral-questions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI API failed: ${response.statusText}: ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Error generating behavioral questions:", error);
    throw new Error(error.message || "Failed to generate behavioral questions");
  }
}

/**
 * Generate Technical Questions based on job requirements
 * @param request - Job requirement details
 * @param difficulty - Question difficulty level
 * @param num_questions - Number of questions to generate
 * @returns Array of technical questions with expected answer points
 */
export async function generateTechnicalQuestions(
  request: TechnicalQuestionRequest,
  difficulty: QuestionDifficulty,
  num_questions: number,
): Promise<TechnicalQuestionResponse> {
  try {
    const response = await fetch(
      `${AI_API_BASE}/generate-technical-questions?difficulty=${difficulty}&num_questions=${num_questions}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI API failed: ${response.statusText}: ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Error generating technical questions:", error);
    throw new Error(error.message || "Failed to generate technical questions");
  }
}

/**
 * Generate Customized Candidate-Specific Questions
 * @param request - Candidate and job requirement details
 * @param num_questions - Number of questions to generate
 * @param difficulty - Question difficulty level
 * @returns Array of customized questions tailored to the candidate
 */
export async function generateCustomizedQuestions(
  request: CustomizedQuestionRequest,
  num_questions: number,
  difficulty: QuestionDifficulty,
): Promise<CustomizedQuestionResponse> {
  try {
    const response = await fetch(
      `${AI_API_BASE}/generate-customized-questions?num_questions=${num_questions}&difficulty=${difficulty}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI API failed: ${response.statusText}: ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Error generating customized questions:", error);
    throw new Error(error.message || "Failed to generate customized questions");
  }
}
