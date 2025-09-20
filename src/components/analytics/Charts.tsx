import { Card, Col, Row } from "antd";
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
} from "recharts";

const data = [
  { name: "Mon", applications: 20, interviews: 5 },
  { name: "Tue", applications: 28, interviews: 7 },
  { name: "Wed", applications: 22, interviews: 6 },
  { name: "Thu", applications: 35, interviews: 10 },
  { name: "Fri", applications: 30, interviews: 8 },
];

const pie = [
  { name: "Offer", value: 8 },
  { name: "Interview", value: 24 },
  { name: "Screening", value: 40 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28"];

export default function Charts() {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={16}>
        <Card title="Weekly Activity" size="small">
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="applications" stroke="#8884d8" />
                <Line type="monotone" dataKey="interviews" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </Col>
      <Col xs={24} md={8}>
        <Card title="Pipeline Breakdown" size="small">
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pie}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  label
                >
                  {pie.map((entry, index) => (
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
    </Row>
  );
}
