import { useState, useEffect } from "react";
import {
  Modal,
  Typography,
  Tag,
  Space,
  Button,
  Card,
  Row,
  Col,
  Divider,
  Spin,
  Empty,
  Timeline,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  StarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  GithubOutlined,
  LinkedinOutlined,
  FileDoneOutlined,
} from "@ant-design/icons";
import { OfferLetterWithDetails } from "@/types/offer";

const { Title, Text, Paragraph } = Typography;

interface CandidateViewModalProps {
  visible: boolean;
  candidate: OfferLetterWithDetails | null;
  onClose: () => void;
  onGenerateOffer: (resume: any) => void;
}

export default function CandidateViewModal({
  visible,
  candidate,
  onClose,
  onGenerateOffer,
}: CandidateViewModalProps) {
  const [loading, setLoading] = useState(false);

  if (!candidate) return null;

  const resume = candidate.resume;
  const jobPost = candidate.jobPost;

  const handleGenerateOffer = () => {
    onGenerateOffer(resume);
    onClose();
  };

  const getScoreColor = (score?: number) => {
    if (!score) return "default";
    if (score >= 85) return "green";
    if (score >= 75) return "blue";
    if (score >= 60) return "orange";
    return "red";
  };

  const getMCQScoreColor = (score?: number) => {
    if (!score) return "default";
    if (score >= 80) return "green";
    if (score >= 60) return "blue";
    if (score >= 40) return "orange";
    return "red";
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center" }}>
          <UserOutlined style={{ marginRight: 8, color: "#1890ff" }} />
          Candidate Details
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={900}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        <Button
          key="offer"
          type="primary"
          icon={<FileDoneOutlined />}
          onClick={handleGenerateOffer}
        >
          Generate Offer Letter
        </Button>,
      ]}
    >
      <Spin spinning={loading}>
        <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
          {/* Basic Information */}
          <Card size="small" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Title level={4} style={{ margin: 0 }}>
                  {resume?.candidateName}
                </Title>
                <Space wrap style={{ marginTop: 8 }}>
                  {resume?.candidateEmail && (
                    <Text>
                      <MailOutlined style={{ marginRight: 4 }} />
                      {resume.candidateEmail}
                    </Text>
                  )}
                  {resume?.candidatePhone && (
                    <Text>
                      <PhoneOutlined style={{ marginRight: 4 }} />
                      {resume.candidatePhone}
                    </Text>
                  )}
                </Space>
              </Col>
            </Row>
          </Card>

          {/* Match Score and Assessment Results */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12}>
              <Card size="small" title="Resume Match Score">
                <div style={{ textAlign: "center" }}>
                  <Tag
                    color={getScoreColor(resume?.matchScore)}
                    style={{ fontSize: 16, padding: "8px 16px" }}
                  >
                    {resume?.matchScore ? `${resume.matchScore}%` : "N/A"}
                  </Tag>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12}>
              <Card size="small" title="MCQ Assessment">
                {candidate.mcqResults ? (
                  <div style={{ textAlign: "center" }}>
                    <Tag
                      color={getMCQScoreColor(candidate.mcqResults.score)}
                      style={{ fontSize: 16, padding: "8px 16px" }}
                    >
                      {candidate.mcqResults.score}%
                    </Tag>
                    <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
                      {candidate.mcqResults.totalQuestions} questions
                    </div>
                  </div>
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No MCQ assessment"
                    style={{ padding: "20px 0" }}
                  />
                )}
              </Card>
            </Col>
          </Row>

          {/* Experience and Education */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12}>
              <Card size="small" title="Experience">
                <div>
                  <Text strong>Current Position: </Text>
                  <Text>{resume?.currentJobTitle || "N/A"}</Text>
                </div>
                <div style={{ marginTop: 8 }}>
                  <Text strong>Experience: </Text>
                  <Text>
                    {resume?.experienceYears
                      ? `${resume.experienceYears} years`
                      : "N/A"}
                  </Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12}>
              <Card size="small" title="Education">
                <Text>{resume?.education || "Not specified"}</Text>
              </Card>
            </Col>
          </Row>

          {/* Skills */}
          {resume?.skills && resume.skills.length > 0 && (
            <Card size="small" title="Skills" style={{ marginBottom: 16 }}>
              <Space wrap>
                {resume.skills.map((skill, index) => (
                  <Tag key={index} color="blue">
                    <StarOutlined style={{ marginRight: 4 }} />
                    {skill}
                  </Tag>
                ))}
              </Space>
            </Card>
          )}

          {/* Summary */}
          {resume?.summary && (
            <Card size="small" title="Summary" style={{ marginBottom: 16 }}>
              <Paragraph>{resume.summary}</Paragraph>
            </Card>
          )}

          {/* Meeting Notes */}
          {candidate.meetingNotes && (
            <Card
              size="small"
              title="Interview Notes"
              style={{ marginBottom: 16 }}
            >
              <div style={{ marginBottom: 12 }}>
                <Text strong>Rating: </Text>
                <Tag color="blue">{candidate.meetingNotes.rating}</Tag>
              </div>
              {candidate.meetingNotes.summary && (
                <div style={{ marginBottom: 12 }}>
                  <Text strong>Summary:</Text>
                  <Paragraph style={{ marginTop: 4 }}>
                    {candidate.meetingNotes.summary}
                  </Paragraph>
                </div>
              )}
              {candidate.meetingNotes.notes && (
                <div>
                  <Text strong>Notes:</Text>
                  <Paragraph style={{ marginTop: 4 }}>
                    {candidate.meetingNotes.notes}
                  </Paragraph>
                </div>
              )}
            </Card>
          )}

          {/* Links */}
          <Card size="small" title="Links">
            <Space wrap>
              {resume?.linkedinUrl && (
                <Button
                  type="link"
                  icon={<LinkedinOutlined />}
                  href={resume.linkedinUrl}
                  target="_blank"
                >
                  LinkedIn
                </Button>
              )}
              {resume?.githubUrl && (
                <Button
                  type="link"
                  icon={<GithubOutlined />}
                  href={resume.githubUrl}
                  target="_blank"
                >
                  GitHub
                </Button>
              )}
            </Space>
          </Card>

          {/* Job Details */}
          <Divider />
          <Card size="small" title="Applied Position">
            <Row gutter={[16, 8]}>
              <Col span={24}>
                <Title level={5} style={{ margin: 0 }}>
                  {jobPost?.jobTitle}
                </Title>
                <Text type="secondary">
                  {jobPost?.companyName} • {jobPost?.location}
                </Text>
              </Col>
              <Col xs={12} sm={8}>
                <Text strong>Type: </Text>
                <Text>{jobPost?.jobType}</Text>
              </Col>
              <Col xs={12} sm={8}>
                <Text strong>Level: </Text>
                <Text>{jobPost?.experienceLevel}</Text>
              </Col>
              <Col xs={12} sm={8}>
                <Text strong>Salary Range: </Text>
                <Text>{jobPost?.salaryRange || "Not specified"}</Text>
              </Col>
            </Row>
          </Card>
        </div>
      </Spin>
    </Modal>
  );
}



