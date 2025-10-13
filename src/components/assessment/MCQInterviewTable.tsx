import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Tag,
  Button,
  Space,
  message,
  Tooltip,
  Row,
  Col,
  Statistic,
  Alert,
  Modal,
  Typography,
  Divider,
} from "antd";
import {
  EyeOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  FileTextOutlined,
  TrophyOutlined,
  MailOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Text, Title } = Typography;

interface MCQInterview {
  id: string;
  title: string;
  description?: string;
  duration: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  attempted: boolean;
  sessionStart?: string;
  sessionEnd?: string;
  candidateEmail?: string;
  sessionPassword?: string;
  createdAt: string;
  updatedAt: string;
  jobPost: {
    id: string;
    jobTitle: string;
    companyName: string;
    location: string;
  };
  resume: {
    id: string;
    candidateName: string;
    candidateEmail: string;
    candidatePhone?: string;
    matchScore?: number;
    experienceYears?: number;
  };
  user: {
    id: number;
    name: string;
    email: string;
  };
  questions: Array<{
    id: string;
    type: string;
    question: string;
    options?: any;
    correct: any;
    points: number;
    order: number;
  }>;
  interviewAttempts: Array<{
    id: string;
    status:
      | "IN_PROGRESS"
      | "COMPLETED"
      | "SUBMITTED"
      | "EXPIRED"
      | "TERMINATED";
    startedAt: string;
    submittedAt?: string;
    completedAt?: string;
    timeSpent?: number;
    score?: number;
    maxScore?: number;
    violations: number;
  }>;
}

interface MCQInterviewTableProps {
  onInterviewSelect?: (interview: MCQInterview) => void;
  onRefresh?: () => void;
}

