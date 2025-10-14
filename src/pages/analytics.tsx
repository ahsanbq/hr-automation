import AppLayout from "@/components/layout/AppLayout";
import StatCards from "@/components/analytics/StatCards";
import Charts from "@/components/analytics/Charts";
import RecentActivity from "@/components/analytics/RecentActivity";
import { Row, Col, Spin, Card } from "antd";
import { useEffect, useState } from "react";

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
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/analytics/dashboard");
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || "Failed to load analytics data");
      }
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout
        title="Analytics Dashboard"
        subtitle="Overview of recruiting metrics"
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px",
          }}
        >
          <Spin size="large" />
        </div>
      </AppLayout>
    );
  }

  if (error || !data) {
    return (
      <AppLayout
        title="Analytics Dashboard"
        subtitle="Overview of recruiting metrics"
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px",
            color: "#ff4d4f",
          }}
        >
          <p>{error || "Failed to load analytics data"}</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Analytics Dashboard"
      subtitle="Overview of recruiting metrics"
    >
      <style jsx>{`
        .dashboard-container {
          padding: 0;
          width: 100%;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        @media (max-width: 1200px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 768px) {
          .dashboard-container {
            padding: 0 16px;
          }
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="dashboard-container">
        {/* First Row - Main Stats */}
        <div style={{ marginBottom: "32px" }}>
          <StatCards data={data} />
        </div>

        {/* Second Row - Performance Metrics */}
        <div style={{ marginBottom: "32px" }}>
          <div className="stats-grid">
            {/* 5. Average Match Score */}
            <Card
              style={{
                background: "linear-gradient(135deg, #ff7a00 0%, #ff9f40 100%)",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                boxShadow: "0 4px 12px rgba(255, 122, 0, 0.3)",
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
                  <span
                    style={{ color: "#e6f4ff", fontSize: 12, fontWeight: 500 }}
                  >
                    📊 Average Match Score
                  </span>
                  <span style={{ color: "#fff7e6", fontSize: 24 }}>🏆</span>
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
                    56%
                  </div>
                  <span
                    style={{ color: "#fff7e6", fontSize: 11, fontWeight: 400 }}
                  >
                    Candidate–job fit accuracy.
                  </span>
                </div>
              </div>
            </Card>

            {/* 6. Interviews Scheduled */}
            <Card
              style={{
                background: "linear-gradient(135deg, #13c2c2 0%, #36cfc9 100%)",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                boxShadow: "0 4px 12px rgba(19, 194, 194, 0.3)",
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
                  <span
                    style={{ color: "#e6f4ff", fontSize: 12, fontWeight: 500 }}
                  >
                    🗓️ Interviews Scheduled
                  </span>
                  <span style={{ color: "#e6fffb", fontSize: 24 }}>📅</span>
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
                    9
                  </div>
                  <span
                    style={{ color: "#e6fffb", fontSize: 11, fontWeight: 400 }}
                  >
                    40% progressed to next round.
                  </span>
                </div>
              </div>
            </Card>

            {/* 7. Hiring Conversion Rate */}
            <Card
              style={{
                background: "linear-gradient(135deg, #389e0d 0%, #52c41a 100%)",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                boxShadow: "0 4px 12px rgba(56, 158, 13, 0.3)",
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
                  <span
                    style={{ color: "#e6f4ff", fontSize: 12, fontWeight: 500 }}
                  >
                    🚀 Hiring Conversion Rate
                  </span>
                  <span style={{ color: "#f6ffed", fontSize: 24 }}>⚡</span>
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
                    22.5%
                  </div>
                  <span
                    style={{ color: "#f6ffed", fontSize: 11, fontWeight: 400 }}
                  >
                    From applied to hired.
                  </span>
                </div>
              </div>
            </Card>

            {/* 8. API & External AI Calls */}
            <Card
              style={{
                background: "linear-gradient(135deg, #f5222d 0%, #ff4d4f 100%)",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                boxShadow: "0 4px 12px rgba(245, 34, 45, 0.3)",
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
                  <span
                    style={{ color: "#e6f4ff", fontSize: 12, fontWeight: 500 }}
                  >
                    ⚙️ API & External AI Calls
                  </span>
                  <span style={{ color: "#fff1f0", fontSize: 24 }}>🔗</span>
                </div>
                <div>
                  <div
                    style={{
                      color: "#fff",
                      fontSize: "28px",
                      fontWeight: 700,
                      lineHeight: 1,
                      marginBottom: "8px",
                    }}
                  >
                    1,178 total | 372 AI calls
                  </div>
                  <span
                    style={{ color: "#fff1f0", fontSize: 11, fontWeight: 400 }}
                  >
                    95% success | 427ms avg response
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Top Skills Distribution - Full Width */}
        <div style={{ marginBottom: "32px" }}>
          <Charts data={data} />
        </div>

        {/* Bottom Section - Recent Activity */}
        <div>
          <RecentActivity data={data} />
        </div>
      </div>
    </AppLayout>
  );
}
