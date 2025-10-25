import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Space,
  Spin,
  Alert,
  Progress,
  Tag,
  Table,
  Tooltip,
  Divider,
} from "antd";
import {
  BuildOutlined,
  UserOutlined,
  CalendarOutlined,
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
  TeamOutlined,
  FileTextOutlined,
  VideoCameraOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StarOutlined,
  LineChartOutlined,
  BarChartOutlined,
  PieChartOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

interface CompanyMetricsData {
  company: {
    name: string;
    address: string;
    country: string;
    website: string;
    memberCount: number;
    joinedDate: string | null;
  };
  jobs: {
    total: number;
    active: number;
    inactive: number;
    last30Days: number;
    last7Days: number;
    avgSalary: number;
  };
  candidates: {
    total: number;
    highMatch: number;
    mediumMatch: number;
    lowMatch: number;
    avgMatchScore: number;
    last30Days: number;
    last7Days: number;
  };
  interviews: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    avgScore: number;
    last30Days: number;
  };
  meetings: {
    total: number;
    scheduled: number;
    completed: number;
    cancelled: number;
    last30Days: number;
  };
  skills: {
    topSkills: Array<{ skill: string; count: number }>;
  };
  trends: {
    monthlyData: Array<{
      month: string;
      jobsCreated: number;
      candidatesAdded: number;
      interviewsConducted: number;
      meetingsScheduled: number;
    }>;
  };
  performance: {
    avgMatchScore: number;
    avgInterviewScore: number;
    hireRecommendations: number;
    noHireRecommendations: number;
    maybeRecommendations: number;
  };
  kpis: {
    applicationToInterviewRate: number;
    interviewToMeetingRate: number;
    interviewCompletionRate: number;
    meetingCompletionRate: number;
  };
}

interface CompanyMetricsProps {
  companyId?: number;
}

