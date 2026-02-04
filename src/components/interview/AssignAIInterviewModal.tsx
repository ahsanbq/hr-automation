// Modal to assign saved AI Interview templates to candidates
// Multi-step flow: Select Template -> Select Job -> Select Candidate -> Send

import React, { useState, useEffect } from "react";
import {
  Modal,
  Steps,
  Button,
  Select,
  List,
  Card,
  Space,
  Typography,
  Tag,
  Radio,
  message,
  Alert,
  Spin,
  Empty,
  Divider,
} from "antd";
import {
  ThunderboltOutlined,
  CheckCircleOutlined,
  SendOutlined,
  FileTextOutlined,
  UserOutlined,
  FolderOutlined,
} from "@ant-design/icons";
import axios from "axios";

const { Title, Text, Paragraph } = Typography;

interface AssignAIInterviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface AITemplate {
  id: string;
  title: string;
  description?: string;
  questionType: string;
  totalQuestions: number;
  difficulty?: string;
  questions: any[];
  createdAt: string;
  createdBy: {
    name: string;
    email: string;
  };
}

interface JobOption {
  id: string;
  jobTitle: string;
  company: string;
  companyName: string;
}

interface CandidateOption {
  id: string;
  candidateName: string;
  candidateEmail: string;
  matchScore?: number;
}

