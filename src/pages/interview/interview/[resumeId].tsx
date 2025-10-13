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
  Divider,
} from "antd";
import { useState, useEffect } from "react";
import {
  LoginOutlined,
  PlayCircleOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import MCQManager from "@/components/interview/MCQManager";
import InterviewTaker from "@/components/interview/InterviewTaker";
import { Interview, InterviewStatus, ShortlistStatus } from "@/types/interview";
import dayjs from "dayjs";

export default function InterviewDetailPage() {
  const router = useRouter();
  const { resumeId } = router.query as { resumeId?: string };
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string>("");
  const [takeInterviewModal, setTakeInterviewModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (resumeId) {
      fetchInterviewData();
    }
  }, [resumeId, refreshKey]);

  const fetchInterviewData = async () => {
    try {
      setLoading(true);
      setAuthError("");

      const token = localStorage.getItem("token");
      if (!token) {
        setAuthError("Please log in to access this page");
        setLoading(false);
        return;
      }

      // Fetch interview by resume ID
      const response = await fetch(`/api/interviews?resumeId=${resumeId}`, {
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
        throw new Error(`Failed to fetch interview data: ${response.status}`);
      }

      const data = await response.json();
      if (data.interviews && data.interviews.length > 0) {
        setInterview(data.interviews[0]);
      } else {
        message.error("No interview found for this candidate");
        router.back();
      }
    } catch (error) {
      console.error("Error fetching interview data:", error);
      message.error("Failed to load interview data");
    } finally {
      setLoading(false);
    }
  };

  const handleTakeInterview = () => {
    setTakeInterviewModal(true);
  };

  const handleInterviewComplete = (result: any) => {
    setTakeInterviewModal(false);
    setRefreshKey((prev) => prev + 1);
    message.success("Interview completed successfully!");
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

  const getShortlistColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "shortlisted":
        return "green";
      case "rejected":
        return "red";
      case "not_shortlisted":
        return "default";
      default:
        return "default";
    }
  };

  // Show authentication error
  if (authError) {
    return (
      <AppLayout title="Interview Details" subtitle="Authentication Required">
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
      <AppLayout title="Interview Details" subtitle="Loading interview data...">
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Spin size="large" />
        </div>
      </AppLayout>
    );
  }

  if (!interview) {
    return (
      <AppLayout title="Interview Details" subtitle="Interview not found">
        <Alert
          message="No Interview Found"
          description="No interview found for this candidate."
          type="warning"
          showIcon
          style={{ margin: "20px 0" }}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={`Interview: ${interview.title}`}
      subtitle={`${interview.resume?.candidateName} - ${interview.jobPost?.jobTitle}`}
    >
      <Row gutter={[16, 16]}>
        {/* Interview Overview */}
        <Col span={24}>
          <Card title="Interview Overview">
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <div>
                  <strong>Candidate:</strong>
                  <div style={{ marginTop: "4px" }}>
                    {interview.resume?.candidateName}
                  </div>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    {interview.resume?.candidateEmail}
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div>
                  <strong>Job Position:</strong>
                  <div style={{ marginTop: "4px" }}>
                    {interview.jobPost?.jobTitle}
                  </div>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    {interview.jobPost?.companyName}
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div>
                  <strong>Interviewer:</strong>
                  <div style={{ marginTop: "4px" }}>
                    {interview.interviewer?.name}
                  </div>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    {interview.interviewer?.email}
                  </div>
                </div>
              </Col>
            </Row>

            <Divider />

            <Row gutter={[16, 16]}>
              <Col span={6}>
                <div>
                  <strong>Status:</strong>
                  <div style={{ marginTop: "4px" }}>
                    <Tag color={getStatusColor(interview.status)}>
                      {interview.status}
                    </Tag>
                  </div>
                </div>
              </Col>
              <Col span={6}>
                <div>
                  <strong>Score:</strong>
                  <div style={{ marginTop: "4px" }}>
                    {interview.percentage ? (
                      <Tag
                        color={
                          interview.percentage >= 80
                            ? "green"
                            : interview.percentage >= 60
                            ? "orange"
                            : "red"
                        }
                      >
                        {interview.percentage.toFixed(1)}%
                      </Tag>
                    ) : (
                      <span style={{ color: "#999" }}>Not scored</span>
                    )}
                  </div>
                </div>
              </Col>
              <Col span={6}>
                <div>
                  <strong>Shortlist Status:</strong>
                  <div style={{ marginTop: "4px" }}>
                    <Tag
                      color={getShortlistColor(
                        interview.shortlistStatus || "not_shortlisted"
                      )}
                    >
                      {interview.shortlistStatus || "Not Set"}
                    </Tag>
                  </div>
                </div>
              </Col>
              <Col span={6}>
                <div>
                  <strong>Completed At:</strong>
                  <div style={{ marginTop: "4px", fontSize: "12px" }}>
                    {interview.sessionEnd
                      ? dayjs(interview.sessionEnd).format("MMM DD, YYYY HH:mm")
                      : "Not completed"}
                  </div>
                </div>
              </Col>
            </Row>

            {interview.notes && (
              <>
                <Divider />
                <div>
                  <strong>Notes:</strong>
                  <div style={{ marginTop: "4px" }}>{interview.notes}</div>
                </div>
              </>
            )}
          </Card>
        </Col>

        {/* MCQ Questions Management */}
        <Col span={24}>
          <Card
            title="MCQ Questions"
            extra={
              <Space>
                {interview.status === "PENDING" && (
                  <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    onClick={handleTakeInterview}
                  >
                    Take Interview
                  </Button>
                )}
                <Button onClick={() => router.back()}>
                  Back to Candidates
                </Button>
              </Space>
            }
          >
            <MCQManager
              interviewId={interview.id}
              onQuestionsChange={() => setRefreshKey((prev) => prev + 1)}
            />
          </Card>
        </Col>
      </Row>

      {/* Take Interview Modal */}
      <Modal
        title="Take Interview"
        open={takeInterviewModal}
        onCancel={() => setTakeInterviewModal(false)}
        footer={null}
        width={1000}
        destroyOnClose
      >
        <InterviewTaker
          interviewId={interview.id}
          onComplete={handleInterviewComplete}
          onExit={() => setTakeInterviewModal(false)}
        />
      </Modal>
    </AppLayout>
  );
}
