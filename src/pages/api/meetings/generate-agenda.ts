import { NextApiRequest, NextApiResponse } from "next";
import meetingAgendaService from "../../../lib/meeting-agenda-service";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { interview_type, candidate_data } = req.body;

    if (!interview_type || !candidate_data) {
      return res.status(400).json({
        error: "Missing required fields",
        details: "interview_type and candidate_data are required",
      });
    }

    console.log("Generating meeting agenda for:", {
      interview_type,
      candidate_name: candidate_data.name,
    });

    // Prepare request data for external API - map resume table fields
    const agendaRequest = {
      resume_path: candidate_data.resumeUrl || candidate_data.resume_path || "",
      name: candidate_data.candidateName || candidate_data.name || "",
      email: candidate_data.candidateEmail || candidate_data.email || "",
      phone: candidate_data.candidatePhone || candidate_data.phone || "",
      skills: candidate_data.skills || [],
      experience_years:
        candidate_data.experienceYears || candidate_data.experience_years || 0,
      education: candidate_data.education || "",
      match_score: candidate_data.matchScore || candidate_data.match_score || 0,
      summary: candidate_data.summary || "",
      location: candidate_data.location || "",
      linkedin_url:
        candidate_data.linkedinUrl || candidate_data.linkedin_url || "",
      github_url: candidate_data.githubUrl || candidate_data.github_url || "",
      current_job_title:
        candidate_data.currentJobTitle ||
        candidate_data.current_job_title ||
        "",
      processing_method: "ai_generated",
      analysis_timestamp: new Date().toISOString(),
    };

    console.log("Prepared agenda request data:", {
      candidateName: agendaRequest.name,
      candidateEmail: agendaRequest.email,
      skillsCount: agendaRequest.skills.length,
      experienceYears: agendaRequest.experience_years,
      matchScore: agendaRequest.match_score,
    });

    // Generate agenda using external service
    const result = await meetingAgendaService.generateAgenda(
      interview_type,
      agendaRequest
    );

    if (!result.success) {
      console.error(
        "Failed to generate agenda from external API:",
        result.error
      );
      return res.status(500).json({
        success: false,
        error: "Failed to generate meeting agenda",
        details: result.error,
      });
    }

    // Return the generated agenda from external API
    return res.status(200).json({
      success: true,
      agenda: result.agenda,
      interview_type,
      candidate_name: agendaRequest.name,
    });
  } catch (error: any) {
    console.error("Error generating meeting agenda:", error);
    return res.status(500).json({
      error: "Failed to generate meeting agenda",
      details: error.message,
    });
  }
}
