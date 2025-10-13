import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Table,
  Modal,
  Form,
  Input,
  Select,
  Radio,
  Space,
  message,
  Popconfirm,
  Tag,
  Row,
  Col,
  Alert,
  Divider,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  QuestionCircleOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  BulbOutlined,
} from "@ant-design/icons";
import { MCQQuestion, Difficulty } from "@/types/interview";

const { Option } = Select;
const { TextArea } = Input;

interface MCQManagerProps {
  interviewId: string;
  onQuestionsChange?: (questions: MCQQuestion[]) => void;
}

const MCQManager: React.FC<MCQManagerProps> = ({
  interviewId,
  onQuestionsChange,
}) => {
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<MCQQuestion | null>(
    null
  );
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [interviewId]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        message.error("Please log in to view questions");
        return;
      }

      const response = await fetch(`/api/interviews/${interviewId}/mcq`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch questions");
      }

      const data = await response.json();
      setQuestions(data.questions || []);
      if (onQuestionsChange) {
        onQuestionsChange(data.questions || []);
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      message.error("Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    setEditingQuestion(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditQuestion = (question: MCQQuestion) => {
    setEditingQuestion(question);
    form.setFieldsValue({
      question: question.question,
      options: question.options,
      correctAnswer: question.correctAnswer,
      points: question.points,
      category: question.category,
      difficulty: question.difficulty,
    });
    setModalVisible(true);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/interviews/${interviewId}/mcq/${questionId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete question");
      }

      message.success("Question deleted successfully!");
      fetchQuestions();
    } catch (error) {
      console.error("Error deleting question:", error);
      message.error("Failed to delete question");
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      if (!token) {
        message.error("Please log in to save question");
        return;
      }

      const payload = {
        question: values.question,
        options: values.options,
        correctAnswer: values.correctAnswer,
        points: values.points || 1.0,
        category: values.category,
        difficulty: values.difficulty || "MEDIUM",
      };

      if (editingQuestion) {
        // Update existing question
        const response = await fetch(
          `/api/interviews/${interviewId}/mcq/${editingQuestion.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update question");
        }
      } else {
        // Create new question
        const response = await fetch(`/api/interviews/${interviewId}/mcq`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error("Failed to create question");
        }
      }

      message.success(
        `Question ${editingQuestion ? "updated" : "created"} successfully!`
      );
      setModalVisible(false);
      setEditingQuestion(null);
      form.resetFields();
      fetchQuestions();
    } catch (error) {
      console.error("Error saving question:", error);
      message.error(
        error instanceof Error ? error.message : "Failed to save question"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case "EASY":
        return "green";
      case "MEDIUM":
        return "orange";
      case "HARD":
        return "red";
      default:
        return "default";
    }
  };

  const columns = [
    {
      title: "Question",
      key: "question",
      render: (_: any, record: MCQQuestion) => (
        <div>
          <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
            {record.question}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            <Space>
              {record.category && <Tag color="blue">{record.category}</Tag>}
              <Tag color={getDifficultyColor(record.difficulty)}>
                {record.difficulty}
              </Tag>
              <Tag color="purple">{record.points} pts</Tag>
            </Space>
          </div>
        </div>
      ),
    },
    {
      title: "Options",
      key: "options",
      width: 300,
      render: (_: any, record: MCQQuestion) => (
        <div>
          {record.options.map((option: any, index: number) => (
            <div
              key={index}
              style={{
                marginBottom: "4px",
                padding: "4px 8px",
                backgroundColor:
                  index === record.correctAnswer ? "#f6ffed" : "#fafafa",
                border:
                  index === record.correctAnswer
                    ? "1px solid #52c41a"
                    : "1px solid #d9d9d9",
                borderRadius: "4px",
                fontSize: "12px",
              }}
            >
              <span style={{ fontWeight: "bold", marginRight: "8px" }}>
                {String.fromCharCode(65 + index)}.
              </span>
              {option}
              {index === record.correctAnswer && (
                <Tag
                  color="green"
                  style={{ marginLeft: "8px", fontSize: "10px" }}
                >
                  Correct
                </Tag>
              )}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_: any, record: MCQQuestion) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditQuestion(record)}
            size="small"
          />
          <Popconfirm
            title="Are you sure you want to delete this question?"
            onConfirm={() => handleDeleteQuestion(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div>
      <Card
        title={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>
              <QuestionCircleOutlined style={{ marginRight: "8px" }} />
              MCQ Questions
            </span>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddQuestion}
            >
              Add Question
            </Button>
          </div>
        }
      >
        {/* Statistics */}
        <Row gutter={[16, 16]} style={{ marginBottom: "16px" }}>
          <Col span={8}>
            <div
              style={{
                textAlign: "center",
                padding: "16px",
                backgroundColor: "#f0f2f5",
                borderRadius: "6px",
              }}
            >
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#1890ff",
                }}
              >
                {questions.length}
              </div>
              <div style={{ fontSize: "12px", color: "#666" }}>
                Total Questions
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div
              style={{
                textAlign: "center",
                padding: "16px",
                backgroundColor: "#f0f2f5",
                borderRadius: "6px",
              }}
            >
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#52c41a",
                }}
              >
                {totalPoints}
              </div>
              <div style={{ fontSize: "12px", color: "#666" }}>
                Total Points
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div
              style={{
                textAlign: "center",
                padding: "16px",
                backgroundColor: "#f0f2f5",
                borderRadius: "6px",
              }}
            >
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#faad14",
                }}
              >
                {questions.filter((q) => q.difficulty === "HARD").length}
              </div>
              <div style={{ fontSize: "12px", color: "#666" }}>
                Hard Questions
              </div>
            </div>
          </Col>
        </Row>

        {/* Difficulty Distribution */}
        {questions.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <div style={{ marginBottom: "8px", fontWeight: "bold" }}>
              Difficulty Distribution:
            </div>
            <Space wrap>
              <Tag color="green">
                Easy: {questions.filter((q) => q.difficulty === "EASY").length}
              </Tag>
              <Tag color="orange">
                Medium:{" "}
                {questions.filter((q) => q.difficulty === "MEDIUM").length}
              </Tag>
              <Tag color="red">
                Hard: {questions.filter((q) => q.difficulty === "HARD").length}
              </Tag>
            </Space>
          </div>
        )}

        {questions.length === 0 ? (
          <Alert
            message="No Questions Added"
            description="Click 'Add Question' to create MCQ questions for this interview."
            type="info"
            showIcon
          />
        ) : (
          <Table
            dataSource={questions}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={false}
            size="small"
          />
        )}
      </Card>

      {/* Add/Edit Question Modal */}
      <Modal
        title={
          <span>
            <QuestionCircleOutlined style={{ marginRight: "8px" }} />
            {editingQuestion ? "Edit Question" : "Add New Question"}
          </span>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingQuestion(null);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            points: 1.0,
            difficulty: "MEDIUM",
          }}
        >
          <Form.Item
            name="question"
            label="Question"
            rules={[{ required: true, message: "Please enter the question" }]}
          >
            <TextArea rows={3} placeholder="Enter the question text..." />
          </Form.Item>

          <Form.Item
            name="options"
            label="Options"
            rules={[
              { required: true, message: "Please add at least 2 options" },
              {
                type: "array",
                min: 2,
                message: "At least 2 options are required",
              },
              { type: "array", max: 6, message: "Maximum 6 options allowed" },
            ]}
          >
            <Form.List name="options">
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field, index) => (
                    <Form.Item
                      {...field}
                      key={field.key}
                      label={`Option ${String.fromCharCode(65 + index)}`}
                      rules={[
                        { required: true, message: "Please enter option text" },
                      ]}
                    >
                      <Input
                        placeholder={`Enter option ${String.fromCharCode(
                          65 + index
                        )}`}
                        suffix={
                          fields.length > 2 ? (
                            <Button
                              type="text"
                              danger
                              onClick={() => remove(field.name)}
                              size="small"
                            >
                              Remove
                            </Button>
                          ) : null
                        }
                      />
                    </Form.Item>
                  ))}
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                      disabled={fields.length >= 6}
                    >
                      Add Option
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form.Item>

          <Form.Item
            name="correctAnswer"
            label="Correct Answer"
            rules={[
              { required: true, message: "Please select the correct answer" },
            ]}
          >
            <Radio.Group>
              {form
                .getFieldValue("options")
                ?.map((option: string, index: number) => (
                  <Radio key={index} value={index}>
                    {String.fromCharCode(65 + index)}. {option}
                  </Radio>
                ))}
            </Radio.Group>
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="points"
                label="Points"
                rules={[{ required: true, message: "Please enter points" }]}
              >
                <Input
                  type="number"
                  min={0.5}
                  max={10}
                  step={0.5}
                  placeholder="1.0"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="difficulty"
                label="Difficulty"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="EASY">Easy</Option>
                  <Option value="MEDIUM">Medium</Option>
                  <Option value="HARD">Hard</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="category" label="Category">
                <Input placeholder="e.g., Technical, Behavioral" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Row justify="end">
              <Col>
                <Space>
                  <Button
                    onClick={() => {
                      setModalVisible(false);
                      setEditingQuestion(null);
                      form.resetFields();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="primary" htmlType="submit" loading={submitting}>
                    {editingQuestion ? "Update Question" : "Add Question"}
                  </Button>
                </Space>
              </Col>
            </Row>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MCQManager;
