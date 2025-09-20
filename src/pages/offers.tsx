import AppLayout from "@/components/layout/AppLayout";
import ManageJobsTable from "@/components/job-requirements/ManageJobsTable";

export default function OffersPage() {
  return (
    <AppLayout title="Offer Letters" subtitle="Select a job to manage offers">
      <ManageJobsTable mode="offers" />
    </AppLayout>
  );
}
