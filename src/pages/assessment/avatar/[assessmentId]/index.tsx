import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AppLayout from "@/components/layout/AppLayout";
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Spin,
  message,
  Tabs,
  List,
  Empty,
  Modal,
  Progress,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  VideoCameraOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  RobotOutlined,
  DownloadOutlined,
  SendOutlined,
  ThunderboltOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import RecordingUploader from "@/components/interview/RecordingUploader";
import AIAnalysisViewer from "@/components/interview/AIAnalysisViewer";

const { TabPane } = Tabs;

export default function AvatarInterviewDetailPage() {
  const router = useRouter();
  const { assessmentId } = router.query;
  const [loading, setLoading] = useState(true);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [interview, setInterview] = useState<any>(null);

  useEffect(() => {
    if (assessmentId) {
      fetchInterviewDetails();
    }
  }, [assessmentId]);

  const fetchInterviewDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/assessments/${assessmentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInterview(data.assessmentStage);
      } else {
        message.error("Failed to load interview details");
        router.push("/assessment/avatar");
      }
    } catch (error) {
      console.error("Error fetching interview:", error);
      message.error("Error loading interview details");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: "Delete AI Interview",
      content:
        "Are you sure you want to delete this interview? This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          const token = localStorage.getItem("token");
          const response = await fetch(`/api/assessments/${assessmentId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            message.success("Interview deleted successfully");
            router.push("/assessment/avatar");
          } else {
            message.error("Failed to delete interview");
          }
        } catch (error) {
          console.error("Error deleting interview:", error);
          message.error("Error deleting interview");
        }
      },
    });
  };

  const handleSendInvite = async () => {
    setInviteLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/assessments/avatar/${assessmentId}/send-invite`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        },
      );
      if (response.ok) {
        const data = await response.json();
        setInviteEmail(data.sentTo || "");
        setInviteModalVisible(true);
      } else {
        message.error("Failed to send invitation");
      }
    } catch (error) {
      console.error("Error sending invite:", error);
      message.error("Error sending invitation");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setInviteLoading(true);
    Modal.confirm({
      title: "Run AI Analysis",
      content: "This will analyze the interview recordings using AI. Continue?",
      okText: "Analyze",
      onOk: async () => {
        try {
          const token = localStorage.getItem("token");
          const response = await fetch(
            `/api/assessments/avatar/${assessmentId}/analyze`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );
          if (response.ok) {
            message.success("AI analysis completed successfully");
            fetchInterviewDetails();
          } else {
            message.error("Failed to analyze interview");
          }
        } catch (error) {
          console.error("Error analyzing interview:", error);
          message.error("Error analyzing interview");
        }
      },
    });
  };

  const copyInterviewLink = () => {
    const link = `${window.location.origin}/assessment/avatar/${assessmentId}/take`;
    navigator.clipboard.writeText(link);
    message.success("Interview link copied to clipboard");
  };

  const getStatusTag = (status: string) => {
    const statusConfig: Record<
      string,
      { color: string; icon: React.ReactNode }
    > = {
      PENDING: { color: "default", icon: <ClockCircleOutlined /> },
      IN_PROGRESS: { color: "processing", icon: <ClockCircleOutlined /> },
      COMPLETED: { color: "success", icon: <CheckCircleOutlined /> },
      CANCELLED: { color: "error", icon: <CloseCircleOutlined /> },
      NO_SHOW: { color: "warning", icon: <CloseCircleOutlined /> },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    return (
      <Tag color={config.color} icon={config.icon}>
        {status.replace("_", " ")}
      </Tag>
    );
  };

  if (loading) {
    return (
      <AppLayout title="AI Interview Details" subtitle="Loading...">
        <div style={{ textAlign: "center", padding: "100px 0" }}>
          <Spin size="large" />
        </div>
      </AppLayout>
    );
  }

  if (!interview) {
    return (
      <AppLayout title="AI Interview Details" subtitle="Not Found">
        <Card>
          <Empty description="Interview not found" />
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <Button
              type="primary"
              onClick={() => router.push("/assessment/avatar")}
            >
              Back to AI Interviews
            </Button>
          </div>
        </Card>
      </AppLayout>
    );
  }

  const { avatarAssessment, jobPost, resume, interviewer } = interview;

  return (
    <AppLayout title="AI Interview Details" subtitle={avatarAssessment.title}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Card>
          <Space style={{ marginBottom: 16, flexWrap: "wrap" }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push("/assessment/avatar")}
            >
              Back
            </Button>
            <Button
              icon={<EditOutlined />}
              type="primary"
              onClick={() =>
                router.push(`/assessment/avatar?edit=${interview.id}`)
              }
            >
              Edit
            </Button>
            <Button
              icon={<SendOutlined />}
              type="default"
              loading={inviteLoading}
              onClick={handleSendInvite}
            >
              Send Invite
            </Button>
            <Modal
              visible={inviteModalVisible}
              onCancel={() => setInviteModalVisible(false)}
              footer={null}
              centered
            >
              <div style={{ textAlign: "center", padding: 24 }}>
                <CheckCircleOutlined
                  style={{ color: "#52c41a", fontSize: 48, marginBottom: 16 }}
                />
                <h2>Invitation Sent!</h2>
                <p>
                  The interview invitation has been sent
                  {inviteEmail ? ` to ${inviteEmail}` : ""}.
                </p>
                <Button
                  type="primary"
                  onClick={() => setInviteModalVisible(false)}
                >
                  OK
                </Button>
              </div>
            </Modal>
            <Button icon={<LinkOutlined />} onClick={copyInterviewLink}>
              Copy Link
            </Button>
            <Button
              icon={<ThunderboltOutlined />}
              type="dashed"
              onClick={handleAnalyze}
              disabled={
                !avatarAssessment.recordings ||
                avatarAssessment.recordings.length === 0
              }
            >
              Run AI Analysis
            </Button>
            <Button icon={<DeleteOutlined />} danger onClick={handleDelete}>
              Delete
            </Button>
          </Space>

          <Descriptions bordered column={2}>
            <Descriptions.Item label="Status" span={2}>
              {getStatusTag(interview.status)}
            </Descriptions.Item>
            <Descriptions.Item label="Candidate">
              <div>
                <div style={{ fontWeight: 600 }}>{resume.candidateName}</div>
                <div style={{ fontSize: "12px", color: "#999" }}>
                  {resume.candidateEmail}
                </div>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Job Position">
              <div>
                <div style={{ fontWeight: 600 }}>{jobPost.jobTitle}</div>
                <div style={{ fontSize: "12px", color: "#999" }}>
                  {jobPost.companyName}
                </div>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Match Score">
              {resume.matchScore ? (
                <Tag
                  color={
                    resume.matchScore >= 80
                      ? "green"
                      : resume.matchScore >= 60
                        ? "orange"
                        : "red"
                  }
                >
                  {resume.matchScore.toFixed(1)}%
                </Tag>
              ) : (
                "N/A"
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Result Score">
              {interview.resultScore ? (
                <div>
                  <Progress
                    percent={interview.resultScore}
                    status={
                      interview.resultScore >= 70
                        ? "success"
                        : interview.resultScore >= 50
                          ? "normal"
                          : "exception"
                    }
                  />
                </div>
              ) : (
                "Not available"
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Interviewer">
              {interviewer
                ? `${interviewer.name} (${interviewer.email})`
                : "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Scheduled At">
              {interview.scheduledAt
                ? dayjs(interview.scheduledAt).format("YYYY-MM-DD HH:mm")
                : "Not scheduled"}
            </Descriptions.Item>
            <Descriptions.Item label="Duration">
              {interview.duration ? `${interview.duration} minutes` : "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Time Limit">
              {avatarAssessment.timeLimit
                ? `${avatarAssessment.timeLimit} minutes`
                : "No limit"}
            </Descriptions.Item>
            <Descriptions.Item label="Completed At">
              {interview.completedAt
                ? dayjs(interview.completedAt).format("YYYY-MM-DD HH:mm")
                : "Not completed"}
            </Descriptions.Item>
            <Descriptions.Item label="Created At">
              {dayjs(interview.createdAt).format("YYYY-MM-DD HH:mm")}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card>
          <Tabs defaultActiveKey="details">
            <TabPane
              tab={
                <span>
                  <FileTextOutlined />
                  Interview Details
                </span>
              }
              key="details"
            >
              <Descriptions bordered column={1}>
                <Descriptions.Item label="Title">
                  {avatarAssessment.title}
                </Descriptions.Item>
                <Descriptions.Item label="Description">
                  {avatarAssessment.description || "No description"}
                </Descriptions.Item>
                <Descriptions.Item label="Avatar Type">
                  <Tag icon={<RobotOutlined />}>
                    {avatarAssessment.avatarType || "Default"}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Recording Enabled">
                  <Tag
                    color={avatarAssessment.recordingEnabled ? "green" : "red"}
                  >
                    {avatarAssessment.recordingEnabled ? "Yes" : "No"}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Interview Script">
                  <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                    {avatarAssessment.interviewScript || "No script provided"}
                  </pre>
                </Descriptions.Item>
                <Descriptions.Item label="Notes">
                  {interview.notes || "No notes"}
                </Descriptions.Item>
              </Descriptions>
            </TabPane>

            <TabPane
              tab={
                <span>
                  <VideoCameraOutlined />
                  Recordings ({avatarAssessment.recordings?.length || 0})
                </span>
              }
              key="recordings"
            >
              {avatarAssessment.recordings &&
              avatarAssessment.recordings.length > 0 ? (
                <List
                  dataSource={avatarAssessment.recordings}
                  renderItem={(recording: any) => (
                    <List.Item
                      actions={[
                        <Button
                          key="download"
                          icon={<DownloadOutlined />}
                          type="link"
                        >
                          Download
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <VideoCameraOutlined style={{ fontSize: 24 }} />
                        }
                        title={recording.filename}
                        description={
                          <Space>
                            {recording.duration && (
                              <Tag>Duration: {recording.duration}s</Tag>
                            )}
                            {recording.fileSize && (
                              <Tag>
                                Size:{" "}
                                {(recording.fileSize / 1024 / 1024).toFixed(2)}{" "}
                                MB
                              </Tag>
                            )}
                            <Tag>
                              {dayjs(recording.uploadedAt).format(
                                "YYYY-MM-DD HH:mm",
                              )}
                            </Tag>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <div>
                  <Empty description="No recordings available" />
                  <div style={{ marginTop: 16 }}>
                    <RecordingUploader
                      assessmentId={interview.id}
                      onUploadSuccess={fetchInterviewDetails}
                    />
                  </div>
                </div>
              )}
            </TabPane>

            <TabPane
              tab={
                <span>
                  <RobotOutlined />
                  AI Analysis
                </span>
              }
              key="analysis"
            >
              <AIAnalysisViewer
                analysis={interview.metadata}
                resultScore={interview.resultScore}
              />
            </TabPane>
          </Tabs>
        </Card>
      </Space>
    </AppLayout>
  );
}
