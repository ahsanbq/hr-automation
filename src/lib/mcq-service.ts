/**
 * MCQ Service for generating and managing MCQ questions
 */

export interface MCQQuestion {
  question: string;
  difficulty: string;
  options: string[];
  topic: string;
  answer: string;
}

export interface MCQGenerationRequest {
  topics: string[];
  difficulty: "Easy" | "Medium" | "Hard";
  number_of_questions: number;
}

export interface MCQGenerationResponse {
  success: boolean;
  questions: MCQQuestion[];
  total_questions: number;
  topics_covered: string[];
  message: string;
  error: string | null;
}

export class MCQService {
  private static readonly API_BASE_URL = "https://ai.synchro-hire.com";

  /**
   * Generate MCQ questions using internal API (which proxies to external API)
   */
  static async generateQuestions(
    request: MCQGenerationRequest
  ): Promise<MCQGenerationResponse> {
    try {
      const response = await fetch("/api/assessments/mcq/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `API request failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("MCQ generation error:", error);
      throw new Error(
        `Failed to generate MCQ questions: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Validate MCQ generation request
   */
  static validateRequest(request: Partial<MCQGenerationRequest>): string[] {
    const errors: string[] = [];

    if (!request.topics || request.topics.length === 0) {
      errors.push("At least one topic is required");
    }

    if (request.topics && request.topics.length > 10) {
      errors.push("Maximum 10 topics allowed");
    }

    if (
      request.difficulty &&
      !["Easy", "Medium", "Hard"].includes(request.difficulty)
    ) {
      errors.push("Difficulty must be Easy, Medium, or Hard");
    }

    if (
      request.number_of_questions &&
      (request.number_of_questions < 1 || request.number_of_questions > 50)
    ) {
      errors.push("Number of questions must be between 1 and 50");
    }

    return errors;
  }

  /**
   * Format topics for display
   */
  static formatTopics(topics: string[]): string {
    return topics.join(", ");
  }

  /**
   * Get difficulty color for UI
   */
  static getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case "Easy":
        return "#52c41a";
      case "Medium":
        return "#faad14";
      case "Hard":
        return "#ff4d4f";
      default:
        return "#1890ff";
    }
  }
}
