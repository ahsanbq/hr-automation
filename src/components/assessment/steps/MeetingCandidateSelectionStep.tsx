import React, { useState, useEffect } from "react";
import {
  Table,
  Tag,
  Typography,
  Checkbox,
  Input,
  Row,
  Col,
  Avatar,
  Space,
  Spin,
  message,
} from "antd";
import {
  SearchOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
} from "@ant-design/icons";

const { Text } = Typography;
const { Search } = Input;

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

interface MeetingCandidateSelectionStepProps {
  jobId?: string;
  selectedCandidates: string[];
  onCandidatesSelect: (candidates: string[]) => void;
  candidates: Candidate[];
  setCandidates: (candidates: Candidate[]) => void;
}

export default function MeetingCandidateSelectionStep({
  jobId,
  selectedCandidates,
  onCandidatesSelect,
  candidates,
  setCandidates,
}: MeetingCandidateSelectionStepProps) {
  const [filteredCandidates, setFilteredCandidates] =
    useState<Candidate[]>(candidates);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch candidates when jobId changes
  useEffect(() => {
    if (jobId) {
      fetchCandidates(jobId);
    } else {
      setCandidates([]);
      setFilteredCandidates([]);
    }
  }, [jobId]);

  // Update filtered candidates when candidates change
  useEffect(() => {
    setFilteredCandidates(candidates);
  }, [candidates]);

  const fetchCandidates = async (jobId: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/jobs/${jobId}/resumes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCandidates(data.resumes || []);
      } else {
        message.error("Failed to fetch candidates");
        setCandidates([]);
      }
    } catch (error) {
      console.error("Error fetching candidates:", error);
      message.error("Failed to fetch candidates");
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter candidates based on search text
  useEffect(() => {
    if (!searchText) {
      setFilteredCandidates(candidates);
    } else {
      const filtered = candidates.filter(
        (candidate) =>
          candidate.candidateName
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          candidate.candidateEmail
            .toLowerCase()
            .includes(searchText.toLowerCase())
      );
      setFilteredCandidates(filtered);
    }
  }, [candidates, searchText]);

  const handleCandidateSelect = (candidateId: string, checked: boolean) => {
    if (checked) {
      onCandidatesSelect([...selectedCandidates, candidateId]);
    } else {
      onCandidatesSelect(selectedCandidates.filter((id) => id !== candidateId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onCandidatesSelect(filteredCandidates.map((c) => c.id));
    } else {
      onCandidatesSelect([]);
    }
  };

  const columns = [
    {
      title: (
        <Checkbox
          checked={
            filteredCandidates.length > 0 &&
            selectedCandidates.length === filteredCandidates.length
          }
          indeterminate={
            selectedCandidates.length > 0 &&
            selectedCandidates.length < filteredCandidates.length
          }
          onChange={(e) => handleSelectAll(e.target.checked)}
        >
          Select
        </Checkbox>
      ),
      key: "select",
      width: 80,
      align: "center" as const,
      render: (_: any, record: Candidate) => (
        <Checkbox
          checked={selectedCandidates.includes(record.id)}
          onChange={(e) => handleCandidateSelect(record.id, e.target.checked)}
        />
      ),
    },
    {
      title: "Candidate",
      key: "candidate",
      width: 280,
      render: (_: any, record: Candidate) => (
        <div style={{ display: "flex", alignItems: "center" }}>
          <Avatar
            size={28}
            icon={<UserOutlined />}
            style={{ marginRight: 6 }}
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <Text strong style={{ fontSize: "12px", wordBreak: "break-word" }}>
              {record.candidateName || "Unknown Candidate"}
            </Text>
            <div style={{ fontSize: "10px", color: "#666", marginTop: 1 }}>
              <MailOutlined /> {record.candidateEmail || "No email"}
            </div>
            {record.candidatePhone && (
              <div style={{ fontSize: "10px", color: "#666" }}>
                <PhoneOutlined /> {record.candidatePhone}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Exp",
      dataIndex: "experienceYears",
      key: "experienceYears",
      width: 70,
      align: "center" as const,
      render: (experience: number) => (
        <Tag color="blue" style={{ fontSize: "10px" }}>
          {experience || 0}y
        </Tag>
      ),
    },
    {
      title: "Skills",
      dataIndex: "skills",
      key: "skills",
      width: 120,
      render: (skills: string[]) => (
        <div style={{ maxWidth: "100px", overflow: "hidden" }}>
          {skills && skills.length > 0 ? (
            <div
              style={{
                fontSize: "9px",
                color: "#666",
                wordWrap: "break-word",
                whiteSpace: "normal",
                lineHeight: "1.2",
              }}
              title={skills.join(", ")}
            >
              {skills.slice(0, 2).join(", ")}
              {skills.length > 2 && "..."}
            </div>
          ) : (
            <Text type="secondary" style={{ fontSize: "9px" }}>
              No skills
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "Score",
      dataIndex: "matchScore",
      key: "matchScore",
      width: 70,
      align: "center" as const,
      render: (score: number) => (
        <Tag
          color={
            score && score >= 80
              ? "green"
              : score && score >= 60
              ? "orange"
              : "red"
          }
          style={{ fontSize: "10px" }}
        >
          {score ? `${Math.round(score)}%` : "N/A"}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "recommendation",
      key: "recommendation",
      width: 80,
      align: "center" as const,
      render: (recommendation: string) => (
        <Tag
          color={
            recommendation === "STRONG_HIRE"
              ? "green"
              : recommendation === "HIRE"
              ? "blue"
              : recommendation === "NO_HIRE"
              ? "red"
              : "orange"
          }
          style={{ fontSize: "9px" }}
        >
          {recommendation?.replace("_", " ") || "Pending"}
        </Tag>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Search
          placeholder="Search candidates by name or email..."
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ marginBottom: 16 }}
          prefix={<SearchOutlined />}
        />

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <Text strong style={{ fontSize: "16px", color: "#722ed1" }}>
                {candidates.length}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: "12px" }}>
                Total Candidates
              </Text>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <Text strong style={{ fontSize: "16px", color: "#52c41a" }}>
                {filteredCandidates.length}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: "12px" }}>
                Filtered Results
              </Text>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <Text strong style={{ fontSize: "16px", color: "#1890ff" }}>
                {selectedCandidates.length}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: "12px" }}>
                Selected
              </Text>
            </div>
          </Col>
        </Row>
      </div>

      <Table
        columns={columns}
        dataSource={filteredCandidates}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 6,
          showSizeChanger: false,
          showQuickJumper: false,
          simple: true,
        }}
        style={{ width: "100%" }}
        size="small"
        scroll={{ x: 600 }}
      />
    </div>
  );
}
