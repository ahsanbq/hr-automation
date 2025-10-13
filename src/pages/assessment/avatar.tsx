import React from "react";
import AppLayout from "@/components/layout/AppLayout";
import AssessmentJobsTable from "@/components/assessment/AssessmentJobsTable";

export default function AvatarAssessmentPage() {
  return (
    <AppLayout
      title="AI Interviews"
      subtitle="Select a job to manage AI interview assessments"
    >
      <AssessmentJobsTable mode="avatar" />
    </AppLayout>
  );
}
