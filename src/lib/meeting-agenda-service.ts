/**
 * Meeting Agenda Generation Service
 * Integrates with external AI service for generating interview agendas
 */

interface AgendaRequest {
  resume_path: string;
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experience_years: number;
  education: string;
  match_score: number;
  summary: string;
  location: string;
  linkedin_url: string;
  github_url: string;
  current_job_title: string;
  processing_method: string;
  analysis_timestamp: string;
}

interface AgendaResponse {
  success: boolean;
  agenda?: string;
  error?: string;
}

class MeetingAgendaService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = "https://ai.synchro-hire.com";
  }

  /**
   * Generate interview agenda using external AI service
   */
  async generateAgenda(
    interviewType: string,
    candidateData: AgendaRequest
  ): Promise<AgendaResponse> {
    try {
      console.log("Generating meeting agenda via external API...", {
        interviewType,
        candidateName: candidateData.name,
      });

      const response = await fetch(
        `${this.baseUrl}/generate-interview-agenda?interview_type=${interviewType}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(candidateData),
        }
      );

      console.log("External API response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("External API error:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });

        return {
          success: false,
          error: `External API failed: ${response.status} ${response.statusText} - ${errorText}`,
        };
      }

      const agenda = await response.json();

      console.log("External API response received:", {
        agendaType: typeof agenda,
        agendaLength:
          typeof agenda === "string" ? agenda.length : "Not a string",
        agendaPreview:
          typeof agenda === "string"
            ? agenda.substring(0, 200) + "..."
            : JSON.stringify(agenda).substring(0, 200) + "...",
      });

      // The API should return a string directly, but handle different response formats
      let agendaText = "";
      if (typeof agenda === "string") {
        agendaText = agenda;
      } else if (typeof agenda === "object" && agenda !== null) {
        // If it's an object, try to extract the agenda text
        agendaText =
          agenda.agenda ||
          agenda.content ||
          agenda.text ||
          JSON.stringify(agenda);
      } else {
        agendaText = String(agenda);
      }

      return {
        success: true,
        agenda: agendaText,
      };
    } catch (error: any) {
      console.error("Error generating meeting agenda:", error);
      return {
        success: false,
        error: error.message || "Failed to connect to external API",
      };
    }
  }
}

export const meetingAgendaService = new MeetingAgendaService();
export default meetingAgendaService;
