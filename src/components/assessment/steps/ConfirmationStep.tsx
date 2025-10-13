/**
 * Step 4: Confirmation and Review Component
 */

import React from "react";
import {
  Card,
  Typography,
  Row,
  Col,
  Tag,
  Divider,
  List,
  Avatar,
  Space,
  Alert,
} from "antd";
import {
  CheckSquareOutlined,
  TeamOutlined,
  UserOutlined,
  MailOutlined,
  SendOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

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

interface Job {
  id: string;
  jobTitle: string;
  companyName: string;
  location: string;
  jobType: string;
  status?: string;
  createdAt: string;
  _count: {
    Resume: number;
  };
}

interface Candidate {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  experienceYears?: number;
  skills: string[];
  recommendation?: string;
  matchScore?: number;
  createdAt: string;
  summary?: string;
  education?: string;
  location?: string;
}

interface ConfirmationStepProps {
  selectedQuestions: string[];
  selectedJob: Job | null;
  selectedCandidates: string[];
  questions: MCQQuestion[];
  candidates: Candidate[];
}

export default function ConfirmationStep({
  selectedQuestions,
  selectedJob,
  selectedCandidates,
  questions,
  candidates,
}: ConfirmationStepProps) {
  const selectedQuestionsData = questions.filter((q) =>
    selectedQuestions.includes(q.id)
  );
  const selectedCandidatesData = candidates.filter((c) =>
    selectedCandidates.includes(c.id)
  );

  return (
    <div>
      <Alert
        message="Review Your Selection"
        description="Please review all selections before sending the MCQ to candidates. You can go back to modify any step."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[16, 16]}>
        {/* Selected Questions */}
        <Col span={12}>
          <Card
            title={
              <Space>
                <CheckSquareOutlined />
                <span>Selected Questions ({selectedQuestions.length})</span>
              </Space>
            }
          >
            <List
              dataSource={selectedQuestionsData}
              renderItem={(question, index) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar size={32} style={{ backgroundColor: "#1890ff" }}>
                        {index + 1}
                      </Avatar>
                    }
                    title={
                      <Text strong style={{ fontSize: "13px" }}>
                        {question.question.substring(0, 80)}
                        {question.question.length > 80 ? "..." : ""}
                      </Text>
                    }
                    description={
                      <Space>
                        <Tag color="blue">{question.topic}</Tag>
                        <Tag
                          color={
                            question.difficulty === "EASY"
                              ? "green"
                              : question.difficulty === "MEDIUM"
                              ? "orange"
                              : "red"
                          }
                        >
                          {question.difficulty}
                        </Tag>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Selected Job */}
        <Col span={12}>
          <Card
            title={
              <Space>
                <TeamOutlined />
                <span>Selected Job</span>
              </Space>
            }
          >
            {selectedJob ? (
              <div>
                <Title level={5} style={{ margin: 0, marginBottom: 8 }}>
                  {selectedJob.jobTitle}
                </Title>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  {selectedJob.companyName}
                </Text>
                <Divider style={{ margin: "12px 0" }} />
                <Row gutter={8}>
                  <Col span={12}>
                    <Text strong>Location:</Text>
                    <br />
                    <Tag>{selectedJob.location}</Tag>
                  </Col>
                  <Col span={12}>
                    <Text strong>Type:</Text>
                    <br />
                    <Tag color="blue">
                      {selectedJob.jobType.replace("_", " ")}
                    </Tag>
                  </Col>
                </Row>
                <Row gutter={8} style={{ marginTop: 8 }}>
                  <Col span={12}>
                    <Text strong>Company:</Text>
                    <br />
                    <Tag color="green">{selectedJob.companyName}</Tag>
                  </Col>
                  <Col span={12}>
                    <Text strong>Total Candidates:</Text>
                    <br />
                    <Tag color="orange">
                      {selectedJob._count.Resume} candidates
                    </Tag>
                  </Col>
                </Row>
              </div>
            ) : (
              <Text type="secondary">No job selected</Text>
            )}
          </Card>
        </Col>
      </Row>

      {/* Selected Candidates */}
      <Row style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card
            title={
              <Space>
                <UserOutlined />
                <span>Selected Candidates ({selectedCandidates.length})</span>
              </Space>
            }
          >
            <List
              dataSource={selectedCandidatesData}
              renderItem={(candidate) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        size={40}
                        icon={<UserOutlined />}
                        style={{ backgroundColor: "#52c41a" }}
                      />
                    }
                    title={
                      <Text strong style={{ fontSize: "14px" }}>
                        {candidate.candidateName}
                      </Text>
                    }
                    description={
                      <div>
                        <div style={{ fontSize: "12px", color: "#666" }}>
                          <MailOutlined /> {candidate.candidateEmail}
                        </div>
                        <Space style={{ marginTop: 4 }}>
                          <Tag color="blue">
                            {candidate.experienceYears || 0} years exp
                          </Tag>
                          <Tag
                            color={
                              candidate.recommendation === "STRONG_HIRE"
                                ? "green"
                                : candidate.recommendation === "HIRE"
                                ? "blue"
                                : candidate.recommendation === "NO_HIRE"
                                ? "red"
                                : "orange"
                            }
                          >
                            {candidate.recommendation?.replace("_", " ") ||
                              "Pending"}
                          </Tag>
                          {candidate.matchScore && (
                            <Tag color="gold">
                              {Math.round(candidate.matchScore)}% score
                            </Tag>
                          )}
                        </Space>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* Summary */}
      <Row style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card
            title={
              <Space>
                <SendOutlined />
                <span>Send Summary</span>
              </Space>
            }
            style={{ backgroundColor: "#f6ffed", border: "1px solid #b7eb8f" }}
          >
            <Row gutter={16}>
              <Col span={6}>
                <Text strong>Questions to Send:</Text>
                <br />
                <Tag
                  color="blue"
                  style={{ fontSize: "16px", padding: "4px 8px" }}
                >
                  {selectedQuestions.length}
                </Tag>
              </Col>
              <Col span={6}>
                <Text strong>Target Job:</Text>
                <br />
                <Text style={{ fontSize: "16px" }}>
                  {selectedJob?.jobTitle || "None"}
                </Text>
              </Col>
              <Col span={6}>
                <Text strong>Candidates:</Text>
                <br />
                <Tag
                  color="green"
                  style={{ fontSize: "16px", padding: "4px 8px" }}
                >
                  {selectedCandidates.length}
                </Tag>
              </Col>
              <Col span={6}>
                <Text strong>Total Emails:</Text>
                <br />
                <Tag
                  color="orange"
                  style={{ fontSize: "16px", padding: "4px 8px" }}
                >
                  {selectedCandidates.length}
                </Tag>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
