import { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Table,
  Button,
  Modal,
  Input,
  message,
  Tag,
  Drawer,
  Space,
  Statistic,
  Popconfirm,
  Spin,
  Tabs,
  Upload,
} from "antd";
import {
  UploadOutlined,
  EyeOutlined,
  MailOutlined,
  PhoneOutlined,
  DeleteOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import AppLayout from "@/components/layout/AppLayout";

interface JobPost {
  id: string;
  jobTitle: string;
  companyName: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  skillsRequired: string;
  jobDescription: string;
  keyResponsibilities: string;
  qualifications: string;
  salaryRange: string;
  benefits: string;
}

interface Resume {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  matchScore: number;
  recommendation: string;
  skills: string[];
  experienceYears: number;
  education: string;
  summary: string;
  resumeUrl: string;
  uploadedBy?: {
    name: string;
    email: string;
  };
}

export default function JobResumePage() {
  const router = useRouter();
  const { jobId } = router.query;
  const [job, setJob] = useState<JobPost | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [resumeUrls, setResumeUrls] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeUploadTab, setActiveUploadTab] = useState<string>("urls");
  const [urlFields, setUrlFields] = useState<string[]>([""]);
  const [fileList, setFileList] = useState<any[]>([]);

  useEffect(() => {
    if (jobId) {
      fetchJobAndResumes();
    }
  }, [jobId]);

  const fetchJobAndResumes = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        message.error("Please login first");
        router.push("/auth");
        return;
      }

      const [jobResponse, resumesResponse] = await Promise.all([
        fetch(`/api/jobs/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/jobs/${jobId}/resumes?sortBy=matchScore&order=desc`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      // Check if responses are ok before parsing JSON
      if (!jobResponse.ok) {
        const errorText = await jobResponse.text();
        console.error("Job API Error:", errorText);
        throw new Error(`Failed to fetch job: ${jobResponse.status}`);
      }

      if (!resumesResponse.ok) {
        const errorText = await resumesResponse.text();
        console.error("Resumes API Error:", errorText);
        throw new Error(`Failed to fetch resumes: ${resumesResponse.status}`);
      }

      const jobData = await jobResponse.json();
      const resumesData = await resumesResponse.json();

      setJob(jobData.job || jobData);
      setResumes(resumesData.resumes || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("Failed to load job data");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeResumes = async () => {
    if (activeUploadTab === "urls") {
      const urls = urlFields.map((u) => u.trim()).filter((u) => u.length > 0);
      if (urls.length === 0) {
        message.error("Please enter at least one resume URL");
        return;
      }

      setAnalyzing(true);
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`/api/jobs/${jobId}/resumes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            resume_paths: urls,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          message.success(
            `${data.resumes?.length || 0} resumes analyzed successfully`
          );
          setUploadModalVisible(false);
          setUrlFields([""]);
          setResumeUrls("");
          fetchJobAndResumes();
        } else {
          message.error(data.error || "Failed to analyze resumes");
        }
      } catch (error) {
        console.error("Error analyzing resumes:", error);
        message.error("Failed to analyze resumes");
      } finally {
        setAnalyzing(false);
      }
    } else {
      message.warning(
        "File upload analysis is not available yet. Please use URLs."
      );
    }
  };

  const handleDeleteResume = async (resumeId: string) => {
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/resumes/${resumeId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        message.success("Resume deleted successfully");
        fetchJobAndResumes();
      } else {
        const data = await response.json();
        message.error(data.error || "Failed to delete resume");
      }
    } catch (error) {
      console.error("Error deleting resume:", error);
      message.error("Failed to delete resume");
    } finally {
      setDeleting(false);
    }
  };

  const addUrlField = () => setUrlFields((prev) => [...prev, ""]);
  const removeUrlField = (index: number) =>
    setUrlFields((prev) => prev.filter((_, i) => i !== index));
  const changeUrlField = (index: number, value: string) => {
    setUrlFields((prev) => prev.map((v, i) => (i === index ? value : v)));
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#52c41a";
    if (score >= 60) return "#faad14";
    return "#ff4d4f";
  };

  const getRecommendationColor = (recommendation: string) => {
    switch ((recommendation || "").toLowerCase()) {
      case "highly recommended":
        return "green";
      case "consider":
        return "orange";
      case "not suitable":
        return "red";
      default:
        return "default" as any;
    }
  };

  const columns = [
    {
      title: "Candidate Name",
      dataIndex: "candidateName",
      key: "candidateName",
      width: 150,
      sorter: (a: Resume, b: Resume) =>
        a.candidateName.localeCompare(b.candidateName),
      render: (name: string) => (
        <div style={{ fontWeight: 500, color: "#1890ff", fontSize: "13px" }}>
          {name}
        </div>
      ),
    },
    {
      title: "Email",
      dataIndex: "candidateEmail",
      key: "candidateEmail",
      width: 180,
      render: (email: string) =>
        email ? (
          <a
            href={`mailto:${email}`}
            style={{ color: "#1890ff", fontSize: "12px" }}
          >
            {email}
          </a>
        ) : (
          <span style={{ color: "#999", fontSize: "12px" }}>N/A</span>
        ),
    },
    {
      title: "Phone",
      dataIndex: "candidatePhone",
      key: "candidatePhone",
      width: 120,
      render: (phone: string) =>
        phone ? (
          <a
            href={`tel:${phone}`}
            style={{ color: "#1890ff", fontSize: "12px" }}
          >
            {phone}
          </a>
        ) : (
          <span style={{ color: "#999", fontSize: "12px" }}>N/A</span>
        ),
    },
    {
      title: "Match Score",
      dataIndex: "matchScore",
      key: "matchScore",
      width: 100,
      align: "center" as const,
      sorter: (a: Resume, b: Resume) =>
        (a.matchScore || 0) - (b.matchScore || 0),
      render: (score: number) => (
        <Tag
          color={getScoreColor(score)}
          style={{
            fontSize: "11px",
            fontWeight: "bold",
            minWidth: "50px",
            textAlign: "center",
            margin: 0,
          }}
        >
          {score ? `${score}%` : "N/A"}
        </Tag>
      ),
    },
    {
      title: "Recommendation",
      dataIndex: "recommendation",
      key: "recommendation",
      width: 120,
      align: "center" as const,
      render: (recommendation: string) => (
        <Tag
          color={getRecommendationColor(recommendation)}
          style={{ fontSize: "11px", margin: 0 }}
        >
          {recommendation || "N/A"}
        </Tag>
      ),
    },
    {
      title: "Experience",
      dataIndex: "experienceYears",
      key: "experienceYears",
      width: 100,
      align: "center" as const,
      render: (years: number) => (
        <span style={{ color: years ? "#000" : "#999", fontSize: "12px" }}>
          {years ? `${years}y` : "N/A"}
        </span>
      ),
      sorter: (a: Resume, b: Resume) =>
        (a.experienceYears || 0) - (b.experienceYears || 0),
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      align: "center" as const,
      render: (_: unknown, record: Resume) => (
        <Space size="small" wrap>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedResume(record);
              setDrawerVisible(true);
            }}
            style={{ fontSize: "11px", height: "24px" }}
          >
            View
          </Button>
          <Button
            type="default"
            size="small"
            icon={<FileTextOutlined />}
            href={record.resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: "11px", height: "24px" }}
          >
            CV
          </Button>
          <Popconfirm
            title="Delete Resume"
            description="Are you sure?"
            onConfirm={() => handleDeleteResume(record.id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true, loading: deleting }}
          >
            <Button
              type="primary"
              danger
              size="small"
              icon={<DeleteOutlined />}
              style={{ fontSize: "11px", height: "24px" }}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

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
                Loading job and resume data...
              </div>
            </div>
          </Spin>
        </div>
      </AppLayout>
    );
  }

  if (!job) {
    return (
      <AppLayout>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "400px",
            fontSize: "16px",
            color: "#f5222d",
          }}
        >
          Job not found
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Spin size="large" spinning={analyzing} tip="Analyzing resumes...">
        <div style={{ padding: "24px" }}>
          <Row gutter={24}>
            {/* Main Content - Resume List */}
            <Col span={18}>
              <Card
                title={
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: "18px", fontWeight: "bold" }}>
                      Resumes for {job?.jobTitle}
                    </span>
                    <Button
                      type="primary"
                      icon={<UploadOutlined />}
                      onClick={() => setUploadModalVisible(true)}
                      size="large"
                    >
                      Analyze New Resumes
                    </Button>
                  </div>
                }
                style={{ borderRadius: "8px" }}
              >
                <div style={{ marginBottom: "20px" }}>
                  <Row gutter={16}>
                    <Col span={6}>
                      <Card
                        size="small"
                        style={{ textAlign: "center", borderRadius: "6px" }}
                      >
                        <Statistic
                          title="Total Resumes"
                          value={resumes.length}
                          valueStyle={{ color: "#1890ff", fontSize: "24px" }}
                        />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card
                        size="small"
                        style={{ textAlign: "center", borderRadius: "6px" }}
                      >
                        <Statistic
                          title="Avg Match Score"
                          value={
                            resumes.length > 0
                              ? resumes.reduce(
                                  (sum, r) => sum + (r.matchScore || 0),
                                  0
                                ) / resumes.length
                              : 0
                          }
                          suffix="%"
                          precision={1}
                          valueStyle={{
                            color:
                              resumes.length > 0 &&
                              resumes.reduce(
                                (sum, r) => sum + (r.matchScore || 0),
                                0
                              ) /
                                resumes.length >=
                                70
                                ? "#52c41a"
                                : "#faad14",
                            fontSize: "24px",
                          }}
                        />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card
                        size="small"
                        style={{ textAlign: "center", borderRadius: "6px" }}
                      >
                        <Statistic
                          title="Highly Recommended"
                          value={
                            resumes.filter(
                              (r) =>
                                r.recommendation?.toLowerCase() ===
                                "highly recommended"
                            ).length
                          }
                          valueStyle={{ color: "#52c41a", fontSize: "24px" }}
                        />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card
                        size="small"
                        style={{ textAlign: "center", borderRadius: "6px" }}
                      >
                        <Statistic
                          title="Consider"
                          value={
                            resumes.filter(
                              (r) =>
                                r.recommendation?.toLowerCase() === "consider"
                            ).length
                          }
                          valueStyle={{ color: "#faad14", fontSize: "24px" }}
                        />
                      </Card>
                    </Col>
                  </Row>
                </div>

                <Table
                  dataSource={resumes}
                  columns={columns}
                  rowKey="id"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total, range) =>
                      `${range[0]}-${range[1]} of ${total} resumes`,
                    showQuickJumper: true,
                  }}
                  style={{ borderRadius: "6px" }}
                  size="small"
                  scroll={{ x: 1000 }}
                  bordered
                />
              </Card>
            </Col>

            {/* Sidebar - Job Details */}
            <Col span={6}>
              <Card
                title="Job Details"
                style={{ borderRadius: "8px" }}
                headStyle={{ backgroundColor: "#fafafa" }}
              >
                {job && (
                  <div>
                    <div style={{ marginBottom: "16px" }}>
                      <h3
                        style={{
                          color: "#1890ff",
                          marginBottom: "8px",
                          fontSize: "16px",
                        }}
                      >
                        {job.jobTitle}
                      </h3>
                      <div style={{ lineHeight: "1.6", fontSize: "12px" }}>
                        <p>
                          <strong>Company:</strong> {job.companyName}
                        </p>
                        <p>
                          <strong>Location:</strong> {job.location}
                        </p>
                        <p>
                          <strong>Type:</strong> {job.jobType}
                        </p>
                        <p>
                          <strong>Experience:</strong> {job.experienceLevel}
                        </p>
                        {job.salaryRange && (
                          <p>
                            <strong>Salary:</strong> {job.salaryRange}
                          </p>
                        )}
                      </div>
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                      <h4
                        style={{
                          color: "#1890ff",
                          marginBottom: "6px",
                          fontSize: "14px",
                        }}
                      >
                        Required Skills
                      </h4>
                      <div>
                        {(() => {
                          try {
                            // Handle both string and array formats
                            let skills = [];
                            if (typeof job.skillsRequired === "string") {
                              // Try to parse as JSON first
                              if (job.skillsRequired.startsWith("[")) {
                                skills = JSON.parse(job.skillsRequired);
                              } else {
                                // Split by comma if it's a comma-separated string
                                skills = job.skillsRequired
                                  .split(",")
                                  .map((s) => s.trim());
                              }
                            } else if (Array.isArray(job.skillsRequired)) {
                              skills = job.skillsRequired;
                            }

                            return skills.map(
                              (skill: string, index: number) => (
                                <Tag
                                  key={index}
                                  color="blue"
                                  style={{
                                    marginBottom: "2px",
                                    fontSize: "11px",
                                    marginRight: "4px",
                                    maxWidth: "100%",
                                    whiteSpace: "normal",
                                    wordBreak: "break-word",
                                    lineHeight: "1.4",
                                    padding: "4px 8px",
                                  }}
                                >
                                  {skill.trim()}
                                </Tag>
                              )
                            );
                          } catch (e) {
                            return (
                              <span style={{ color: "#999", fontSize: "11px" }}>
                                No skills specified
                              </span>
                            );
                          }
                        })()}
                      </div>
                    </div>

                    {job.jobDescription && (
                      <div style={{ marginBottom: "16px" }}>
                        <h4
                          style={{
                            color: "#1890ff",
                            marginBottom: "6px",
                            fontSize: "14px",
                          }}
                        >
                          Job Description
                        </h4>
                        <div
                          style={{
                            fontSize: "11px",
                            lineHeight: "1.4",
                            padding: "8px",
                            backgroundColor: "#f5f5f5",
                            borderRadius: "4px",
                            border: "1px solid #d9d9d9",
                          }}
                        >
                          {job.jobDescription.substring(0, 150)}...
                        </div>
                      </div>
                    )}

                    {job.keyResponsibilities && (
                      <div style={{ marginBottom: "16px" }}>
                        <h4
                          style={{
                            color: "#1890ff",
                            marginBottom: "6px",
                            fontSize: "14px",
                          }}
                        >
                          Key Responsibilities
                        </h4>
                        <div>
                          {(() => {
                            try {
                              // Handle both string and array formats
                              let responsibilities = [];
                              if (typeof job.keyResponsibilities === "string") {
                                // Try to parse as JSON first
                                if (job.keyResponsibilities.startsWith("[")) {
                                  responsibilities = JSON.parse(
                                    job.keyResponsibilities
                                  );
                                } else {
                                  // Split by newline if it's a newline-separated string
                                  responsibilities = job.keyResponsibilities
                                    .split("\n")
                                    .filter((r) => r.trim());
                                }
                              } else if (
                                Array.isArray(job.keyResponsibilities)
                              ) {
                                responsibilities = job.keyResponsibilities;
                              }

                              return responsibilities.length > 0 ? (
                                responsibilities.map(
                                  (item: any, index: any) => (
                                    <Tag
                                      key={index}
                                      color="green"
                                      style={{
                                        marginBottom: "4px",
                                        fontSize: "11px",
                                        display: "inline-block",
                                        marginRight: "4px",
                                        maxWidth: "100%",
                                        whiteSpace: "normal",
                                        wordBreak: "break-word",
                                        lineHeight: "1.4",
                                        padding: "4px 8px",
                                      }}
                                    >
                                      {item.trim()}
                                    </Tag>
                                  )
                                )
                              ) : (
                                <span
                                  style={{ color: "#999", fontSize: "11px" }}
                                >
                                  No responsibilities specified
                                </span>
                              );
                            } catch (e) {
                              return (
                                <span
                                  style={{ color: "#999", fontSize: "11px" }}
                                >
                                  No responsibilities specified
                                </span>
                              );
                            }
                          })()}
                        </div>
                      </div>
                    )}

                    {job.qualifications && (
                      <div>
                        <h4
                          style={{
                            color: "#1890ff",
                            marginBottom: "6px",
                            fontSize: "14px",
                          }}
                        >
                          Qualifications
                        </h4>
                        <div>
                          {(() => {
                            try {
                              // Handle both string and array formats
                              let qualifications = [];
                              if (typeof job.qualifications === "string") {
                                // Try to parse as JSON first
                                if (job.qualifications.startsWith("[")) {
                                  qualifications = JSON.parse(
                                    job.qualifications
                                  );
                                } else {
                                  // Split by newline if it's a newline-separated string
                                  qualifications = job.qualifications
                                    .split("\n")
                                    .filter((q) => q.trim());
                                }
                              } else if (Array.isArray(job.qualifications)) {
                                qualifications = job.qualifications;
                              }

                              return qualifications.length > 0 ? (
                                qualifications.map((item: any, index: any) => (
                                  <Tag
                                    key={index}
                                    color="orange"
                                    style={{
                                      marginBottom: "4px",
                                      fontSize: "11px",
                                      display: "inline-block",
                                      marginRight: "4px",
                                      maxWidth: "100%",
                                      whiteSpace: "normal",
                                      wordBreak: "break-word",
                                      lineHeight: "1.4",
                                      padding: "4px 8px",
                                    }}
                                  >
                                    {item.trim()}
                                  </Tag>
                                ))
                              ) : (
                                <span
                                  style={{ color: "#999", fontSize: "11px" }}
                                >
                                  No qualifications specified
                                </span>
                              );
                            } catch (e) {
                              return (
                                <span
                                  style={{ color: "#999", fontSize: "11px" }}
                                >
                                  No qualifications specified
                                </span>
                              );
                            }
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </Col>
          </Row>

          {/* Upload Modal */}
          <Modal
            title="Analyze New Resumes"
            open={uploadModalVisible}
            onCancel={() => setUploadModalVisible(false)}
            onOk={handleAnalyzeResumes}
            confirmLoading={analyzing}
            width={700}
            okText={
              activeUploadTab === "urls" ? "Analyze URLs" : "Analyze Files"
            }
            cancelText="Cancel"
          >
            <Tabs
              activeKey={activeUploadTab}
              onChange={(k) => setActiveUploadTab(k)}
              items={[
                {
                  key: "urls",
                  label: "Upload by URLs",
                  children: (
                    <div>
                      <p style={{ color: "#666", marginBottom: 12 }}>
                        Add one or more resume URLs. Use the button to add more
                        fields.
                      </p>
                      <Space direction="vertical" style={{ width: "100%" }}>
                        {urlFields.map((value, idx) => (
                          <div key={idx} style={{ display: "flex", gap: 8 }}>
                            <Input
                              value={value}
                              onChange={(e) =>
                                changeUrlField(idx, e.target.value)
                              }
                              placeholder="https://..."
                            />
                            {urlFields.length > 1 && (
                              <Button
                                danger
                                onClick={() => removeUrlField(idx)}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button onClick={addUrlField}>Add another URL</Button>
                      </Space>
                    </div>
                  ),
                },
                {
                  key: "files",
                  label: "Upload Files",
                  children: (
                    <div>
                      <p style={{ color: "#666", marginBottom: 12 }}>
                        Select one or more resume files to upload.
                      </p>
                      <Upload.Dragger
                        multiple
                        fileList={fileList}
                        beforeUpload={() => false}
                        onChange={({ fileList }) => setFileList(fileList)}
                        accept=".pdf,.doc,.docx,.rtf"
                      >
                        <p className="ant-upload-drag-icon">
                          <UploadOutlined />
                        </p>
                        <p className="ant-upload-text">
                          Click or drag files to this area
                        </p>
                        <p className="ant-upload-hint">
                          Supports PDF, DOC, DOCX, RTF
                        </p>
                      </Upload.Dragger>
                      <div style={{ marginTop: 12, color: "#faad14" }}>
                        File analysis requires a backend upload endpoint. Please
                        use URLs for now.
                      </div>
                    </div>
                  ),
                },
              ]}
            />
          </Modal>

          {/* Resume Details Drawer */}
          <Drawer
            title={
              <div style={{ display: "flex", alignItems: "center" }}>
                <FileTextOutlined
                  style={{ marginRight: "8px", color: "#1890ff" }}
                />
                {selectedResume?.candidateName}
              </div>
            }
            placement="right"
            size="large"
            open={drawerVisible}
            onClose={() => setDrawerVisible(false)}
            style={{ borderRadius: "8px" }}
          >
            {selectedResume && (
              <div>
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Card
                      size="small"
                      title="Contact Information"
                      style={{ borderRadius: "6px" }}
                    >
                      <div style={{ lineHeight: "1.8" }}>
                        <p>
                          <MailOutlined
                            style={{ marginRight: "8px", color: "#1890ff" }}
                          />
                          {selectedResume.candidateEmail || "N/A"}
                        </p>
                        <p>
                          <PhoneOutlined
                            style={{ marginRight: "8px", color: "#1890ff" }}
                          />
                          {selectedResume.candidatePhone || "N/A"}
                        </p>
                      </div>
                    </Card>
                  </Col>

                  <Col span={24}>
                    <Card
                      size="small"
                      title="Match Analysis"
                      style={{ borderRadius: "6px" }}
                    >
                      <Row gutter={16}>
                        <Col span={12}>
                          <Statistic
                            title="Match Score"
                            value={selectedResume.matchScore || 0}
                            suffix="%"
                            valueStyle={{
                              color: getScoreColor(
                                selectedResume.matchScore || 0
                              ),
                              fontSize: "20px",
                            }}
                          />
                        </Col>
                        <Col span={12}>
                          <div>
                            <p
                              style={{
                                marginBottom: "8px",
                                fontSize: "14px",
                                color: "#666",
                              }}
                            >
                              Recommendation
                            </p>
                            <Tag
                              color={getRecommendationColor(
                                selectedResume.recommendation
                              )}
                              style={{ fontSize: "14px", padding: "4px 8px" }}
                            >
                              {selectedResume.recommendation || "N/A"}
                            </Tag>
                          </div>
                        </Col>
                      </Row>
                    </Card>
                  </Col>

                  <Col span={24}>
                    <Card
                      size="small"
                      title="Skills"
                      style={{ borderRadius: "6px" }}
                    >
                      <div>
                        {selectedResume.skills?.map((skill, index) => (
                          <Tag
                            key={index}
                            color="blue"
                            style={{ marginBottom: "6px", fontSize: "12px" }}
                          >
                            {skill}
                          </Tag>
                        ))}
                      </div>
                    </Card>
                  </Col>

                  <Col span={24}>
                    <Card
                      size="small"
                      title="Education & Experience"
                      style={{ borderRadius: "6px" }}
                    >
                      <div style={{ lineHeight: "1.8" }}>
                        <p>
                          <strong>Education:</strong>{" "}
                          {selectedResume.education || "N/A"}
                        </p>
                        <p>
                          <strong>Experience:</strong>{" "}
                          {selectedResume.experienceYears
                            ? `${selectedResume.experienceYears} years`
                            : "N/A"}
                        </p>
                      </div>
                    </Card>
                  </Col>

                  {selectedResume.summary && (
                    <Col span={24}>
                      <Card
                        size="small"
                        title="AI Summary"
                        style={{ borderRadius: "6px" }}
                      >
                        <p style={{ lineHeight: "1.6", color: "#666" }}>
                          {selectedResume.summary}
                        </p>
                      </Card>
                    </Col>
                  )}

                  <Col span={24}>
                    <Card
                      size="small"
                      title="Resume Document"
                      style={{ borderRadius: "6px" }}
                    >
                      <Button
                        type="primary"
                        icon={<FileTextOutlined />}
                        href={selectedResume.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        block
                        size="large"
                      >
                        View Full Resume
                      </Button>
                    </Card>
                  </Col>
                </Row>
              </div>
            )}
          </Drawer>
        </div>
      </Spin>
    </AppLayout>
  );
}
