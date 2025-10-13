import { useState, useEffect } from "react";
import type { ColumnsType } from "antd/es/table";
import {
  Table,
  Space,
  Button,
  Modal,
  message,
  Tag,
  Card,
  Spin,
  Row,
  Col,
  Statistic,
  Tooltip,
} from "antd";
import {
  EyeOutlined,
  ProfileOutlined,
  CalendarOutlined,
  TeamOutlined,
  UserOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  EditOutlined,
  QuestionCircleOutlined,
  RobotOutlined,
  TeamOutlined as MeetingOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import Link from "next/link";

export type AssessmentJobRow = {
  id: string;
  jobTitle: string;
  companyName?: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  salaryRange?: string;
  skillsRequired: string[];
  status?: string;
  createdAt?: string;
  createdBy?: { id: number; name: string; email: string };
  companies?: { name: string };
  _count?: {
    Resume: number;
    assessmentStages: number;
  };
  assessmentStages?: {
    type: string;
    status: string;
  }[];
};

interface AssessmentJobsTableProps {
  mode?: "mcq" | "avatar" | "manual" | "all";
}

export default function AssessmentJobsTable({
  mode = "all",
}: AssessmentJobsTableProps) {
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<AssessmentJobRow[]>([]);
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalResumes: 0,
    totalMCQ: 0,
    totalAvatar: 0,
    totalManual: 0,
  });
  const router = useRouter();

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/jobs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);

        // Calculate stats
        const totalResumes =
          data.jobs?.reduce(
            (sum: number, job: AssessmentJobRow) =>
              sum + (job._count?.Resume || 0),
            0
          ) || 0;

        const totalMCQ =
          data.jobs?.reduce((sum: number, job: AssessmentJobRow) => {
            return (
              sum +
              (job.assessmentStages?.filter((stage) => stage.type === "MCQ")
                .length || 0)
            );
          }, 0) || 0;

        const totalAvatar =
          data.jobs?.reduce((sum: number, job: AssessmentJobRow) => {
            return (
              sum +
              (job.assessmentStages?.filter((stage) => stage.type === "AVATAR")
                .length || 0)
            );
          }, 0) || 0;

        const totalManual =
          data.jobs?.reduce((sum: number, job: AssessmentJobRow) => {
            return (
              sum +
              (job.assessmentStages?.filter((stage) => stage.type === "MANUAL")
                .length || 0)
            );
          }, 0) || 0;

        setStats({
          totalJobs: data.jobs?.length || 0,
          totalResumes,
          totalMCQ,
          totalAvatar,
          totalManual,
        });
      } else {
        message.error("Failed to fetch jobs");
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      message.error("Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const getModeTitle = () => {
    switch (mode) {
      case "mcq":
        return "MCQ Tests";
      case "avatar":
        return "AI Interviews";
      case "manual":
        return "Manual Meetings";
      default:
        return "Candidate Assessments";
    }
  };

  const getModeIcon = () => {
    switch (mode) {
      case "mcq":
        return <QuestionCircleOutlined />;
      case "avatar":
        return <RobotOutlined />;
      case "manual":
        return <MeetingOutlined />;
      default:
        return <ProfileOutlined />;
    }
  };

  const getModeRoute = () => {
    switch (mode) {
      case "mcq":
        return "/assessment/mcq";
      case "avatar":
        return "/assessment/avatar";
      case "manual":
        return "/assessment/manual";
      default:
        return "/assessment";
    }
  };

  const columns: ColumnsType<AssessmentJobRow> = [
    {
      title: "Job Title",
      dataIndex: "jobTitle",
      key: "jobTitle",
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            {record.companies?.name || record.companyName || "N/A"}
          </div>
        </div>
      ),
    },
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
      render: (location) => (
        <div>
          <EnvironmentOutlined style={{ marginRight: 4 }} />
          {location}
        </div>
      ),
    },
    {
      title: "Type",
      dataIndex: "jobType",
      key: "jobType",
      render: (type) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: "Experience",
      dataIndex: "experienceLevel",
      key: "experienceLevel",
      render: (level) => <Tag color="green">{level}</Tag>,
    },
    {
      title: "Resumes",
      key: "resumes",
      render: (_, record) => (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "16px", fontWeight: 500 }}>
            {record._count?.Resume || 0}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>Candidates</div>
        </div>
      ),
    },
    {
      title: "Assessments",
      key: "assessments",
      render: (_, record) => {
        const mcqCount =
          record.assessmentStages?.filter((stage) => stage.type === "MCQ")
            .length || 0;
        const avatarCount =
          record.assessmentStages?.filter((stage) => stage.type === "AVATAR")
            .length || 0;
        const manualCount =
          record.assessmentStages?.filter((stage) => stage.type === "MANUAL")
            .length || 0;

        return (
          <Space direction="vertical" size="small">
            <div>
              <QuestionCircleOutlined
                style={{ color: "#1890ff", marginRight: 4 }}
              />
              <span style={{ fontSize: "12px" }}>MCQ: {mcqCount}</span>
            </div>
            <div>
              <RobotOutlined style={{ color: "#52c41a", marginRight: 4 }} />
              <span style={{ fontSize: "12px" }}>AI: {avatarCount}</span>
            </div>
            <div>
              <MeetingOutlined style={{ color: "#722ed1", marginRight: 4 }} />
              <span style={{ fontSize: "12px" }}>Manual: {manualCount}</span>
            </div>
          </Space>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const statusConfig = {
          ACTIVE: { color: "green", text: "Active" },
          PAUSED: { color: "orange", text: "Paused" },
          CLOSED: { color: "red", text: "Closed" },
        };
        const config =
          statusConfig[status as keyof typeof statusConfig] ||
          statusConfig.ACTIVE;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Tooltip title="View Candidates">
            <Link href={`${getModeRoute()}/${record.id}`}>
              <Button type="primary" icon={<EyeOutlined />} size="small">
                Manage
              </Button>
            </Link>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ background: "#f5f5f5", minHeight: "100vh" }}>
      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Jobs"
              value={stats.totalJobs}
              prefix={<ProfileOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Candidates"
              value={stats.totalResumes}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="MCQ Tests"
              value={stats.totalMCQ}
              prefix={<QuestionCircleOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="AI Interviews"
              value={stats.totalAvatar}
              prefix={<RobotOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Jobs Table */}
      <Card>
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {getModeIcon()}
              {getModeTitle()} - Job List
            </h3>
            <p style={{ margin: "4px 0 0 0", color: "#666" }}>
              Select a job to manage candidate assessments
            </p>
          </div>
          <Button onClick={fetchJobs} loading={loading}>
            Refresh
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={jobs}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} jobs`,
          }}
        />
      </Card>
    </div>
  );
}
