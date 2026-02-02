import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, Button, Space, Modal, message } from "antd";
import { PlusOutlined, RobotOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";
import AvatarJobAccordionTable from "@/components/assessment/AvatarJobAccordionTable";
import AvatarInterviewForm from "@/components/interview/AvatarInterviewForm";

export default function AIInterviewsPage() {
  const router = useRouter();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateInterview = () => {
    console.log("Create interview button clicked");
    setIsModalVisible(true);
  };

  return (
    <AppLayout
      title="AI Interviews"
      subtitle="Expand job rows to view and manage AI-powered candidate interviews"
    >
      <Card style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <RobotOutlined style={{ color: "#722ed1" }} />
              AI Interviews Dashboard
            </h3>
            <p style={{ margin: "8px 0 0 0", color: "#666" }}>
              Create new AI interviews, manage avatar assessments, and track
              candidate interactions
            </p>
          </div>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateInterview}
              size="large"
              style={{ backgroundColor: "#722ed1", borderColor: "#722ed1" }}
            >
              Create AI Interview
            </Button>
          </Space>
        </div>
      </Card>

      <AvatarJobAccordionTable key={refreshKey} />

      <Modal
        title="Create AI Interview"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <AvatarInterviewForm
          interviewId={null}
          onSuccess={() => {
            setIsModalVisible(false);
            message.success("AI interview created successfully");
            setRefreshKey((prev) => prev + 1);
          }}
          onCancel={() => setIsModalVisible(false)}
        />
      </Modal>
    </AppLayout>
  );
}