const MCQInterviewTable: React.FC<MCQInterviewTableProps> = ({
  onInterviewSelect,
  onRefresh,
}) => {
  const [interviews, setInterviews] = useState<MCQInterview[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [selectedInterview, setSelectedInterview] =
    useState<MCQInterview | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  useEffect(() => {
    fetchInterviews();
  }, [pagination.page, pagination.limit]);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      console.log("🔑 Token:", token ? "Found" : "Missing");

      const response = await fetch(
        `/api/interviews?page=${pagination.page}&limit=${pagination.limit}&includeQuestions=true`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        throw new Error(`Failed to fetch interviews: ${response.status}`);
      }

      const data = await response.json();
      console.log("📊 API Response:", data); // Debug log
      setInterviews(data.interviews || []);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination?.total || 0,
        pages: data.pagination?.pages || 0,
      }));
    } catch (error) {
      console.error("Error fetching interviews:", error);
      message.error(
        `Failed to fetch interviews: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (pagination: any) => {
    setPagination((prev) => ({
      ...prev,
      page: pagination.current,
      limit: pagination.pageSize,
    }));
  };

  const handleViewDetails = (interview: MCQInterview) => {
    setSelectedInterview(interview);
    setDetailModalVisible(true);
  };

  const handleTakeInterview = (interview: MCQInterview) => {
    // Redirect to external examination platform
    window.open(`https://exam.synchro-hire.com/`, "_blank");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "default";
      case "PUBLISHED":
        return "processing";
      case "ARCHIVED":
        return "error";
      default:
        return "default";
    }
  };

  const getAttemptStatusColor = (status: string) => {
    switch (status) {
      case "IN_PROGRESS":
        return "processing";
      case "COMPLETED":
        return "success";
      case "SUBMITTED":
        return "success";
      case "EXPIRED":
        return "error";
      case "TERMINATED":
        return "error";
      default:
        return "default";
    }
  };

  const columns = [
    {
      title: "Candidate",
      key: "candidate",
      width: 200,
      render: (_: any, record: MCQInterview) => (
        <div>
          <div style={{ fontWeight: "bold", fontSize: "13px" }}>
            {record.resume?.candidateName || "Unknown"}
          </div>
          <div style={{ fontSize: "11px", color: "#666" }}>
            {record.resume?.candidateEmail ||
              record.candidateEmail ||
              "No email"}
          </div>
          {record.resume?.matchScore && (
            <div style={{ fontSize: "11px", color: "#1890ff" }}>
              Match: {record.resume.matchScore}%
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Job Position",
      key: "job",
      width: 180,
      render: (_: any, record: MCQInterview) => (
        <div>
          <div style={{ fontWeight: "bold", fontSize: "12px" }}>
            {record.jobPost?.jobTitle || "Unknown Job"}
          </div>
          <div style={{ fontSize: "11px", color: "#666" }}>
            {record.jobPost?.companyName || "Unknown Company"}
          </div>
        </div>
      ),
    },
    {
      title: "Interview Details",
      key: "details",
      width: 200,
      render: (_: any, record: MCQInterview) => (
        <div>
          <div style={{ fontSize: "12px", fontWeight: "bold" }}>
            {record.title}
          </div>
          <div style={{ fontSize: "11px", color: "#666" }}>
            Duration: {record.duration} min
          </div>
          <div style={{ fontSize: "11px", color: "#666" }}>
            Questions: {record.questions?.length || 0}
          </div>
        </div>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 120,
      render: (_: any, record: MCQInterview) => (
        <div>
          <Tag color={getStatusColor(record.status)}>
            {record.status.replace("_", " ")}
          </Tag>
          {record.attempted && record.interviewAttempts.length > 0 && (
            <div style={{ marginTop: 4 }}>
              <Tag
                color={getAttemptStatusColor(
                  record.interviewAttempts[0].status
                )}
              >
                {record.interviewAttempts[0].status.replace("_", " ")}
              </Tag>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Performance",
      key: "performance",
      width: 150,
      render: (_: any, record: MCQInterview) => {
        const attempt = record.interviewAttempts[0];
        if (!attempt || attempt.status !== "COMPLETED") {
          return (
            <div style={{ color: "#999", fontSize: "12px" }}>
              {attempt?.status === "IN_PROGRESS"
                ? "In Progress"
                : "Not Started"}
            </div>
          );
        }

        const score = attempt.score || 0;
        const maxScore = attempt.maxScore || record.questions.length;
        const percentage =
          maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

        return (
          <div>
            <div
              style={{
                fontWeight: "bold",
                color:
                  percentage >= 70
                    ? "#52c41a"
                    : percentage >= 50
                    ? "#faad14"
                    : "#ff4d4f",
              }}
            >
              {percentage}%
            </div>
            <div style={{ fontSize: "11px", color: "#666" }}>
              {score}/{maxScore} points
            </div>
            {attempt.timeSpent && (
              <div style={{ fontSize: "11px", color: "#666" }}>
                Time: {Math.round(attempt.timeSpent / 60)}m
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Created",
      key: "created",
      width: 120,
      render: (_: any, record: MCQInterview) => (
        <div style={{ fontSize: "12px" }}>
          {dayjs(record.createdAt).format("MMM DD, YYYY")}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_: any, record: MCQInterview) => {
        const attempt = record.interviewAttempts[0];
        const canTakeInterview =
          record.status === "PUBLISHED" && attempt?.status === "IN_PROGRESS";

        return (
          <Space size="small">
            <Tooltip title="View Details">
              <Button
                type="text"
                icon={<EyeOutlined />}
                size="small"
                onClick={() => handleViewDetails(record)}
              />
            </Tooltip>
            {canTakeInterview && (
              <Tooltip title="Take Interview">
                <Button
                  type="text"
                  icon={<PlayCircleOutlined />}
                  size="small"
                  onClick={() => handleTakeInterview(record)}
                />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  const renderInterviewDetails = () => {
    if (!selectedInterview) return null;

    const attempt = selectedInterview.interviewAttempts[0];

    return (
      <Modal
        title="Interview Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Title level={5}>
              <UserOutlined /> Candidate Information
            </Title>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Name:</Text>{" "}
              {selectedInterview.resume?.candidateName || "Unknown"}
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Email:</Text>{" "}
              {selectedInterview.resume?.candidateEmail ||
                selectedInterview.candidateEmail ||
                "No email"}
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Phone:</Text>{" "}
              {selectedInterview.resume?.candidatePhone || "Not provided"}
            </div>
            {selectedInterview.resume?.matchScore && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>Match Score:</Text>{" "}
                {selectedInterview.resume.matchScore}%
              </div>
            )}
          </Col>

          <Col span={12}>
            <Title level={5}>
              <FileTextOutlined /> Job Information
            </Title>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Position:</Text>{" "}
              {selectedInterview.jobPost?.jobTitle || "Unknown"}
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Company:</Text>{" "}
              {selectedInterview.jobPost?.companyName || "Unknown"}
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Location:</Text>{" "}
              {selectedInterview.jobPost?.location || "Not specified"}
            </div>
          </Col>

          <Col span={24}>
            <Divider />
            <Title level={5}>
              <TrophyOutlined /> Assessment Details
            </Title>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Statistic
                  title="Status"
                  value={selectedInterview.status}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Duration"
                  value={selectedInterview.duration}
                  suffix="minutes"
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Questions"
                  value={selectedInterview.questions?.length || 0}
                />
              </Col>
            </Row>
          </Col>

          {attempt && (
            <Col span={24}>
              <Divider />
              <Title level={5}>
                <TrophyOutlined /> Attempt Results
              </Title>
              <Row gutter={[16, 16]}>
                <Col span={6}>
                  <Statistic
                    title="Status"
                    value={attempt.status}
                    prefix={<ClockCircleOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Score"
                    value={attempt.score || 0}
                    suffix={`/ ${
                      attempt.maxScore || selectedInterview.questions.length
                    }`}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Percentage"
                    value={
                      attempt.maxScore
                        ? Math.round(
                            ((attempt.score || 0) / attempt.maxScore) * 100
                          )
                        : 0
                    }
                    suffix="%"
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Time Spent"
                    value={
                      attempt.timeSpent ? Math.round(attempt.timeSpent / 60) : 0
                    }
                    suffix="minutes"
                  />
                </Col>
              </Row>
              {attempt.submittedAt && (
                <div style={{ marginTop: 16 }}>
                  <Text strong>Submitted At:</Text>{" "}
                  {dayjs(attempt.submittedAt).format("MMM DD, YYYY HH:mm")}
                </div>
              )}
            </Col>
          )}

          {selectedInterview.sessionPassword && (
            <Col span={24}>
              <Divider />
              <Alert
                message="Session Information"
                description={
                  <div>
                    <div>
                      <Text strong>Session Password:</Text>{" "}
                      {selectedInterview.sessionPassword}
                    </div>
                    <div>
                      <Text strong>Test Link:</Text>{" "}
                      https://exam.synchro-hire.com/
                    </div>
                  </div>
                }
                type="info"
                showIcon
              />
            </Col>
          )}
        </Row>
      </Modal>
    );
  };

  return (
    <>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Title level={4}>
            <FileTextOutlined /> MCQ Interviews Overview
          </Title>
          <Text type="secondary">
            Monitor MCQ assessments and track candidate progress
          </Text>
        </div>

        {interviews.length === 0 && !loading ? (
          <div style={{ textAlign: "center", padding: "50px" }}>
            <div
              style={{ fontSize: "16px", color: "#999", marginBottom: "16px" }}
            >
              📝 No MCQ interviews found
            </div>
            <div style={{ color: "#666" }}>
              Create your first MCQ assessment by clicking "Create New MCQ Test"
              above
            </div>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={interviews}
            loading={loading}
            rowKey="id"
            pagination={{
              current: pagination.page,
              pageSize: pagination.limit,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} interviews`,
            }}
            onChange={handleTableChange}
            scroll={{ x: 1200 }}
          />
        )}
      </Card>

      {renderInterviewDetails()}
    </>
  );
};

export default MCQInterviewTable;
