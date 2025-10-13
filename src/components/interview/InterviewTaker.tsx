import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Radio,
  Progress,
  Space,
  Typography,
  Alert,
  Modal,
  Result,
  Statistic,
  Row,
  Col,
  Tag,
  message,
  Spin,
} from "antd";
import {
  ClockCircleOutlined,
  QuestionCircleOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { Interview, MCQQuestion, CandidateAnswer } from "@/types/interview";

const { Title, Text } = Typography;

interface InterviewTakerProps {
  interviewId: string;
  onComplete?: (result: any) => void;
  onExit?: () => void;
}

interface InterviewSession {
  interview: Interview;
  questions: MCQQuestion[];
  currentQuestionIndex: number;
  answers: { [questionId: string]: number };
  timeRemaining: number;
  isCompleted: boolean;
}

const InterviewTaker: React.FC<InterviewTakerProps> = ({
  interviewId,
  onComplete,
  onExit,
}) => {
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    startInterview();
  }, [interviewId]);

  useEffect(() => {
    if (session && session.timeRemaining > 0 && !session.isCompleted) {
      const timer = setInterval(() => {
        setSession((prev) => {
          if (!prev || prev.timeRemaining <= 1) {
            if (prev && !prev.isCompleted) {
              handleAutoSubmit();
            }
            return prev;
          }
          return {
            ...prev,
            timeRemaining: prev.timeRemaining - 1,
          };
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [session]);

  const startInterview = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        message.error("Please log in to take interview");
        return;
      }

      const response = await fetch(`/api/interviews/${interviewId}/start`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to start interview");
      }

      const data = await response.json();
      const timeRemaining = data.interview.duration
        ? data.interview.duration * 60
        : 3600; // Convert minutes to seconds

      setSession({
        interview: data.interview,
        questions: data.questions,
        currentQuestionIndex: 0,
        answers: {},
        timeRemaining,
        isCompleted: false,
      });
    } catch (error) {
      console.error("Error starting interview:", error);
      message.error("Failed to start interview");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: number) => {
    if (!session) return;

    setSession((prev) => ({
      ...prev!,
      answers: {
        ...prev!.answers,
        [questionId]: answer,
      },
    }));
  };

  const handleNextQuestion = () => {
    if (!session) return;

    if (session.currentQuestionIndex < session.questions.length - 1) {
      setSession((prev) => ({
        ...prev!,
        currentQuestionIndex: prev!.currentQuestionIndex + 1,
      }));
    }
  };

  const handlePreviousQuestion = () => {
    if (!session) return;

    if (session.currentQuestionIndex > 0) {
      setSession((prev) => ({
        ...prev!,
        currentQuestionIndex: prev!.currentQuestionIndex - 1,
      }));
    }
  };

  const handleSubmitAnswers = async () => {
    if (!session) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");

      const answers = Object.entries(session.answers).map(
        ([questionId, selectedAnswer]) => ({
          questionId,
          selectedAnswer,
        })
      );

      const response = await fetch(`/api/interviews/${interviewId}/answers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit answers");
      }

      const data = await response.json();
      setResult(data);
      setShowResults(true);
      setSession((prev) => ({ ...prev!, isCompleted: true }));

      if (onComplete) {
        onComplete(data);
      }
    } catch (error) {
      console.error("Error submitting answers:", error);
      message.error("Failed to submit answers");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = async () => {
    if (!session || session.isCompleted) return;

    const answeredQuestions = Object.keys(session.answers).length;
    const totalQuestions = session.questions.length;

    if (answeredQuestions < totalQuestions) {
      Modal.confirm({
        title: "Time Up!",
        content: `Time has run out. You answered ${answeredQuestions} out of ${totalQuestions} questions. Submit now?`,
        okText: "Submit",
        cancelText: "Continue (if time remaining)",
        onOk: handleSubmitAnswers,
      });
    } else {
      handleSubmitAnswers();
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage < 30) return "#ff4d4f";
    if (percentage < 60) return "#faad14";
    return "#52c41a";
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
        <div style={{ marginTop: "16px" }}>Loading interview...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <Alert
        message="Interview Not Found"
        description="The requested interview could not be found or you don't have access to it."
        type="error"
        showIcon
      />
    );
  }

  const currentQuestion = session.questions[session.currentQuestionIndex];
  const answeredQuestions = Object.keys(session.answers).length;
  const progress = (answeredQuestions / session.questions.length) * 100;

  if (showResults && result) {
    return (
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <Result
          icon={<TrophyOutlined style={{ color: "#52c41a" }} />}
          title="Interview Completed!"
          subTitle={`You scored ${result.score.percentage.toFixed(
            1
          )}% in the interview`}
          extra={[
            <Button
              type="primary"
              key="view-details"
              onClick={() => onExit?.()}
            >
              View Details
            </Button>,
          ]}
        >
          <Row gutter={[16, 16]} style={{ marginTop: "24px" }}>
            <Col span={8}>
              <Statistic
                title="Total Score"
                value={result.score.totalScore}
                suffix={`/ ${result.score.totalPossibleScore}`}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Percentage"
                value={result.score.percentage}
                suffix="%"
                precision={1}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Status"
                value={result.score.shortlistStatus}
                valueStyle={{
                  color:
                    result.score.shortlistStatus === "SHORTLISTED"
                      ? "#52c41a"
                      : "#666",
                }}
              />
            </Col>
          </Row>
        </Result>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      {/* Header */}
      <Card style={{ marginBottom: "16px" }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              {session.interview.title}
            </Title>
            <Text type="secondary">
              {session.interview.jobPost?.jobTitle} •{" "}
              {session.interview.jobPost?.companyName}
            </Text>
          </Col>
          <Col>
            <Space>
              <Tag color="blue">
                <ClockCircleOutlined /> {formatTime(session.timeRemaining)}
              </Tag>
              <Tag color="green">
                <CheckCircleOutlined /> {answeredQuestions}/
                {session.questions.length} Answered
              </Tag>
            </Space>
          </Col>
        </Row>

        <div style={{ marginTop: "16px" }}>
          <Progress
            percent={progress}
            strokeColor={getProgressColor(progress)}
            showInfo={false}
          />
        </div>
      </Card>

      {/* Question */}
      <Card>
        <div style={{ marginBottom: "24px" }}>
          <Space>
            <Tag color="blue">
              Question {session.currentQuestionIndex + 1} of{" "}
              {session.questions.length}
            </Tag>
            {currentQuestion.category && (
              <Tag color="purple">{currentQuestion.category}</Tag>
            )}
            <Tag
              color={
                currentQuestion.difficulty === "EASY"
                  ? "green"
                  : currentQuestion.difficulty === "MEDIUM"
                  ? "orange"
                  : "red"
              }
            >
              {currentQuestion.difficulty}
            </Tag>
            <Tag color="cyan">{currentQuestion.points} points</Tag>
          </Space>
        </div>

        <Title level={4} style={{ marginBottom: "24px" }}>
          {currentQuestion.question}
        </Title>

        <Radio.Group
          value={session.answers[currentQuestion.id]}
          onChange={(e) =>
            handleAnswerChange(currentQuestion.id, e.target.value)
          }
          style={{ width: "100%" }}
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            {currentQuestion.options.map((option: any, index: number) => (
              <Radio
                key={index}
                value={index}
                style={{
                  display: "block",
                  padding: "12px",
                  border: "1px solid #f0f0f0",
                  borderRadius: "6px",
                  marginBottom: "8px",
                  backgroundColor:
                    session.answers[currentQuestion.id] === index
                      ? "#f6ffed"
                      : "#fff",
                }}
              >
                <span style={{ fontWeight: "bold", marginRight: "8px" }}>
                  {String.fromCharCode(65 + index)}.
                </span>
                {option}
              </Radio>
            ))}
          </Space>
        </Radio.Group>

        {/* Navigation */}
        <div
          style={{
            marginTop: "32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Button
            onClick={handlePreviousQuestion}
            disabled={session.currentQuestionIndex === 0}
          >
            Previous
          </Button>

          <Space>
            {session.currentQuestionIndex === session.questions.length - 1 ? (
              <Button
                type="primary"
                size="large"
                onClick={handleSubmitAnswers}
                loading={submitting}
                icon={<CheckCircleOutlined />}
              >
                Submit Interview
              </Button>
            ) : (
              <Button type="primary" onClick={handleNextQuestion}>
                Next
              </Button>
            )}
          </Space>
        </div>
      </Card>

      {/* Time Warning */}
      {session.timeRemaining <= 300 && session.timeRemaining > 0 && (
        <Alert
          message="Time Warning"
          description={`Only ${formatTime(session.timeRemaining)} remaining!`}
          type="warning"
          showIcon
          style={{ marginTop: "16px" }}
        />
      )}
    </div>
  );
};

export default InterviewTaker;
