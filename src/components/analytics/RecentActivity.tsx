import { Card, List, Avatar, Typography, Space, Tag, Spin, Empty } from "antd";
import {
  FileTextOutlined,
  UserOutlined,
  CalendarOutlined,
  VideoCameraOutlined,
  QuestionCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";

const { Text, Title } = Typography;

interface RecentActivityData {
  recent: {
    jobs: Array<{
      id: string;
      jobTitle: string;
      companyName: string;
      location: string;
      createdAt: string;
      _count: { Resume: number };
    }>;
    resumes: Array<{
      id: string;
      candidateName: string;
      candidateEmail: string;
      matchScore: number | null;
      recommendation: string | null;
      createdAt: string;
      JobPost: { jobTitle: string };
    }>;
    interviews: Array<{
      id: string;
      title: string;
      status: string;
      attempted: boolean;
      candidateEmail: string | null;
      createdAt: string;
      jobPost: { jobTitle: string };
      _count: { questions: number };
    }>;
    meetings: Array<{
      id: string;
      meetingType: string | null;
      status: string;
      meetingTime: string;
      createdAt: string;
      JobPost: { jobTitle: string };
      Resume: { candidateName: string };
    }>;
  };
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case "job":
      return <FileTextOutlined style={{ color: "#1677ff" }} />;
    case "resume":
      return <UserOutlined style={{ color: "#52c41a" }} />;
    case "interview":
      return <QuestionCircleOutlined style={{ color: "#faad14" }} />;
    case "meeting":
      return <VideoCameraOutlined style={{ color: "#722ed1" }} />;
    default:
      return <ClockCircleOutlined style={{ color: "#8c8c8c" }} />;
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "draft":
      return "default";
    case "published":
      return "success";
    case "scheduled":
      return "processing";
    case "completed":
      return "success";
    case "in_progress":
      return "processing";
    case "cancelled":
      return "error";
    default:
      return "default";
  }
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

export default function RecentActivity() {
  const [data, setData] = useState<RecentActivityData | null>(null);
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
      <Card
        title="Recent Activity"
        size="small"
        style={{ borderRadius: 8, boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)" }}
      >
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card
        title="Recent Activity"
        size="small"
        style={{ borderRadius: 8, boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)" }}
      >
        <Empty description="Failed to load recent activity" />
      </Card>
    );
  }

  // Combine and sort all recent activities
  const activities = [
    ...data.recent.jobs.map((job) => ({
      ...job,
      type: "job" as const,
      timestamp: new Date(job.createdAt).getTime(),
      title: `New job posted: ${job.jobTitle}`,
      subtitle: `${job.companyName} • ${job.location}`,
      extra: `${job._count.Resume} applications`,
      status: "published",
    })),
    ...data.recent.resumes.slice(0, 3).map((resume) => ({
      ...resume,
      type: "resume" as const,
      timestamp: new Date(resume.createdAt).getTime(),
      title: `New application from ${resume.candidateName}`,
      subtitle: resume.JobPost.jobTitle,
      extra: resume.matchScore ? `${resume.matchScore}% match` : "No score",
      status: resume.recommendation || "pending",
    })),
    ...data.recent.interviews.slice(0, 3).map((interview) => ({
      ...interview,
      type: "interview" as const,
      timestamp: new Date(interview.createdAt).getTime(),
      title: `MCQ test created: ${interview.title}`,
      subtitle: interview.jobPost.jobTitle,
      extra: `${interview._count.questions} questions • ${
        interview.attempted ? "Attempted" : "Not attempted"
      }`,
      status: interview.status,
    })),
    ...data.recent.meetings.slice(0, 3).map((meeting) => ({
      ...meeting,
      type: "meeting" as const,
      timestamp: new Date(meeting.createdAt).getTime(),
      title: `Meeting scheduled with ${meeting.Resume.candidateName}`,
      subtitle: meeting.JobPost.jobTitle,
      extra: `${meeting.meetingType || "General"} interview`,
      status: meeting.status,
    })),
  ]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10);

  return (
    <Card
      title="Recent Activity"
      size="small"
      style={{ borderRadius: 8, boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)" }}
      extra={<Text type="secondary">{activities.length} activities</Text>}
    >
      {activities.length === 0 ? (
        <Empty description="No recent activity" />
      ) : (
        <List
          size="small"
          dataSource={activities}
          renderItem={(item) => (
            <List.Item style={{ padding: "12px 0" }}>
              <List.Item.Meta
                avatar={
                  <Avatar
                    icon={getActivityIcon(item.type)}
                    style={{
                      backgroundColor: "transparent",
                      border: `2px solid ${
                        getActivityIcon(item.type).props.style.color
                      }`,
                    }}
                  />
                }
                title={
                  <Space
                    direction="vertical"
                    size={4}
                    style={{ width: "100%" }}
                  >
                    <Space
                      style={{ width: "100%", justifyContent: "space-between" }}
                    >
                      <Text strong style={{ fontSize: 14 }}>
                        {item.title}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {formatTimeAgo(item.timestamp.toString())}
                      </Text>
                    </Space>
                    <Space
                      style={{ width: "100%", justifyContent: "space-between" }}
                    >
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.subtitle}
                      </Text>
                      <Tag
                        color={getStatusColor(item.status)}
                        style={{ fontSize: 11 }}
                      >
                        {item.status}
                      </Tag>
                    </Space>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {item.extra}
                    </Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}
