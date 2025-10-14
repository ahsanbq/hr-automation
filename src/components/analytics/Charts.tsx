import React from "react";
import { Card, Row, Col, Typography } from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const { Text } = Typography;

interface ChartsProps {
  data: {
    analytics: {
      topSkills: Array<{ skill: string; count: number }>;
      experienceLevels: Array<{ level: string; count: number }>;
      jobTypes: Array<{ type: string; count: number }>;
      meetingTypes: Array<{ type: string; count: number }>;
      interviewStatus: Array<{ status: string; count: number }>;
      resumeRecommendations: Array<any>;
    };
  };
}

const COLORS = [
  "#1677ff",
  "#52c41a",
  "#faad14",
  "#f5222d",
  "#722ed1",
  "#13c2c2",
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: "#fff",
          padding: "12px",
          border: "1px solid #d9d9d9",
          borderRadius: "6px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        }}
      >
        <p style={{ margin: 0, color: "#262626", fontWeight: 500 }}>{label}</p>
        <p style={{ margin: "4px 0 0 0", color: "#1677ff" }}>
          Count: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

export default function Charts({ data }: ChartsProps) {
  const { analytics } = data;

  return (
    <div>
      {/* Three Charts Row */}
      <Row gutter={[24, 24]}>
        {/* Job Types */}
        <Col xs={24} md={8}>
          <Card
            title="Job Types"
            style={{
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              height: "100%",
            }}
            bodyStyle={{ padding: "20px" }}
          >
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={[{ type: "Full-time", count: 12 }]}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    label={(entry: any) =>
                      `${entry.type} ${(entry.percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    <Cell fill="#1677ff" />
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
            style={{
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              height: "100%",
            }}
            bodyStyle={{ padding: "20px" }}
          >
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart
                  data={[
                    { level: "10 years", count: 3 },
                    { level: "5 years", count: 2.25 },
                    { level: "2 years", count: 1.5 },
                    { level: "6 years", count: 0.75 },
                    { level: "Not specified", count: 0 },
                    { level: "4 years", count: 0 },
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
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
                  <Bar dataKey="count" fill="#52c41a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* Interview Status */}
        <Col xs={24} md={8}>
          <Card
            title="Interview Status"
            style={{
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              height: "100%",
            }}
            bodyStyle={{ padding: "20px" }}
          >
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={[
                      { status: "Completed", count: 6 },
                      { status: "Pending", count: 2 },
                      { status: "Cancelled", count: 1 },
                    ]}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    label={(entry: any) =>
                      `${entry.status} ${(entry.percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    <Cell fill="#1677ff" />
                    <Cell fill="#52c41a" />
                    <Cell fill="#faad14" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
