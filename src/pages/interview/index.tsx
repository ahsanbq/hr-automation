import AppLayout from "@/components/layout/AppLayout";
import ManageJobsTable from "@/components/job-requirements/ManageJobsTable";
import { ManageMode } from "@/components/job-requirements/ManageJobsTable";

export default function InterviewManagementPage() {
  return (
    <AppLayout 
      title="Interview Management" 
      subtitle="Select a job to manage interviews and generate meeting agendas"
    >
      <ManageJobsTable mode={ "interview" as ManageMode } />
    </AppLayout>
  );
}
