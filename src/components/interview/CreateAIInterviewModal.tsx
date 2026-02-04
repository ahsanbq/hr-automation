// Multi-step modal for creating AI Interview question sets
// Similar to MCQ Creator workflow

import React, { useState, useEffect } from "react";
import {
  Modal,
  Steps,
  Button,
  Form,
  Select,
  Radio,
  InputNumber,
  Input,
  message,
  Card,
  Space,
  Typography,
  Divider,
  List,
  Tag,
  Alert,
  Spin,
} from "antd";
import {
  ThunderboltOutlined,
  BulbOutlined,
  CodeOutlined,
  UserOutlined,
  CheckCircleOutlined,
  SaveOutlined,
  SendOutlined,
} from "@ant-design/icons";
import axios from "axios";
import {
  QuestionGenerationType,
  QuestionDifficulty,
} from "@/types/ai-interview";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

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
  const [questionType, setQuestionType] = useState<QuestionGenerationType>(
    QuestionGenerationType.BEHAVIORAL,
  );
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>();
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [templateTitle, setTemplateTitle] = useState("");

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
    setQuestionType(QuestionGenerationType.BEHAVIORAL);
    setSelectedCandidateId(undefined);
    setGeneratedQuestions([]);
    setTemplateTitle("");
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
      console.log("Candidates API response:", response.data);
      const candidatesData = response.data.resumes || response.data || [];
      const candidatesList = candidatesData.map((resume: any) => ({
        id: resume.id,
        name: resume.candidateName,
        email: resume.candidateEmail,
      }));
      console.log("Parsed candidates list:", candidatesList);
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
      // Validate job selection
      if (!selectedJobId) {
        message.error("Please select a job");
        return;
      }
    } else if (currentStep === 1) {
      // Validate question type and candidate if needed
      if (
        questionType === QuestionGenerationType.CUSTOMIZED &&
        !selectedCandidateId
      ) {
        message.error("Please select a candidate for customized questions");
        return;
      }
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleGenerateQuestions = async () => {
    try {
      setLoading(true);
      const values = form.getFieldsValue();
      const token = localStorage.getItem("token");

      console.log("🔵 Generate Questions - Selected Job ID:", selectedJobId);
      console.log("🔵 Question Type:", questionType);
      console.log("🔵 Form Values:", values);
      console.log("🔵 Selected Candidate ID:", selectedCandidateId);

      // Validate selectedJobId
      if (!selectedJobId) {
        message.error("Please select a job first");
        setLoading(false);
        return;
      }

      let response;
      let endpoint = "";
      let payload: any = { jobPostId: selectedJobId };

      switch (questionType) {
        case QuestionGenerationType.BEHAVIORAL:
          endpoint = "/api/interview/generate-behavioral";
          payload = {
            ...payload,
            number_of_questions: values.number_of_questions || 5,
            focus_areas: values.focus_areas || [],
            difficulty: values.difficulty || QuestionDifficulty.MEDIUM,
          };
          break;

        case QuestionGenerationType.TECHNICAL:
          endpoint = `/api/interview/generate-technical?difficulty=${values.difficulty || QuestionDifficulty.MEDIUM}&num_questions=${values.number_of_questions || 5}`;
          break;

        case QuestionGenerationType.CUSTOMIZED:
          if (!selectedCandidateId) {
            message.error("Please select a candidate");
            setLoading(false);
            return;
          }
          endpoint = `/api/interview/generate-customized?difficulty=${values.difficulty || QuestionDifficulty.MEDIUM}&num_questions=${values.number_of_questions || 5}`;
          payload.resumeId = selectedCandidateId;
          break;
      }

      console.log("🔵 API Endpoint:", endpoint);
      console.log("🔵 Payload:", payload);

      response = await axios.post(endpoint, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const questions = response.data.data.questions || [];
        setGeneratedQuestions(questions);

        // Auto-generate template title
        const selectedJob = jobs.find((j) => j.id === selectedJobId);
        const typeLabel =
          questionType.charAt(0) + questionType.slice(1).toLowerCase();
        setTemplateTitle(
          `${typeLabel} Questions - ${selectedJob?.title || "Job"}`,
        );

        message.success(
          `Generated ${questions.length} questions successfully!`,
        );
        handleNext(); // Move to review step
      } else {
        message.error("Failed to generate questions");
      }
    } catch (error: any) {
      console.error("❌ Generate error:", error);
      console.error("❌ Error response:", error.response?.data);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to generate questions";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateTitle.trim()) {
      message.error("Please enter a template title");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const values = form.getFieldsValue();

      await axios.post(
        "/api/interview/ai-templates",
        {
          title: templateTitle,
          description: values.description,
          questionType,
          questions: generatedQuestions,
          jobPostId: selectedJobId,
          difficulty: values.difficulty,
          totalQuestions: generatedQuestions.length,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      message.success("AI Interview template saved successfully!");
      onSuccess?.();
      onClose();
      resetModal();
    } catch (error: any) {
      console.error("Save error:", error);
      message.error(error.response?.data?.error || "Failed to save template");
    } finally {
      setLoading(false);
    }
  };

  const handleSendToCandidate = async () => {
    if (!selectedCandidateId) {
      message.error("Please select a candidate");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      await axios.post(
        "/api/interview/send-ai-interview",
        {
          candidateId: selectedCandidateId,
          jobPostId: selectedJobId,
          questions: generatedQuestions,
          questionType,
          duration: form.getFieldValue("duration") || 30,
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        // Step 1: Select Job
        return (
          <div>
            <Alert
              message="Select Job Position"
              description="Choose the job for which you want to create AI interview questions"
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
            <Form.Item
              label="Job Position"
              required
              tooltip="Select the job position"
            >
              <Select
                placeholder="Select a job"
                value={selectedJobId}
                onChange={setSelectedJobId}
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
                  label: `${job.title} - ${job.company}`,
                }))}
              />
            </Form.Item>
          </div>
        );

      case 1:
        // Step 2: Select Question Type and Configure
        return (
          <div>
            <Alert
              message="Configure AI Interview Questions"
              description="Select question type and configure generation parameters"
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Form.Item label="Question Type" required>
              <Radio.Group
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value)}
                size="large"
              >
                <Radio.Button value={QuestionGenerationType.BEHAVIORAL}>
                  <BulbOutlined /> Behavioral
                </Radio.Button>
                <Radio.Button value={QuestionGenerationType.TECHNICAL}>
                  <CodeOutlined /> Technical
                </Radio.Button>
                <Radio.Button value={QuestionGenerationType.CUSTOMIZED}>
                  <UserOutlined /> Customized
                </Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Divider />

            <Form.Item
              name="number_of_questions"
              label="Number of Questions"
              initialValue={5}
            >
              <InputNumber min={1} max={20} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="difficulty"
              label="Difficulty Level"
              initialValue={QuestionDifficulty.MEDIUM}
            >
              <Select size="large">
                <Select.Option value={QuestionDifficulty.EASY}>
                  Easy
                </Select.Option>
                <Select.Option value={QuestionDifficulty.MEDIUM}>
                  Medium
                </Select.Option>
                <Select.Option value={QuestionDifficulty.HARD}>
                  Hard
                </Select.Option>
              </Select>
            </Form.Item>

            {questionType === QuestionGenerationType.CUSTOMIZED && (
              <Form.Item label="Select Candidate" required>
                <Select
                  placeholder="Select a candidate"
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
                    label: `${candidate.name} (${candidate.email})`,
                  }))}
                />
              </Form.Item>
            )}

            {questionType === QuestionGenerationType.BEHAVIORAL && (
              <Form.Item name="focus_areas" label="Focus Areas (Optional)">
                <Select
                  mode="tags"
                  size="large"
                  placeholder="Add focus areas (e.g., Leadership, Communication)"
                />
              </Form.Item>
            )}

            <Form.Item
              name="duration"
              label="Interview Duration (minutes)"
              initialValue={30}
            >
              <InputNumber min={10} max={120} style={{ width: "100%" }} />
            </Form.Item>
          </div>
        );

      case 2:
        // Step 3: Review and Save/Send
        return (
          <div>
            <Alert
              message="Review Generated Questions"
              description="Review the AI-generated questions and save as template or send to candidate"
              type="success"
              showIcon
              style={{ marginBottom: 24 }}
            />

            {loading ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <Spin size="large" />
                <Paragraph style={{ marginTop: 16 }}>
                  Generating questions...
                </Paragraph>
              </div>
            ) : generatedQuestions.length > 0 ? (
              <>
                <Card style={{ marginBottom: 16 }}>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <div>
                      <Tag color="blue">{questionType}</Tag>
                      <Tag color="green">
                        {generatedQuestions.length} Questions
                      </Tag>
                    </div>
                    <Form.Item
                      label="Template Title"
                      tooltip="Give this question set a name for future use"
                    >
                      <Input
                        value={templateTitle}
                        onChange={(e) => setTemplateTitle(e.target.value)}
                        placeholder="e.g., Senior Developer Behavioral Questions"
                        size="large"
                      />
                    </Form.Item>
                    <Form.Item
                      name="description"
                      label="Description (Optional)"
                    >
                      <TextArea
                        rows={2}
                        placeholder="Add description for this question set"
                      />
                    </Form.Item>
                  </Space>
                </Card>

                <List
                  dataSource={generatedQuestions}
                  renderItem={(question: any, index) => (
                    <List.Item>
                      <Card style={{ width: "100%" }} size="small">
                        <Space direction="vertical" style={{ width: "100%" }}>
                          <Text strong>
                            {index + 1}. {question.question}
                          </Text>
                          {question.expectedAnswer && (
                            <Paragraph
                              type="secondary"
                              style={{ marginBottom: 0 }}
                            >
                              <Text type="secondary">Expected: </Text>
                              {question.expectedAnswer}
                            </Paragraph>
                          )}
                          {question.category && <Tag>{question.category}</Tag>}
                        </Space>
                      </Card>
                    </List.Item>
                  )}
                  style={{ maxHeight: 400, overflow: "auto" }}
                />

                {questionType === QuestionGenerationType.CUSTOMIZED && (
                  <Alert
                    message="Send to Candidate"
                    description="These customized questions are ready to be sent to the selected candidate"
                    type="info"
                    showIcon
                    style={{ marginTop: 16 }}
                  />
                )}
              </>
            ) : (
              <Alert
                message="No questions generated yet"
                description="Click 'Generate Questions' to create AI interview questions"
                type="warning"
                showIcon
              />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const getStepButtons = () => {
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
              icon={<ThunderboltOutlined />}
              onClick={handleGenerateQuestions}
              loading={loading}
            >
              Generate Questions
            </Button>
          </Space>
        );

      case 2:
        return (
          <Space>
            <Button onClick={handlePrevious}>Previous</Button>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              icon={<SaveOutlined />}
              onClick={handleSaveTemplate}
              loading={loading}
              disabled={generatedQuestions.length === 0}
            >
              Save as Template
            </Button>
            {questionType === QuestionGenerationType.CUSTOMIZED && (
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendToCandidate}
                loading={loading}
                disabled={
                  generatedQuestions.length === 0 || !selectedCandidateId
                }
              >
                Send to Candidate
              </Button>
            )}
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
          <span>Create AI Interview Questions</span>
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
            title: "Select Job",
            icon: <UserOutlined />,
          },
          {
            title: "Configure",
            icon: <ThunderboltOutlined />,
          },
          {
            title: "Review & Save",
            icon: <CheckCircleOutlined />,
          },
        ]}
      />

      <Form form={form} layout="vertical">
        {renderStepContent()}
      </Form>
    </Modal>
  );
}
