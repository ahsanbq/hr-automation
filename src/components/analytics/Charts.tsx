import { Card, Col, Row, Spin, Typography } from "antd";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts";
import { useEffect, useState } from "react";

interface AnalyticsData {
  analytics: {
    topSkills: Array<{ skill: string; count: number }>;
    experienceLevels: Array<{ level: string; count: number }>;
    jobTypes: Array<{ type: string; count: number }>;
    meetingTypes: Array<{ type: string; count: number }>;
    interviewStatus: Array<{ status: string; count: number }>;
    resumeRecommendations: Array<{ recommendation: string; count: number }>;
    weeklyActivity: Array<{ date: string; type: string; count: number }>;
    monthlyTrends: Array<{ month: string; jobs_created: number }>;
  };
}

const COLORS = [
  "#1677ff",
  "#52c41a",
  "#faad14",
  "#f5222d",
  "#722ed1",
  "#13c2c2",
  "#eb2f96",
  "#fa8c16",
  "#a0d911",
  "#2f54eb",
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "white",
          padding: "12px",
          border: "1px solid #d9d9d9",
          borderRadius: "6px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        }}
      >
        <p style={{ margin: 0, fontWeight: 600 }}>{`${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ margin: "4px 0", color: entry.color }}>
            {`${entry.dataKey}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Charts() {
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
            <Typography.Text>Failed to load charts data</Typography.Text>
          </Card>
        </Col>
      </Row>
    );
  }

  const { analytics } = data;

  // Process weekly activity data
  const weeklyData = analytics.weeklyActivity.reduce((acc: any, item: any) => {
    const date = new Date(item.date).toLocaleDateString("en-US", {
      weekday: "short",
    });
    const existing = acc.find((d: any) => d.date === date);

    if (existing) {
      existing[item.type] = (existing[item.type] || 0) + parseInt(item.count);
    } else {
      acc.push({
        date,
        [item.type]: parseInt(item.count),
      });
    }
    return acc;
  }, []);

  // Process monthly trends
  const monthlyData = analytics.monthlyTrends.map((item: any) => ({
    month: new Date(item.month).toLocaleDateString("en-US", { month: "short" }),
    jobs: parseInt(item.jobs_created),
  }));

  return (
    <Row gutter={[16, 16]}>
      {/* Weekly Activity Chart */}
      <Col xs={24} lg={12}>
        <Card
          title="Weekly Activity"
          size="small"
          style={{ borderRadius: 8, boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)" }}
        >
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient
                    id="colorApplications"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#1677ff" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#1677ff" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorResumes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#52c41a" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#52c41a" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="job"
                  stackId="1"
                  stroke="#1677ff"
                  fill="url(#colorApplications)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="resume"
                  stackId="1"
                  stroke="#52c41a"
                  fill="url(#colorResumes)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </Col>

      {/* Top Skills Chart */}
      <Col xs={24} lg={12}>
        <Card
          title="Top Skills"
          size="small"
          style={{ borderRadius: 8, boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)" }}
        >
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart
                data={analytics.topSkills.slice(0, 8)}
                layout="horizontal"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  type="category"
                  dataKey="skill"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  width={100}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#1677ff" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </Col>

      {/* Job Types Distribution */}
      <Col xs={24} md={8}>
        <Card
          title="Job Types"
          size="small"
          style={{ borderRadius: 8, boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)" }}
        >
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={analytics.jobTypes}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  label={(entry: any) =>
                    `${entry.type} ${(entry.percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {analytics.jobTypes.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </Col>

      {/* Experience Levels */}
      <Col xs={24} md={8}>
        <Card
          title="Experience Distribution"
          size="small"
          style={{ borderRadius: 8, boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)" }}
        >
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={analytics.experienceLevels}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="level"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#52c41a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </Col>

      {/* Interview Status */}
      <Col xs={24} md={8}>
        <Card
          title="Interview Status"
          size="small"
          style={{ borderRadius: 8, boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)" }}
        >
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={analytics.interviewStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  label={(entry: any) =>
                    `${entry.status} ${(entry.percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {analytics.interviewStatus.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </Col>

      {/* Monthly Trends */}
      <Col xs={24}>
        <Card
          title="Monthly Job Creation Trends"
          size="small"
          style={{ borderRadius: 8, boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)" }}
        >
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorJobs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#722ed1" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#722ed1" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="jobs"
                  stroke="#722ed1"
                  fill="url(#colorJobs)"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </Col>
    </Row>
  );
}
