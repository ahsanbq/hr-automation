import AppLayout from "@/components/layout/AppLayout";
import ManageJobsTable from "@/components/job-requirements/ManageJobsTable";

export default function MeetingManagementPage() {
  return (
    <AppLayout 
      title="Meeting Management" 
      subtitle="Select a job to manage meetings and generate meeting agendas"
    >
      <ManageJobsTable mode="meeting" />
    </AppLayout>
  );
}
