/**
 * MCQ Management Page - View and manage saved MCQ tests
 */

import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  message,
  Modal,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import AppLayout from "@/components/layout/AppLayout";

const { Title, Text } = Typography;

interface MCQTest {
  id: string;
  title: string;
  description: string;
  totalQuestions: number;
  topics: string[];
  difficulty: string;
  createdAt: string;
  isActive: boolean;
}

export default function MCQManagePage() {
  const [loading, setLoading] = useState(false);
  const [mcqTests, setMcqTests] = useState<MCQTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<MCQTest | null>(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);

  useEffect(() => {
    fetchMCQTests();
  }, []);

  const fetchMCQTests = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call to fetch MCQ tests
      // For now, show mock data
      const mockTests: MCQTest[] = [
        {
          id: "1",
          title: "JavaScript Fundamentals",
          description: "Basic JavaScript concepts and syntax",
          totalQuestions: 10,
          topics: ["JavaScript", "ES6", "DOM"],
          difficulty: "Medium",
          createdAt: "2024-01-15",
          isActive: true,
        },
        {
          id: "2",
          title: "React Development",
          description: "React hooks, components, and state management",
          totalQuestions: 15,
          topics: ["React", "Hooks", "State"],
          difficulty: "Hard",
          createdAt: "2024-01-20",
          isActive: true,
        },
      ];
      setMcqTests(mockTests);
    } catch (error) {
      message.error("Failed to fetch MCQ tests");
    } finally {
      setLoading(false);
    }
  };

  const handleViewTest = (test: MCQTest) => {
    setSelectedTest(test);
    setViewModalVisible(true);
  };

  const handleEditTest = (test: MCQTest) => {
    // TODO: Implement edit functionality
    message.info("Edit functionality coming soon");
  };

  const handleDeleteTest = (test: MCQTest) => {
    Modal.confirm({
      title: "Delete MCQ Test",
      content: `Are you sure you want to delete "${test.title}"?`,
      onOk: async () => {
        try {
          // TODO: Implement delete API call
          message.success("MCQ test deleted successfully");
          fetchMCQTests();
        } catch (error) {
          message.error("Failed to delete MCQ test");
        }
      },
    });
  };

  const handleSendTest = (test: MCQTest) => {
    // TODO: Implement send to candidates
    message.info("Send functionality will be integrated with external module");
  };

  const columns = [
    {
      title: "Test Name",
      dataIndex: "title",
      key: "title",
      render: (text: string, record: MCQTest) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {record.description}
          </Text>
        </div>
      ),
    },
    {
      title: "Questions",
      dataIndex: "totalQuestions",
      key: "totalQuestions",
      width: 100,
      align: "center" as const,
      render: (count: number) => <Tag color="blue">{count} questions</Tag>,
    },
    {
      title: "Topics",
      dataIndex: "topics",
      key: "topics",
      render: (topics: string[]) => (
        <div>
          {topics.slice(0, 2).map((topic, index) => (
            <Tag key={index} style={{ marginBottom: 2 }}>
              {topic}
            </Tag>
          ))}
          {topics.length > 2 && (
            <Tag style={{ marginBottom: 2 }}>+{topics.length - 2} more</Tag>
          )}
        </div>
      ),
    },
    {
      title: "Difficulty",
      dataIndex: "difficulty",
      key: "difficulty",
      width: 100,
      render: (difficulty: string) => {
        const colors = {
          Easy: "green",
          Medium: "orange",
          Hard: "red",
        };
        return (
          <Tag color={colors[difficulty as keyof typeof colors]}>
            {difficulty}
          </Tag>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      render: (_: any, record: MCQTest) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewTest(record)}
          >
            View
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditTest(record)}
          >
            Edit
          </Button>
          <Button
            size="small"
            icon={<SendOutlined />}
            onClick={() => handleSendTest(record)}
          >
            Send
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteTest(record)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <AppLayout
      title="Manage MCQ Tests"
      subtitle="View and manage your saved MCQ tests"
    >
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Title
            level={4}
            style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}
          >
            <QuestionCircleOutlined />
            Saved MCQ Tests
          </Title>
          <Text type="secondary">
            Manage your created MCQ tests and send them to candidates
          </Text>
        </div>

        <Table
          columns={columns}
          dataSource={mcqTests}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>

      {/* View Test Modal */}
      <Modal
        title={`MCQ Test: ${selectedTest?.title}`}
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>,
          <Button
            key="send"
            type="primary"
            icon={<SendOutlined />}
            onClick={() => {
              setViewModalVisible(false);
              handleSendTest(selectedTest!);
            }}
          >
            Send to Candidates
          </Button>,
        ]}
        width={800}
      >
        {selectedTest && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Statistic
                  title="Total Questions"
                  value={selectedTest.totalQuestions}
                  prefix={<QuestionCircleOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic title="Difficulty" value={selectedTest.difficulty} />
              </Col>
              <Col span={8}>
                <Statistic title="Topics" value={selectedTest.topics.length} />
              </Col>
            </Row>

            <div style={{ marginBottom: 16 }}>
              <Text strong>Description:</Text>
              <br />
              <Text>{selectedTest.description}</Text>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong>Topics Covered:</Text>
              <br />
              {selectedTest.topics.map((topic, index) => (
                <Tag key={index} style={{ marginTop: 4 }}>
                  {topic}
                </Tag>
              ))}
            </div>

            <div>
              <Text strong>Created:</Text>{" "}
              {new Date(selectedTest.createdAt).toLocaleString()}
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}
