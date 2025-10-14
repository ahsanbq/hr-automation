import { Card, Col, Row, Statistic, Typography, Space } from "antd";
import {
  UserAddOutlined,
  CalendarOutlined,
  SendOutlined,
  SmileOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  VideoCameraOutlined,
  TrophyOutlined,
  ApiOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  BulbOutlined,
  SettingOutlined,
} from "@ant-design/icons";

interface AnalyticsData {
  summary: {
    totalJobs: number;
    totalResumes: number;
    totalCandidates: number;
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
  recent: {
    jobs: Array<any>;
    resumes: Array<any>;
    interviews: Array<any>;
    meetings: Array<any>;
  };
  analytics: {
    topSkills: Array<{ skill: string; count: number }>;
    experienceLevels: Array<{ level: string; count: number }>;
    jobTypes: Array<{ type: string; count: number }>;
    meetingTypes: Array<{ type: string; count: number }>;
    interviewStatus: Array<{ status: string; count: number }>;
    resumeRecommendations: Array<any>;
    weeklyActivity: Array<{ date: string; type: string; count: number }>;
    monthlyTrends: Array<{ month: string; jobs_created: number }>;
  };
}

interface StatCardsProps {
  data: AnalyticsData & {
    apiLogs: {
      totalApiCalls: number;
      successfulCalls: number;
      failedCalls: number;
      avgResponseTime: number;
      openaiCalls: number;
      claudeCalls: number;
      geminiCalls: number;
      customApiCalls: number;
    };
  };
}

const cardStyles = {
  primary: {
    background: "linear-gradient(135deg, #1677ff 0%, #3f8cff 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    boxShadow: "0 4px 12px rgba(22, 119, 255, 0.3)",
  },
  success: {
    background: "linear-gradient(135deg, #52c41a 0%, #73d13d 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    boxShadow: "0 4px 12px rgba(82, 196, 26, 0.3)",
  },
  warning: {
    background: "linear-gradient(135deg, #faad14 0%, #ffc53d 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    boxShadow: "0 4px 12px rgba(250, 173, 20, 0.3)",
  },
  purple: {
    background: "linear-gradient(135deg, #722ed1 0%, #9254de 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    boxShadow: "0 4px 12px rgba(114, 46, 209, 0.3)",
  },
  orange: {
    background: "linear-gradient(135deg, #ff7a00 0%, #ff9f40 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    boxShadow: "0 4px 12px rgba(255, 122, 0, 0.3)",
  },
  teal: {
    background: "linear-gradient(135deg, #13c2c2 0%, #36cfc9 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    boxShadow: "0 4px 12px rgba(19, 194, 194, 0.3)",
  },
  red: {
    background: "linear-gradient(135deg, #f5222d 0%, #ff4d4f 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    boxShadow: "0 4px 12px rgba(245, 34, 45, 0.3)",
  },
  green: {
    background: "linear-gradient(135deg, #389e0d 0%, #52c41a 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    boxShadow: "0 4px 12px rgba(56, 158, 13, 0.3)",
  },
};

const TitleText = ({ children }: { children: React.ReactNode }) => (
  <Typography.Text style={{ color: "#e6f4ff", fontSize: 12, fontWeight: 500 }}>
    {children}
  </Typography.Text>
);

const MetricText = ({ value, color }: { value: string; color: string }) => (
  <Typography.Text style={{ color, fontSize: 11, fontWeight: 400 }}>
    {value}
  </Typography.Text>
);

export default function StatCards({ data }: StatCardsProps) {
  const { summary, apiLogs } = data;

  return (
    <>
      <style jsx>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 16px;
        }
        @media (max-width: 1200px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* First Row - Business Metrics Only */}
      <div className="stats-grid">
        {/* 1. Total Jobs */}
        <Card
          style={{
            ...cardStyles.primary,
            height: "140px",
          }}
          bodyStyle={{ padding: "24px", height: "100%" }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <TitleText>💼 Total Jobs</TitleText>
              <FileTextOutlined style={{ color: "#e6f4ff", fontSize: 24 }} />
            </div>
            <div>
              <div
                style={{
                  color: "#fff",
                  fontSize: "36px",
                  fontWeight: 700,
                  lineHeight: 1,
                  marginBottom: "8px",
                }}
              >
                {summary.totalJobs}
              </div>
              <MetricText value="Active & closed job posts." color="#e6f4ff" />
            </div>
          </div>
        </Card>

        {/* 2. Total Applications */}
        <Card
          style={{
            ...cardStyles.success,
            height: "140px",
          }}
          bodyStyle={{ padding: "24px", height: "100%" }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <TitleText>📝 Total Applications</TitleText>
              <UserAddOutlined style={{ color: "#f6ffed", fontSize: 24 }} />
            </div>
            <div>
              <div
                style={{
                  color: "#fff",
                  fontSize: "36px",
                  fontWeight: 700,
                  lineHeight: 1,
                  marginBottom: "8px",
                }}
              >
                {summary.totalResumes}
              </div>
              <MetricText
                value="Applications received across all jobs."
                color="#f6ffed"
              />
            </div>
          </div>
        </Card>

        {/* 3. Total Candidates */}
        <Card
          style={{
            ...cardStyles.warning,
            height: "140px",
          }}
          bodyStyle={{ padding: "24px", height: "100%" }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <TitleText>👥 Total Candidates</TitleText>
              <UserAddOutlined style={{ color: "#fffbe6", fontSize: 24 }} />
            </div>
            <div>
              <div
                style={{
                  color: "#fff",
                  fontSize: "36px",
                  fontWeight: 700,
                  lineHeight: 1,
                  marginBottom: "8px",
                }}
              >
                {summary.totalCandidates}
              </div>
              <MetricText
                value="Unique profiles in the system."
                color="#fffbe6"
              />
            </div>
          </div>
        </Card>

        {/* 4. MCQ Tests Conducted */}
        <Card
          style={{
            ...cardStyles.purple,
            height: "140px",
          }}
          bodyStyle={{ padding: "24px", height: "100%" }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <TitleText>🧠 MCQ Tests Conducted</TitleText>
              <QuestionCircleOutlined
                style={{ color: "#f9f0ff", fontSize: 24 }}
              />
            </div>
            <div>
              <div
                style={{
                  color: "#fff",
                  fontSize: "36px",
                  fontWeight: 700,
                  lineHeight: 1,
                  marginBottom: "8px",
                }}
              >
                {summary.totalMCQTemplates}
              </div>
              <MetricText
                value="Skill-based assessments completed."
                color="#f9f0ff"
              />
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
