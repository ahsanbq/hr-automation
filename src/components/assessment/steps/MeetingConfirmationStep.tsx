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
  CalendarOutlined,
  TeamOutlined,
  UserOutlined,
  MailOutlined,
  SendOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

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

interface MeetingConfirmationStepProps {
  selectedJob: Job | null;
  selectedCandidates: string[];
  candidates: Candidate[];
  agenda: string;
  meetingTime: string;
  meetingType: string;
}

export default function MeetingConfirmationStep({
  selectedJob,
  selectedCandidates,
  candidates,
  agenda,
  meetingTime,
  meetingType,
}: MeetingConfirmationStepProps) {
  const selectedCandidatesData = candidates.filter((c) =>
    selectedCandidates.includes(c.id)
  );

  return (
    <div>
      <Alert
        message="Review Your Meeting Details"
        description="Please review all meeting details before sending invitations to candidates. You can go back to modify any step."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[16, 16]}>
        {/* Meeting Details */}
        <Col span={12}>
          <Card
            title={
              <Space>
                <CalendarOutlined />
                <span>Meeting Details</span>
              </Space>
            }
          >
            <div>
              <Row gutter={8} style={{ marginBottom: 12 }}>
                <Col span={12}>
                  <Text strong>Meeting Type:</Text>
                  <br />
                  <Tag color="purple" style={{ marginTop: 4 }}>
                    {meetingType.replace("_", " ")}
                  </Tag>
                </Col>
                <Col span={12}>
                  <Text strong>Meeting Time:</Text>
                  <br />
                  <Tag color="blue" style={{ marginTop: 4 }}>
                    {new Date(meetingTime).toLocaleString()}
                  </Tag>
                </Col>
              </Row>

              <Divider style={{ margin: "12px 0" }} />

              <Text strong>Agenda Preview:</Text>
              <div
                style={{
                  background: "#f5f5f5",
                  padding: "12px",
                  borderRadius: "6px",
                  marginTop: "8px",
                  maxHeight: "120px",
                  overflowY: "auto",
                  fontSize: "12px",
                }}
              >
                {agenda.substring(0, 200)}
                {agenda.length > 200 && "..."}
              </div>
            </div>
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
                        style={{ backgroundColor: "#722ed1" }}
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
                <Text strong>Meeting Type:</Text>
                <br />
                <Tag
                  color="purple"
                  style={{ fontSize: "16px", padding: "4px 8px" }}
                >
                  {meetingType.replace("_", " ")}
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
                <Text strong>Total Invitations:</Text>
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
