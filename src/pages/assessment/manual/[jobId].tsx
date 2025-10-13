import React from "react";
import { useRouter } from "next/router";
import AppLayout from "@/components/layout/AppLayout";
import JobResumeManager from "@/components/assessment/JobResumeManager";
import { Spin } from "antd";

export default function ManualJobPage() {
  const router = useRouter();
  const { jobId } = router.query;

  if (!jobId || typeof jobId !== "string") {
    return (
      <AppLayout title="Manual Meetings" subtitle="Loading...">
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Spin size="large" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Manual Meetings"
      subtitle="Manage manual meeting assessments for candidates"
    >
      <JobResumeManager jobId={jobId} mode="manual" />
    </AppLayout>
  );
}
