import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Row,
  Col,
  Statistic,
  Progress,
  message,
  Tooltip,
  Select,
  Spin,
  Alert,
} from "antd";
import {
  TrophyOutlined,
  UserOutlined,
  FileTextOutlined,
  StarOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  EyeOutlined,
} from "@ant-design/icons";

const { Option } = Select;

interface ShortlistedCandidate {
  interviewId: string;
  candidate: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    matchScore?: number;
    experienceYears?: number;
    skills: string[];
    education?: string;
    summary?: string;
    location?: string;
    linkedinUrl?: string;
    githubUrl?: string;
    currentJobTitle?: string;
  };
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    skillsRequired: string;
  };
  interview: {
    id: string;
    title: string;
    score: number;
    percentage: number;
    duration?: number;
    completedAt: string;
    interviewer: string;
  };
  performance: {
    totalQuestions: number;
    correctAnswers: number;
    categories: Record<string, number>;
    difficulties: Record<string, number>;
  };
}

interface ShortlistedCandidatesProps {
  jobId?: string;
  onCandidateSelect?: (candidate: ShortlistedCandidate) => void;
}

const ShortlistedCandidates: React.FC<ShortlistedCandidatesProps> = ({
  jobId,
  onCandidateSelect,
}) => {
  const [candidates, setCandidates] = useState<ShortlistedCandidate[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<string>(jobId || "");

  useEffect(() => {
    fetchShortlistedCandidates();
  }, [selectedJob]);

  const fetchShortlistedCandidates = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        message.error("Please log in to view shortlisted candidates");
        return;
      }

      const params = new URLSearchParams();
      if (selectedJob) params.append("jobPostId", selectedJob);

      const response = await fetch(`/api/interviews/shortlisted?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch shortlisted candidates");
      }

      const data = await response.json();
      setCandidates(data.candidates);
      setStats(data.stats);
    } catch (error) {
      console.error("Error fetching shortlisted candidates:", error);
      message.error("Failed to load shortlisted candidates");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return "green";
    if (percentage >= 80) return "blue";
    if (percentage >= 70) return "orange";
    return "red";
  };

  const columns = [
    {
      title: "Candidate",
      key: "candidate",
      width: 200,
      render: (_: any, record: ShortlistedCandidate) => (
        <div>
          <div style={{ fontWeight: "bold", fontSize: "13px" }}>
            {record.candidate.name}
          </div>
          <div style={{ fontSize: "11px", color: "#666" }}>
            {record.candidate.email}
          </div>
          {record.candidate.matchScore && (
            <div style={{ fontSize: "11px", color: "#1890ff" }}>
              Match: {record.candidate.matchScore}%
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Job Position",
      key: "job",
      width: 180,
      render: (_: any, record: ShortlistedCandidate) => (
        <div>
          <div style={{ fontWeight: "bold", fontSize: "12px" }}>
            {record.job.title}
          </div>
          <div style={{ fontSize: "11px", color: "#666" }}>
            {record.job.company}
          </div>
        </div>
      ),
    },
    {
      title: "Interview Score",
      key: "score",
      width: 120,
      render: (_: any, record: ShortlistedCandidate) => (
        <div>
          <div style={{ fontWeight: "bold", color: "#1890ff" }}>
            {record.interview.percentage.toFixed(1)}%
          </div>
          <Progress
            percent={record.interview.percentage}
            size="small"
            showInfo={false}
            strokeColor={getScoreColor(record.interview.percentage)}
          />
        </div>
      ),
    },
    {
      title: "Performance",
      key: "performance",
      width: 120,
      render: (_: any, record: ShortlistedCandidate) => (
        <div>
          <div style={{ fontSize: "12px" }}>
            {record.performance.correctAnswers}/
            {record.performance.totalQuestions}
          </div>
          <div style={{ fontSize: "11px", color: "#666" }}>Correct Answers</div>
        </div>
      ),
    },
    {
      title: "Skills",
      key: "skills",
      width: 150,
      render: (_: any, record: ShortlistedCandidate) => (
        <div>
          {record.candidate.skills.slice(0, 3).map((skill, index) => (
            <Tag
              key={index}
              color="blue"
              style={{ fontSize: "10px", marginBottom: "2px" }}
            >
              {skill}
            </Tag>
          ))}
          {record.candidate.skills.length > 3 && (
            <Tag style={{ fontSize: "10px" }}>
              +{record.candidate.skills.length - 3}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Completed",
      key: "completed",
      width: 120,
      render: (_: any, record: ShortlistedCandidate) => (
        <div style={{ fontSize: "12px" }}>
          {new Date(record.interview.completedAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_: any, record: ShortlistedCandidate) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => onCandidateSelect?.(record)}
              size="small"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      {/* Statistics */}
      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: "16px" }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Shortlisted"
                value={stats.totalShortlisted}
                prefix={<TrophyOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Average Score"
                value={stats.averageScore.toFixed(1)}
                suffix="%"
                prefix={<StarOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Top Performers"
                value={stats.topPerformers}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Score Range"
                value={`${stats.scoreRange.min.toFixed(
                  1
                )}-${stats.scoreRange.max.toFixed(1)}%`}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Job Filter */}
      <Card style={{ marginBottom: "16px" }}>
        <Row gutter={[16, 16]} align="middle">
          <Col span={6}>
            <Select
              placeholder="Filter by Job Position"
              value={selectedJob || undefined}
              onChange={setSelectedJob}
              style={{ width: "100%" }}
              allowClear
            >
              {/* This would be populated with available jobs */}
            </Select>
          </Col>
          <Col span={18}>
            <Space>
              <Button
                icon={<CalendarOutlined />}
                onClick={fetchShortlistedCandidates}
              >
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Candidates Table */}
      {candidates.length === 0 ? (
        <Alert
          message="No Shortlisted Candidates"
          description="No candidates have been shortlisted for interviews yet."
          type="info"
          showIcon
        />
      ) : (
        <Card title="Shortlisted Candidates for Meetings">
          <Table
            dataSource={candidates}
            columns={columns}
            rowKey="interviewId"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} candidates`,
              showQuickJumper: true,
            }}
            scroll={{ x: 1000 }}
            size="small"
          />
        </Card>
      )}
    </div>
  );
};

export default ShortlistedCandidates;
