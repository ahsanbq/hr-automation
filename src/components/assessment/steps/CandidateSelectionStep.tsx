/**
 * Step 3: Candidate Selection Component
 */

import React from "react";
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
  User?: {
    id: number;
    name: string;
    email: string;
  };
}

interface CandidateSelectionStepProps {
  candidates: Candidate[];
  selectedCandidates: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  loading: boolean;
}

export default function CandidateSelectionStep({
  candidates,
  selectedCandidates,
  onSelectionChange,
  loading,
}: CandidateSelectionStepProps) {
  const [filteredCandidates, setFilteredCandidates] =
    React.useState<Candidate[]>(candidates);
  const [searchText, setSearchText] = React.useState("");

  React.useEffect(() => {
    setFilteredCandidates(candidates);
  }, [candidates]);

  React.useEffect(() => {
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
      onSelectionChange([...selectedCandidates, candidateId]);
    } else {
      onSelectionChange(selectedCandidates.filter((id) => id !== candidateId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(filteredCandidates.map((c) => c.id));
    } else {
      onSelectionChange([]);
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
        <div
          style={{
            maxWidth: "100px",
            overflow: "hidden",
          }}
        >
          {(skills || []).slice(0, 1).map((skill, index) => {
            // Truncate very long skill names
            const truncatedSkill =
              skill.length > 15 ? skill.substring(0, 15) + "..." : skill;
            return (
              <Tag
                key={index}
                style={{
                  fontSize: "9px",
                  marginBottom: 2,
                  maxWidth: "100%",
                  wordWrap: "break-word",
                  whiteSpace: "normal",
                  lineHeight: "1.2",
                }}
                title={skill} // Show full skill name on hover
              >
                {truncatedSkill}
              </Tag>
            );
          })}
          {skills && skills.length > 1 && (
            <Tag
              style={{
                fontSize: "9px",
                marginBottom: 2,
                maxWidth: "100%",
                wordWrap: "break-word",
              }}
            >
              +{skills.length - 1}
            </Tag>
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
      render: (score: number) =>
        score ? (
          <Tag color="gold" style={{ fontSize: "10px" }}>
            {Math.round(score)}%
          </Tag>
        ) : (
          <Text type="secondary" style={{ fontSize: "10px" }}>
            -
          </Text>
        ),
    },
    {
      title: "Status",
      dataIndex: "recommendation",
      key: "recommendation",
      width: 80,
      align: "center" as const,
      render: (recommendation: string) => {
        if (!recommendation)
          return <Tag style={{ fontSize: "9px" }}>Pending</Tag>;

        const colors = {
          STRONG_HIRE: "green",
          HIRE: "blue",
          NO_HIRE: "red",
          STRONG_NO_HIRE: "red",
          PENDING: "orange",
        };
        return (
          <Tag
            color={colors[recommendation as keyof typeof colors]}
            style={{ fontSize: "9px" }}
          >
            {recommendation.replace("_", " ")}
          </Tag>
        );
      },
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Text strong>Total Candidates: </Text>
          <Tag color="blue">{candidates.length}</Tag>
        </Col>
        <Col span={8}>
          <Text strong>Filtered: </Text>
          <Tag color="green">{filteredCandidates.length}</Tag>
        </Col>
        <Col span={8}>
          <Text strong>Selected: </Text>
          <Tag color="orange">{selectedCandidates.length}</Tag>
        </Col>
      </Row>

      {/* Search */}
      <Row style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Search
            placeholder="Search candidates by name or email..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
            allowClear
          />
        </Col>
      </Row>

      {/* Candidates Table */}
      <Table
        columns={columns}
        dataSource={filteredCandidates}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 6,
          showSizeChanger: false,
          showQuickJumper: false,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} candidates`,
          simple: true,
        }}
        scroll={{ y: 350 }}
        style={{ width: "100%" }}
      />
    </div>
  );
}
