import React, { useState } from "react";
import { Button, Space, Card } from "antd";
import {
  PlusOutlined,
  QuestionCircleOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import AppLayout from "@/components/layout/AppLayout";
import MCQJobAccordionTable from "@/components/assessment/MCQJobAccordionTable";
import SavedMCQModal from "@/components/assessment/SavedMCQModal";

export default function MCQAssessmentPage() {
  const router = useRouter();
  const [savedMCQModalVisible, setSavedMCQModalVisible] = useState(false);

  const handleCreateMCQ = () => {
    router.push("/assessment/mcq/create");
  };

  const handleShowSavedMCQs = () => {
    setSavedMCQModalVisible(true);
  };

  const handleSelectTemplate = (template: any) => {
    // TODO: Implement template selection logic
    console.log("Selected template:", template);
  };

  return (
    <AppLayout
      title="MCQ Tests"
      subtitle="Expand job rows to view and manage MCQ interviews for each position"
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
              <QuestionCircleOutlined />
              MCQ Management
            </h3>
            <p style={{ margin: "8px 0 0 0", color: "#666" }}>
              Create new MCQ tests, manage saved templates, and track candidate
              performance
            </p>
          </div>
          <Space>
            <Button
              type="primary"
              icon={<DatabaseOutlined />}
              onClick={handleShowSavedMCQs}
              size="large"
              style={{ backgroundColor: "#1890ff", borderColor: "#1890ff" }}
            >
              Assign MCQ
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateMCQ}
              size="large"
            >
              Create New MCQ Test
            </Button>
          </Space>
        </div>
      </Card>

      <MCQJobAccordionTable />

      <SavedMCQModal
        visible={savedMCQModalVisible}
        onClose={() => setSavedMCQModalVisible(false)}
        onSelectTemplate={handleSelectTemplate}
      />
    </AppLayout>
  );
}
