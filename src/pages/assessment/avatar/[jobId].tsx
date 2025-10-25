import React from "react";
import { useRouter } from "next/router";
import AppLayout from "@/components/layout/AppLayout";
import { Card, Typography, Button, Space } from "antd";
import {
  RobotOutlined,
  LockOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";

const { Title, Paragraph } = Typography;

export default function AvatarJobPage() {
  const router = useRouter();
  const { jobId } = router.query;

  return (
    <AppLayout
      title="AI Interviews"
      subtitle="Coming Soon - Advanced AI Interview Features"
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
          padding: "40px 20px",
        }}
      >
        <Card
          style={{
            maxWidth: "500px",
            textAlign: "center",
            border: "1px solid #f0f0f0",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div style={{ marginBottom: "24px" }}>
            <RobotOutlined
              style={{
                fontSize: "64px",
                color: "#1890ff",
                marginBottom: "16px",
              }}
            />
            <LockOutlined
              style={{
                fontSize: "32px",
                color: "#999",
                marginLeft: "8px",
              }}
            />
          </div>

          <Title level={2} style={{ color: "#1890ff", marginBottom: "16px" }}>
            AI Interviews
          </Title>

          <Title level={4} style={{ color: "#52c41a", marginBottom: "16px" }}>
            🚀 Coming Soon
          </Title>

          <Paragraph
            style={{ fontSize: "16px", color: "#666", marginBottom: "24px" }}
          >
            This feature is currently under development. AI-powered interviews
            will be available soon with advanced capabilities for candidate
            assessment.
          </Paragraph>

          <Space>
            <Button
              type="primary"
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push("/assessment/avatar")}
            >
              Back to AI Interviews
            </Button>
            <Button onClick={() => router.push("/assessment/manual")}>
              Try Manual Meetings Instead
            </Button>
          </Space>
        </Card>
      </div>
    </AppLayout>
  );
}
