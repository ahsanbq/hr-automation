/**
 * Step 1: Question Selection Component
 */

import React from "react";
import {
  Table,
  Tag,
  Typography,
  Checkbox,
  Row,
  Col,
  Select,
  Input,
  Space,
  Button,
} from "antd";
import { SearchOutlined, FilterOutlined } from "@ant-design/icons";

const { Text } = Typography;
const { Option } = Select;
const { Search } = Input;

interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  topic: string;
  difficulty: string;
  explanation?: string;
  createdAt: string;
  createdBy: {
    name: string;
  };
}

interface QuestionSelectionStepProps {
  questions: MCQQuestion[];
  selectedQuestions: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  loading: boolean;
}

export default function QuestionSelectionStep({
  questions,
  selectedQuestions,
  onSelectionChange,
  loading,
}: QuestionSelectionStepProps) {
  const [filteredQuestions, setFilteredQuestions] =
    React.useState<MCQQuestion[]>(questions);
  const [searchText, setSearchText] = React.useState("");
  const [topicFilter, setTopicFilter] = React.useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = React.useState<string>("all");

  React.useEffect(() => {
    filterQuestions();
  }, [questions, searchText, topicFilter, difficultyFilter]);

  const filterQuestions = () => {
    let filtered = [...questions];

    if (searchText) {
      filtered = filtered.filter((q) =>
        q.question.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (topicFilter !== "all") {
      filtered = filtered.filter((q) => q.topic === topicFilter);
    }

    if (difficultyFilter !== "all") {
      filtered = filtered.filter((q) => q.difficulty === difficultyFilter);
    }

    setFilteredQuestions(filtered);
  };

  const handleQuestionSelect = (questionId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedQuestions, questionId]);
    } else {
      onSelectionChange(selectedQuestions.filter((id) => id !== questionId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(filteredQuestions.map((q) => q.id));
    } else {
      onSelectionChange([]);
    }
  };

  const getUniqueTopics = () => {
    return [...new Set(questions.map((q) => q.topic))];
  };

  const getUniqueDifficulties = () => {
    return [...new Set(questions.map((q) => q.difficulty))];
  };

  const columns = [
    {
      title: (
        <Checkbox
          checked={
            filteredQuestions.length > 0 &&
            selectedQuestions.length === filteredQuestions.length
          }
          indeterminate={
            selectedQuestions.length > 0 &&
            selectedQuestions.length < filteredQuestions.length
          }
          onChange={(e) => handleSelectAll(e.target.checked)}
        >
          Select All
        </Checkbox>
      ),
      key: "select",
      width: 80,
      render: (_: any, record: MCQQuestion) => (
        <Checkbox
          checked={selectedQuestions.includes(record.id)}
          onChange={(e) => handleQuestionSelect(record.id, e.target.checked)}
        />
      ),
    },
    {
      title: "Question",
      dataIndex: "question",
      key: "question",
      render: (text: string, record: MCQQuestion) => (
        <div>
          <Text style={{ fontSize: "14px" }}>{text || "No question text"}</Text>
          <div style={{ marginTop: 4 }}>
            <Tag color="blue">{record.topic || "Unknown"}</Tag>
            <Tag
              color={
                record.difficulty === "EASY"
                  ? "green"
                  : record.difficulty === "MEDIUM"
                  ? "orange"
                  : "red"
              }
            >
              {record.difficulty || "Unknown"}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: "Options",
      dataIndex: "options",
      key: "options",
      width: 300,
      render: (options: string[]) => (
        <div>
          {(options || []).map((option, index) => (
            <div key={index} style={{ fontSize: "12px", marginBottom: 2 }}>
              {String.fromCharCode(65 + index)}. {option || "No option text"}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "Correct Answer",
      dataIndex: "correctAnswer",
      key: "correctAnswer",
      width: 150,
      render: (answer: string) => (
        <Text strong style={{ color: "#52c41a" }}>
          {answer || "No answer"}
        </Text>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Search
            placeholder="Search questions..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
            allowClear
          />
        </Col>
        <Col span={6}>
          <Select
            placeholder="Filter by Topic"
            value={topicFilter}
            onChange={setTopicFilter}
            style={{ width: "100%" }}
            allowClear
          >
            <Option value="all">All Topics</Option>
            {getUniqueTopics().map((topic) => (
              <Option key={topic} value={topic}>
                {topic}
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={6}>
          <Select
            placeholder="Filter by Difficulty"
            value={difficultyFilter}
            onChange={setDifficultyFilter}
            style={{ width: "100%" }}
            allowClear
          >
            <Option value="all">All Difficulties</Option>
            {getUniqueDifficulties().map((difficulty) => (
              <Option key={difficulty} value={difficulty}>
                {difficulty}
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={4}>
          <Button
            icon={<FilterOutlined />}
            onClick={() => {
              setSearchText("");
              setTopicFilter("all");
              setDifficultyFilter("all");
            }}
          >
            Clear
          </Button>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Text strong>Total Questions: </Text>
          <Tag color="blue">{questions.length}</Tag>
        </Col>
        <Col span={8}>
          <Text strong>Filtered: </Text>
          <Tag color="green">{filteredQuestions.length}</Tag>
        </Col>
        <Col span={8}>
          <Text strong>Selected: </Text>
          <Tag color="orange">{selectedQuestions.length}</Tag>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={filteredQuestions}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 8,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} questions`,
        }}
        scroll={{ y: 300 }}
      />
    </div>
  );
}
