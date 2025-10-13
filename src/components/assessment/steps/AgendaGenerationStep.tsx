import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Form,
  Select,
  DatePicker,
  TimePicker,
  Input,
  Row,
  Col,
  Typography,
  Space,
  Spin,
  Alert,
  message,
} from "antd";
import {
  CalendarOutlined,
  FileTextOutlined,
  RobotOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface Job {
  id: string;
  jobTitle: string;
  companyName: string;
  location: string;
  jobType: string;
  status?: string;
  createdAt: string;
  _count: {
    Resume: number;
  };
}

interface Candidate {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  experienceYears?: number;
  skills: string[];
  matchScore?: number;
  recommendation?: string;
  createdAt: string;
}

interface AgendaGenerationStepProps {
  selectedJob: Job | null;
  selectedCandidates: string[];
  candidates: Candidate[];
  agenda: string;
  setAgenda: (agenda: string) => void;
  meetingTime: string;
  setMeetingTime: (time: string) => void;
  meetingType: string;
  setMeetingType: (type: string) => void;
}

const AgendaGenerationStep: React.FC<AgendaGenerationStepProps> = ({
  selectedJob,
  selectedCandidates,
  candidates,
  agenda,
  setAgenda,
  meetingTime,
  setMeetingTime,
  meetingType,
  setMeetingType,
}) => {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const selectedCandidateObjects = candidates.filter((c) =>
    selectedCandidates.includes(c.id)
  );

  const handleGenerateAgenda = async () => {
    if (!selectedJob || selectedCandidateObjects.length === 0) {
      message.error("Please select a job and candidates first");
      return;
    }

    setGenerating(true);
    try {
      // Prepare candidate data for the external API
      const candidateData = selectedCandidateObjects.map((candidate) => ({
        resume_path: "", // We don't have resume path in our current schema
        name: candidate.candidateName,
        email: candidate.candidateEmail,
        phone: candidate.candidatePhone || "",
        skills: candidate.skills || [],
        experience_years: candidate.experienceYears || 0,
        education: "", // Not available in current schema
        match_score: candidate.matchScore || 0,
        summary: "", // Not available in current schema
        location: "", // Not available in current schema
        linkedin_url: "", // Not available in current schema
        github_url: "", // Not available in current schema
        current_job_title: "", // Not available in current schema
        processing_method: "manual",
        analysis_timestamp: new Date().toISOString(),
      }));

      // Call external API for each candidate
      const agendaPromises = candidateData.map(async (candidate) => {
        try {
          const response = await fetch("/api/meetings/generate-agenda", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
              interview_type: meetingType.toLowerCase(),
              candidate_data: candidate,
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to generate agenda for ${candidate.name}`);
          }

          const data = await response.json();
          if (data.success) {
            console.log(
              "Successfully generated agenda using external AI service"
            );
            return data.agenda || "";
          } else {
            console.error("Failed to generate agenda:", data.error);
            throw new Error(data.error || "Failed to generate agenda");
          }
        } catch (error) {
          console.error(
            `Error generating agenda for ${candidate.name}:`,
            error
          );
          return `Meeting agenda for ${candidate.name} - ${meetingType} interview`;
        }
      });

      const agendas = await Promise.all(agendaPromises);

      // Combine all agendas into one
      const combinedAgenda = agendas.join("\n\n---\n\n");
      setAgenda(combinedAgenda);

      message.success("Meeting agenda generated successfully!");
    } catch (error) {
      console.error("Error generating agenda:", error);
      message.error("Failed to generate meeting agenda");
    } finally {
      setGenerating(false);
    }
  };

  const handleDateTimeChange = (date: any, timeString: string) => {
    if (date && timeString) {
      const combinedDateTime = dayjs(date)
        .hour(dayjs(timeString).hour())
        .minute(dayjs(timeString).minute())
        .format("YYYY-MM-DD HH:mm:ss");
      setMeetingTime(combinedDateTime);
    }
  };

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>
        <FileTextOutlined style={{ marginRight: 8, color: "#722ed1" }} />
        Generate Meeting Agenda
      </Title>

      <Row gutter={[24, 24]}>
        {/* Meeting Details */}
        <Col span={12}>
          <Card title="Meeting Details" size="small">
            <Form layout="vertical">
              <Form.Item label="Meeting Type">
                <Select
                  value={meetingType}
                  onChange={setMeetingType}
                  style={{ width: "100%" }}
                >
                  <Option value="TECHNICAL">Technical Interview</Option>
                  <Option value="BEHAVIORAL">Behavioral Interview</Option>
                  <Option value="SITUATIONAL">Situational Interview</Option>
                </Select>
              </Form.Item>

              <Form.Item label="Meeting Date & Time">
                <Space direction="vertical" style={{ width: "100%" }}>
                  <DatePicker
                    style={{ width: "100%" }}
                    placeholder="Select date"
                    disabledDate={(current) =>
                      current && current < dayjs().startOf("day")
                    }
                  />
                  <TimePicker
                    style={{ width: "100%" }}
                    placeholder="Select time"
                    format="HH:mm"
                    onChange={(time) => {
                      if (time) {
                        const timeString = time.format("HH:mm:ss");
                        setMeetingTime(timeString);
                      }
                    }}
                  />
                </Space>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  icon={<RobotOutlined />}
                  onClick={handleGenerateAgenda}
                  loading={generating}
                  style={{
                    width: "100%",
                    backgroundColor: "#722ed1",
                    borderColor: "#722ed1",
                  }}
                >
                  {generating ? "Generating Agenda..." : "Generate Agenda"}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* Selected Candidates */}
        <Col span={12}>
          <Card title="Selected Candidates" size="small">
            <div style={{ maxHeight: 200, overflowY: "auto" }}>
              {selectedCandidateObjects.map((candidate) => (
                <div
                  key={candidate.id}
                  style={{
                    padding: "8px 12px",
                    marginBottom: "8px",
                    background: "#f5f5f5",
                    borderRadius: "6px",
                    border: "1px solid #d9d9d9",
                  }}
                >
                  <div style={{ fontWeight: "500", fontSize: "14px" }}>
                    {candidate.candidateName}
                  </div>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    {candidate.candidateEmail}
                  </div>
                  {candidate.skills && candidate.skills.length > 0 && (
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#999",
                        marginTop: "4px",
                      }}
                    >
                      Skills: {candidate.skills.slice(0, 3).join(", ")}
                      {candidate.skills.length > 3 && "..."}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* Generated Agenda */}
        <Col span={24}>
          <Card title="Meeting Agenda" size="small">
            <TextArea
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              placeholder="Meeting agenda will be generated here..."
              rows={8}
              style={{ marginBottom: 16 }}
            />
            <Alert
              message="Agenda Generation"
              description="Click 'Generate Agenda' to automatically create a comprehensive meeting agenda based on the selected candidates' profiles and the job requirements."
              type="info"
              showIcon
              style={{ marginTop: 16 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AgendaGenerationStep;
