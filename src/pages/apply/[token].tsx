import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Button,
  Upload,
  message,
  Typography,
  Tag,
  Space,
  Divider,
  Result,
  Spin,
  Progress,
} from "antd";
import {
  UploadOutlined,
  CloudUploadOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  TeamOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import type { UploadFile, UploadProps } from "antd/es/upload/interface";
import { useRouter } from "next/router";
import Head from "next/head";

const { Title, Text, Paragraph } = Typography;

interface JobInfo {
  id: string;
  jobTitle: string;
  companyName: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  salaryRange?: string;
  skillsRequired: string;
  jobDescription?: string;
  keyResponsibilities?: string;
  qualifications?: string;
  benefits?: string;
}

type PageState =
  | "loading"
  | "valid"
  | "expired"
  | "closed"
  | "invalid"
  | "job_inactive"
  | "submitted";

export default function PublicApplyPage() {
  const router = useRouter();
  const { token } = router.query;

  const [state, setState] = useState<PageState>("loading");
  const [job, setJob] = useState<JobInfo | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchLinkInfo = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/apply/${token}`);
      const data = await res.json();

      if (res.ok && data.valid) {
        setJob(data.job);
        setRemaining(data.remaining);
        setExpiresAt(data.expiresAt);
        setState("valid");
      } else {
        const errorType = data.error;
        if (errorType === "EXPIRED") setState("expired");
        else if (errorType === "CLOSED") setState("closed");
        else if (errorType === "JOB_INACTIVE") setState("job_inactive");
        else setState("invalid");
        setErrorMessage(data.message || "This link is not available.");
      }
    } catch {
      setState("invalid");
      setErrorMessage("Unable to verify this application link.");
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchLinkInfo();
  }, [token, fetchLinkInfo]);

  const uploadProps: UploadProps = {
    multiple: false,
    fileList,
    beforeUpload: (file) => {
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "application/rtf",
      ];
      if (!allowedTypes.includes(file.type)) {
        message.error("Only PDF, DOC, DOCX, TXT, and RTF files are allowed.");
        return false;
      }
      if (file.size / 1024 / 1024 > 10) {
        message.error("File size must be under 10MB.");
        return false;
      }
      setFileList([file as any]);
      return false; // Prevent auto upload
    },
    onRemove: () => {
      setFileList([]);
    },
    accept: ".pdf,.doc,.docx,.rtf,.txt",
  };

  const handleSubmit = async () => {
    if (fileList.length === 0) {
      message.warning("Please select your CV/Resume file first.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      const file = fileList[0];
      formData.append(
        "resumes",
        (file as any).originFileObj || file,
        (file as any).name
      );

      const res = await fetch(`/api/apply/${token}/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setState("submitted");
        message.success("Application submitted successfully!");
      } else {
        if (data.error === "CLOSED" || data.error === "EXPIRED") {
          setState(data.error === "CLOSED" ? "closed" : "expired");
          setErrorMessage(data.message);
        } else {
          message.error(data.error || "Failed to submit application");
        }
      }
    } catch {
      message.error("Network error. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // ─── Render States ──────────────────────────────
  if (state === "loading") {
    return (
      <PageWrapper>
        <div style={{ textAlign: "center", padding: 80 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: "#722ed1", fontWeight: 500 }}>
            Verifying application link...
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (state === "submitted") {
    return (
      <PageWrapper title={job?.jobTitle}>
        <Result
          status="success"
          icon={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
          title="Application Submitted!"
          subTitle={`Your CV has been submitted for the ${
            job?.jobTitle || "position"
          } at ${
            job?.companyName || "the company"
          }. Our team will review it shortly.`}
          extra={
            <Text type="secondary" style={{ fontSize: 14 }}>
              You will be contacted if your profile matches the requirements.
            </Text>
          }
        />
      </PageWrapper>
    );
  }

  if (state !== "valid") {
    return (
      <PageWrapper>
        <Result
          status={state === "expired" ? "warning" : "error"}
          icon={
            state === "expired" ? (
              <ClockCircleOutlined style={{ color: "#faad14" }} />
            ) : (
              <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
            )
          }
          title={
            state === "expired"
              ? "Link Expired"
              : state === "closed"
              ? "Applications Closed"
              : state === "job_inactive"
              ? "Position Closed"
              : "Invalid Link"
          }
          subTitle={
            errorMessage ||
            "This application link is no longer available."
          }
        />
      </PageWrapper>
    );
  }

  // ─── Valid State — Show Job + Upload Form ───────
  const skills = job?.skillsRequired
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const responsibilities = job?.keyResponsibilities
    ?.split("\n")
    .filter(Boolean);
  const qualificationsList = job?.qualifications?.split("\n").filter(Boolean);
  const benefitsList = job?.benefits?.split("\n").filter(Boolean);

  return (
    <PageWrapper title={job?.jobTitle}>
      <Head>
        <title>{job?.jobTitle} — Apply Now | {job?.companyName}</title>
      </Head>

      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        {/* Job Header */}
        <Card
          style={{
            marginBottom: 24,
            borderRadius: 12,
            border: "2px solid #722ed1",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <Title level={2} style={{ margin: 0, color: "#262626" }}>
              {job?.jobTitle}
            </Title>
            <Title
              level={4}
              style={{ margin: "4px 0 16px", color: "#722ed1", fontWeight: 500 }}
            >
              {job?.companyName}
            </Title>
            <Space wrap size={[8, 8]} style={{ justifyContent: "center" }}>
              {job?.location && (
                <Tag icon={<EnvironmentOutlined />} color="blue">
                  {job.location}
                </Tag>
              )}
              {job?.jobType && (
                <Tag icon={<TeamOutlined />} color="purple">
                  {job.jobType.replace(/_/g, " ")}
                </Tag>
              )}
              {job?.experienceLevel && (
                <Tag icon={<TrophyOutlined />} color="gold">
                  {job.experienceLevel}
                </Tag>
              )}
              {job?.salaryRange && (
                <Tag icon={<DollarOutlined />} color="green">
                  {job.salaryRange}
                </Tag>
              )}
            </Space>
          </div>
        </Card>

        {/* Job Details */}
        <Card style={{ marginBottom: 24, borderRadius: 12 }}>
          {job?.jobDescription && (
            <div style={{ marginBottom: 20 }}>
              <Title level={5}>Job Description</Title>
              <Paragraph style={{ whiteSpace: "pre-line", color: "#555" }}>
                {job.jobDescription}
              </Paragraph>
            </div>
          )}

          {skills && skills.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <Title level={5}>Required Skills</Title>
              <Space wrap>
                {skills.map((s, i) => (
                  <Tag key={i} color="blue">
                    {s}
                  </Tag>
                ))}
              </Space>
            </div>
          )}

          {responsibilities && responsibilities.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <Title level={5}>Key Responsibilities</Title>
              <ul style={{ color: "#555", paddingLeft: 20 }}>
                {responsibilities.map((r, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {qualificationsList && qualificationsList.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <Title level={5}>Qualifications</Title>
              <ul style={{ color: "#555", paddingLeft: 20 }}>
                {qualificationsList.map((q, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {benefitsList && benefitsList.length > 0 && (
            <div>
              <Title level={5}>Benefits</Title>
              <ul style={{ color: "#555", paddingLeft: 20 }}>
                {benefitsList.map((b, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {/* Upload Form */}
        <Card
          style={{
            borderRadius: 12,
            border: "1px solid #d9d9d9",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <Title level={4} style={{ margin: 0 }}>
              <FileTextOutlined style={{ color: "#722ed1", marginRight: 8 }} />
              Submit Your Application
            </Title>
            <Text type="secondary">
              Upload your CV/Resume to apply for this position
            </Text>
          </div>

          <div
            style={{
              border: "2px dashed #d9d9d9",
              borderRadius: 12,
              padding: 32,
              textAlign: "center",
              background: "#fafafa",
              marginBottom: 20,
              cursor: "pointer",
              transition: "all 0.3s",
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            <Upload {...uploadProps}>
              <div>
                <CloudUploadOutlined
                  style={{ fontSize: 48, color: "#722ed1", marginBottom: 12 }}
                />
                <div style={{ fontSize: 16, fontWeight: 500, color: "#333" }}>
                  Click or drag your CV here
                </div>
                <div style={{ color: "#888", marginTop: 4 }}>
                  Supported: PDF, DOC, DOCX, TXT, RTF (Max 10MB)
                </div>
              </div>
            </Upload>
          </div>

          <Button
            type="primary"
            size="large"
            block
            icon={<UploadOutlined />}
            onClick={handleSubmit}
            loading={uploading}
            disabled={fileList.length === 0}
            style={{
              height: 48,
              fontSize: 16,
              backgroundColor: "#722ed1",
              borderColor: "#722ed1",
            }}
          >
            {uploading ? "Submitting Application..." : "Submit Application"}
          </Button>

          {uploading && (
            <div style={{ marginTop: 16 }}>
              <Progress
                percent={100}
                status="active"
                showInfo={false}
                strokeColor={{ "0%": "#722ed1", "100%": "#52c41a" }}
              />
              <div
                style={{ textAlign: "center", marginTop: 8, color: "#722ed1" }}
              >
                Uploading and analyzing your CV...
              </div>
            </div>
          )}

          <Divider />

          <div style={{ textAlign: "center" }}>
            <Space>
              <SafetyOutlined style={{ color: "#52c41a" }} />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Your data is securely processed. Only the hiring team will see
                your CV.
              </Text>
            </Space>
          </div>
        </Card>

        {/* Footer Info */}
        <div style={{ textAlign: "center", marginTop: 24, marginBottom: 24 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Powered by Synchro Hire — {remaining} application
            {remaining !== 1 ? "s" : ""} remaining
          </Text>
        </div>
      </div>
    </PageWrapper>
  );
}

// Minimal wrapper for public pages (no sidebar/auth)
function PageWrapper({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <>
      <Head>
        <title>{title ? `${title} — Apply` : "Job Application"}</title>
      </Head>
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #f0f9ff 100%)",
          padding: "24px 16px",
        }}
      >
        {/* Minimal header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Title
            level={4}
            style={{ margin: 0, color: "#722ed1", fontWeight: 700 }}
          >
            Synchro Hire
          </Title>
        </div>
        {children}
      </div>
    </>
  );
}

