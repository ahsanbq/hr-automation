import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import {
  Card,
  Button,
  Space,
  message,
  Spin,
  Typography,
  Alert,
  Progress,
  Tag,
  Modal,
} from "antd";
import {
  VideoCameraOutlined,
  AudioOutlined,
  PlayCircleOutlined,
  StopOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import Head from "next/head";

const { Title, Text, Paragraph } = Typography;

export default function TakeAIInterviewPage() {
  const router = useRouter();
  const { assessmentId } = router.query;
  const [loading, setLoading] = useState(true);
  const [interview, setInterview] = useState<any>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (assessmentId) {
      fetchInterviewDetails();
    }
  }, [assessmentId]);

  useEffect(() => {
    return () => {
      // Cleanup timers
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      // Stop media stream
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const fetchInterviewDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/assessments/${assessmentId}/public`);

      if (response.ok) {
        const data = await response.json();
        setInterview(data.assessmentStage);
        if (data.assessmentStage.avatarAssessment.timeLimit) {
          setTimeRemaining(
            data.assessmentStage.avatarAssessment.timeLimit * 60,
          );
        }
      } else {
        message.error("Failed to load interview details");
      }
    } catch (error) {
      console.error("Error fetching interview:", error);
      message.error("Error loading interview");
    } finally {
      setLoading(false);
    }
  };

  const requestMediaPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setHasPermissions(true);
      message.success("Camera and microphone access granted");
      return true;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      message.error(
        "Please grant camera and microphone permissions to continue",
      );
      return false;
    }
  };

  const startInterview = async () => {
    if (!interview.avatarAssessment.recordingEnabled) {
      setIsStarted(true);
      startTimer();
      return;
    }

    const hasAccess = await requestMediaPermissions();
    if (!hasAccess) return;

    setIsStarted(true);
    startRecording();
    startTimer();
  };

  const startTimer = () => {
    if (interview.avatarAssessment.timeLimit && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const startRecording = () => {
    try {
      if (!videoRef.current || !videoRef.current.srcObject) return;

      const stream = videoRef.current.srcObject as MediaStream;
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm",
      });

      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        uploadRecording();
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      message.info("Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
      message.error("Failed to start recording");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }

      message.info("Recording stopped");
    }
  };

  const uploadRecording = async () => {
    if (recordedChunksRef.current.length === 0) {
      message.warning("No recording data available");
      return;
    }

    setIsSubmitting(true);
    try {
      const blob = new Blob(recordedChunksRef.current, {
        type: "video/webm",
      });

      // In a real implementation, you would upload to S3 first
      // For now, we'll just create a metadata record

      const response = await fetch(
        `/api/assessments/avatar/${assessmentId}/recordings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filename: `interview_${assessmentId}_${Date.now()}.webm`,
            fileSize: blob.size,
            duration: recordingTime,
          }),
        },
      );

      if (response.ok) {
        message.success("Interview submitted successfully");
        router.push("/assessment/avatar/thank-you");
      } else {
        message.error("Failed to submit interview");
      }
    } catch (error) {
      console.error("Error uploading recording:", error);
      message.error("Error submitting interview");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimeUp = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    Modal.warning({
      title: "Time's Up!",
      content:
        "Your interview time has expired. The interview will be submitted automatically.",
      onOk: () => {
        if (isRecording) {
          stopRecording();
        } else {
          handleSubmit();
        }
      },
    });
  };

  const handleSubmit = () => {
    Modal.confirm({
      title: "Submit Interview",
      content:
        "Are you sure you want to submit your interview? You cannot make changes after submission.",
      okText: "Submit",
      cancelText: "Continue",
      onOk: () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (isRecording) {
          stopRecording();
        } else {
          router.push("/assessment/avatar/thank-you");
        }
      },
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!interview) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <Card>
          <Title level={3}>Interview Not Found</Title>
          <Paragraph>The interview link may be invalid or expired.</Paragraph>
        </Card>
      </div>
    );
  }

  const { avatarAssessment } = interview;

  return (
    <>
      <Head>
        <title>AI Interview - {avatarAssessment.title}</title>
      </Head>
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: "20px",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {!isStarted ? (
            <Card style={{ marginTop: "40px" }}>
              <Space
                direction="vertical"
                size="large"
                style={{ width: "100%" }}
              >
                <div style={{ textAlign: "center" }}>
                  <RobotOutlined
                    style={{ fontSize: "64px", color: "#1890ff" }}
                  />
                  <Title level={2} style={{ marginTop: "16px" }}>
                    {avatarAssessment.title}
                  </Title>
                  <Text type="secondary">{avatarAssessment.description}</Text>
                </div>

                <Alert
                  message="Before You Start"
                  description={
                    <ul style={{ marginBottom: 0, paddingLeft: "20px" }}>
                      <li>Ensure you have a stable internet connection</li>
                      {avatarAssessment.recordingEnabled && (
                        <li>
                          Grant camera and microphone permissions when prompted
                        </li>
                      )}
                      <li>Find a quiet place for the interview</li>
                      {avatarAssessment.timeLimit && (
                        <li>
                          You have {avatarAssessment.timeLimit} minutes to
                          complete the interview
                        </li>
                      )}
                    </ul>
                  }
                  type="info"
                  showIcon
                />

                <div style={{ textAlign: "center" }}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<PlayCircleOutlined />}
                    onClick={startInterview}
                  >
                    Start Interview
                  </Button>
                </div>
              </Space>
            </Card>
          ) : (
            <Card>
              <Space
                direction="vertical"
                size="large"
                style={{ width: "100%" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Title level={4} style={{ margin: 0 }}>
                    {avatarAssessment.title}
                  </Title>
                  <Space>
                    {isRecording && (
                      <Tag icon={<VideoCameraOutlined />} color="red">
                        Recording {formatTime(recordingTime)}
                      </Tag>
                    )}
                    {avatarAssessment.timeLimit && (
                      <Tag
                        icon={<ClockCircleOutlined />}
                        color={timeRemaining < 300 ? "red" : "blue"}
                      >
                        {formatTime(timeRemaining)} remaining
                      </Tag>
                    )}
                  </Space>
                </div>

                {avatarAssessment.recordingEnabled && (
                  <Card size="small" style={{ background: "#000" }}>
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      style={{
                        width: "100%",
                        maxHeight: "400px",
                        borderRadius: "8px",
                      }}
                    />
                  </Card>
                )}

                <Card title="Interview Questions" size="small">
                  <Paragraph>
                    {avatarAssessment.interviewScript ||
                      "Please introduce yourself and share your experience relevant to this position."}
                  </Paragraph>
                </Card>

                <div style={{ textAlign: "center" }}>
                  <Space size="large">
                    {isRecording && (
                      <Button
                        danger
                        size="large"
                        icon={<StopOutlined />}
                        onClick={stopRecording}
                      >
                        Stop Recording
                      </Button>
                    )}
                    <Button
                      type="primary"
                      size="large"
                      icon={<CheckCircleOutlined />}
                      onClick={handleSubmit}
                      loading={isSubmitting}
                    >
                      Submit Interview
                    </Button>
                  </Space>
                </div>
              </Space>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
