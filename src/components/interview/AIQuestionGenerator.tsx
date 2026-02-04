// AI Interview Question Generator Component
// Allows HR to select question type and generate AI-powered interview questions

import React, { useState, useEffect } from "react";
import {
  Modal,
  Radio,
  InputNumber,
  Select,
  Button,
  Form,
  Space,
  Alert,
  Card,
  Tag,
  Spin,
  Typography,
  Divider,
  List,
  message,
} from "antd";
import {
  BulbOutlined,
  CodeOutlined,
  UserOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import axios from "axios";
import {
  QuestionGenerationType,
  QuestionDifficulty,
  BehavioralQuestionResponse,
  TechnicalQuestionResponse,
  CustomizedQuestionResponse,
} from "@/types/ai-interview";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface AIQuestionGeneratorProps {
  visible: boolean;
  onClose: () => void;
  jobPostId?: string; // Optional - can be selected from dropdown
  resumeId?: string; // Required only for customized questions
  candidateName?: string;
  onQuestionsGenerated?: (questions: any[]) => void;
}

interface JobOption {
  id: string;
  title: string;
  company: string;
}

export default function AIQuestionGenerator({
  visible,
  onClose,
  jobPostId,
  resumeId,
  candidateName,
  onQuestionsGenerated,
}: AIQuestionGeneratorProps) {
  console.log("🔷 AIQuestionGenerator RENDERED", { visible, jobPostId, resumeId });
  
  const [form] = Form.useForm();
  const [questionType, setQuestionType] = useState<QuestionGenerationType>(
    QuestionGenerationType.BEHAVIORAL
  );
  const [loading, setLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | undefined>(jobPostId);

  // Fetch jobs list when modal opens
  useEffect(() => {
    if (visible && !jobPostId) {
      fetchJobs();
    }
    // Set selected job if provided via props
    if (jobPostId) {
      setSelectedJobId(jobPostId);
    }
  }, [visible, jobPostId]);

  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/jobs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Jobs API response:", response.data);
      const jobsData = response.data.jobs || response.data || [];
      const jobsList = jobsData.map((job: any) => ({
        id: job.id,
        title: job.jobTitle,
        company: job.company,
      }));
      console.log("Parsed jobs list:", jobsList);
      setJobs(jobsList);
      if (jobsList.length === 0) {
        message.warning("No job positions found. Please create a job post first.");
      }
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
      message.error("Failed to load jobs list");
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleGenerate = async () => {
    console.log("🔵 Generate button clicked");
    console.log("🔵 selectedJobId:", selectedJobId);
    console.log("🔵 resumeId:", resumeId);
    console.log("🔵 questionType:", questionType);
    
    try {
      console.log("🔵 Validating form fields...");
      await form.validateFields();
      const values = form.getFieldsValue();
      console.log("🔵 Form values:", values);
      
      // Validate selectedJobId
      if (!selectedJobId || selectedJobId.trim() === '') {
        console.error("❌ selectedJobId is missing or empty");
        message.error("Please select a job to generate questions");
        return;
      }
      
      console.log("🔵 Setting loading state...");
      setLoading(true);
      setGeneratedQuestions([]);
      setShowResults(false);

      // Get JWT token from localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("❌ JWT token not found");
        message.error("You must be logged in to generate questions");
        setLoading(false);
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      let response;

      console.log("🔵 Making API call for question type:", questionType);

      switch (questionType) {
        case QuestionGenerationType.BEHAVIORAL:
          console.log("🔵 Calling behavioral API with:", {
            selectedJobId,
            number_of_questions: values.number_of_questions,
            focus_areas: values.focus_areas,
            difficulty: values.difficulty,
          });
          response = await axios.post<{
            success: boolean;
            data: BehavioralQuestionResponse;
          }>(
            "/api/interview/generate-behavioral",
            {
              jobPostId: selectedJobId,
              number_of_questions: values.number_of_questions,
              focus_areas: values.focus_areas,
              difficulty: values.difficulty,
            },
            { headers }
          );
          break;

        case QuestionGenerationType.TECHNICAL:
          console.log("🔵 Calling technical API with:", { selectedJobId });
          response = await axios.post<{
            success: boolean;
            data: TechnicalQuestionResponse;
          }>(
            `/api/interview/generate-technical?difficulty=${values.difficulty}&num_questions=${values.number_of_questions}`,
            { jobPostId: selectedJobId },
            { headers }
          );
          break;

        case QuestionGenerationType.CUSTOMIZED:
          if (!resumeId) {
            console.error("❌ resumeId is missing for customized questions");
            message.error("Candidate resume is required for customized questions");
            setLoading(false);
            return;
          }
          console.log("🔵 Calling customized API with:", { selectedJobId, resumeId });
          response = await axios.post<{
            success: boolean;
            data: CustomizedQuestionResponse;
          }>(
            `/api/interview/generate-customized?difficulty=${values.difficulty}&num_questions=${values.number_of_questions}`,
            { jobPostId: selectedJobId, resumeId },
            { headers }
          );
          break;

        default:
          throw new Error("Invalid question type");
      }

      console.log("🔵 API Response:", response.data);

      if (response.data.success && response.data.data.questions) {
        setGeneratedQuestions(response.data.data.questions);
        setShowResults(true);
        message.success(
          `Successfully generated ${response.data.data.questions.length} questions!`
        );
        
        if (onQuestionsGenerated) {
          onQuestionsGenerated(response.data.data.questions);
        }
      } else {
        console.error("❌ Invalid response format:", response.data);
        message.error("Failed to generate questions");
      }
    } catch (error: any) {
      console.error("❌ Error generating questions:", error);
      console.error("❌ Error response:", error.response?.data);
      message.error(
        error.response?.data?.error || error.message || "Failed to generate questions"
      );
    } finally {
      console.log("🔵 Setting loading to false");
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    setGeneratedQuestions([]);
    setShowResults(false);
    // Reset selectedJobId only if it wasn't provided via props
    if (!jobPostId) {
      setSelectedJobId(undefined);
    }
  };

  const getQuestionTypeIcon = (type: QuestionGenerationType) => {
    switch (type) {
      case QuestionGenerationType.BEHAVIORAL:
        return <BulbOutlined />;
      case QuestionGenerationType.TECHNICAL:
        return <CodeOutlined />;
      case QuestionGenerationType.CUSTOMIZED:
        return <UserOutlined />;
      default:
        return <ThunderboltOutlined />;
    }
  };

  const getQuestionTypeDescription = (type: QuestionGenerationType) => {
    switch (type) {
      case QuestionGenerationType.BEHAVIORAL:
        return "Generate questions focused on soft skills, problem-solving, and past experiences";
      case QuestionGenerationType.TECHNICAL:
        return "Generate questions based on technical skills and job requirements";
      case QuestionGenerationType.CUSTOMIZED:
        return "Generate personalized questions tailored to the candidate's resume and experience";
      default:
        return "";
    }
  };

  return (
    <Modal
      title={
        <Space>
          <ThunderboltOutlined style={{ color: "#1890ff" }} />
          <span>AI Interview Question Generator</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={null}
      destroyOnClose
    >
      {!showResults ? (
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            number_of_questions: 5,
            difficulty: QuestionDifficulty.MEDIUM,
            focus_areas: [],
          }}
        >
          {/* Job Selector - show if no jobPostId provided */}
          {!jobPostId && (
            <Form.Item
              label="Select Job"
              required
              tooltip="Choose the job position for which you want to generate interview questions"
            >
              <Select
                placeholder="Select a job position"
                value={selectedJobId}
                onChange={setSelectedJobId}
                loading={loadingJobs}
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={jobs.map(job => ({
                  value: job.id,
                  label: `${job.title} - ${job.company}`,
                }))}
                size="large"
              />
            </Form.Item>
          )}
          
          <Alert
            message="Select Question Generation Type"
            description="Choose how you want to generate interview questions for this candidate"
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          {/* Question Type Selector */}
          <Form.Item label="Question Type" required>
            <Radio.Group
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value)}
              style={{ width: "100%" }}
            >
              <Space direction="vertical" style={{ width: "100%" }}>
                <Card
                  hoverable
                  size="small"
                  style={{
                    borderColor:
                      questionType === QuestionGenerationType.BEHAVIORAL
                        ? "#1890ff"
                        : "#d9d9d9",
                  }}
                >
                  <Radio value={QuestionGenerationType.BEHAVIORAL}>
                    <Space>
                      {getQuestionTypeIcon(QuestionGenerationType.BEHAVIORAL)}
                      <strong>Behavioral Questions</strong>
                    </Space>
                    <Paragraph
                      type="secondary"
                      style={{ marginLeft: 24, marginBottom: 0, marginTop: 4 }}
                    >
                      {getQuestionTypeDescription(
                        QuestionGenerationType.BEHAVIORAL
                      )}
                    </Paragraph>
                  </Radio>
                </Card>

                <Card
                  hoverable
                  size="small"
                  style={{
                    borderColor:
                      questionType === QuestionGenerationType.TECHNICAL
                        ? "#1890ff"
                        : "#d9d9d9",
                  }}
                >
                  <Radio value={QuestionGenerationType.TECHNICAL}>
                    <Space>
                      {getQuestionTypeIcon(QuestionGenerationType.TECHNICAL)}
                      <strong>Technical Questions</strong>
                    </Space>
                    <Paragraph
                      type="secondary"
                      style={{ marginLeft: 24, marginBottom: 0, marginTop: 4 }}
                    >
                      {getQuestionTypeDescription(
                        QuestionGenerationType.TECHNICAL
                      )}
                    </Paragraph>
                  </Radio>
                </Card>

                <Card
                  hoverable
                  size="small"
                  style={{
                    borderColor:
                      questionType === QuestionGenerationType.CUSTOMIZED
                        ? "#1890ff"
                        : "#d9d9d9",
                  }}
                  className={!resumeId ? "disabled" : ""}
                >
                  <Radio
                    value={QuestionGenerationType.CUSTOMIZED}
                    disabled={!resumeId}
                  >
                    <Space>
                      {getQuestionTypeIcon(QuestionGenerationType.CUSTOMIZED)}
                      <strong>Customized Candidate Questions</strong>
                      {candidateName && (
                        <Tag color="blue">{candidateName}</Tag>
                      )}
                    </Space>
                    <Paragraph
                      type="secondary"
                      style={{ marginLeft: 24, marginBottom: 0, marginTop: 4 }}
                    >
                      {getQuestionTypeDescription(
                        QuestionGenerationType.CUSTOMIZED
                      )}
                    </Paragraph>
                  </Radio>
                  {!resumeId && (
                    <Text type="danger" style={{ marginLeft: 24, fontSize: 12 }}>
                      * Candidate must be selected to use this option
                    </Text>
                  )}
                </Card>
              </Space>
            </Radio.Group>
          </Form.Item>

          <Divider />

          {/* Common Configuration */}
          <Form.Item
            label="Number of Questions"
            name="number_of_questions"
            rules={[
              { required: true, message: "Please specify number of questions" },
            ]}
          >
            <InputNumber min={1} max={20} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="Difficulty Level"
            name="difficulty"
            rules={[{ required: true, message: "Please select difficulty" }]}
          >
            <Select>
              <Option value={QuestionDifficulty.EASY}>
                <Tag color="green">Easy</Tag> - Entry level candidates
              </Option>
              <Option value={QuestionDifficulty.MEDIUM}>
                <Tag color="orange">Medium</Tag> - Mid-level professionals
              </Option>
              <Option value={QuestionDifficulty.HARD}>
                <Tag color="red">Hard</Tag> - Senior/Expert level
              </Option>
            </Select>
          </Form.Item>

          {/* Focus Areas (only for Behavioral) */}
          {questionType === QuestionGenerationType.BEHAVIORAL && (
            <Form.Item
              label="Focus Areas"
              name="focus_areas"
              rules={[
                {
                  required: true,
                  message: "Please select at least one focus area",
                },
              ]}
            >
              <Select
                mode="tags"
                placeholder="Enter or select focus areas (e.g., Leadership, Teamwork)"
                style={{ width: "100%" }}
              >
                <Option value="Leadership">Leadership</Option>
                <Option value="Teamwork">Teamwork</Option>
                <Option value="Problem Solving">Problem Solving</Option>
                <Option value="Communication">Communication</Option>
                <Option value="Conflict Resolution">Conflict Resolution</Option>
                <Option value="Time Management">Time Management</Option>
                <Option value="Adaptability">Adaptability</Option>
                <Option value="Decision Making">Decision Making</Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="button"
                onClick={(e) => {
                  console.log("🟢 BUTTON CLICKED!", e);
                  handleGenerate();
                }}
                loading={loading}
                icon={<ThunderboltOutlined />}
              >
                Generate Questions
              </Button>
              <Button htmlType="button" onClick={handleReset}>Reset</Button>
              <Button htmlType="button" onClick={onClose}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      ) : (
        <>
          <Alert
            message={`Successfully Generated ${generatedQuestions.length} Questions`}
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <List
            dataSource={generatedQuestions}
            renderItem={(item: any, index) => (
              <Card
                size="small"
                style={{ marginBottom: 12 }}
                title={
                  <Space>
                    <Tag color="blue">Q{index + 1}</Tag>
                    <Text strong>{item.question}</Text>
                  </Space>
                }
              >
                {item.expected_answer_points && (
                  <>
                    <Text type="secondary" strong>
                      Expected Answer Points:
                    </Text>
                    <List
                      size="small"
                      dataSource={item.expected_answer_points}
                      renderItem={(point: string) => (
                        <List.Item>
                          <Text>• {point}</Text>
                        </List.Item>
                      )}
                    />
                  </>
                )}
                {item.reasoning && (
                  <>
                    <Divider style={{ margin: "8px 0" }} />
                    <Text type="secondary">
                      <strong>Reasoning:</strong> {item.reasoning}
                    </Text>
                  </>
                )}
              </Card>
            )}
          />

          <Space style={{ marginTop: 16 }}>
            <Button type="primary" onClick={handleReset}>
              Generate New Questions
            </Button>
            <Button onClick={onClose}>Close</Button>
          </Space>
        </>
      )}
    </Modal>
  );
}
