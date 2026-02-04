import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, Button, Space, Modal, message } from "antd";
import {
  PlusOutlined,
  RobotOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import AvatarJobAccordionTable from "@/components/assessment/AvatarJobAccordionTable";
import AvatarInterviewForm from "@/components/interview/AvatarInterviewForm";
import AIQuestionGenerator from "@/components/interview/AIQuestionGenerator";
import CreateAIInterviewModal from "@/components/interview/CreateAIInterviewModal";
import AssignAIInterviewModal from "@/components/interview/AssignAIInterviewModal";

export default function AIInterviewsPage() {
  const router = useRouter();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [aiGeneratorVisible, setAiGeneratorVisible] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [createAIModalVisible, setCreateAIModalVisible] = useState(false);
  const [assignAIModalVisible, setAssignAIModalVisible] = useState(false);

  const handleCreateInterview = () => {
    console.log("Assign AI Interview button clicked");
    setAssignAIModalVisible(true);
  };

  const handleOpenAIGenerator = (jobId?: string) => {
    setSelectedJobId(jobId || null);
    setAiGeneratorVisible(true);
  };

  const handleOpenCreateAIModal = () => {
    setCreateAIModalVisible(true);
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
              type="default"
              icon={<ThunderboltOutlined />}
              onClick={handleOpenCreateAIModal}
              size="large"
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                border: "none",
              }}
            >
              Create AI Interview
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateInterview}
              size="large"
            >
              Assign AI Interview
            </Button>
          </Space>
        </div>
      </Card>

      <AvatarJobAccordionTable
        key={refreshKey}
        onGenerateQuestions={(jobId) => handleOpenAIGenerator(jobId)}
      />

      {/* Legacy Create Interview Modal */}
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

      {/* Create AI Interview Modal - Multi-step */}
      <CreateAIInterviewModal
        visible={createAIModalVisible}
        onClose={() => setCreateAIModalVisible(false)}
        onSuccess={() => {
          message.success("AI Interview created successfully!");
          setRefreshKey((prev) => prev + 1);
        }}
      />

      {/* Assign AI Interview Modal - Multi-step */}
      <AssignAIInterviewModal
        visible={assignAIModalVisible}
        onClose={() => setAssignAIModalVisible(false)}
        onSuccess={() => {
          message.success("AI Interview assigned successfully!");
          setRefreshKey((prev) => prev + 1);
        }}
      />

      {/* AI Question Generator Modal - Legacy/Quick Generate */}
      <AIQuestionGenerator
        visible={aiGeneratorVisible}
        onClose={() => {
          setAiGeneratorVisible(false);
          setSelectedJobId(null);
        }}
        jobPostId={selectedJobId || ""}
        onQuestionsGenerated={(questions) => {
          console.log("Generated AI Questions:", questions);
          message.success(
            `Successfully generated ${questions.length} AI questions!`,
          );
        }}
      />
    </AppLayout>
  );
}
