import React from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, Typography, Button, Space } from "antd";
import {
  RobotOutlined,
  LockOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";

const { Title, Paragraph } = Typography;

export default function AvatarAssessmentPage() {
  const router = useRouter();

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
            We're working on advanced AI interview features that will
            revolutionize your candidate assessment process. This powerful
            module will include:
          </Paragraph>

          <div style={{ textAlign: "left", marginBottom: "24px" }}>
            <ul style={{ color: "#666", fontSize: "14px" }}>
              <li>🤖 AI-powered interview questions generation</li>
              <li>🎯 Real-time candidate assessment</li>
              <li>📊 Advanced analytics and insights</li>
              <li>🎥 Video interview capabilities</li>
              <li>💬 Natural language processing</li>
            </ul>
          </div>

          <Space>
            <Button
              type="primary"
              icon={<ArrowLeftOutlined />}
              onClick={() => router.back()}
            >
              Go Back
            </Button>
            <Button onClick={() => router.push("/assessment/mcq")}>
              Try MCQ Tests Instead
            </Button>
          </Space>
        </Card>
      </div>
    </AppLayout>
  );
}
