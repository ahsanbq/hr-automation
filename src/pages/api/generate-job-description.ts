import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      title,
      company,
      department,
      location,
      job_type,
      experience_level,
      key_skills,
      budget_range,
      additional_requirements,
    } = req.body;

    // Validate required fields
    if (!title || !company || !location || !job_type) {
      return res.status(400).json({
        error: "Missing required fields: title, company, location, job_type",
      });
    }

    // Prepare request body for external API
    const requestBody = {
      title,
      company,
      department: department || "",
      location,
      job_type,
      experience_level: experience_level || "Entry-level (0–1 year)",
      key_skills: key_skills || [],
      budget_range: budget_range || "",
      additional_requirements: additional_requirements || "",
    };

    // Call external AI API
    const response = await axios.post(
      "https://ai.synchro-hire.com/create-job-post",
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000, // 30 second timeout
      }
    );

    if (response.data && response.data.job_requirement) {
      return res.status(200).json({
        success: true,
        job_requirement: response.data.job_requirement,
      });
    } else {
      return res.status(500).json({
        error: "Invalid response format from AI service",
      });
    }
  } catch (error: any) {
    console.error("AI API Error:", error);

    if (error.code === "ECONNABORTED") {
      return res.status(408).json({
        error: "Request timeout. Please try again.",
      });
    }

    if (error.response) {
      // External API returned an error
      return res.status(error.response.status).json({
        error:
          error.response.data?.detail ||
          error.response.data?.message ||
          "External API error",
      });
    }

    if (error.request) {
      // Network error
      return res.status(503).json({
        error: "Unable to connect to AI service. Please try again later.",
      });
    }

    // Other error
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}
