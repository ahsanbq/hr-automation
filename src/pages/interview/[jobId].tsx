import AppLayout from "@/components/layout/AppLayout";
import { useRouter } from "next/router";
import {
  Card,
  Row,
  Col,
  Button,
  Modal,
  message,
  Space,
  Alert,
  Spin,
  Table,
  Tag,
  Tooltip,
  Popconfirm,
  Statistic,
} from "antd";
import { useState, useEffect } from "react";
import {
  CalendarOutlined,
  UserOutlined,
  FileTextOutlined,
  LoginOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import InterviewForm from "@/components/interview/InterviewForm";
import MCQManager from "@/components/interview/MCQManager";
import InterviewTaker from "@/components/interview/InterviewTaker";
import AIQuestionGenerator from "@/components/interview/AIQuestionGenerator";
import { Interview, InterviewStatus, ShortlistStatus } from "@/types/interview";
import dayjs from "dayjs";

interface Resume {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  matchScore: number;
  recommendation: string;
  experienceYears: number;
  skills?: string[];
  education?: string;
  summary?: string;
  hasMeeting?: boolean;
  meetingStatus?: string;
  meeting?: {
    id: string;
    meetingTime: string;
    status: string;
    meetingType: string;
    agenda?: string;
    notes?: string;
    meetingRating?: string;
  };
  interview?: {
    id: string;
    title: string;
    status: string;
    percentage?: number;
    shortlistStatus?: string;
    completedAt?: string;
  };
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
}

export default function InterviewJobPage() {
  const router = useRouter();
  const { jobId } = router.query as { jobId?: string };
  const [job, setJob] = useState<JobData["job"] | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string>("");
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [aiGeneratorVisible, setAiGeneratorVisible] = useState(false);
  const [selectedCandidateForAI, setSelectedCandidateForAI] = useState<Resume | null>(null);

  useEffect(() => {
    if (jobId) {
      fetchJobAndResumes();
    }
  }, [jobId, refreshKey]);

  const fetchJobAndResumes = async () => {
    try {
      setLoading(true);
      setAuthError("");

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
        throw new Error(`Failed to fetch data: ${response.status}`);
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

  const handleCreateInterview = (resume: Resume) => {
    setSelectedResume(resume);
    setCreateModalVisible(true);
  };

  const handleCreateSuccess = (interview: Interview) => {
    setCreateModalVisible(false);
    setSelectedResume(null);
    setRefreshKey((prev) => prev + 1);
    message.success("Interview created successfully!");
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "default";
      case "in_progress":
        return "processing";
      case "completed":
        return "success";
      case "cancelled":
        return "error";
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

  const columns = [
    {
      title: "Candidate Name",
      dataIndex: "candidateName",
      key: "candidateName",
      width: 150,
      sorter: (a: Resume, b: Resume) =>
        a.candidateName.localeCompare(b.candidateName),
      render: (name: string) => (
        <div style={{ fontWeight: 500, color: "#1890ff", fontSize: "13px" }}>
          {name}
        </div>
      ),
    },
    {
      title: "Email",
      dataIndex: "candidateEmail",
      key: "candidateEmail",
      width: 180,
      render: (email: string) =>
        email ? (
          <a
            href={`mailto:${email}`}
            style={{ color: "#1890ff", fontSize: "12px" }}
          >
            {email}
          </a>
        ) : (
          <span style={{ color: "#999", fontSize: "12px" }}>N/A</span>
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
      sorter: (a: Resume, b: Resume) =>
        (a.matchScore || 0) - (b.matchScore || 0),
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
      sorter: (a: Resume, b: Resume) =>
        (a.experienceYears || 0) - (b.experienceYears || 0),
    },
    {
      title: "Meeting Status",
      key: "meetingStatus",
      width: 120,
      align: "center" as const,
      render: (_: any, record: Resume) => {
        if (record.meeting) {
          return (
            <Tag
              color={getStatusColor(record.meeting.status)}
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
      title: "Interview Status",
      key: "interviewStatus",
      width: 120,
      align: "center" as const,
      render: (_: any, record: Resume) => {
        if (record.interview) {
          return (
            <Tag
              color={getStatusColor(record.interview.status)}
              style={{ fontSize: "11px", margin: 0 }}
            >
              {record.interview.status}
            </Tag>
          );
        }
        return (
          <Tag color="default" style={{ fontSize: "11px", margin: 0 }}>
            No Interview
          </Tag>
        );
      },
    },
    {
      title: "Interview Score",
      key: "interviewScore",
      width: 100,
      align: "center" as const,
      render: (_: any, record: Resume) => {
        if (record.interview?.percentage) {
          return (
            <Tag
              color={
                record.interview.percentage >= 80
                  ? "green"
                  : record.interview.percentage >= 60
                  ? "orange"
                  : "red"
              }
              style={{ fontSize: "11px", margin: 0 }}
            >
              {record.interview.percentage.toFixed(1)}%
            </Tag>
          );
        }
        return <span style={{ color: "#999", fontSize: "12px" }}>-</span>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      align: "center" as const,
      render: (_: any, record: Resume) => (
        <Space size="small" wrap>
          {record.interview ? (
            <Tooltip title="View Interview">
              <Button
                type="primary"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => router.push(`/interview/interview/${record.id}`)}
                style={{ fontSize: "11px", height: "24px" }}
              >
                View
              </Button>
            </Tooltip>
          ) : (
            <Tooltip title="Create Interview">
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => handleCreateInterview(record)}
                style={{ fontSize: "11px", height: "24px" }}
              >
                Create
              </Button>
            </Tooltip>
          )}
          <Tooltip title="Generate AI Questions">
            <Button
              type="default"
              size="small"
              icon={<ThunderboltOutlined />}
              onClick={() => {
                setSelectedCandidateForAI(record);
                setAiGeneratorVisible(true);
              }}
              style={{ fontSize: "11px", height: "24px", color: "#722ed1" }}
            >
              AI Q's
            </Button>
          </Tooltip>
          <Tooltip title="Schedule Meeting">
            <Button
              type="default"
              size="small"
              icon={<CalendarOutlined />}
              onClick={() => router.push(`/meeting/meeting/${record.id}`)}
              style={{ fontSize: "11px", height: "24px" }}
            >
              Meeting
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Show authentication error
  if (authError) {
    return (
      <AppLayout
        title="Interview Management"
        subtitle="Authentication Required"
      >
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
        title="Interview Management"
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
      subtitle={`${job?.companyName} - Manage MCQ interviews for this position`}
    >
      <div style={{ padding: "24px" }}>
        <Row gutter={24}>
          {/* Main Content - Candidates List */}
          <Col span={18}>
            <Card
              title={
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: "18px", fontWeight: "bold" }}>
                    Candidates for {job?.jobTitle}
                  </span>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setCreateModalVisible(true)}
                    size="large"
                  >
                    Create New Interview
                  </Button>
                </div>
              }
              style={{ borderRadius: "8px" }}
            >
              {/* Statistics Row */}
              <div style={{ marginBottom: "20px" }}>
                <Row gutter={16}>
                  <Col span={6}>
                    <Card
                      size="small"
                      style={{ textAlign: "center", borderRadius: "6px" }}
                    >
                      <Statistic
                        title="Total Candidates"
                        value={resumes.length}
                        valueStyle={{ color: "#1890ff", fontSize: "24px" }}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card
                      size="small"
                      style={{ textAlign: "center", borderRadius: "6px" }}
                    >
                      <Statistic
                        title="Avg Match Score"
                        value={
                          resumes.length > 0
                            ? resumes.reduce(
                                (sum, r) => sum + (r.matchScore || 0),
                                0
                              ) / resumes.length
                            : 0
                        }
                        suffix="%"
                        precision={1}
                        valueStyle={{
                          color:
                            resumes.length > 0 &&
                            resumes.reduce(
                              (sum, r) => sum + (r.matchScore || 0),
                              0
                            ) /
                              resumes.length >=
                              70
                              ? "#52c41a"
                              : "#faad14",
                          fontSize: "24px",
                        }}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card
                      size="small"
                      style={{ textAlign: "center", borderRadius: "6px" }}
                    >
                      <Statistic
                        title="Meetings Scheduled"
                        value={resumes.filter((r) => r.meeting).length}
                        valueStyle={{ color: "#52c41a", fontSize: "24px" }}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card
                      size="small"
                      style={{ textAlign: "center", borderRadius: "6px" }}
                    >
                      <Statistic
                        title="Meetings Completed"
                        value={
                          resumes.filter(
                            (r) => r.meeting?.status === "COMPLETED"
                          ).length
                        }
                        valueStyle={{ color: "#722ed1", fontSize: "24px" }}
                      />
                    </Card>
                  </Col>
                </Row>
              </div>

              <Table
                dataSource={resumes}
                columns={columns}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} candidates`,
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
                      <p>
                        <strong>Skills Required:</strong> {job.skillsRequired}
                      </p>
                    </div>
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <h4 style={{ marginBottom: "8px", fontSize: "14px" }}>
                      Interview Management
                    </h4>
                    <Space direction="vertical" style={{ width: "100%" }}>
                      <Button
                        type="primary"
                        block
                        icon={<PlusOutlined />}
                        onClick={() => setCreateModalVisible(true)}
                      >
                        Create Interview
                      </Button>
                      <Button
                        block
                        icon={<ThunderboltOutlined />}
                        onClick={() => {
                          setSelectedCandidateForAI(null);
                          setAiGeneratorVisible(true);
                        }}
                        style={{ 
                          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          color: "white",
                          border: "none"
                        }}
                      >
                        Generate AI Questions
                      </Button>
                      <Button
                        type="default"
                        block
                        icon={<CalendarOutlined />}
                        onClick={() => router.push(`/meeting/${jobId}`)}
                      >
                        Manage Meetings
                      </Button>
                    </Space>
                  </div>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </div>

      {/* Create Interview Modal */}
      <Modal
        title="Create New Interview"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          setSelectedResume(null);
        }}
        footer={null}
        width={800}
      >
        <InterviewForm
          jobId={jobId}
          resumeId={selectedResume?.id}
          onSuccess={handleCreateSuccess}
          onCancel={() => {
            setCreateModalVisible(false);
            setSelectedResume(null);
          }}
        />
      </Modal>

      {/* AI Question Generator Modal */}
      <AIQuestionGenerator
        visible={aiGeneratorVisible}
        onClose={() => {
          setAiGeneratorVisible(false);
          setSelectedCandidateForAI(null);
        }}
        jobPostId={jobId as string}
        resumeId={selectedCandidateForAI?.id}
        candidateName={selectedCandidateForAI?.candidateName}
        onQuestionsGenerated={(questions) => {
          console.log("Generated AI Questions:", questions);
          message.success(`Successfully generated ${questions.length} AI questions!`);
          // TODO: You can save these questions to database or use them in interview creation
        }}
      />
    </AppLayout>
  );
}
