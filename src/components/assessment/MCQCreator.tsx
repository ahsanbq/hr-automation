/**
 * MCQ Creator Component for generating and managing MCQ questions
 */

import React, { useState } from "react";
import {
  Card,
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Space,
  Tag,
  Divider,
  Alert,
  Spin,
  Row,
  Col,
  Typography,
  message,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  QuestionCircleOutlined,
  SaveOutlined,
  SendOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  MCQService,
  MCQQuestion,
  MCQGenerationRequest,
} from "@/lib/mcq-service";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface MCQCreatorProps {
  onSave?: (questions: MCQQuestion[]) => void;
  onSend?: (questions: MCQQuestion[]) => void;
  jobId?: string;
  candidateId?: string;
}

export default function MCQCreator({
  onSave,
  onSend,
  jobId,
  candidateId,
}: MCQCreatorProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<MCQQuestion[]>(
    []
  );
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);

  const handleGenerate = async (values: MCQGenerationRequest) => {
    setLoading(true);
    try {
      console.log("Generating MCQ with values:", values);
      const response = await MCQService.generateQuestions(values);
      console.log("MCQ generation response:", response);

      if (response.success) {
        setGeneratedQuestions(response.questions);
        setSelectedQuestions(response.questions.map((_, index) => index));
        message.success(
          `Generated ${response.total_questions} questions successfully!`
        );
      } else {
        message.error(response.error || "Failed to generate questions");
      }
    } catch (error) {
      console.error("MCQ generation error:", error);
      message.error(
        error instanceof Error ? error.message : "Failed to generate questions"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuestion = (index: number, selected: boolean) => {
    if (selected) {
      setSelectedQuestions([...selectedQuestions, index]);
    } else {
      setSelectedQuestions(selectedQuestions.filter((i) => i !== index));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedQuestions(generatedQuestions.map((_, index) => index));
    } else {
      setSelectedQuestions([]);
    }
  };

  const handleSave = async () => {
    const questionsToSave = selectedQuestions.map(
      (index) => generatedQuestions[index]
    );
    if (questionsToSave.length === 0) {
      message.warning("Please select at least one question to save");
      return;
    }

    try {
      setLoading(true);

      // Get topics from selected questions
      const topics = [...new Set(questionsToSave.map((q) => q.topic))];

      // Get difficulty (use most common difficulty)
      const difficulties = questionsToSave.map((q) => q.difficulty);
      const difficulty = difficulties.reduce((a, b, i, arr) =>
        arr.filter((v) => v === a).length >= arr.filter((v) => v === b).length
          ? a
          : b
      );

      // Convert difficulty to uppercase for Prisma enum
      const prismaDifficulty = difficulty.toUpperCase() as
        | "EASY"
        | "MEDIUM"
        | "HARD";

      const response = await fetch("/api/assessments/mcq/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          questions: questionsToSave.map((q) => ({
            question: q.question,
            options: q.options,
            answer: q.answer,
            topic: q.topic,
            difficulty: prismaDifficulty,
          })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        message.success(
          `Saved ${questionsToSave.length} individual MCQ questions`
        );
        onSave?.(questionsToSave);
      } else {
        const error = await response.json();
        message.error(error.error || "Failed to save questions");
      }
    } catch (error) {
      message.error("Failed to save questions");
      console.error("Save error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    const questionsToSend = selectedQuestions.map(
      (index) => generatedQuestions[index]
    );
    if (questionsToSend.length === 0) {
      message.warning("Please select at least one question to send");
      return;
    }
    onSend?.(questionsToSend);
    message.success(`Prepared ${questionsToSend.length} questions for sending`);
  };

  const handleRegenerate = () => {
    const values = form.getFieldsValue();
    if (values.topics && values.topics.length > 0) {
      handleGenerate(values);
    } else {
      message.warning("Please fill in the form first");
    }
  };

  return (
    <div>
      {/* Generation Form */}
      <Card title="Generate MCQ Questions" style={{ marginBottom: 24 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleGenerate}
          initialValues={{
            difficulty: "Medium",
            number_of_questions: 5,
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="topics"
                label="Topics"
                rules={[
                  {
                    required: true,
                    message: "Please enter at least one topic",
                  },
                ]}
              >
                <Select
                  mode="tags"
                  placeholder="Enter topics (e.g., JavaScript, React, OOP)"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="difficulty"
                label="Difficulty"
                rules={[
                  { required: true, message: "Please select difficulty" },
                ]}
              >
                <Select>
                  <Option value="Easy">Easy</Option>
                  <Option value="Medium">Medium</Option>
                  <Option value="Hard">Hard</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="number_of_questions"
                label="Number of Questions"
                rules={[
                  {
                    required: true,
                    message: "Please enter number of questions",
                  },
                  {
                    type: "number",
                    min: 1,
                    max: 50,
                    message: "Must be between 1 and 50",
                  },
                ]}
              >
                <InputNumber min={1} max={50} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<QuestionCircleOutlined />}
                loading={loading}
              >
                Generate Questions
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRegenerate}
                disabled={generatedQuestions.length === 0}
              >
                Regenerate
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* Generated Questions */}
      {generatedQuestions.length > 0 && (
        <Card
          title={
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>Generated Questions ({generatedQuestions.length})</span>
              <Space>
                <Button
                  size="small"
                  onClick={() => handleSelectAll(true)}
                  disabled={
                    selectedQuestions.length === generatedQuestions.length
                  }
                >
                  Select All
                </Button>
                <Button
                  size="small"
                  onClick={() => handleSelectAll(false)}
                  disabled={selectedQuestions.length === 0}
                >
                  Deselect All
                </Button>
                <Divider type="vertical" />
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  disabled={selectedQuestions.length === 0}
                >
                  Save Selected ({selectedQuestions.length})
                </Button>
                <Button
                  icon={<SendOutlined />}
                  onClick={handleSend}
                  disabled={selectedQuestions.length === 0}
                >
                  Send to Candidates
                </Button>
              </Space>
            </div>
          }
        >
          <div style={{ maxHeight: 600, overflowY: "auto" }}>
            {generatedQuestions.map((question, index) => (
              <Card
                key={index}
                size="small"
                style={{
                  marginBottom: 16,
                  border: selectedQuestions.includes(index)
                    ? "2px solid #1890ff"
                    : "1px solid #d9d9d9",
                  backgroundColor: selectedQuestions.includes(index)
                    ? "#f0f8ff"
                    : "white",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <Text strong style={{ marginRight: 8 }}>
                        Question {index + 1}:
                      </Text>
                      <Tag
                        color={MCQService.getDifficultyColor(
                          question.difficulty
                        )}
                      >
                        {question.difficulty}
                      </Tag>
                      <Tag>{question.topic}</Tag>
                    </div>

                    <Text style={{ display: "block", marginBottom: 12 }}>
                      {question.question}
                    </Text>

                    <div style={{ marginBottom: 8 }}>
                      <Text strong>Options:</Text>
                      <ul style={{ margin: "4px 0 0 0", paddingLeft: 20 }}>
                        {question.options.map((option, optIndex) => (
                          <li key={optIndex}>
                            <Text
                              style={{
                                color:
                                  option === question.answer
                                    ? "#52c41a"
                                    : "inherit",
                                fontWeight:
                                  option === question.answer
                                    ? "bold"
                                    : "normal",
                              }}
                            >
                              {option}
                            </Text>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Text strong style={{ color: "#52c41a" }}>
                      Correct Answer: {question.answer}
                    </Text>
                  </div>

                  <Button
                    type={
                      selectedQuestions.includes(index) ? "primary" : "default"
                    }
                    size="small"
                    onClick={() =>
                      handleSelectQuestion(
                        index,
                        !selectedQuestions.includes(index)
                      )
                    }
                    style={{ marginLeft: 16 }}
                  >
                    {selectedQuestions.includes(index) ? "Selected" : "Select"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Instructions */}
      <Card size="small" style={{ marginTop: 16 }}>
        <Alert
          message="Instructions"
          description={
            <div>
              <p>
                <strong>1. Generate Questions:</strong> Fill in topics, select
                difficulty, and specify number of questions.
              </p>
              <p>
                <strong>2. Review & Select:</strong> Review generated questions
                and select the ones you want to use.
              </p>
              <p>
                <strong>3. Save:</strong> Save selected questions to the
                database for later use.
              </p>
              <p>
                <strong>4. Send:</strong> Send questions to candidates
                (integration with external module required).
              </p>
            </div>
          }
          type="info"
          showIcon
        />
      </Card>
    </div>
  );
}
