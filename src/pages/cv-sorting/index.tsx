import AppLayout from "@/components/layout/AppLayout";
import ManageJobsTable from "@/components/job-requirements/ManageJobsTable";

export default function CvSortingLanding() {
  return (
    <AppLayout title="CV Sorting" subtitle="Select a job to review resumes">
      <ManageJobsTable mode="cv" />
    </AppLayout>
  );
}
