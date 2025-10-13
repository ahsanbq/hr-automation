import { useState } from "react";
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Modal,
  Input,
  message,
  Typography,
  Spin,
} from "antd";
import {
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  UploadOutlined,
  LoadingOutlined,
} from "@ant-design/icons";

const { TextArea } = Input;

export type ResumeRow = {
  id: string;
  candidate: string;
  email?: string;
  phone?: string;
  score: number;
  source?: string;
  appliedAt?: string;
  url?: string;
  experience_years?: number;
  education?: string;
  skills?: string[];
  summary?: string;
  linkedin_url?: string;
  github_url?: string;
  recommendation?: string;
  matched_skills?: string[];
};

type JobRequirement = {
  title: string;
  company: string;
  location: string;
  job_type: string;
  experience_level: string;
  skills_required: string[];
  responsibilities: string[];
  qualifications: string[];
  salary_range: string;
  benefits: string[];
  description: string;
};

export default function ResumeList() {
  const [resumes, setResumes] = useState<ResumeRow[]>([]);
  const [viewing, setViewing] = useState<ResumeRow | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [linksInput, setLinksInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Static job requirement for CV sorting
  const jobRequirement: JobRequirement = {
    title: "Junior Software Engineer",
    company: "Tech Solutions Ltd.",
    location: "Dhaka, Bangladesh",
    job_type: "Full-time",
    experience_level: "Entry-level (0-1 years)",
    skills_required: [
      "Basic knowledge of JavaScript/TypeScript",
      "Understanding of HTML & CSS",
      "Familiarity with Git/GitHub",
      "Problem-solving mindset",
    ],
    responsibilities: [
      "Assist in developing and maintaining web applications",
      "Collaborate with senior developers on coding tasks",
      "Debug and fix issues in existing codebase",
      "Write clean, maintainable, and testable code",
    ],
    qualifications: [
      "Bachelor's degree in Computer Science or related field (or equivalent practical experience)",
      "Basic understanding of software development lifecycle",
      "Good communication and teamwork skills",
    ],
    description:
      "We are looking for a passionate Junior Developer eager to learn and grow within our development team. You will support projects, gain hands-on experience, and contribute to building scalable applications.",
    salary_range: "BDT 25,000 - 35,000/month",
    benefits: [
      "Health insurance",
      "Flexible working hours",
      "Career growth opportunities",
      "Friendly team environment",
    ],
  };

  const scoreTag = (s: number) => {
    let color = "default";
    if (s >= 85) color = "green";
    else if (s >= 75) color = "blue";
    else if (s >= 60) color = "orange";
    else color = "red";

    return <Tag color={color}>{s}%</Tag>;
  };

  const recommendationTag = (rec?: string) => {
    if (!rec) return <Tag>Unknown</Tag>;

    let color = "default";
    if (
      rec.toLowerCase().includes("strong") ||
      rec.toLowerCase().includes("excellent")
    )
      color = "green";
    else if (
      rec.toLowerCase().includes("consider") ||
      rec.toLowerCase().includes("good")
    )
      color = "blue";
    else if (
      rec.toLowerCase().includes("low") ||
      rec.toLowerCase().includes("weak")
    )
      color = "red";

    return <Tag color={color}>{rec}</Tag>;
  };

  const parseLinks = (text: string): string[] => {
    const lines = text
      .split(/[\n,]/)
      .map((line) => line.trim())
      .filter((line) => line);
    return lines.filter((line) => line.startsWith("http"));
  };

  const handleSubmitLinks = async () => {
    const links = parseLinks(linksInput);
    if (!links.length) {
      message.warning("Please paste at least one CV link.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/sort-cvs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_paths: links,
          job_req: jobRequirement,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process CVs");
      }

      if (data.success && data.analyses) {
        const newResumes: ResumeRow[] = data.analyses.map(
          (analysis: any, index: number) => ({
            id: `cv_${Date.now()}_${index}`,
            candidate: analysis.candidate?.name || `Candidate ${index + 1}`,
            email: analysis.candidate?.email || "",
            phone: analysis.candidate?.phone || "",
            score: analysis.analysis?.match_score || 0,
            source: "AI Analysis",
            appliedAt: new Date().toISOString().slice(0, 10),
            url: analysis.resume_path,
            experience_years: analysis.candidate?.experience_years || 0,
            education: analysis.candidate?.education || "",
            skills: analysis.candidate?.skills || [],
            summary: analysis.candidate?.summary || "",
            linkedin_url: analysis.candidate?.linkedin_url || "",
            github_url: analysis.candidate?.github_url || "",
            recommendation: analysis.analysis?.recommendation || "Unknown",
            matched_skills: analysis.analysis?.matched_skills || [],
          })
        );

        // Sort by score (highest first)
        newResumes.sort((a, b) => b.score - a.score);

        setResumes((prev) => {
          const merged = [...prev, ...newResumes];
          merged.sort((a, b) => b.score - a.score);
          return merged;
        });

        message.success(
          `Successfully processed ${newResumes.length} CV(s) and sorted by match score!`
        );
        setUploadOpen(false);
        setLinksInput("");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error: any) {
      console.error("CV Processing Error:", error);
      message.error(
        error.message || "Failed to process CVs. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: "Candidate",
      dataIndex: "candidate",
      render: (text: string, record: ResumeRow) => (
        <div>
          <div style={{ fontWeight: 600 }}>{text}</div>
          {record.email && (
            <div style={{ fontSize: 12, color: "#666" }}>{record.email}</div>
          )}
        </div>
      ),
    },
    {
      title: "Experience",
      dataIndex: "experience_years",
      width: 100,
      align: "center" as const,
      render: (years: number) => (
        <div
          style={{
            wordWrap: "break-word",
            wordBreak: "break-word",
            whiteSpace: "normal",
            textAlign: "center",
            fontSize: "12px",
          }}
        >
          {years ? `${years} years` : "N/A"}
        </div>
      ),
      responsive: ["md"] as any,
    },
    {
      title: "Match Score",
      dataIndex: "score",
      render: (s: number) => scoreTag(s),
      sorter: (a: ResumeRow, b: ResumeRow) => b.score - a.score,
      defaultSortOrder: "descend" as any,
    },
    {
      title: "Recommendation",
      dataIndex: "recommendation",
      render: (rec: string) => recommendationTag(rec),
      responsive: ["lg"] as any,
    },
    {
      title: "Source",
      dataIndex: "source",
      responsive: ["md"] as any,
    },
    {
      title: "Actions",
      width: 300,
      render: (_: any, record: ResumeRow) => (
        <Space size="small" wrap>
          <Button
            size="small"
            type="primary"
            shape="round"
            icon={<EyeOutlined />}
            onClick={() => setViewing(record)}
          >
            View
          </Button>
          <Button
            size="small"
            type="primary"
            shape="round"
            icon={<CheckCircleOutlined />}
            style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
          >
            Shortlist
          </Button>
          <Button
            size="small"
            type="primary"
            danger
            shape="round"
            icon={<CloseCircleOutlined />}
          >
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card
        title="Resumes"
        extra={
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => setUploadOpen(true)}
          >
            Upload CV Links
          </Button>
        }
      >
        <Table
          size="small"
          rowKey="id"
          columns={columns}
          dataSource={resumes}
          pagination={{ pageSize: 10, size: "small" }}
          scroll={{ x: 800 }}
        />
      </Card>

      <Modal
        title="Upload CV Links for AI Analysis"
        open={uploadOpen}
        onCancel={() => setUploadOpen(false)}
        onOk={handleSubmitLinks}
        okText="Process & Score CVs"
        confirmLoading={submitting}
        width={600}
      >
        <div style={{ marginBottom: 16 }}>
          <Typography.Text strong>Job Requirement:</Typography.Text>
          <div
            style={{
              marginTop: 8,
              padding: 12,
              backgroundColor: "#f5f5f5",
              borderRadius: 6,
            }}
          >
            <Typography.Text strong>{jobRequirement.title}</Typography.Text>
            <br />
            <Typography.Text type="secondary">
              {jobRequirement.company} • {jobRequirement.location}
            </Typography.Text>
          </div>
        </div>

        <Typography.Paragraph>
          Paste CV links (one per line or separated by commas). The AI will
          analyze each CV and provide match scores.
        </Typography.Paragraph>

        <TextArea
          rows={6}
          placeholder="https://drive.google.com/file/d/1AkY8_bitQCPEixPHGgQW9KN23Xbcd5J4/view?usp=sharing&#10;https://example.com/cv/jane-doe.pdf&#10;https://linkedin.com/in/candidate-profile"
          value={linksInput}
          onChange={(e) => setLinksInput(e.target.value)}
        />

        {submitting && (
          <div style={{ marginTop: 16, textAlign: "center" }}>
            <Spin
              indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
            />
            <div style={{ marginTop: 8 }}>Processing CVs with AI...</div>
          </div>
        )}
      </Modal>

      <Modal
        title="Resume Details"
        open={!!viewing}
        onCancel={() => setViewing(null)}
        footer={<Button onClick={() => setViewing(null)}>Close</Button>}
        width={700}
      >
        {viewing && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Typography.Title level={4} style={{ margin: 0 }}>
                {viewing.candidate}
              </Typography.Title>
              {viewing.email && (
                <Typography.Text type="secondary">
                  {viewing.email}
                </Typography.Text>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <Typography.Text strong>Match Score: </Typography.Text>
              {scoreTag(viewing.score)}
              <br />
              <Typography.Text strong>Recommendation: </Typography.Text>
              {recommendationTag(viewing.recommendation)}
            </div>

            {viewing.experience_years && (
              <div style={{ marginBottom: 16 }}>
                <Typography.Text strong>Experience: </Typography.Text>
                <Typography.Text>
                  {viewing.experience_years} years
                </Typography.Text>
              </div>
            )}

            {viewing.education && (
              <div style={{ marginBottom: 16 }}>
                <Typography.Text strong>Education: </Typography.Text>
                <Typography.Text>{viewing.education}</Typography.Text>
              </div>
            )}

            {viewing.skills && viewing.skills.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Typography.Text strong>Skills: </Typography.Text>
                <br />
                <Space wrap style={{ marginTop: 4 }}>
                  {viewing.skills.map((skill, index) => (
                    <Tag key={index} color="blue">
                      {skill}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}

            {viewing.matched_skills && viewing.matched_skills.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Typography.Text strong>Matched Skills: </Typography.Text>
                <br />
                <Space wrap style={{ marginTop: 4 }}>
                  {viewing.matched_skills.map((skill, index) => (
                    <Tag key={index} color="green">
                      {skill}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}

            {viewing.summary && (
              <div style={{ marginBottom: 16 }}>
                <Typography.Text strong>Summary: </Typography.Text>
                <Typography.Paragraph>{viewing.summary}</Typography.Paragraph>
              </div>
            )}

            <div style={{ display: "flex", gap: 16 }}>
              {viewing.linkedin_url && (
                <Button type="link" href={viewing.linkedin_url} target="_blank">
                  LinkedIn Profile
                </Button>
              )}
              {viewing.github_url && (
                <Button type="link" href={viewing.github_url} target="_blank">
                  GitHub Profile
                </Button>
              )}
              {viewing.url && (
                <Button type="link" href={viewing.url} target="_blank">
                  View CV
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
