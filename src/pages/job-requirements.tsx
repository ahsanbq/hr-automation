import AppLayout from "@/components/layout/AppLayout";
import { Tabs } from "antd";
import CreateJobForm from "@/components/job-requirements/CreateJobForm";
import ManageJobsTable from "@/components/job-requirements/ManageJobsTable";

export default function JobRequirementsPage() {
  return (
    <AppLayout
      title="Job Requirements"
      subtitle="Create and manage job postings"
    >
      <Tabs
        items={[
          { key: "create", label: "Create Job", children: <CreateJobForm /> },
          { key: "manage", label: "Manage", children: <ManageJobsTable /> },
        ]}
      />
    </AppLayout>
  );
}
