import AppLayout from "@/components/layout/AppLayout";
import { useRouter } from "next/router";
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  message,
  Space,
  Statistic,
  Spin,
  Alert,
} from "antd";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import {
  CalendarOutlined,
  UserOutlined,
  FileTextOutlined,
  LoginOutlined,
} from "@ant-design/icons";

interface Resume {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  matchScore: number;
  recommendation: string;
  experienceYears: number;
  meeting?: {
    id: string;
    meetingTime: string;
    status: string;
    meetingType: string;
    agenda?: string;
    notes?: string;
    meetingRating?: number; // Added meetingRating
  };
  meetingStatus?: string;
  hasMeeting?: boolean;
}

interface JobData {
  job: {
    id: string;
    jobTitle: string;
    companyName: string;
    location: string;
    skillsRequired: string;
  };
  resumes: Resume[];
  totalResumes: number;
  resumesWithMeetings: number;
}

export default function InterviewJobPage() {
  const router = useRouter();
  const { jobId } = router.query as { jobId?: string };
  const [job, setJob] = useState<JobData["job"] | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState(false);
  const [generatingAgenda, setGeneratingAgenda] = useState(false);
  const [generatedAgenda, setGeneratedAgenda] = useState<string>("");
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [authError, setAuthError] = useState<string>("");

  useEffect(() => {
    if (jobId) {
      fetchJobAndResumes();
    }
  }, [jobId]);

  const fetchJobAndResumes = async () => {
    try {
      setLoading(true);
      setAuthError("");

      // Check if user is authenticated
      const token = localStorage.getItem("token");
      if (!token) {
        setAuthError("Please log in to access this page");
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/jobs/${jobId}/resumes-with-meetings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setAuthError("Session expired. Please log in again.");
          localStorage.removeItem("token");
          return;
        }
        const errorData = await response.text();
        console.error("API Error Response:", errorData);
        throw new Error(
          `Failed to fetch data: ${response.status} - ${errorData}`
        );
      }

      const data = await response.json();
      setJob(data.job);
      setResumes(data.resumes);
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("Failed to load job data");
    } finally {
      setLoading(false);
    }
  };

  const getMeetingStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "scheduled":
        return "blue";
      case "in_progress":
        return "orange";
      case "completed":
        return "green";
      case "cancelled":
        return "red";
      default:
        return "default";
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation?.toLowerCase()) {
      case "highly recommended":
        return "green";
      case "consider":
        return "orange";
      case "not suitable":
        return "red";
      default:
        return "default";
    }
  };

  const handleScheduleInterview = (resume: Resume) => {
    setSelectedResume(resume);
    setScheduleModalVisible(true);
    setGeneratedAgenda(""); // Reset agenda when opening modal
  };

  const handleGenerateAgenda = async () => {
    if (!selectedResume) return;

    try {
      setGeneratingAgenda(true);
      const response = await fetch("/api/generate-interview-agenda", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          resumeId: selectedResume.id,
          interview_type: "Technical", // Default to Technical, can be made dynamic
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate agenda");
      }

      const data = await response.json();
      setGeneratedAgenda(data.agenda);
      message.success("Agenda generated successfully!");
    } catch (error) {
      console.error("Error generating agenda:", error);
      message.error("Failed to generate agenda");
    } finally {
      setGeneratingAgenda(false);
    }
  };

  const handleScheduleSubmit = async (values: any) => {
    if (!selectedResume) return;

    try {
      setScheduling(true);
      const meetingTime = dayjs(values.meetingTime);

      const response = await fetch("/api/meetings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          meetingTime: meetingTime.toISOString(),
          meetingLink: values.meetingLink,
          meetingType: values.meetingType || "TECHNICAL",
          interviewType: values.interviewType || "TECHNICAL",
          agenda: generatedAgenda, // Include the generated agenda
          status: "SCHEDULED",
          resumeId: selectedResume.id,
          jobId: jobId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to schedule meeting");
      }

      message.success("Interview scheduled successfully!");
      setScheduleModalVisible(false);
      setSelectedResume(null);
      setGeneratedAgenda("");
      fetchJobAndResumes(); // Refresh the data
    } catch (error) {
      console.error("Error scheduling interview:", error);
      message.error("Failed to schedule interview");
    } finally {
      setScheduling(false);
    }
  };
  const columns = [
    {
      title: "Candidate",
      dataIndex: "candidateName",
      key: "candidateName",
      width: 150,
      render: (name: string, record: Resume) => (
        <div>
          <div style={{ fontWeight: 500, color: "#1890ff", fontSize: "13px" }}>
            {name}
          </div>
          <a
            href={`mailto:${record.candidateEmail}`}
            style={{ color: "#1890ff", fontSize: "12px" }}
          >
            {record.candidateEmail}
          </a>
        </div>
      ),
    },
    {
      title: "Phone",
      dataIndex: "candidatePhone",
      key: "candidatePhone",
      width: 120,
      render: (phone: string) =>
        phone ? (
          <a
            href={`tel:${phone}`}
            style={{ color: "#1890ff", fontSize: "12px" }}
          >
            {phone}
          </a>
        ) : (
          <span style={{ color: "#999", fontSize: "12px" }}>N/A</span>
        ),
    },
    {
      title: "Match Score",
      dataIndex: "matchScore",
      key: "matchScore",
      width: 100,
      align: "center" as const,
      render: (score: number) => (
        <Tag
          color={score >= 80 ? "green" : score >= 60 ? "orange" : "red"}
          style={{
            fontSize: "11px",
            fontWeight: "bold",
            minWidth: "50px",
            textAlign: "center",
            margin: 0,
          }}
        >
          {score ? `${score}%` : "N/A"}
        </Tag>
      ),
    },
    {
      title: "Recommendation",
      dataIndex: "recommendation",
      key: "recommendation",
      width: 120,
      align: "center" as const,
      render: (recommendation: string) => (
        <Tag
          color={getRecommendationColor(recommendation)}
          style={{ fontSize: "11px", margin: 0 }}
        >
          {recommendation || "N/A"}
        </Tag>
      ),
    },
    {
      title: "Experience",
      dataIndex: "experienceYears",
      key: "experienceYears",
      width: 100,
      align: "center" as const,
      render: (years: number) => (
        <span style={{ color: years ? "#000" : "#999", fontSize: "12px" }}>
          {years ? `${years}y` : "N/A"}
        </span>
      ),
    },
    {
      title: "Meeting Status",
      key: "meetingStatus",
      width: 120,
      align: "center" as const,
      render: (_: unknown, record: Resume) => {
        if (record.meeting) {
          return (
            <Tag
              color={getMeetingStatusColor(record.meeting.status)}
              style={{ fontSize: "11px", margin: 0 }}
            >
              {record.meeting.status}
            </Tag>
          );
        }
        return (
          <Tag color="default" style={{ fontSize: "11px", margin: 0 }}>
            No Meeting
          </Tag>
        );
      },
    },
    {
      title: "Meeting Rating",
      key: "meetingRating",
      width: 120,
      align: "center" as const,
      render: (_: unknown, record: Resume) => {
        const rating = record.meeting?.meetingRating;
        if (rating && rating > 0) {
          return (
            <Tag
              color={rating >= 8 ? "green" : rating >= 6 ? "orange" : "red"}
              style={{ fontSize: "11px", margin: 0 }}
            >
              {rating}/10
            </Tag>
          );
        }
        return <span style={{ color: "#999", fontSize: "12px" }}>-</span>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_: unknown, record: Resume) => (
        <Space size="small">
          {record.hasMeeting ? (
            <Button
              type="primary"
              size="small"
              onClick={() => router.push(`/meeting/meeting/${record.id}`)}
            >
              Manage Meeting
            </Button>
          ) : (
            <Button
              type="primary"
              size="small"
              onClick={() => handleScheduleInterview(record)}
            >
              Schedule Interview
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // Show authentication error
  if (authError) {
    return (
      <AppLayout title="Meeting Management" subtitle="Authentication Required">
        <Alert
          message="Authentication Required"
          description={
            <div>
              <p>{authError}</p>
              <Button
                type="primary"
                icon={<LoginOutlined />}
                onClick={() => router.push("/auth")}
                style={{ marginTop: "16px" }}
              >
                Go to Login
              </Button>
            </div>
          }
          type="warning"
          showIcon
          style={{ margin: "20px 0" }}
        />
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout
        title="Meeting Management"
        subtitle="Loading interview data..."
      >
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Spin size="large" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={`Interview Management - ${job?.jobTitle || "..."}`}
      subtitle={`${job?.companyName} - Manage interviews for this position`}
    >
      <Row gutter={[16, 16]} style={{ marginBottom: "16px" }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Resumes"
              value={resumes.length}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Meetings Scheduled"
              value={resumes.filter((r) => r.hasMeeting).length}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Completed Interviews"
              value={
                resumes.filter((r) => r.meeting?.status === "COMPLETED").length
              }
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={18}>
          <Card title="Resume List" style={{ borderRadius: "8px" }}>
            <Table
              dataSource={resumes}
              columns={columns}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} resumes`,
                showQuickJumper: true,
              }}
              style={{ borderRadius: "6px" }}
              size="small"
              scroll={{ x: 1000 }}
              bordered
            />
          </Card>
        </Col>

        {/* Sidebar - Job Details */}
        <Col span={6}>
          <Card
            title="Job Details"
            style={{ borderRadius: "8px" }}
            headStyle={{ backgroundColor: "#fafafa" }}
          >
            {job && (
              <div>
                <div style={{ marginBottom: "16px" }}>
                  <h3
                    style={{
                      color: "#1890ff",
                      marginBottom: "8px",
                      fontSize: "16px",
                    }}
                  >
                    {job.jobTitle}
                  </h3>
                  <div style={{ lineHeight: "1.6", fontSize: "12px" }}>
                    <p>
                      <strong>Company:</strong> {job.companyName}
                    </p>
                    <p>
                      <strong>Location:</strong> {job.location}
                    </p>
                  </div>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <h4
                    style={{
                      color: "#1890ff",
                      marginBottom: "6px",
                      fontSize: "14px",
                    }}
                  >
                    Required Skills
                  </h4>
                  <div>
                    {(() => {
                      let skills = [];
                      try {
                        // Try to parse as JSON array first
                        if (
                          typeof job.skillsRequired === "string" &&
                          job.skillsRequired.startsWith("[")
                        ) {
                          skills = JSON.parse(job.skillsRequired);
                        } else if (Array.isArray(job.skillsRequired)) {
                          skills = job.skillsRequired;
                        } else if (typeof job.skillsRequired === "string") {
                          // Fallback to comma splitting
                          skills = job.skillsRequired
                            .split(",")
                            .map((s) => s.trim());
                        }
                      } catch (e) {
                        // If JSON parsing fails, try comma splitting
                        skills =
                          typeof job.skillsRequired === "string"
                            ? job.skillsRequired.split(",").map((s) => s.trim())
                            : [];
                      }
                      return skills.map((skill: string, index: number) => (
                        <Tag
                          key={index}
                          color="blue"
                          style={{ marginBottom: "2px", fontSize: "11px" }}
                        >
                          {typeof skill === "string" ? skill.trim() : skill}
                        </Tag>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Schedule Interview Modal */}
      <Modal
        title="Schedule Interview"
        open={scheduleModalVisible}
        onCancel={() => {
          setScheduleModalVisible(false);
          setSelectedResume(null);
          setGeneratedAgenda("");
        }}
        footer={null}
        width={800}
      >
        {selectedResume && (
          <div>
            <div
              style={{
                marginBottom: "16px",
                padding: "12px",
                backgroundColor: "#f5f5f5",
                borderRadius: "6px",
              }}
            >
              <p>
                <strong>Candidate:</strong> {selectedResume.candidateName}
              </p>
              <p>
                <strong>Email:</strong> {selectedResume.candidateEmail}
              </p>
              <p>
                <strong>Match Score:</strong> {selectedResume.matchScore}%
              </p>
            </div>

            <Form
              layout="vertical"
              onFinish={handleScheduleSubmit}
              initialValues={{
                meetingTime: dayjs().add(1, "day").hour(10).minute(0),
                meetingType: "TECHNICAL",
                interviewType: "TECHNICAL",
              }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="meetingTime"
                    label="Meeting Date & Time"
                    rules={[
                      { required: true, message: "Please select meeting time" },
                    ]}
                  >
                    <DatePicker
                      showTime
                      format="YYYY-MM-DD HH:mm"
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="meetingLink"
                    label="Meeting Link"
                    rules={[
                      { required: true, message: "Please enter meeting link" },
                    ]}
                  >
                    <Input placeholder="https://meet.google.com/..." />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="meetingType"
                    label="Meeting Type"
                    rules={[{ required: true }]}
                  >
                    <Select>
                      <Select.Option value="TECHNICAL">Technical</Select.Option>
                      <Select.Option value="BEHAVIORAL">
                        Behavioral
                      </Select.Option>
                      <Select.Option value="SITUATIONAL">
                        Situational
                      </Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="interviewType"
                    label="Interview Type"
                    rules={[{ required: true }]}
                  >
                    <Select>
                      <Select.Option value="TECHNICAL">Technical</Select.Option>
                      <Select.Option value="BEHAVIORAL">
                        Behavioral
                      </Select.Option>
                      <Select.Option value="EASY">Easy</Select.Option>
                      <Select.Option value="MEDIUM">Medium</Select.Option>
                      <Select.Option value="COMPLEX">Complex</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={scheduling}
                    size="large"
                  >
                    Schedule Interview
                  </Button>
                  <Button
                    type="default"
                    onClick={handleGenerateAgenda}
                    loading={generatingAgenda}
                    size="large"
                  >
                    Generate AI Agenda
                  </Button>
                </Space>
              </Form.Item>
            </Form>

            {generatedAgenda && (
              <div style={{ marginTop: "16px" }}>
                <h4>Generated Interview Agenda:</h4>
                <div
                  style={{
                    maxHeight: "300px",
                    overflowY: "auto",
                    padding: "12px",
                    backgroundColor: "#f9f9f9",
                    border: "1px solid #d9d9d9",
                    borderRadius: "6px",
                    whiteSpace: "pre-wrap",
                    fontSize: "12px",
                    lineHeight: "1.5",
                  }}
                >
                  {generatedAgenda}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}
