/**
 * API endpoint to generate MCQ questions via external API
 * This acts as a proxy to handle CORS issues
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { getUserFromRequest } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { topics, difficulty, number_of_questions } = req.body;

    // Validate request
    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({ error: "Topics array is required" });
    }

    if (topics.length > 10) {
      return res.status(400).json({ error: "Maximum 10 topics allowed" });
    }

    if (difficulty && !["Easy", "Medium", "Hard"].includes(difficulty)) {
      return res
        .status(400)
        .json({ error: "Difficulty must be Easy, Medium, or Hard" });
    }

    if (
      number_of_questions &&
      (number_of_questions < 1 || number_of_questions > 50)
    ) {
      return res
        .status(400)
        .json({ error: "Number of questions must be between 1 and 50" });
    }

    // Make request to external API
    const response = await fetch(
      "https://ai.synchro-hire.com/generate-mcq-questions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          topics,
          difficulty: difficulty || "Medium",
          number_of_questions: number_of_questions || 5,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("External API error:", response.status, errorText);
      return res.status(response.status).json({
        error: "Failed to generate questions",
        details: `External API returned ${response.status}: ${errorText}`,
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error: any) {
    console.error("MCQ generation error:", error);
    return res.status(500).json({
      error: "Failed to generate MCQ questions",
      details: error.message,
    });
  }
}
