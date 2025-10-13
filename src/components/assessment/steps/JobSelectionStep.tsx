/**
 * Step 2: Job Selection Component
 */

import React from "react";
import {
  Table,
  Tag,
  Typography,
  Input,
  Row,
  Col,
  Statistic,
  Space,
} from "antd";
import {
  SearchOutlined,
  UserOutlined,
  CalendarOutlined,
} from "@ant-design/icons";

const { Text } = Typography;
const { Search } = Input;

interface JobPost {
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

interface JobSelectionStepProps {
  jobs: JobPost[];
  selectedJob: JobPost | null;
  onJobSelect: (job: JobPost) => void;
  loading: boolean;
}

export default function JobSelectionStep({
  jobs,
  selectedJob,
  onJobSelect,
  loading,
}: JobSelectionStepProps) {
  const [filteredJobs, setFilteredJobs] = React.useState<JobPost[]>(jobs || []);
  const [searchText, setSearchText] = React.useState("");

  React.useEffect(() => {
    setFilteredJobs(jobs || []);
  }, [jobs]);

  React.useEffect(() => {
    if (!searchText) {
      setFilteredJobs(jobs || []);
    } else {
      const filtered =
        jobs?.filter(
          (job) =>
            job.jobTitle.toLowerCase().includes(searchText.toLowerCase()) ||
            job.companyName.toLowerCase().includes(searchText.toLowerCase())
        ) || [];
      setFilteredJobs(filtered);
    }
  }, [jobs, searchText]);

  const columns = [
    {
      title: "Job Title",
      dataIndex: "jobTitle",
      key: "jobTitle",
      width: 400,
      render: (text: string, record: JobPost) => (
        <div>
          <Text strong style={{ fontSize: "15px" }}>
            {text || "Untitled Job"}
          </Text>
          <div style={{ marginTop: 4 }}>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {record.companyName || "No company specified"}
            </Text>
          </div>
          <div style={{ marginTop: 2 }}>
            <Text type="secondary" style={{ fontSize: "11px" }}>
              {record.location || "No location"} •{" "}
              {record.jobType || "Unknown type"}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Candidates",
      dataIndex: ["_count", "Resume"],
      key: "candidates",
      width: 120,
      align: "center" as const,
      render: (count: number) => (
        <Tag color="blue" icon={<UserOutlined />} style={{ fontSize: "12px" }}>
          {count || 0} candidates
        </Tag>
      ),
    },
    {
      title: "Select",
      key: "select",
      width: 120,
      align: "center" as const,
      render: (_: any, record: JobPost) => (
        <div>
          {selectedJob?.id === record.id ? (
            <Tag color="green" style={{ fontSize: "12px", cursor: "default" }}>
              ✓ Selected
            </Tag>
          ) : (
            <Tag
              color="blue"
              style={{
                cursor: "pointer",
                fontSize: "12px",
                transition: "all 0.3s ease",
              }}
              onClick={() => onJobSelect(record)}
            >
              Click to Select
            </Tag>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Summary Stats */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Statistic
            title="Total Jobs"
            value={jobs?.length || 0}
            prefix={<CalendarOutlined />}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Available Jobs"
            value={jobs?.length || 0}
            valueStyle={{ color: "#52c41a" }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Total Candidates"
            value={
              jobs?.reduce((sum, job) => sum + (job?._count?.Resume || 0), 0) ||
              0
            }
            prefix={<UserOutlined />}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Selected Job"
            value={selectedJob ? "1" : "0"}
            valueStyle={{ color: selectedJob ? "#1890ff" : "#999" }}
          />
        </Col>
      </Row>

      {/* Search */}
      <Row style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Search
            placeholder="Search jobs by title or description..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
            allowClear
          />
        </Col>
      </Row>

      {/* Selected Job Display */}
      {selectedJob && (
        <Row style={{ marginBottom: 16 }}>
          <Col span={24}>
            <div
              style={{
                padding: 16,
                background: "#e6f7ff",
                border: "1px solid #91d5ff",
                borderRadius: 6,
              }}
            >
              <Text strong style={{ color: "#1890ff" }}>
                Selected Job: {selectedJob.jobTitle || "Untitled Job"}
              </Text>
              <br />
              <Text type="secondary">
                {selectedJob._count?.Resume || 0} candidates available
              </Text>
            </div>
          </Col>
        </Row>
      )}

      {/* Jobs Table */}
      <Table
        columns={columns}
        dataSource={filteredJobs}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 5,
          showSizeChanger: false,
          showQuickJumper: false,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} jobs`,
          simple: true,
        }}
        scroll={{ y: 350 }}
        size="small"
        rowClassName={(record) =>
          selectedJob?.id === record.id ? "selected-row" : ""
        }
        style={{ width: "100%" }}
      />

      <style jsx>{`
        .selected-row {
          background-color: #e6f7ff !important;
        }
      `}</style>
    </div>
  );
}
