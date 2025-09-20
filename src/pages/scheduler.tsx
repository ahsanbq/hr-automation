import AppLayout from "@/components/layout/AppLayout";
import ManageJobsTable from "@/components/job-requirements/ManageJobsTable";

export default function SchedulerPage() {
  return (
    <AppLayout
      title="Meeting Scheduler"
      subtitle="Select a job to manage schedules"
    >
      <ManageJobsTable mode="scheduler" />
    </AppLayout>
  );
}