export default function AssignAIInterviewModal({
  visible,
  onClose,
  onSuccess,
}: AssignAIInterviewModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<AITemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [candidates, setCandidates] = useState<CandidateOption[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  // Selected values
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>();
  const [selectedJobId, setSelectedJobId] = useState<string>();
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>();

  useEffect(() => {
    if (visible) {
      fetchTemplates();
      fetchJobs();
      resetModal();
    }
  }, [visible]);

  useEffect(() => {
    if (selectedJobId) {
      fetchCandidatesForJob(selectedJobId);
    }
  }, [selectedJobId]);

  const resetModal = () => {
    setCurrentStep(0);
    setSelectedTemplateId(undefined);
    setSelectedJobId(undefined);
    setSelectedCandidateId(undefined);
  };

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/interview/ai-templates", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
      message.error("Failed to load AI interview templates");
    } finally {
      setLoadingTemplates(false);
    }
  };

  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/jobs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const jobsData = response.data.jobs || response.data || [];
      setJobs(jobsData);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
      message.error("Failed to load jobs");
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
      setCandidates(candidatesData);
    } catch (error) {
      console.error("Failed to fetch candidates:", error);
      message.error("Failed to load candidates");
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 0 && !selectedTemplateId) {
      message.error("Please select a question template");
      return;
    }
    if (currentStep === 1 && !selectedJobId) {
      message.error("Please select a job");
      return;
    }
    if (currentStep === 2 && !selectedCandidateId) {
      message.error("Please select a candidate");
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSendInterview = async () => {
    if (!selectedTemplateId || !selectedJobId || !selectedCandidateId) {
      message.error("Please complete all steps");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const selectedTemplate = templates.find(
        (t) => t.id === selectedTemplateId,
      );

      if (!selectedTemplate) {
        message.error("Selected template not found");
        return;
      }

      await axios.post(
        "/api/interview/send-ai-interview",
        {
          candidateId: selectedCandidateId,
          jobPostId: selectedJobId,
          questions: selectedTemplate.questions,
          questionType: selectedTemplate.questionType,
          duration: 30, // Default duration
          templateId: selectedTemplateId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      message.success("AI Interview sent to candidate successfully!");
      onSuccess?.();
      onClose();
      resetModal();
    } catch (error: any) {
      console.error("Send error:", error);
      message.error(error.response?.data?.error || "Failed to send interview");
    } finally {
      setLoading(false);
    }
  };

  const getSelectedTemplate = () => {
    return templates.find((t) => t.id === selectedTemplateId);
  };

  const getSelectedJob = () => {
    return jobs.find((j) => j.id === selectedJobId);
  };

  const getSelectedCandidate = () => {
    return candidates.find((c) => c.id === selectedCandidateId);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        // Step 1: Select AI Interview Template
        return (
          <div>
            <Alert
              message="Select AI Interview Template"
              description="Choose from your saved AI interview question sets"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            {loadingTemplates ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <Spin size="large" />
              </div>
            ) : templates.length === 0 ? (
              <Empty
                description="No AI interview templates found. Create one first using 'Create AI Interview' button."
                style={{ padding: "40px" }}
              />
            ) : (
              <Radio.Group
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                style={{ width: "100%" }}
              >
                <Space direction="vertical" style={{ width: "100%" }}>
                  {templates.map((template) => (
                    <Card
                      key={template.id}
                      hoverable
                      style={{
                        cursor: "pointer",
                        border:
                          selectedTemplateId === template.id
                            ? "2px solid #722ed1"
                            : "1px solid #d9d9d9",
                      }}
                      onClick={() => setSelectedTemplateId(template.id)}
                    >
                      <Radio value={template.id}>
                        <Space direction="vertical" style={{ width: "100%" }}>
                          <Text strong style={{ fontSize: 16 }}>
                            {template.title}
                          </Text>
                          {template.description && (
                            <Text type="secondary">{template.description}</Text>
                          )}
                          <Space wrap>
                            <Tag color="blue">{template.questionType}</Tag>
                            <Tag color="green">
                              {template.totalQuestions} Questions
                            </Tag>
                            {template.difficulty && (
                              <Tag color="orange">{template.difficulty}</Tag>
                            )}
                          </Space>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Created by {template.createdBy.name} on{" "}
                            {new Date(template.createdAt).toLocaleDateString()}
                          </Text>
                        </Space>
                      </Radio>
                    </Card>
                  ))}
                </Space>
              </Radio.Group>
            )}
          </div>
        );

      case 1:
        // Step 2: Select Job
        return (
          <div>
            <Alert
              message="Select Job Position"
              description="Choose the job for which you want to assign this AI interview"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            {getSelectedTemplate() && (
              <Card style={{ marginBottom: 16, background: "#f0f2f5" }}>
                <Space>
                  <FileTextOutlined
                    style={{ fontSize: 20, color: "#722ed1" }}
                  />
                  <div>
                    <Text strong>Selected Template:</Text>
                    <br />
                    <Text>{getSelectedTemplate()?.title}</Text>
                  </div>
                </Space>
              </Card>
            )}

            {loadingJobs ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <Spin size="large" />
              </div>
            ) : (
              <Select
                placeholder="Select a job position"
                value={selectedJobId}
                onChange={setSelectedJobId}
                loading={loadingJobs}
                showSearch
                size="large"
                style={{ width: "100%" }}
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                options={jobs.map((job) => ({
                  value: job.id,
                  label: `${job.jobTitle} - ${job.company || job.companyName}`,
                }))}
              />
            )}
          </div>
        );

      case 2:
        // Step 3: Select Candidate
        return (
          <div>
            <Alert
              message="Select Candidate"
              description="Choose the candidate to receive this AI interview"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            {getSelectedJob() && (
              <Card style={{ marginBottom: 16, background: "#f0f2f5" }}>
                <Space>
                  <FolderOutlined style={{ fontSize: 20, color: "#722ed1" }} />
                  <div>
                    <Text strong>Selected Job:</Text>
                    <br />
                    <Text>
                      {getSelectedJob()?.jobTitle} -{" "}
                      {getSelectedJob()?.company ||
                        getSelectedJob()?.companyName}
                    </Text>
                  </div>
                </Space>
              </Card>
            )}

            {loadingCandidates ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <Spin size="large" />
              </div>
            ) : candidates.length === 0 ? (
              <Empty
                description="No candidates found for this job position"
                style={{ padding: "40px" }}
              />
            ) : (
              <Radio.Group
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
                style={{ width: "100%" }}
              >
                <Space direction="vertical" style={{ width: "100%" }}>
                  {candidates.map((candidate) => (
                    <Card
                      key={candidate.id}
                      hoverable
                      style={{
                        cursor: "pointer",
                        border:
                          selectedCandidateId === candidate.id
                            ? "2px solid #722ed1"
                            : "1px solid #d9d9d9",
                      }}
                      onClick={() => setSelectedCandidateId(candidate.id)}
                    >
                      <Radio value={candidate.id}>
                        <Space direction="vertical">
                          <Text strong>{candidate.candidateName}</Text>
                          <Text type="secondary">
                            {candidate.candidateEmail}
                          </Text>
                          {candidate.matchScore && (
                            <Tag color="green">
                              Match: {candidate.matchScore}%
                            </Tag>
                          )}
                        </Space>
                      </Radio>
                    </Card>
                  ))}
                </Space>
              </Radio.Group>
            )}
          </div>
        );

      case 3:
        // Step 4: Review & Send
        const template = getSelectedTemplate();
        const job = getSelectedJob();
        const candidate = getSelectedCandidate();

        return (
          <div>
            <Alert
              message="Review & Send"
              description="Review your selection and send the AI interview invitation"
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Space direction="vertical" style={{ width: "100%" }} size="large">
              <Card title="Interview Template">
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Text strong>{template?.title}</Text>
                  {template?.description && (
                    <Text type="secondary">{template.description}</Text>
                  )}
                  <Space wrap>
                    <Tag color="blue">{template?.questionType}</Tag>
                    <Tag color="green">
                      {template?.totalQuestions} Questions
                    </Tag>
                    {template?.difficulty && (
                      <Tag color="orange">{template.difficulty}</Tag>
                    )}
                  </Space>
                </Space>
              </Card>

              <Card title="Job Position">
                <Text strong>
                  {job?.jobTitle} - {job?.company || job?.companyName}
                </Text>
              </Card>

              <Card title="Candidate">
                <Space direction="vertical">
                  <Text strong>{candidate?.candidateName}</Text>
                  <Text type="secondary">{candidate?.candidateEmail}</Text>
                  {candidate?.matchScore && (
                    <Tag color="green">Match: {candidate.matchScore}%</Tag>
                  )}
                </Space>
              </Card>

              <Alert
                message="Email Notification"
                description="The candidate will receive an email with interview link and session password"
                type="info"
                showIcon
              />
            </Space>
          </div>
        );

      default:
        return null;
    }
  };

  const getStepButtons = () => {
    if (currentStep === 0) {
      return (
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            onClick={handleNext}
            disabled={!selectedTemplateId || templates.length === 0}
          >
            Next
          </Button>
        </Space>
      );
    } else if (currentStep === 3) {
      return (
        <Space>
          <Button onClick={handlePrevious}>Previous</Button>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSendInterview}
            loading={loading}
          >
            Send Interview
          </Button>
        </Space>
      );
    } else {
      return (
        <Space>
          <Button onClick={handlePrevious}>Previous</Button>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={handleNext}>
            Next
          </Button>
        </Space>
      );
    }
  };

  return (
    <Modal
      title={
        <Space>
          <ThunderboltOutlined style={{ color: "#722ed1" }} />
          <span>Assign AI Interview</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={getStepButtons()}
      destroyOnClose
    >
      <Steps
        current={currentStep}
        style={{ marginBottom: 24 }}
        items={[
          {
            title: "Select Template",
            icon: <FileTextOutlined />,
          },
          {
            title: "Select Job",
            icon: <FolderOutlined />,
          },
          {
            title: "Select Candidate",
            icon: <UserOutlined />,
          },
          {
            title: "Review & Send",
            icon: <CheckCircleOutlined />,
          },
        ]}
      />

      {renderStepContent()}
    </Modal>
  );
}
