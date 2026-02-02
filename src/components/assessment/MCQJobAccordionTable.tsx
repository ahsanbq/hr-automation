import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Tag,
  Button,
  Space,
  message,
  Tooltip,
  Modal,
  Typography,
  Divider,
  Row,
  Col,
  Statistic,
  Alert,
  Popconfirm,
  Progress,
  Collapse,
  Collapse as AntCollapse,
  Spin,
} from "antd";
import {
  DownOutlined,
  RightOutlined,
  EyeOutlined,
  DeleteOutlined,
  UserOutlined,
  FileTextOutlined,
  TrophyOutlined,
  MailOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CheckSquareOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Text, Title } = Typography;
const { Panel } = Collapse;

interface JobWithInterviews {
  id: string;
  jobTitle: string;
  companyName: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    interviews: number;
  };
  interviews: Array<{
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
    resume: {
      id: string;
      candidateName: string;
      candidateEmail?: string;
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
      answers: Array<{
        id: string;
        answer: any;
        isCorrect?: boolean;
        pointsEarned?: number;
        answeredAt: string;
        question: {
          id: string;
          question: string;
          options?: any;
          correct: any;
          points: number;
        };
      }>;
    }>;
  }>;
}

interface MCQJobAccordionTableProps {
  onRefresh?: () => void;
}