const CompanyMetrics: React.FC<CompanyMetricsProps> = () => {
  const [data, setData] = useState<CompanyMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCompanyMetrics();
  }, []);

  const fetchCompanyMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to view analytics");
        return;
      }

      const response = await fetch("/api/analytics/company-metrics", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || "Failed to load company metrics");
        }
      } else {
        setError("Failed to load company metrics");
      }
    } catch (err) {
      console.error("Error fetching company metrics:", err);
      setError("Failed to load company metrics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
        <div style={{ marginTop: "16px" }}>
          <Text>Loading company analytics...</Text>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Alert
        message="Error Loading Analytics"
        description={error || "Failed to load company metrics"}
        type="error"
        showIcon
        style={{ margin: "20px" }}
      />
    );
  }

  const skillColumns = [
    {
      title: "Skill",
      dataIndex: "skill",
      key: "skill",
    },
    {
      title: "Count",
      dataIndex: "count",
      key: "count",
      render: (count: number) => <Tag color="blue">{count}</Tag>,
    },
  ];

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous)
      return <RiseOutlined style={{ color: "#52c41a" }} />;
    if (current < previous)
      return <FallOutlined style={{ color: "#ff4d4f" }} />;
    return <span style={{ color: "#8c8c8c" }}>—</span>;
  };

  const getTrendColor = (current: number, previous: number) => {
    if (current > previous) return "#52c41a";
    if (current < previous) return "#ff4d4f";
    return "#8c8c8c";
  };

  return (
    <div style={{ padding: "24px" }}>
      {/* Company Header */}
      <Card style={{ marginBottom: "24px" }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space direction="vertical" size="small">
              <Title level={2} style={{ margin: 0 }}>
                <BuildOutlined /> {data.company.name}
              </Title>
              <Text type="secondary">
                {data.company.address}, {data.company.country}
              </Text>
              <Text type="secondary">
                {data.company.memberCount} team members
              </Text>
            </Space>
          </Col>
          <Col>
            <Space direction="vertical" align="end">
              <Text strong>Company Analytics</Text>
              <Text type="secondary">Real-time company-specific metrics</Text>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Key Performance Indicators */}
      <Card title="Key Performance Indicators" style={{ marginBottom: "24px" }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <Statistic
                title="Application to Interview Rate"
                value={data.kpis.applicationToInterviewRate}
                precision={1}
                suffix="%"
                prefix={<LineChartOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <Statistic
                title="Interview to Meeting Rate"
                value={data.kpis.interviewToMeetingRate}
                precision={1}
                suffix="%"
                prefix={<VideoCameraOutlined />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <Statistic
                title="Interview Completion Rate"
                value={data.kpis.interviewCompletionRate}
                precision={1}
                suffix="%"
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: "#722ed1" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <Statistic
                title="Meeting Completion Rate"
                value={data.kpis.meetingCompletionRate}
                precision={1}
                suffix="%"
                prefix={<CalendarOutlined />}
                valueStyle={{ color: "#fa8c16" }}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Overview Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Jobs"
              value={data.jobs.total}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
            <div style={{ marginTop: "8px" }}>
              <Text type="secondary">
                Active: {data.jobs.active} | Inactive: {data.jobs.inactive}
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Candidates"
              value={data.candidates.total}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
            <div style={{ marginTop: "8px" }}>
              <Text type="secondary">
                High Match: {data.candidates.highMatch} | Medium:{" "}
                {data.candidates.mediumMatch} | Low: {data.candidates.lowMatch}
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Interviews"
              value={data.interviews.total}
              prefix={<VideoCameraOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
            <div style={{ marginTop: "8px" }}>
              <Text type="secondary">
                Completed: {data.interviews.completed} | In Progress:{" "}
                {data.interviews.inProgress} | Pending:{" "}
                {data.interviews.pending}
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Meetings"
              value={data.meetings.total}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: "#fa8c16" }}
            />
            <div style={{ marginTop: "8px" }}>
              <Text type="secondary">
                Scheduled: {data.meetings.scheduled} | Completed:{" "}
                {data.meetings.completed} | Cancelled: {data.meetings.cancelled}
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Performance Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col xs={24} sm={12} md={8}>
          <Card title="Average Match Score" size="small">
            <Progress
              type="circle"
              percent={Math.round(data.performance.avgMatchScore)}
              format={(percent) => `${percent}%`}
              strokeColor="#52c41a"
            />
            <div style={{ textAlign: "center", marginTop: "8px" }}>
              <Text type="secondary">
                Based on {data.candidates.total} candidates
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card title="Average Interview Score" size="small">
            <Progress
              type="circle"
              percent={Math.round(data.performance.avgInterviewScore)}
              format={(percent) => `${percent}%`}
              strokeColor="#1890ff"
            />
            <div style={{ textAlign: "center", marginTop: "8px" }}>
              <Text type="secondary">
                Based on {data.interviews.completed} completed interviews
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card title="Recommendation Breakdown" size="small">
            <Space direction="vertical" style={{ width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text>Hire</Text>
                <Tag color="green">{data.performance.hireRecommendations}</Tag>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text>Maybe</Text>
                <Tag color="orange">
                  {data.performance.maybeRecommendations}
                </Tag>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text>No Hire</Text>
                <Tag color="red">{data.performance.noHireRecommendations}</Tag>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Top Skills */}
      <Card title="Top Skills in Your Company" style={{ marginBottom: "24px" }}>
        <Table
          columns={skillColumns}
          dataSource={data.skills.topSkills}
          pagination={{ pageSize: 10 }}
          size="small"
          rowKey="skill"
        />
      </Card>

      {/* Recent Activity Trends */}
      <Card title="Monthly Activity Trends" style={{ marginBottom: "24px" }}>
        <Row gutter={[16, 16]}>
          {data.trends.monthlyData.slice(-6).map((month, index) => (
            <Col xs={24} sm={12} md={8} key={month.month}>
              <Card size="small" title={month.month}>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Text>Jobs Created</Text>
                    <Text strong>{month.jobsCreated}</Text>
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Text>Candidates Added</Text>
                    <Text strong>{month.candidatesAdded}</Text>
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Text>Interviews Conducted</Text>
                    <Text strong>{month.interviewsConducted}</Text>
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Text>Meetings Scheduled</Text>
                    <Text strong>{month.meetingsScheduled}</Text>
                  </div>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Recent Activity Summary */}
      <Card title="Recent Activity (Last 30 Days)">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <Statistic
                title="Jobs Created"
                value={data.jobs.last30Days}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <Statistic
                title="Candidates Added"
                value={data.candidates.last30Days}
                prefix={<UserOutlined />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <Statistic
                title="Interviews Conducted"
                value={data.interviews.last30Days}
                prefix={<VideoCameraOutlined />}
                valueStyle={{ color: "#722ed1" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <Statistic
                title="Meetings Scheduled"
                value={data.meetings.last30Days}
                prefix={<CalendarOutlined />}
                valueStyle={{ color: "#fa8c16" }}
              />
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default CompanyMetrics;
