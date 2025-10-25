import { useState, useEffect } from "react";
import type { ColumnsType } from "antd/es/table";
import {
  Table,
  Space,
  Button,
  Modal,
  message,
  Tag,
  Card,
  Spin,
  Row,
  Col,
  Statistic,
  Tooltip,
  Checkbox,
  Select,
  Input,
  Drawer,
  Divider,
} from "antd";
import {
  EyeOutlined,
  SendOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  StarOutlined,
  QuestionCircleOutlined,
  RobotOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  PlusOutlined,
  DatabaseOutlined,
  BookOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import MCQCreator from "./MCQCreator";
import SavedMCQModal from "./SavedMCQModal";

export type ResumeRow = {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  experienceYears: number;
  matchScore: number;
  status: string;
  createdAt: string;
  skills: string[];
  education: string;
  currentPosition?: string;
  currentCompany?: string;
  expectedSalary?: number;
  noticePeriod?: string;
  resumeUrl?: string;
  assessmentStages?: {
    id: string;
    type: string;
    status: string;
    resultScore?: number;
    scheduledAt?: string;
  }[];
};

type MCQQuestion = {
  value: string;
  label: string;
  question: string;
  options: string[];
  correctAnswer: string;
  topic: string;
  difficulty: string;
  createdAt: string;
};

interface JobResumeManagerProps {
  jobId: string;
  mode: "mcq" | "avatar" | "manual";
}

export default function JobResumeManager({
  jobId,
  mode,
}: JobResumeManagerProps) {
  const [loading, setLoading] = useState(false);
  const [resumes, setResumes] = useState<ResumeRow[]>([]);
  const [selectedResumes, setSelectedResumes] = useState<string[]>([]);
  const [sendModalVisible, setSendModalVisible] = useState(false);
  const [assessmentType, setAssessmentType] = useState<string>(mode);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [jobDetails, setJobDetails] = useState<any>(null);
  const [stats, setStats] = useState({
    totalResumes: 0,
    completedAssessments: 0,
    pendingAssessments: 0,
    inProgressAssessments: 0,
  });
  const [mcqCreatorVisible, setMcqCreatorVisible] = useState(false);
  const [savedMCQModalVisible, setSavedMCQModalVisible] = useState(false);
  const [mcqQuestions, setMcqQuestions] = useState<MCQQuestion[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const router = useRouter();

  // Fetch MCQ templates for dropdown
  const fetchMCQTemplates = async () => {
    if (mode !== "mcq") return;

    setLoadingTemplates(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/interview/templates-dropdown", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("MCQ Questions loaded:", data.options);
        setMcqQuestions(data.options || []);
      } else {
        const errorData = await response.json();
        console.error("Failed to load MCQ questions:", errorData);
        message.error("Failed to load MCQ questions");
      }
    } catch (error) {
      console.error("Error fetching MCQ templates:", error);
      message.error("Failed to load MCQ templates");
    } finally {
      setLoadingTemplates(false);
    }
  };

  const fetchJobAndResumes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      // Fetch job details
      const jobResponse = await fetch(`/api/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (jobResponse.ok) {
        const jobData = await jobResponse.json();
        setJobDetails(jobData.jobPost);
      }

      // Fetch resumes for this job
      const resumeResponse = await fetch(`/api/jobs/${jobId}/resumes`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (resumeResponse.ok) {
        const resumeData = await resumeResponse.json();
        setResumes(resumeData.resumes || []);

        // Calculate stats
        const totalResumes = resumeData.resumes?.length || 0;
        const completedAssessments =
          resumeData.resumes?.filter((r: ResumeRow) =>
            r.assessmentStages?.some(
              (stage) => stage.type === mode && stage.status === "COMPLETED"
            )
          ).length || 0;
        const pendingAssessments =
          resumeData.resumes?.filter((r: ResumeRow) =>
            r.assessmentStages?.some(
              (stage) => stage.type === mode && stage.status === "PENDING"
            )
          ).length || 0;
        const inProgressAssessments =
          resumeData.resumes?.filter((r: ResumeRow) =>
            r.assessmentStages?.some(
              (stage) => stage.type === mode && stage.status === "IN_PROGRESS"
            )
          ).length || 0;

        setStats({
          totalResumes,
          completedAssessments,
          pendingAssessments,
          inProgressAssessments,
        });
      } else {
        message.error("Failed to fetch resumes");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) {
      fetchJobAndResumes();
      fetchMCQTemplates();
    }
  }, [jobId, mode]);

  const getModeTitle = () => {
    switch (mode) {
      case "mcq":
        return "MCQ Tests";
      case "avatar":
        return "AI Interviews";
      case "manual":
        return "Manual Meetings";
    }
  };

  const getModeIcon = () => {
    switch (mode) {
      case "mcq":
        return <QuestionCircleOutlined />;
      case "avatar":
        return <RobotOutlined />;
      case "manual":
        return <TeamOutlined />;
    }
  };

  const getAssessmentStatus = (resume: ResumeRow) => {
    const assessment = resume.assessmentStages?.find(
      (stage) => stage.type === mode.toUpperCase()
    );
    if (!assessment) return { status: "NOT_ASSIGNED", score: null };
    return { status: assessment.status, score: assessment.resultScore };
  };

  const getStatusTag = (status: string, score?: number | null) => {
    const statusConfig = {
      NOT_ASSIGNED: {
        color: "default",
        text: "Not Assigned",
        icon: <ClockCircleOutlined />,
      },
      PENDING: {
        color: "orange",
        text: "Pending",
        icon: <ClockCircleOutlined />,
      },
      IN_PROGRESS: {
        color: "blue",
        text: "In Progress",
        icon: <ClockCircleOutlined />,
      },
      COMPLETED: {
        color: "green",
        text: score ? `${score.toFixed(1)}%` : "Completed",
        icon: <CheckCircleOutlined />,
      },
      CANCELLED: {
        color: "red",
        text: "Cancelled",
        icon: <ClockCircleOutlined />,
      },
    };
    const config =
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig.NOT_ASSIGNED;
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  const handleSelectResume = (resumeId: string, checked: boolean) => {
    if (checked) {
      setSelectedResumes([...selectedResumes, resumeId]);
    } else {
      setSelectedResumes(selectedResumes.filter((id) => id !== resumeId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedResumes(resumes.map((r) => r.id));
    } else {
      setSelectedResumes([]);
    }
  };

  const handleSendAssessment = async () => {
    if (selectedResumes.length === 0) {
      message.warning("Please select at least one candidate");
      return;
    }

    setBulkActionLoading(true);
    try {
      const token = localStorage.getItem("token");

      // Create assessment stages for selected resumes
      const promises = selectedResumes.map((resumeId) =>
        fetch("/api/assessments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: assessmentType.toUpperCase(),
            jobPostId: jobId,
            resumeId,
            status: "PENDING",
            scheduledAt: new Date().toISOString(),
          }),
        })
      );

      await Promise.all(promises);

      message.success(
        `Assessment invitations sent to ${selectedResumes.length} candidates`
      );
      setSelectedResumes([]);
      setSendModalVisible(false);
      fetchJobAndResumes();
    } catch (error) {
      console.error("Error sending assessments:", error);
      message.error("Failed to send assessment invitations");
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Send MCQ to individual candidate
  const handleSendMCQToCandidate = async (
    candidate: ResumeRow,
    questionId: string
  ) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/interview/send-mcq-simple", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          candidateEmail: candidate.candidateEmail,
          candidateName: candidate.candidateName,
          questionId: questionId,
          message: `Hi ${candidate.candidateName}! Please complete this technical assessment.`,
          duration: 30,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.emailSent) {
          message.success(
            `MCQ sent successfully to ${candidate.candidateName}`
          );
        } else {
          message.warning(
            `MCQ created but email failed to send to ${candidate.candidateName}`
          );
        }
      } else {
        const error = await response.json();
        message.error(error.error || "Failed to send MCQ");
      }
    } catch (error) {
      console.error("Error sending MCQ:", error);
      message.error("Failed to send MCQ to candidate");
    }
  };

  const columns: ColumnsType<ResumeRow> = [
    {
      title: (
        <Checkbox
          checked={
            selectedResumes.length === resumes.length && resumes.length > 0
          }
          indeterminate={
            selectedResumes.length > 0 &&
            selectedResumes.length < resumes.length
          }
          onChange={(e) => handleSelectAll(e.target.checked)}
        />
      ),
      key: "select",
      width: 50,
      render: (_, record) => (
        <Checkbox
          checked={selectedResumes.includes(record.id)}
          onChange={(e) => handleSelectResume(record.id, e.target.checked)}
        />
      ),
    },
    {
      title: "Candidate",
      key: "candidate",
      render: (_, record) => (
        <div>
          <div
            style={{
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <UserOutlined />
            {record.candidateName}
          </div>
          <div style={{ fontSize: "12px", color: "#666", marginTop: 2 }}>
            <MailOutlined style={{ marginRight: 4 }} />
            {record.candidateEmail}
          </div>
          {record.candidatePhone && (
            <div style={{ fontSize: "12px", color: "#666" }}>
              <PhoneOutlined style={{ marginRight: 4 }} />
              {record.candidatePhone}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Experience",
      dataIndex: "experienceYears",
      key: "experience",
      width: 100,
      align: "center" as const,
      render: (years) => (
        <div
          style={{
            wordWrap: "break-word",
            wordBreak: "break-word",
            whiteSpace: "normal",
            textAlign: "center",
            fontSize: "12px",
          }}
        >
          <StarOutlined style={{ color: "#faad14", marginRight: 4 }} />
          {years} years
        </div>
      ),
    },
    {
      title: "Match Score",
      dataIndex: "matchScore",
      key: "matchScore",
      render: (score) => (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "16px",
              fontWeight: 500,
              color:
                score >= 80 ? "#52c41a" : score >= 60 ? "#faad14" : "#ff4d4f",
            }}
          >
            {score.toFixed(1)}%
          </div>
        </div>
      ),
    },
    {
      title: "Skills",
      dataIndex: "skills",
      key: "skills",
      render: (skills) => (
        <div>
          {skills?.slice(0, 3).map((skill: string) => (
            <Tag key={skill} style={{ marginBottom: 2 }}>
              {skill}
            </Tag>
          ))}
          {skills?.length > 3 && (
            <Tag style={{ marginBottom: 2 }}>+{skills.length - 3} more</Tag>
          )}
        </div>
      ),
    },
    {
      title: `${getModeTitle()} Status`,
      key: "assessmentStatus",
      render: (_, record) => {
        const { status, score } = getAssessmentStatus(record);
        return getStatusTag(status, score);
      },
    },
    ...(mode === "mcq"
      ? [
          {
            title: "MCQ Set",
            key: "mcqSet",
            width: 200,
            render: (_: any, record: any) => (
              <Space.Compact style={{ width: "100%" }}>
                <Select
                  placeholder={
                    mcqQuestions.length === 0
                      ? "No MCQ questions"
                      : "Select MCQ Question"
                  }
                  style={{ width: "70%" }}
                  loading={loadingTemplates}
                  options={mcqQuestions}
                  size="small"
                  disabled={mcqQuestions.length === 0}
                  onSelect={(questionId) =>
                    handleSendMCQToCandidate(record, questionId)
                  }
                />
                <Tooltip title="Send MCQ">
                  <Button
                    type="primary"
                    size="small"
                    icon={<BookOutlined />}
                    style={{ width: "30%" }}
                    onClick={() => {
                      // This will be handled by the onSelect above
                    }}
                  />
                </Tooltip>
              </Space.Compact>
            ),
          },
        ]
      : []),
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => {
        const { status } = getAssessmentStatus(record);
        return (
          <Space>
            <Tooltip title="View Resume">
              <Button
                type="text"
                icon={<EyeOutlined />}
                size="small"
                onClick={async () => {
                  try {
                    const token = localStorage.getItem("token");

                    if (!token) {
                      alert("Please log in to access CV files.");
                      return;
                    }

                    const response = await fetch(
                      `/api/resumes/${record.id}/presigned-url`,
                      {
                        headers: { Authorization: `Bearer ${token}` },
                      }
                    );

                    if (response.ok) {
                      const data = await response.json();
                      window.open(
                        data.presignedUrl,
                        "_blank",
                        "noopener,noreferrer"
                      );
                    } else if (response.status === 401) {
                      alert("Please log in to access CV files.");
                    } else if (response.status === 403) {
                      alert("You don't have permission to access this CV.");
                    } else {
                      // Show specific error message
                      const errorData = await response.json();
                      console.error(
                        "Failed to get fresh presigned URL:",
                        errorData
                      );

                      if (errorData.error === "S3 configuration error") {
                        alert(
                          "CV access is temporarily unavailable due to server configuration. Please contact support."
                        );
                      } else {
                        alert(
                          "Unable to access CV. Please try again or contact support."
                        );
                      }
                    }
                  } catch (error) {
                    console.error("Error getting fresh URL:", error);
                    // Show error message instead of using expired URL
                    alert(
                      "Unable to access CV. Please try again or contact support."
                    );
                  }
                }}
              />
            </Tooltip>
            {status === "NOT_ASSIGNED" && (
              <Tooltip title={`Send ${getModeTitle()} Invitation`}>
                <Button
                  type="primary"
                  size="small"
                  icon={<SendOutlined />}
                  onClick={() => {
                    setSelectedResumes([record.id]);
                    setSendModalVisible(true);
                  }}
                >
                  Send
                </Button>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ background: "#f5f5f5", minHeight: "100vh" }}>
      {/* Header */}
      <Card style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {getModeIcon()}
              {getModeTitle()} - {jobDetails?.jobTitle}
            </h2>
            <p style={{ margin: "4px 0 0 0", color: "#666" }}>
              {jobDetails?.company} • {jobDetails?.location}
            </p>
          </div>
          <Space>
            <Button onClick={fetchJobAndResumes} loading={loading}>
              Refresh
            </Button>
            {mode === "mcq" && (
              <>
                <Button
                  icon={<PlusOutlined />}
                  onClick={() => setMcqCreatorVisible(true)}
                >
                  Create MCQ
                </Button>
                <Button
                  icon={<DatabaseOutlined />}
                  onClick={() => setSavedMCQModalVisible(true)}
                >
                  Saved MCQs
                </Button>
              </>
            )}
            <Button
              type="primary"
              icon={<SendOutlined />}
              disabled={selectedResumes.length === 0}
              onClick={() => setSendModalVisible(true)}
            >
              Send to Selected ({selectedResumes.length})
            </Button>
          </Space>
        </div>
      </Card>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Candidates"
              value={stats.totalResumes}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Completed"
              value={stats.completedAssessments}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="In Progress"
              value={stats.inProgressAssessments}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending"
              value={stats.pendingAssessments}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Resumes Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={resumes}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} candidates`,
          }}
        />
      </Card>

      {/* Send Assessment Modal */}
      <Modal
        title={`Send ${getModeTitle()} Invitations`}
        open={sendModalVisible}
        onOk={handleSendAssessment}
        onCancel={() => setSendModalVisible(false)}
        confirmLoading={bulkActionLoading}
        okText={`Send to ${selectedResumes.length} Candidates`}
      >
        <div>
          <p>
            You are about to send <strong>{getModeTitle()}</strong> invitations
            to <strong>{selectedResumes.length}</strong> selected candidates.
          </p>
          <Divider />
          <div>
            <label>Assessment Type:</label>
            <Select
              value={assessmentType}
              onChange={setAssessmentType}
              style={{ width: "100%", marginTop: 8 }}
              options={[
                { value: "MCQ", label: "MCQ Test" },
                { value: "AVATAR", label: "AI Interview" },
                { value: "MANUAL", label: "Manual Meeting" },
              ]}
            />
          </div>
          <Divider />
          <div>
            <p>Selected candidates:</p>
            <div style={{ maxHeight: 200, overflowY: "auto" }}>
              {selectedResumes.map((resumeId) => {
                const resume = resumes.find((r) => r.id === resumeId);
                return (
                  <div key={resumeId} style={{ padding: "4px 0" }}>
                    • {resume?.candidateName} ({resume?.candidateEmail})
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>

      {/* MCQ Creator Modal */}
      {mode === "mcq" && (
        <Modal
          title="Create MCQ Template"
          open={mcqCreatorVisible}
          onCancel={() => setMcqCreatorVisible(false)}
          width={1000}
          footer={null}
        >
          <MCQCreator
            onSave={() => {
              setMcqCreatorVisible(false);
              message.success("MCQ template created successfully!");
            }}
            onSend={() => {
              setMcqCreatorVisible(false);
              message.success("MCQ template ready for sending!");
            }}
          />
        </Modal>
      )}

      {/* Saved MCQ Modal */}
      {mode === "mcq" && (
        <SavedMCQModal
          visible={savedMCQModalVisible}
          onClose={() => setSavedMCQModalVisible(false)}
          onSelectTemplate={(template) => {
            setSavedMCQModalVisible(false);
            // TODO: Implement template selection for sending
            message.success(`Selected template: ${template.title}`);
          }}
          jobId={jobId}
        />
      )}
    </div>
  );
}