const MCQJobAccordionTable: React.FC<MCQJobAccordionTableProps> = ({
  onRefresh,
}) => {
  const [jobs, setJobs] = useState<JobWithInterviews[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [animatingRows, setAnimatingRows] = useState<Set<string>>(new Set());
  const [selectedInterview, setSelectedInterview] = useState<any>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Helper function to format answers for display
  const formatAnswerForDisplay = (answer: any): string => {
    if (!answer && answer !== 0 && answer !== false)
      return "No answer provided";

    // Handle string answers
    if (typeof answer === "string") {
      return answer.trim() || "Empty answer";
    }

    // Handle number and boolean answers
    if (typeof answer === "number" || typeof answer === "boolean") {
      return String(answer);
    }

    // Handle array answers (multiple choice)
    if (Array.isArray(answer)) {
      if (answer.length === 0) return "No options selected";
      return answer
        .filter((item) => item !== null && item !== undefined)
        .join(", ");
    }

    // Handle object answers
    if (typeof answer === "object" && answer !== null) {
      // Prioritize selectedText for MCQ answers
      if (answer.selectedText && typeof answer.selectedText === "string") {
        return answer.selectedText.trim();
      }

      // Try other common properties
      if (answer.text && typeof answer.text === "string")
        return answer.text.trim();
      if (answer.value && typeof answer.value === "string")
        return answer.value.trim();
      if (answer.option && typeof answer.option === "string")
        return answer.option.trim();
      if (answer.label && typeof answer.label === "string")
        return answer.label.trim();

      // For objects, try to extract the first meaningful string value
      const values = Object.values(answer).filter(
        (v) =>
          v !== null && v !== undefined && v !== "" && typeof v === "string",
      );

      if (values.length > 0) {
        return String(values[0]).trim();
      }
    }

    return "Invalid answer format";
  };

  // Helper function to normalize answers for comparison
  const normalizeAnswerForComparison = (answer: any): any => {
    if (typeof answer === "object" && answer !== null) {
      if (Array.isArray(answer)) {
        return answer[0];
      }
      // Prioritize selectedText for MCQ answers
      return (
        answer.selectedText ||
        answer.text ||
        answer.value ||
        answer.option ||
        answer.label ||
        Object.values(answer)[0]
      );
    }
    return answer;
  };

  useEffect(() => {
    fetchJobsWithInterviews();
  }, []);

  const fetchJobsWithInterviews = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/jobs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }

      const data = await response.json();
      const jobsData = data.jobs || [];

      // Fetch interviews for each job
      const jobsWithInterviews = await Promise.all(
        jobsData.map(async (job: any) => {
          try {
            const interviewsResponse = await fetch(
              `/api/interviews?jobPostId=${job.id}&includeQuestions=true`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );

            if (interviewsResponse.ok) {
              const interviewsData = await interviewsResponse.json();
              return {
                ...job,
                interviews: interviewsData.interviews || [],
                _count: {
                  interviews: interviewsData.interviews?.length || 0,
                },
              };
            }
            return {
              ...job,
              interviews: [],
              _count: { interviews: 0 },
            };
          } catch (error) {
            console.error(
              `Error fetching interviews for job ${job.id}:`,
              error,
            );
            return {
              ...job,
              interviews: [],
              _count: { interviews: 0 },
            };
          }
        }),
      );

      setJobs(jobsWithInterviews);
    } catch (error) {
      console.error("Error fetching jobs with interviews:", error);
      message.error("Failed to fetch jobs and interviews");
    } finally {
      setLoading(false);
    }
  };

  const handleRowExpand = (jobId: string) => {
    const isCurrentlyExpanded = expandedRows.has(jobId);

    if (isCurrentlyExpanded) {
      // Collapsing - start animation but keep content visible
      setAnimatingRows((prev) => new Set(prev).add(jobId));

      // After animation completes, remove from expanded rows and animation state
      setTimeout(() => {
        setExpandedRows((prev) => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
        setAnimatingRows((prev) => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
      }, 350); // Slightly longer to ensure smooth completion
    } else {
      // Expanding - add to expanded rows immediately and start animation
      setExpandedRows((prev) => new Set(prev).add(jobId));
      setAnimatingRows((prev) => new Set(prev).add(jobId));

      // Remove animation class after animation completes
      setTimeout(() => {
        setAnimatingRows((prev) => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
      }, 400); // Match animation duration
    }
  };

  const handleDeleteInterview = async (interviewId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/interviews/${interviewId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete interview");
      }

      message.success("Interview deleted successfully");
      fetchJobsWithInterviews(); // Refresh data
    } catch (error) {
      console.error("Error deleting interview:", error);
      message.error("Failed to delete interview");
    }
  };

  const handleViewInterviewDetails = (interview: any) => {
    setSelectedInterview(interview);
    setDetailModalVisible(true);
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

  const getScoreColor = (percentage: number) => {
    if (percentage >= 70) return "#52c41a";
    if (percentage >= 50) return "#faad14";
    return "#ff4d4f";
  };

  const renderInterviewTable = (interviews: any[]) => {
    if (interviews.length === 0) {
      return (
        <div style={{ textAlign: "center", padding: "20px", color: "#999" }}>
          <FileTextOutlined style={{ fontSize: "24px", marginBottom: "8px" }} />
          <div>No MCQ interviews found for this job</div>
        </div>
      );
    }

    const interviewColumns = [
      {
        title: "Candidate",
        key: "candidate",
        width: 200,
        render: (_: any, record: any) => (
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
        title: "Interview Details",
        key: "details",
        width: 200,
        render: (_: any, record: any) => (
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
        render: (_: any, record: any) => (
          <div>
            <Tag color={getStatusColor(record.status)}>
              {record.status.replace("_", " ")}
            </Tag>
            {record.attempted && record.interviewAttempts.length > 0 && (
              <div style={{ marginTop: 4 }}>
                <Tag
                  color={getAttemptStatusColor(
                    record.interviewAttempts[0].status,
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
        render: (_: any, record: any) => {
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
                  color: getScoreColor(percentage),
                  fontSize: "14px",
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
        render: (_: any, record: any) => (
          <div style={{ fontSize: "12px" }}>
            {dayjs(record.createdAt).format("MMM DD, YYYY")}
          </div>
        ),
      },
      {
        title: "Actions",
        key: "actions",
        width: 150,
        render: (_: any, record: any) => (
          <Space size="small">
            <Tooltip title="View Details & Answers">
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() => handleViewInterviewDetails(record)}
              />
            </Tooltip>
            <Popconfirm
              title="Are you sure you want to delete this interview?"
              onConfirm={() => handleDeleteInterview(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Tooltip title="Delete Interview">
                <Button type="text" icon={<DeleteOutlined />} danger />
              </Tooltip>
            </Popconfirm>
          </Space>
        ),
      },
    ];

    return (
      <div
        style={{
          animation: "fadeIn 0.3s ease-in-out",
          marginTop: "16px",
        }}
      >
        <Table
          columns={interviewColumns}
          dataSource={interviews}
          rowKey="id"
          pagination={false}
          style={{
            marginTop: "16px",
            borderRadius: "8px",
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        />
      </div>
    );
  };

  const renderInterviewDetailsModal = () => {
    if (!selectedInterview) return null;

    const attempt = selectedInterview.interviewAttempts[0];
    const answers = attempt?.answers || [];

    return (
      <Modal
        title="Interview Details & Answers"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={900}
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
              <FileTextOutlined /> Interview Information
            </Title>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Title:</Text> {selectedInterview.title}
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Duration:</Text> {selectedInterview.duration} minutes
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Questions:</Text>{" "}
              {selectedInterview.questions?.length || 0}
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Status:</Text>{" "}
              <Tag color={getStatusColor(selectedInterview.status)}>
                {selectedInterview.status}
              </Tag>
            </div>
          </Col>

          {attempt && (
            <Col span={24}>
              <Divider />
              <Title level={5}>
                <TrophyOutlined /> Performance Results
              </Title>
              {attempt.status === "IN_PROGRESS" && !attempt.submittedAt ? (
                <Alert
                  message="Assessment Not Started"
                  description="The candidate hasn't taken the assessment yet. They will receive an email with the test link and can start when ready."
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              ) : (
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
                              ((attempt.score || 0) / attempt.maxScore) * 100,
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
                        attempt.timeSpent
                          ? Math.round(attempt.timeSpent / 60)
                          : 0
                      }
                      suffix="minutes"
                    />
                  </Col>
                </Row>
              )}
              {attempt.submittedAt && (
                <div style={{ marginTop: 16 }}>
                  <Text strong>Submitted At:</Text>{" "}
                  {dayjs(attempt.submittedAt).format("MMM DD, YYYY HH:mm")}
                </div>
              )}
            </Col>
          )}

          {/* Show All Questions Section */}
          {selectedInterview.questions &&
            selectedInterview.questions.length > 0 && (
              <Col span={24}>
                <Divider />
                <Title level={5}>
                  <CheckSquareOutlined /> MCQ Questions (
                  {selectedInterview.questions.length})
                </Title>

                {/* Show placeholder if candidate hasn't started the exam */}
                {attempt &&
                attempt.status === "IN_PROGRESS" &&
                !attempt.submittedAt ? (
                  <Alert
                    message="Assessment Not Started"
                    description="The candidate hasn't taken the assessment yet. All questions will be available once they start the exam."
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                ) : (
                  <Row gutter={[16, 16]}>
                    {selectedInterview.questions.map(
                      (question: any, index: number) => {
                        // Find if this question has been answered
                        const questionAnswer = answers.find(
                          (answer: any) => answer.question.id === question.id,
                        );

                        // Determine question status and styling
                        let questionStatus = "not-answered";
                        let borderColor = "#d9d9d9";
                        let backgroundColor = "#fafafa";
                        let statusTag = {
                          color: "default",
                          text: "Not Answered",
                        };

                        if (questionAnswer) {
                          if (questionAnswer.isCorrect) {
                            questionStatus = "correct";
                            borderColor = "#52c41a";
                            backgroundColor = "#f6ffed";
                            statusTag = { color: "green", text: "Correct" };
                          } else {
                            questionStatus = "incorrect";
                            borderColor = "#ff4d4f";
                            backgroundColor = "#fff2f0";
                            statusTag = { color: "red", text: "Incorrect" };
                          }
                        } else if (attempt && attempt.submittedAt) {
                          // Question was skipped (submitted but no answer)
                          questionStatus = "skipped";
                          borderColor = "#595959";
                          backgroundColor = "#f5f5f5";
                          statusTag = { color: "default", text: "Skipped" };
                        }

                        return (
                          <Col span={24} key={question.id}>
                            <Card
                              style={{
                                marginBottom: 16,
                                border: `1px solid ${borderColor}`,
                                backgroundColor: backgroundColor,
                                opacity: questionStatus === "skipped" ? 0.7 : 1,
                              }}
                              title={`Question ${index + 1}`}
                              extra={
                                <Space>
                                  <Tag color="blue">
                                    Points: {question.points}
                                  </Tag>
                                  <Tag color={statusTag.color}>
                                    {statusTag.text}
                                  </Tag>
                                </Space>
                              }
                            >
                              <div style={{ marginBottom: 12 }}>
                                <Text strong>Question:</Text>
                                <div style={{ marginTop: 4, fontSize: "14px" }}>
                                  {question.question}
                                </div>
                              </div>

                              {question.options && (
                                <div style={{ marginBottom: 12 }}>
                                  <Text strong>Options:</Text>
                                  <div style={{ marginTop: 4 }}>
                                    {(() => {
                                      // Normalize options to always be an array of strings
                                      let optionsArray = [];

                                      if (Array.isArray(question.options)) {
                                        optionsArray = question.options;
                                      } else if (
                                        typeof question.options === "object" &&
                                        question.options !== null
                                      ) {
                                        optionsArray = Object.values(
                                          question.options,
                                        );
                                      } else if (
                                        typeof question.options === "string"
                                      ) {
                                        optionsArray = [question.options];
                                      }

                                      // Normalize correct answer for comparison
                                      let correctAnswer =
                                        normalizeAnswerForComparison(
                                          question.correct,
                                        );

                                      // Normalize candidate answer for comparison
                                      let candidateAnswer = questionAnswer
                                        ? normalizeAnswerForComparison(
                                            questionAnswer.answer,
                                          )
                                        : null;

                                      return optionsArray.map(
                                        (option: any, optIndex: number) => {
                                          // Convert option to string for display
                                          let optionText =
                                            typeof option === "string"
                                              ? option
                                              : option?.text ||
                                                option?.value ||
                                                option?.label ||
                                                String(option);

                                          let optionBgColor = "#fafafa";
                                          let optionBorderColor = "#d9d9d9";
                                          let isCorrectOption =
                                            optionText === correctAnswer ||
                                            option === correctAnswer;

                                          if (isCorrectOption) {
                                            optionBgColor = "#f6ffed";
                                            optionBorderColor = "#b7eb8f";
                                          }

                                          // Highlight candidate's answer if they answered incorrectly
                                          if (
                                            questionAnswer &&
                                            !questionAnswer.isCorrect &&
                                            (candidateAnswer === optionText ||
                                              candidateAnswer === option)
                                          ) {
                                            optionBgColor = "#fff2f0";
                                            optionBorderColor = "#ffccc7";
                                          }

                                          return (
                                            <div
                                              key={optIndex}
                                              style={{
                                                padding: "4px 8px",
                                                margin: "2px 0",
                                                backgroundColor: optionBgColor,
                                                border: `1px solid ${optionBorderColor}`,
                                                borderRadius: "4px",
                                                fontSize: "13px",
                                              }}
                                            >
                                              {optionText}
                                              {isCorrectOption && (
                                                <Tag
                                                  color="green"
                                                  style={{ marginLeft: 8 }}
                                                >
                                                  Correct
                                                </Tag>
                                              )}
                                              {questionAnswer &&
                                                !questionAnswer.isCorrect &&
                                                (candidateAnswer ===
                                                  optionText ||
                                                  candidateAnswer ===
                                                    option) && (
                                                  <Tag
                                                    color="red"
                                                    style={{ marginLeft: 8 }}
                                                  >
                                                    Candidate's Answer
                                                  </Tag>
                                                )}
                                            </div>
                                          );
                                        },
                                      );
                                    })()}
                                  </div>
                                </div>
                              )}

                              {questionAnswer ? (
                                <div style={{ marginBottom: 12 }}>
                                  <Text strong>Candidate's Answer:</Text>
                                  <div style={{ marginTop: 4 }}>
                                    <Tag
                                      color={
                                        questionAnswer.isCorrect
                                          ? "green"
                                          : "red"
                                      }
                                      style={{
                                        fontSize: "13px",
                                        padding: "4px 8px",
                                        maxWidth: "100%",
                                        whiteSpace: "pre-wrap",
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      {(() => {
                                        return formatAnswerForDisplay(
                                          questionAnswer.answer,
                                        );
                                      })()}
                                    </Tag>
                                  </div>
                                  <div
                                    style={{
                                      marginTop: 4,
                                      fontSize: "12px",
                                      color: "#666",
                                    }}
                                  >
                                    Answered at:{" "}
                                    {dayjs(questionAnswer.answeredAt).format(
                                      "MMM DD, YYYY HH:mm",
                                    )}
                                  </div>
                                </div>
                              ) : attempt && attempt.submittedAt ? (
                                <div style={{ marginBottom: 12 }}>
                                  <Text strong>Candidate's Answer:</Text>
                                  <div style={{ marginTop: 4 }}>
                                    <Tag
                                      color="default"
                                      style={{
                                        backgroundColor: "#f5f5f5",
                                        color: "#8c8c8c",
                                      }}
                                    >
                                      Question Skipped
                                    </Tag>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ marginBottom: 12 }}>
                                  <Text strong>Candidate's Answer:</Text>
                                  <div style={{ marginTop: 4 }}>
                                    <Tag
                                      color="default"
                                      style={{
                                        backgroundColor: "#f0f0f0",
                                        color: "#bfbfbf",
                                      }}
                                    >
                                      Not answered yet
                                    </Tag>
                                  </div>
                                </div>
                              )}

                              <div>
                                <Text strong>Correct Answer:</Text>
                                <div style={{ marginTop: 4 }}>
                                  <Tag color="green">
                                    {typeof question.correct === "string"
                                      ? question.correct
                                      : JSON.stringify(question.correct)}
                                  </Tag>
                                </div>
                              </div>
                            </Card>
                          </Col>
                        );
                      },
                    )}
                  </Row>
                )}
              </Col>
            )}

          {selectedInterview.questions &&
            selectedInterview.questions.length === 0 && (
              <Col span={24}>
                <Alert
                  message="No Questions Found"
                  description="This interview does not have any questions assigned."
                  type="warning"
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
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .expandable-content {
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
          opacity: 1;
          transform: translateY(0);
          max-height: 1000px;
        }

        .expandable-content.expanding {
          opacity: 1;
          transform: translateY(0);
          max-height: 1000px;
        }

        .expandable-content.collapsing {
          opacity: 0;
          transform: translateY(-10px);
          max-height: 0;
        }

        /* Smooth hover transitions for expand buttons */
        .ant-btn-text:hover {
          background: rgba(24, 144, 255, 0.06) !important;
          border-radius: 6px !important;
        }

        /* Enhanced row hover effects */
        .job-row {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .job-row:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transform: translateY(-1px);
        }

        .ant-table-small .ant-table-thead > tr > th {
          background: #fafafa !important;
          font-weight: 600 !important;
        }

        .ant-table-small .ant-table-tbody > tr:hover > td {
          background: #f0f9ff !important;
        }
      `}</style>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Title level={4}>
            <FileTextOutlined /> MCQ Assessments Overview
          </Title>
          <Text type="secondary">
            Expand job rows to view and manage MCQ interviews for each position
          </Text>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <Spin size="large" style={{ marginBottom: "20px" }} />
            <div
              style={{
                color: "#1890ff",
                fontSize: "16px",
                fontWeight: "500",
                marginBottom: "8px",
              }}
            >
              Loading MCQ Assessments
            </div>
            <div style={{ color: "#666", fontSize: "14px" }}>
              Fetching job positions and interview data...
            </div>
          </div>
        ) : jobs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px" }}>
            <div
              style={{ fontSize: "16px", color: "#999", marginBottom: "16px" }}
            >
              📝 No jobs found
            </div>
            <div style={{ color: "#666" }}>
              Create your first job posting to start managing MCQ interviews
            </div>
          </div>
        ) : (
          <div
            style={{
              background: "white",
              borderRadius: "8px",
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            {/* Proper Table Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "16px 20px",
                background: "#fafafa",
                borderBottom: "1px solid #f0f0f0",
                fontWeight: "600",
                fontSize: "12px",
                color: "#666",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              <div style={{ flex: "2", minWidth: "300px" }}>Job Position</div>
              <div
                style={{ flex: "1", textAlign: "center", minWidth: "150px" }}
              >
                MCQ Interviews
              </div>
              <div style={{ width: "120px" }}>Status</div>
              <div style={{ width: "120px" }}>Created</div>
              <div style={{ width: "60px" }}></div>
            </div>

            {/* Job Rows */}
            {jobs.map((job, index) => (
              <div
                key={job.id}
                style={{
                  borderBottom:
                    index < jobs.length - 1 ? "1px solid #f0f0f0" : "none",
                  background: "white",
                }}
              >
                {/* Main Job Row */}
                <div
                  className="job-row"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "20px",
                    cursor: job._count.interviews > 0 ? "pointer" : "default",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                  onClick={() =>
                    job._count.interviews > 0 && handleRowExpand(job.id)
                  }
                  onMouseEnter={(e) => {
                    if (job._count.interviews > 0) {
                      e.currentTarget.style.backgroundColor = "#f8f9fa";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "white";
                  }}
                >
                  {/* Job Position */}
                  <div style={{ flex: "2", minWidth: "300px" }}>
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: "14px",
                        marginBottom: "4px",
                        color: "#262626",
                      }}
                    >
                      {job.jobTitle}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#666",
                        marginBottom: "2px",
                      }}
                    >
                      {job.companyName} • {job.location}
                    </div>
                    <div style={{ fontSize: "11px", color: "#999" }}>
                      {job.jobType} • {job.experienceLevel}
                    </div>
                  </div>

                  {/* MCQ Interviews Count */}
                  <div
                    style={{
                      flex: "1",
                      textAlign: "center",
                      minWidth: "150px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: "bold",
                        color: "#1890ff",
                        marginBottom: "2px",
                      }}
                    >
                      {job._count.interviews}
                    </div>
                    <div style={{ fontSize: "11px", color: "#666" }}>
                      {job._count.interviews === 1 ? "Interview" : "Interviews"}
                    </div>
                  </div>

                  {/* Status */}
                  <div style={{ width: "120px" }}>
                    <Tag color={job.isActive ? "green" : "red"}>
                      {job.isActive ? "Active" : "Inactive"}
                    </Tag>
                  </div>

                  {/* Created Date */}
                  <div
                    style={{ width: "120px", fontSize: "12px", color: "#666" }}
                  >
                    {dayjs(job.createdAt).format("MMM DD, YYYY")}
                  </div>

                  {/* Expand Button */}
                  <div style={{ width: "60px", textAlign: "center" }}>
                    {job._count.interviews > 0 && (
                      <Button
                        type="text"
                        icon={
                          <DownOutlined
                            style={{
                              transform: `rotate(${
                                expandedRows.has(job.id) ||
                                animatingRows.has(job.id)
                                  ? 180
                                  : 0
                              }deg)`,
                              transition:
                                "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                              color: "#1890ff",
                            }}
                          />
                        }
                        style={{
                          border: "none",
                          background: "transparent",
                          boxShadow: "none",
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Expanded Interview Table */}
                {(expandedRows.has(job.id) || animatingRows.has(job.id)) && (
                  <div
                    className={`expandable-content ${
                      animatingRows.has(job.id)
                        ? expandedRows.has(job.id)
                          ? "expanding"
                          : "collapsing"
                        : ""
                    }`}
                    style={{
                      background: "#fafafa",
                      borderTop: "1px solid #f0f0f0",
                    }}
                  >
                    {job._count.interviews > 0 ? (
                      <div style={{ padding: "16px" }}>
                        {renderInterviewTable(job.interviews)}
                      </div>
                    ) : (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "40px 20px",
                          color: "#999",
                        }}
                      >
                        <FileTextOutlined
                          style={{ fontSize: "24px", marginBottom: "8px" }}
                        />
                        <div>No MCQ interviews found for this job</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {renderInterviewDetailsModal()}
    </>
  );
};

export default MCQJobAccordionTable;
