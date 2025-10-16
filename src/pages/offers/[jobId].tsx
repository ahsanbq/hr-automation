import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Spin } from "antd";
import AppLayout from "@/components/layout/AppLayout";
import OfferLetterTable from "@/components/offers/OfferLetterTable";
import { OfferLetterWithDetails } from "@/types/offer";

export default function JobOffersPage() {
  const router = useRouter();
  const { jobId } = router.query;
  const [jobDetails, setJobDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setJobDetails(data.job);
      } else {
        console.error("Failed to fetch job details");
      }
    } catch (error) {
      console.error("Error fetching job details:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div style={{ padding: "24px" }}>
          <Spin size="large" spinning={true}>
            <div style={{ minHeight: "400px" }}>
              <div
                style={{
                  textAlign: "center",
                  padding: "100px 0",
                  color: "#666",
                }}
              >
                Loading job and offer data...
              </div>
            </div>
          </Spin>
        </div>
      </AppLayout>
    );
  }

  if (!jobDetails) {
    return (
      <AppLayout
        title="Job Not Found"
        subtitle="The requested job could not be found"
      >
        <div>Job not found</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={`Offer Letters - ${jobDetails.jobTitle}`}
      subtitle={`${jobDetails.companyName} • ${jobDetails.location}`}
    >
      <OfferLetterTable jobId={jobId as string} jobDetails={jobDetails} />
    </AppLayout>
  );
}
