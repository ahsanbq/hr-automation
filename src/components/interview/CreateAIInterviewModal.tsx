// Multi-step modal for creating AI Interview sessions
// New flow: Select Job → Select Candidate → Session Setup → Generate Questions → Send

import React, { useState, useEffect } from "react";
import {
  Modal,
  Steps,
  Button,
  Form,
  Select,
  Input,
  InputNumber,
  DatePicker,
  TimePicker,
  message,
  Card,
  Space,
  Typography,
  Divider,
  List,
  Tag,
  Alert,
  Spin,
  Result,
  Descriptions,
} from "antd";
import {
  ThunderboltOutlined,
  UserOutlined,
  CheckCircleOutlined,
  SendOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  SolutionOutlined,
  MailOutlined,
  CopyOutlined,
  LockOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;

interface CreateAIInterviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface JobOption {
  id: string;
  title: string;
  company: string;
}

interface CandidateOption {
  id: string;
  name: string;
  email: string;
  matchScore?: number;
  skills?: string[];
}

interface CreatedSession {
  id: string;
  title: string;
  duration: number;
  sessionStart: string;
  sessionEnd: string;
  candidateEmail: string;
  sessionPassword: string;
  jobTitle: string;
  companyName: string;
  candidateName: string;
}

export default function CreateAIInterviewModal({
  visible,
  onClose,
  onSuccess,
}: CreateAIInterviewModalProps) {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [candidates, setCandidates] = useState<CandidateOption[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  // Form data state
  const [selectedJobId, setSelectedJobId] = useState<string>();
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>();
  const [createdSession, setCreatedSession] = useState<CreatedSession | null>(
    null,
  );
  const [generatedQuestions, setGeneratedQuestions] = useState<string[]>([]);
  const [emailSent, setEmailSent] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [questionsModified, setQuestionsModified] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchJobs();
      resetModal();
    }
  }, [visible]);

  // Fetch candidates when job is selected
  useEffect(() => {
    if (selectedJobId) {
      fetchCandidatesForJob(selectedJobId);
    }
  }, [selectedJobId]);

  const resetModal = () => {
    setCurrentStep(0);
    form.resetFields();
    setSelectedJobId(undefined);
    setSelectedCandidateId(undefined);
    setCreatedSession(null);
    setGeneratedQuestions([]);
    setEmailSent(false);
    setNewQuestion("");
    setQuestionsModified(false);
  };

  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/jobs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const jobsData = response.data.jobs || response.data || [];
      const jobsList = jobsData.map((job: any) => ({
        id: job.id,
        title: job.jobTitle,
        company: job.company || job.companyName,
      }));
      setJobs(jobsList);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
      message.error("Failed to load jobs list");
    } finally {
      setLoadingJobs(false);
    }
  };

  const fetchCandidatesForJob = async (jobId: string) => {
    setLoadingCandidates(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`/api/resumes?jobId=${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const candidatesData = response.data.resumes || response.data || [];
      const candidatesList = candidatesData.map((resume: any) => ({
        id: resume.id,
        name: resume.candidateName,
        email: resume.candidateEmail,
        matchScore: resume.matchScore,
        skills: resume.skills,
      }));
      setCandidates(candidatesList);
      if (candidatesList.length === 0) {
        message.warning("No candidates found for this job position");
      }
    } catch (error) {
      console.error("Failed to fetch candidates:", error);
      message.error("Failed to load candidates");
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 0) {
      if (!selectedJobId) {
        message.error("Please select a job");
        return;
      }
    } else if (currentStep === 1) {
      if (!selectedCandidateId) {
        message.error("Please select a candidate");
        return;
      }
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  // Step 2: Create Interview Session
  const handleCreateSession = async () => {
    try {
      const values = await form.validateFields([
        "interview_date",
        "start_time",
        "end_time",
      ]);

      if (!values.interview_date || !values.start_time || !values.end_time) {
        message.error("Please fill in all session details");
        return;
      }

      setLoading(true);
      const token = localStorage.getItem("token");

      const interviewDate = dayjs(values.interview_date).format("YYYY-MM-DD");
      const startTime = dayjs(values.start_time).format("HH:mm:ss");
      const endTime = dayjs(values.end_time).format("HH:mm:ss");

      const response = await axios.post(
        "/api/interview/create-ai-session",
        {
          jobPostId: selectedJobId,
          candidateId: selectedCandidateId,
          interviewDate,
          startTime,
          endTime,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        setCreatedSession(response.data.interview);
        message.success("Interview session created successfully!");
        setCurrentStep(currentStep + 1);
      } else {
        message.error(
          response.data.error || "Failed to create interview session",
        );
      }
    } catch (error: any) {
      console.error("Create session error:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to create interview session";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Generate Questions
  const handleGenerateQuestions = async () => {
    if (!createdSession) {
      message.error("Please create an interview session first");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await axios.post(
        "/api/interview/generate-simple-questions",
        {
          interviewId: createdSession.id,
          jobPostId: selectedJobId,
          candidateId: selectedCandidateId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        const questions = response.data.data.questions || [];
        setGeneratedQuestions(questions);
        message.success(
          `Generated ${questions.length} questions successfully!`,
        );
        setCurrentStep(currentStep + 1);
      } else {
        message.error(
          response.data.error || "Failed to generate questions",
        );
      }
    } catch (error: any) {
      console.error("Generate questions error:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to generate questions";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Send to Candidate
  const handleSendToCandidate = async () => {
    if (!createdSession) {
      message.error("No interview session found");
      return;
    }

    if (generatedQuestions.length === 0) {
      message.error("Please add at least one question before sending");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // If questions were modified (added/deleted), sync to DB first
      if (questionsModified) {
        await axios.post(
          "/api/interview/sync-questions",
          {
            interviewId: createdSession.id,
            questions: generatedQuestions,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      }

      const response = await axios.post(
        "/api/interview/send-ai-interview",
        {
          interviewId: createdSession.id,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        setEmailSent(true);
        message.success("Interview invitation sent to candidate!");
        onSuccess?.();
      } else {
        message.error(
          response.data.error || "Failed to send interview invitation",
        );
      }
    } catch (error: any) {
      console.error("Send error:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to send interview invitation";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPassword = () => {
    if (createdSession?.sessionPassword) {
      navigator.clipboard.writeText(createdSession.sessionPassword);
      message.success("Password copied to clipboard!");
    }
  };

  // Add a manually typed question
  const handleAddQuestion = () => {
    const trimmed = newQuestion.trim();
    if (!trimmed) {
      message.warning("Please type a question first");
      return;
    }
    setGeneratedQuestions((prev) => [...prev, trimmed]);
    setNewQuestion("");
    setQuestionsModified(true);
    message.success("Question added");
  };

  // Delete a question by index
  const handleDeleteQuestion = (index: number) => {
    setGeneratedQuestions((prev) => prev.filter((_, i) => i !== index));
    setQuestionsModified(true);
    message.success("Question removed");
  };

  const selectedJob = jobs.find((j) => j.id === selectedJobId);
  const selectedCandidate = candidates.find(
    (c) => c.id === selectedCandidateId,
  );

  const renderStepContent = () => {
    switch (currentStep) {
      // ===== Step 0: Select Job =====
      case 0:
        return (
          <div>
            <Alert
              message="Select Job Position"
              description="Choose the job position for the AI interview"
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
            <Form.Item
              label="Job Position"
              required
              tooltip="Select the job position for the interview"
            >
              <Select
                placeholder="Search and select a job..."
                value={selectedJobId}
                onChange={(val) => {
                  setSelectedJobId(val);
                  setSelectedCandidateId(undefined);
                }}
                loading={loadingJobs}
                showSearch
                size="large"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                options={jobs.map((job) => ({
                  value: job.id,
                  label: `${job.title} — ${job.company}`,
                }))}
              />
            </Form.Item>
            {selectedJob && (
              <Card
                size="small"
                style={{
                  background: "#f6ffed",
                  borderColor: "#b7eb8f",
                  marginTop: 12,
                }}
              >
                <Text strong style={{ color: "#389e0d" }}>
                  <CheckCircleOutlined /> Selected:{" "}
                </Text>
                <Text>
                  {selectedJob.title} at {selectedJob.company}
                </Text>
              </Card>
            )}
          </div>
        );

      // ===== Step 1: Select Candidate =====
      case 1:
        return (
          <div>
            <Alert
              message="Select Candidate"
              description={`Choose a candidate from "${selectedJob?.title || "selected job"}" to interview`}
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
            <Form.Item
              label="Candidate"
              required
              tooltip="Select the candidate for the interview"
            >
              <Select
                placeholder="Search and select a candidate..."
                value={selectedCandidateId}
                onChange={setSelectedCandidateId}
                loading={loadingCandidates}
                showSearch
                size="large"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                options={candidates.map((candidate) => ({
                  value: candidate.id,
                  label: `${candidate.name} (${candidate.email || "No email"})${candidate.matchScore ? ` — ${candidate.matchScore}% match` : ""}`,
                }))}
              />
            </Form.Item>
            {selectedCandidate && (
              <Card
                size="small"
                style={{
                  background: "#f6ffed",
                  borderColor: "#b7eb8f",
                  marginTop: 12,
                }}
              >
                <Space direction="vertical" size={4}>
                  <Text strong style={{ color: "#389e0d" }}>
                    <CheckCircleOutlined /> Selected Candidate
                  </Text>
                  <Text>
                    <UserOutlined /> {selectedCandidate.name}
                  </Text>
                  <Text>
                    <MailOutlined /> {selectedCandidate.email || "No email"}
                  </Text>
                  {selectedCandidate.matchScore && (
                    <Tag color="blue">
                      Match Score: {selectedCandidate.matchScore}%
                    </Tag>
                  )}
                  {selectedCandidate.skills &&
                    selectedCandidate.skills.length > 0 && (
                      <div>
                        {selectedCandidate.skills.slice(0, 5).map((skill) => (
                          <Tag key={skill} style={{ marginBottom: 4 }}>
                            {skill}
                          </Tag>
                        ))}
                        {selectedCandidate.skills.length > 5 && (
                          <Tag>+{selectedCandidate.skills.length - 5} more</Tag>
                        )}
                      </div>
                    )}
                </Space>
              </Card>
            )}
          </div>
        );

      // ===== Step 2: Session Setup + Create =====
      case 2:
        return (
          <div>
            <Alert
              message="Session Setup"
              description="Set the interview date and time, then create the interview session"
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            {/* Summary of selections */}
            <Card
              size="small"
              style={{ marginBottom: 20, background: "#fafafa" }}
            >
              <Descriptions size="small" column={1}>
                <Descriptions.Item label="Job Position">
                  <Text strong>{selectedJob?.title}</Text>
                  <Text type="secondary"> at {selectedJob?.company}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Candidate">
                  <Text strong>{selectedCandidate?.name}</Text>
                  <Text type="secondary">
                    {" "}
                    ({selectedCandidate?.email})
                  </Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Form.Item
              name="interview_date"
              label="Interview Date"
              rules={[
                { required: true, message: "Please select interview date" },
              ]}
            >
              <DatePicker
                size="large"
                style={{ width: "100%" }}
                placeholder="Select interview date"
                disabledDate={(current) =>
                  current && current < dayjs().startOf("day")
                }
              />
            </Form.Item>

            <div style={{ display: "flex", gap: 16 }}>
              <Form.Item
                name="start_time"
                label="Start Time"
                rules={[
                  { required: true, message: "Please select start time" },
                ]}
                style={{ flex: 1 }}
              >
                <TimePicker
                  size="large"
                  style={{ width: "100%" }}
                  format="HH:mm"
                  placeholder="Start time"
                  minuteStep={5}
                />
              </Form.Item>

              <Form.Item
                name="end_time"
                label="End Time"
                rules={[
                  { required: true, message: "Please select end time" },
                ]}
                style={{ flex: 1 }}
              >
                <TimePicker
                  size="large"
                  style={{ width: "100%" }}
                  format="HH:mm"
                  placeholder="End time"
                  minuteStep={5}
                />
              </Form.Item>
            </div>
          </div>
        );

      // ===== Step 3: Generate Questions =====
      case 3:
        return (
          <div>
            <Alert
              message="Generate AI Questions"
              description="Generate interview questions using AI based on the job requirements and candidate profile"
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            {createdSession && (
              <Card
                size="small"
                style={{
                  marginBottom: 20,
                  background: "#f6ffed",
                  borderColor: "#b7eb8f",
                }}
              >
                <Descriptions size="small" column={1} title="Session Created">
                  <Descriptions.Item label="Interview ID">
                    <Text code copyable>
                      {createdSession.id}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Title">
                    {createdSession.title}
                  </Descriptions.Item>
                  <Descriptions.Item label="Duration">
                    {createdSession.duration} minutes
                  </Descriptions.Item>
                  <Descriptions.Item label="Session Password">
                    <Space>
                      <Text code strong style={{ fontSize: 16 }}>
                        {createdSession.sessionPassword}
                      </Text>
                      <Button
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={handleCopyPassword}
                      >
                        Copy
                      </Button>
                    </Space>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            {loading ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <Spin size="large" />
                <Paragraph style={{ marginTop: 16 }}>
                  Generating AI interview questions...
                </Paragraph>
                <Text type="secondary">
                  This may take a moment as we analyze the job requirements and
                  candidate profile.
                </Text>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <ThunderboltOutlined
                  style={{ fontSize: 48, color: "#722ed1", marginBottom: 16 }}
                />
                <Title level={4}>Ready to Generate Questions</Title>
                <Paragraph type="secondary">
                  Click the button below to generate AI-powered interview
                  questions tailored to the job requirements and candidate
                  profile.
                </Paragraph>
                <Button
                  type="primary"
                  size="large"
                  icon={<ThunderboltOutlined />}
                  onClick={handleGenerateQuestions}
                  loading={loading}
                  style={{
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    border: "none",
                    height: 48,
                    fontSize: 16,
                    paddingLeft: 32,
                    paddingRight: 32,
                  }}
                >
                  Generate Questions
                </Button>
              </div>
            )}
          </div>
        );

      // ===== Step 4: Review & Send =====
      case 4:
        return (
          <div>
            {emailSent ? (
              <Result
                status="success"
                title="Interview Invitation Sent!"
                subTitle={`The AI interview invitation has been sent to ${createdSession?.candidateEmail}`}
                extra={[
                  <Button
                    key="close"
                    type="primary"
                    onClick={() => {
                      onClose();
                      resetModal();
                    }}
                  >
                    Close
                  </Button>,
                ]}
              >
                <Descriptions
                  size="small"
                  column={1}
                  bordered
                  style={{ marginTop: 16 }}
                >
                  <Descriptions.Item label="Interview Title">
                    {createdSession?.title}
                  </Descriptions.Item>
                  <Descriptions.Item label="Interview ID">
                    <Text code>{createdSession?.id}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Candidate">
                    {createdSession?.candidateName} (
                    {createdSession?.candidateEmail})
                  </Descriptions.Item>
                  <Descriptions.Item label="Session Password">
                    <Text code strong>
                      {createdSession?.sessionPassword}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Questions">
                    {generatedQuestions.length} questions
                  </Descriptions.Item>
                </Descriptions>
              </Result>
            ) : (
              <>
                <Alert
                  message="Review & Send Interview"
                  description="Review the generated questions and send the interview invitation to the candidate"
                  type="success"
                  showIcon
                  style={{ marginBottom: 24 }}
                />

                {/* Session Summary */}
                {createdSession && (
                  <Card
                    size="small"
                    title={
                      <Space>
                        <FileTextOutlined />
                        <span>Interview Session Summary</span>
                      </Space>
                    }
                    style={{ marginBottom: 16 }}
                  >
                    <Descriptions size="small" column={2}>
                      <Descriptions.Item label="Title">
                        {createdSession.title}
                      </Descriptions.Item>
                      <Descriptions.Item label="Interview ID">
                        <Text code>{createdSession.id}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Job">
                        {createdSession.jobTitle}
                      </Descriptions.Item>
                      <Descriptions.Item label="Company">
                        {createdSession.companyName}
                      </Descriptions.Item>
                      <Descriptions.Item label="Candidate">
                        {createdSession.candidateName}
                      </Descriptions.Item>
                      <Descriptions.Item label="Email">
                        {createdSession.candidateEmail}
                      </Descriptions.Item>
                      <Descriptions.Item label="Duration">
                        {createdSession.duration} min
                      </Descriptions.Item>
                      <Descriptions.Item label="Password">
                        <Text code strong>
                          {createdSession.sessionPassword}
                        </Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Start Time">
                        {createdSession.sessionStart
                          ? new Date(
                              createdSession.sessionStart,
                            ).toLocaleString()
                          : "N/A"}
                      </Descriptions.Item>
                      <Descriptions.Item label="End Time">
                        {createdSession.sessionEnd
                          ? new Date(
                              createdSession.sessionEnd,
                            ).toLocaleString()
                          : "N/A"}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                )}

                {/* Questions List */}
                <Card
                  size="small"
                  title={
                    <Space>
                      <ThunderboltOutlined style={{ color: "#722ed1" }} />
                      <span>
                        Questions ({generatedQuestions.length})
                      </span>
                      {questionsModified && (
                        <Tag color="orange" style={{ marginLeft: 8 }}>
                          Modified
                        </Tag>
                      )}
                    </Space>
                  }
                  style={{ marginBottom: 16 }}
                >
                  <List
                    dataSource={generatedQuestions}
                    renderItem={(question: string, index: number) => (
                      <List.Item
                        style={{ padding: "8px 0" }}
                        actions={[
                          <Button
                            key="delete"
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeleteQuestion(index)}
                          />,
                        ]}
                      >
                        <div
                          style={{
                            width: "100%",
                            paddingRight: 8,
                          }}
                        >
                          <Text strong>
                            Q{index + 1}. {question}
                          </Text>
                        </div>
                      </List.Item>
                    )}
                    style={{ maxHeight: 280, overflow: "auto" }}
                    locale={{ emptyText: "No questions yet. Add one below." }}
                  />

                  <Divider style={{ margin: "12px 0" }} />

                  {/* Add Question Manually */}
                  <div style={{ display: "flex", gap: 8 }}>
                    <Input.TextArea
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      placeholder="Type a custom question to add..."
                      autoSize={{ minRows: 1, maxRows: 3 }}
                      style={{ flex: 1 }}
                      onPressEnter={(e) => {
                        if (!e.shiftKey) {
                          e.preventDefault();
                          handleAddQuestion();
                        }
                      }}
                    />
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleAddQuestion}
                      disabled={!newQuestion.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </Card>

                {/* Email Preview Info */}
                <Alert
                  message="Email will include"
                  description={
                    <ul style={{ margin: "8px 0 0 0", paddingLeft: 20 }}>
                      <li>
                        Interview Title: <strong>{createdSession?.title}</strong>
                      </li>
                      <li>
                        Interview ID: <strong>{createdSession?.id}</strong>
                      </li>
                      <li>
                        Session Password:{" "}
                        <strong>{createdSession?.sessionPassword}</strong>
                      </li>
                      <li>
                        Candidate Email:{" "}
                        <strong>{createdSession?.candidateEmail}</strong>
                      </li>
                      <li>
                        Start Time:{" "}
                        <strong>
                          {createdSession?.sessionStart
                            ? new Date(
                                createdSession.sessionStart,
                              ).toLocaleString()
                            : "N/A"}
                        </strong>
                      </li>
                      <li>
                        End Time:{" "}
                        <strong>
                          {createdSession?.sessionEnd
                            ? new Date(
                                createdSession.sessionEnd,
                              ).toLocaleString()
                            : "N/A"}
                        </strong>
                      </li>
                      <li>
                        <strong>"Start Now"</strong> button
                      </li>
                    </ul>
                  }
                  type="info"
                  showIcon
                  icon={<MailOutlined />}
                />
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const getStepButtons = () => {
    // If email already sent, only show close button
    if (emailSent) {
      return (
        <Button
          type="primary"
          onClick={() => {
            onClose();
            resetModal();
          }}
        >
          Close
        </Button>
      );
    }

    switch (currentStep) {
      case 0:
        return (
          <Space>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              type="primary"
              onClick={handleNext}
              disabled={!selectedJobId}
            >
              Next
            </Button>
          </Space>
        );

      case 1:
        return (
          <Space>
            <Button onClick={handlePrevious}>Previous</Button>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              type="primary"
              onClick={handleNext}
              disabled={!selectedCandidateId}
            >
              Next
            </Button>
          </Space>
        );

      case 2:
        return (
          <Space>
            <Button onClick={handlePrevious}>Previous</Button>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              type="primary"
              icon={<SolutionOutlined />}
              onClick={handleCreateSession}
              loading={loading}
            >
              Create Interview Session
            </Button>
          </Space>
        );

      case 3:
        return (
          <Space>
            <Button onClick={onClose}>Cancel</Button>
            {/* Generate button is rendered inline in the step content */}
          </Space>
        );

      case 4:
        return (
          <Space>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSendToCandidate}
              loading={loading}
              disabled={generatedQuestions.length === 0}
              size="large"
              style={{
                background:
                  "linear-gradient(135deg, #52c41a 0%, #389e0d 100%)",
                border: "none",
              }}
            >
              Send Interview to Candidate
            </Button>
          </Space>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      title={
        <Space>
          <ThunderboltOutlined style={{ color: "#722ed1" }} />
          <span>Create AI Interview</span>
        </Space>
      }
      open={visible}
      onCancel={() => {
        onClose();
        resetModal();
      }}
      width={850}
      footer={getStepButtons()}
      destroyOnClose
    >
      <Steps
        current={currentStep}
        style={{ marginBottom: 24 }}
        size="small"
        items={[
          {
            title: "Select Job",
            icon: <FileTextOutlined />,
          },
          {
            title: "Select Candidate",
            icon: <UserOutlined />,
          },
          {
            title: "Session Setup",
            icon: <CalendarOutlined />,
          },
          {
            title: "Generate Questions",
            icon: <ThunderboltOutlined />,
          },
          {
            title: "Review & Send",
            icon: <SendOutlined />,
          },
        ]}
      />

      <Form form={form} layout="vertical">
        {renderStepContent()}
      </Form>
    </Modal>
  );
}
