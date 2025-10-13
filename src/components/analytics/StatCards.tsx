import { Card, Col, Row, Statistic, Typography, Space, Spin } from "antd";
import {
  UserAddOutlined,
  CalendarOutlined,
  SendOutlined,
  SmileOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  VideoCameraOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";

interface AnalyticsData {
  summary: {
    totalJobs: number;
    totalResumes: number;
    totalInterviews: number;
    totalMeetings: number;
    totalMCQTemplates: number;
    avgMatchScore: number;
    avgInterviewScore: number;
    conversionRates: {
      applicationToInterview: number;
      interviewToMeeting: number;
      interviewCompletion: number;
    };
  };
}

const cardStyles = {
  primary: {
    background: "linear-gradient(135deg, #1677ff 0%, #3f8cff 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
  },
  success: {
    background: "linear-gradient(135deg, #52c41a 0%, #73d13d 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
  },
  warning: {
    background: "linear-gradient(135deg, #faad14 0%, #ffc53d 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
  },
  purple: {
    background: "linear-gradient(135deg, #722ed1 0%, #9254de 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
  },
};

const TitleText = ({ children }: { children: React.ReactNode }) => (
  <Typography.Text style={{ color: "#e6f4ff", fontSize: 12, fontWeight: 500 }}>
    {children}
  </Typography.Text>
);

const MetricText = ({
  value,
  suffix = "",
  color = "#d9f7be",
}: {
  value: string | number;
  suffix?: string;
  color?: string;
}) => (
  <Typography.Text style={{ color, fontSize: 12, fontWeight: 500 }}>
    {value}
    {suffix}
  </Typography.Text>
);

export default function StatCards() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const response = await fetch("/api/analytics/dashboard");
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Row gutter={[16, 16]} justify="center">
        <Col>
          <Spin size="large" />
        </Col>
      </Row>
    );
  }

  if (!data) {
    return (
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Typography.Text>Failed to load analytics data</Typography.Text>
          </Card>
        </Col>
      </Row>
    );
  }

  const { summary } = data;

  return (
    <Row gutter={[16, 16]}>
      {/* Primary Stats Row */}
      <Col xs={24} md={6}>
        <Card
          size="small"
          style={cardStyles.primary}
          bodyStyle={{ padding: 20 }}
        >
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <Space
              align="center"
              style={{ justifyContent: "space-between", width: "100%" }}
            >
              <TitleText>Total Jobs</TitleText>
              <FileTextOutlined style={{ color: "#e6f4ff", fontSize: 18 }} />
            </Space>
            <Statistic
              valueStyle={{ color: "#fff", fontSize: 28, fontWeight: 600 }}
              value={summary.totalJobs}
              suffix={null}
            />
            <MetricText
              value={`${summary.totalResumes} applications`}
              color="#e6f4ff"
            />
          </Space>
        </Card>
      </Col>

      <Col xs={24} md={6}>
        <Card
          size="small"
          style={cardStyles.success}
          bodyStyle={{ padding: 20 }}
        >
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <Space
              align="center"
              style={{ justifyContent: "space-between", width: "100%" }}
            >
              <TitleText>MCQ Tests</TitleText>
              <QuestionCircleOutlined
                style={{ color: "#f6ffed", fontSize: 18 }}
              />
            </Space>
            <Statistic
              valueStyle={{ color: "#fff", fontSize: 28, fontWeight: 600 }}
              value={summary.totalInterviews}
              suffix={null}
            />
            <MetricText
              value={`${summary.totalMCQTemplates} templates`}
              color="#f6ffed"
            />
          </Space>
        </Card>
      </Col>

      <Col xs={24} md={6}>
        <Card
          size="small"
          style={cardStyles.warning}
          bodyStyle={{ padding: 20 }}
        >
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <Space
              align="center"
              style={{ justifyContent: "space-between", width: "100%" }}
            >
              <TitleText>Meetings</TitleText>
              <VideoCameraOutlined style={{ color: "#fffbe6", fontSize: 18 }} />
            </Space>
            <Statistic
              valueStyle={{ color: "#fff", fontSize: 28, fontWeight: 600 }}
              value={summary.totalMeetings}
              suffix={null}
            />
            <MetricText
              value={`${summary.conversionRates.interviewToMeeting.toFixed(
                1
              )}% conversion`}
              color="#fffbe6"
            />
          </Space>
        </Card>
      </Col>

      <Col xs={24} md={6}>
        <Card
          size="small"
          style={cardStyles.purple}
          bodyStyle={{ padding: 20 }}
        >
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <Space
              align="center"
              style={{ justifyContent: "space-between", width: "100%" }}
            >
              <TitleText>Avg Match Score</TitleText>
              <TrophyOutlined style={{ color: "#f9f0ff", fontSize: 18 }} />
            </Space>
            <Statistic
              valueStyle={{ color: "#fff", fontSize: 28, fontWeight: 600 }}
              value={summary.avgMatchScore}
              precision={1}
              suffix="%"
            />
            <MetricText
              value={`${summary.conversionRates.applicationToInterview.toFixed(
                1
              )}% to interview`}
              color="#f9f0ff"
            />
          </Space>
        </Card>
      </Col>

      {/* Secondary Stats Row */}
      <Col xs={24} md={6}>
        <Card
          size="small"
          style={cardStyles.primary}
          bodyStyle={{ padding: 20 }}
        >
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <Space
              align="center"
              style={{ justifyContent: "space-between", width: "100%" }}
            >
              <TitleText>Applications</TitleText>
              <UserAddOutlined style={{ color: "#e6f4ff", fontSize: 18 }} />
            </Space>
            <Statistic
              valueStyle={{ color: "#fff", fontSize: 28, fontWeight: 600 }}
              value={summary.totalResumes}
              suffix={null}
            />
            <MetricText value="Total candidates" color="#e6f4ff" />
          </Space>
        </Card>
      </Col>

      <Col xs={24} md={6}>
        <Card
          size="small"
          style={cardStyles.success}
          bodyStyle={{ padding: 20 }}
        >
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <Space
              align="center"
              style={{ justifyContent: "space-between", width: "100%" }}
            >
              <TitleText>Interviews</TitleText>
              <CalendarOutlined style={{ color: "#f6ffed", fontSize: 18 }} />
            </Space>
            <Statistic
              valueStyle={{ color: "#fff", fontSize: 28, fontWeight: 600 }}
              value={summary.totalInterviews}
              suffix={null}
            />
            <MetricText
              value={`${summary.conversionRates.interviewCompletion.toFixed(
                1
              )}% completed`}
              color="#f6ffed"
            />
          </Space>
        </Card>
      </Col>

      <Col xs={24} md={6}>
        <Card
          size="small"
          style={cardStyles.warning}
          bodyStyle={{ padding: 20 }}
        >
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <Space
              align="center"
              style={{ justifyContent: "space-between", width: "100%" }}
            >
              <TitleText>Avg Interview Score</TitleText>
              <TrophyOutlined style={{ color: "#fffbe6", fontSize: 18 }} />
            </Space>
            <Statistic
              valueStyle={{ color: "#fff", fontSize: 28, fontWeight: 600 }}
              value={summary.avgInterviewScore}
              precision={1}
              suffix="%"
            />
            <MetricText value="Performance metric" color="#fffbe6" />
          </Space>
        </Card>
      </Col>

      <Col xs={24} md={6}>
        <Card
          size="small"
          style={cardStyles.purple}
          bodyStyle={{ padding: 20 }}
        >
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <Space
              align="center"
              style={{ justifyContent: "space-between", width: "100%" }}
            >
              <TitleText>MCQ Templates</TitleText>
              <QuestionCircleOutlined
                style={{ color: "#f9f0ff", fontSize: 18 }}
              />
            </Space>
            <Statistic
              valueStyle={{ color: "#fff", fontSize: 28, fontWeight: 600 }}
              value={summary.totalMCQTemplates}
              suffix={null}
            />
            <MetricText value="Question bank" color="#f9f0ff" />
          </Space>
        </Card>
      </Col>
    </Row>
  );
}
