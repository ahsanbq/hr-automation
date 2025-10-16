import { useState, useEffect } from "react";
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Modal,
  message,
  Typography,
  Spin,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  EyeOutlined,
  FileDoneOutlined,
  UserOutlined,
  StarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { OfferLetterWithDetails } from "@/types/offer";
import CandidateViewModal from "./CandidateViewModal";

const { Text } = Typography;

interface ResumeListProps {
  jobId: string;
  onGenerateOffer: (resume: any) => void;
}

interface ResumeRow {
  id: string;
  candidateName: string;
  candidateEmail?: string;
  candidatePhone?: string;
  matchScore?: number;
  experienceYears?: number;
  currentJobTitle?: string;
  education?: string;
  skills: string[];
  summary?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  createdAt: string;
  hasOffer?: boolean;
  offerStatus?: string;
}

export default function ResumeList({
  jobId,
  onGenerateOffer,
}: ResumeListProps) {
  const [resumes, setResumes] = useState<ResumeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingCandidate, setViewingCandidate] = useState<ResumeRow | null>(
    null
  );

  useEffect(() => {
    fetchResumes();
  }, [jobId]);

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/resumes?jobId=${jobId}&includeOffers=true`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setResumes(data.resumes || []);
      } else {
        console.error("Failed to fetch resumes");
      }
    } catch (error) {
      console.error("Error fetching resumes:", error);
    } finally {
      setLoading(false);
    }
  };

  const scoreTag = (score?: number) => {
    if (!score) return <Tag>N/A</Tag>;

    let color = "default";
    if (score >= 85) color = "green";
    else if (score >= 75) color = "blue";
    else if (score >= 60) color = "orange";
    else color = "red";

    return <Tag color={color}>{score}%</Tag>;
  };

  const getOfferStatusTag = (hasOffer: boolean, status?: string) => {
    if (!hasOffer) {
      return <Tag color="default">No Offer</Tag>;
    }

    switch (status) {
      case "PENDING":
        return <Tag color="default">Pending</Tag>;
      case "SENT":
        return <Tag color="blue">Sent</Tag>;
      case "ACCEPTED":
        return <Tag color="green">Accepted</Tag>;
      case "REJECTED":
        return <Tag color="red">Rejected</Tag>;
      case "EXPIRED":
        return <Tag color="orange">Expired</Tag>;
      case "WITHDRAWN":
        return <Tag color="purple">Withdrawn</Tag>;
      default:
        return <Tag color="default">Unknown</Tag>;
    }
  };

  const columns = [
    {
      title: "Candidate",
      dataIndex: "candidateName",
      key: "candidate",
      render: (text: string, record: ResumeRow) => (
        <div>
          <div style={{ fontWeight: 600 }}>{text}</div>
          {record.candidateEmail && (
            <div style={{ fontSize: 12, color: "#666" }}>
              {record.candidateEmail}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Current Position",
      dataIndex: "currentJobTitle",
      key: "position",
      render: (title: string) => (
        <span style={{ fontSize: 13 }}>{title || "N/A"}</span>
      ),
      responsive: ["md"] as any,
    },
    {
      title: "Experience",
      dataIndex: "experienceYears",
      key: "experience",
      width: 100,
      align: "center" as const,
      render: (years: number) => (
        <span style={{ fontSize: 12 }}>{years ? `${years} years` : "N/A"}</span>
      ),
      responsive: ["md"] as any,
    },
    {
      title: "Match Score",
      dataIndex: "matchScore",
      key: "matchScore",
      render: (score: number) => scoreTag(score),
      sorter: (a: ResumeRow, b: ResumeRow) =>
        (b.matchScore || 0) - (a.matchScore || 0),
      defaultSortOrder: "descend" as any,
    },
    {
      title: "Offer Status",
      key: "offerStatus",
      render: (_: any, record: ResumeRow) =>
        getOfferStatusTag(record.hasOffer || false, record.offerStatus),
      responsive: ["lg"] as any,
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      render: (_: any, record: ResumeRow) => (
        <Space size="small" wrap>
          <Button
            size="small"
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => setViewingCandidate(record)}
          >
            View
          </Button>
          <Button
            size="small"
            type="default"
            icon={<FileDoneOutlined />}
            onClick={() => onGenerateOffer(record)}
            disabled={record.hasOffer && record.offerStatus === "ACCEPTED"}
          >
            {record.hasOffer ? "Edit Offer" : "Generate Offer"}
          </Button>
        </Space>
      ),
    },
  ];

  const stats = {
    total: resumes.length,
    withOffers: resumes.filter((r) => r.hasOffer).length,
    accepted: resumes.filter((r) => r.offerStatus === "ACCEPTED").length,
    pending: resumes.filter(
      (r) => r.offerStatus === "PENDING" || r.offerStatus === "SENT"
    ).length,
  };

  return (
    <>
      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Total Candidates"
              value={stats.total}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="With Offers"
              value={stats.withOffers}
              prefix={<FileDoneOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Accepted"
              value={stats.accepted}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Pending"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Resumes Table */}
      <Card title="Candidates">
        <Spin spinning={loading}>
          <Table
            size="small"
            rowKey="id"
            columns={columns}
            dataSource={resumes}
            pagination={{ pageSize: 10, size: "small" }}
            scroll={{ x: 800 }}
          />
        </Spin>
      </Card>

      {/* Candidate View Modal */}
      <CandidateViewModal
        visible={!!viewingCandidate}
        candidate={
          viewingCandidate
            ? ({
                id: "",
                jobPostId: jobId,
                resumeId: viewingCandidate.id,
                createdById: 0,
                offerDate: "",
                offeredPosition: "",
                salary: "",
                status: "PENDING",
                createdAt: "",
                updatedAt: "",
                resume: {
                  id: viewingCandidate.id,
                  candidateName: viewingCandidate.candidateName,
                  candidateEmail: viewingCandidate.candidateEmail,
                  candidatePhone: viewingCandidate.candidatePhone,
                  currentJobTitle: viewingCandidate.currentJobTitle,
                  education: viewingCandidate.education,
                  experienceYears: viewingCandidate.experienceYears,
                  skills: viewingCandidate.skills,
                  summary: viewingCandidate.summary,
                  linkedinUrl: viewingCandidate.linkedinUrl,
                  githubUrl: viewingCandidate.githubUrl,
                  matchScore: viewingCandidate.matchScore,
                },
                jobPost: {
                  id: jobId,
                  jobTitle: "",
                  companyName: "",
                  location: "",
                  jobType: "",
                  experienceLevel: "",
                  salaryRange: "",
                  skillsRequired: [],
                  jobDescription: "",
                  keyResponsibilities: [],
                  qualifications: [],
                  benefits: [],
                },
                createdBy: {
                  id: 0,
                  name: "",
                  email: "",
                },
              } as OfferLetterWithDetails)
            : null
        }
        onClose={() => setViewingCandidate(null)}
        onGenerateOffer={onGenerateOffer}
      />
    </>
  );
}



