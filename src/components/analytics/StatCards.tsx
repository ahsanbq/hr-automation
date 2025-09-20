import { Card, Col, Row, Statistic, Typography, Space } from "antd";
import {
  UserAddOutlined,
  CalendarOutlined,
  SendOutlined,
  SmileOutlined,
} from "@ant-design/icons";

const cardStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #1677ff 0%, #3f8cff 100%)",
  color: "#fff",
  border: "none",
  borderRadius: 6,
};

const TitleText = ({ children }: { children: React.ReactNode }) => (
  <Typography.Text style={{ color: "#e6f4ff", fontSize: 12 }}>
    {children}
  </Typography.Text>
);

const Delta = ({ value, up = true }: { value: string; up?: boolean }) => (
  <Typography.Text style={{ color: up ? "#d9f7be" : "#ffd6e7", fontSize: 12 }}>
    {up ? "+" : "-"}
    {value} vs last week
  </Typography.Text>
);

export default function StatCards() {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={6}>
        <Card size="small" style={cardStyle} bodyStyle={{ padding: 16 }}>
          <Space direction="vertical" size={6} style={{ width: "100%" }}>
            <Space
              align="center"
              style={{ justifyContent: "space-between", width: "100%" }}
            >
              <TitleText>New Applications</TitleText>
              <UserAddOutlined style={{ color: "#e6f4ff" }} />
            </Space>
            <Statistic
              valueStyle={{ color: "#fff" }}
              value={135}
              suffix={null}
            />
            <Delta value="12%" up />
          </Space>
        </Card>
      </Col>
      <Col xs={24} md={6}>
        <Card size="small" style={cardStyle} bodyStyle={{ padding: 16 }}>
          <Space direction="vertical" size={6} style={{ width: "100%" }}>
            <Space
              align="center"
              style={{ justifyContent: "space-between", width: "100%" }}
            >
              <TitleText>Interviews Scheduled</TitleText>
              <CalendarOutlined style={{ color: "#e6f4ff" }} />
            </Space>
            <Statistic valueStyle={{ color: "#fff" }} value={28} />
            <Delta value="5%" up />
          </Space>
        </Card>
      </Col>
      <Col xs={24} md={6}>
        <Card size="small" style={cardStyle} bodyStyle={{ padding: 16 }}>
          <Space direction="vertical" size={6} style={{ width: "100%" }}>
            <Space
              align="center"
              style={{ justifyContent: "space-between", width: "100%" }}
            >
              <TitleText>Offers Sent</TitleText>
              <SendOutlined style={{ color: "#e6f4ff" }} />
            </Space>
            <Statistic valueStyle={{ color: "#fff" }} value={12} />
            <Delta value="3%" up />
          </Space>
        </Card>
      </Col>
      <Col xs={24} md={6}>
        <Card size="small" style={cardStyle} bodyStyle={{ padding: 16 }}>
          <Space direction="vertical" size={6} style={{ width: "100%" }}>
            <Space
              align="center"
              style={{ justifyContent: "space-between", width: "100%" }}
            >
              <TitleText>Hires</TitleText>
              <SmileOutlined style={{ color: "#e6f4ff" }} />
            </Space>
            <Statistic valueStyle={{ color: "#fff" }} value={5} />
            <Delta value="1%" up />
          </Space>
        </Card>
      </Col>
    </Row>
  );
}
