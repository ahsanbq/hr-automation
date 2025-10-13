import React, { useState } from "react";
import { Button, Space, Card } from "antd";
import {
  PlusOutlined,
  TeamOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import AppLayout from "@/components/layout/AppLayout";
import ManualMeetingJobAccordionTable from "@/components/assessment/ManualMeetingJobAccordionTable";
import AssignMeetingModal from "@/components/assessment/AssignMeetingModal";

export default function ManualMeetingPage() {
  const router = useRouter();
  const [assignMeetingModalVisible, setAssignMeetingModalVisible] =
    useState(false);

  const handleCreateMeeting = () => {
    router.push("/assessment/manual/create");
  };

  const handleShowAssignMeeting = () => {
    setAssignMeetingModalVisible(true);
  };

  return (
    <AppLayout
      title="Manual Meetings"
      subtitle="Expand job rows to view and manage manual meetings for each position"
    >
      <div style={{ marginBottom: 24 }}>
        <Card>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
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
                <TeamOutlined style={{ color: "#722ed1" }} />
                Manual Meetings Dashboard
              </h3>
              <p style={{ margin: "4px 0 0 0", color: "#666" }}>
                Create new manual meetings, manage meeting schedules, and track
                candidate interviews
              </p>
            </div>
            <Space>
              <Button
                type="primary"
                icon={<CalendarOutlined />}
                onClick={handleShowAssignMeeting}
                size="large"
                style={{ backgroundColor: "#722ed1", borderColor: "#722ed1" }}
              >
                Assign Meeting
              </Button>
            </Space>
          </div>
        </Card>
      </div>

      <ManualMeetingJobAccordionTable onRefresh={() => {}} />

      <AssignMeetingModal
        visible={assignMeetingModalVisible}
        onClose={() => setAssignMeetingModalVisible(false)}
      />
    </AppLayout>
  );
}
