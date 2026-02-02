import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Tag,
  Button,
  Space,
  message,
  Tooltip,
  Modal,
  Typography,
  Row,
  Col,
  Popconfirm,
  Spin,
} from "antd";
import {
  DownOutlined,
  RightOutlined,
  EyeOutlined,
  DeleteOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  VideoCameraOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useRouter } from "next/router";

const { Text } = Typography;

interface JobWithInterviews {
  id: string;
  jobTitle: string;
  companyName: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    interviews: number;
  };
  interviews: Array<{
    id: string;
    type: string;
    status: string;
    scheduledAt: string | null;
    completedAt: string | null;
    resultScore: number | null;
    duration: number | null;
    notes: string | null;
    createdAt: string;
    resume: {
      id: string;
      candidateName: string;
      candidateEmail: string;
      matchScore: number | null;
    };
    avatarAssessment: {
      id: string;
      title: string;
      description: string | null;
      avatarType: string | null;
      recordingEnabled: boolean;
      timeLimit: number | null;
      recordings: any[];
    };
  }>;
}

interface AvatarJobAccordionTableProps {
  onRefresh?: () => void;
}

const AvatarJobAccordionTable: React.FC<AvatarJobAccordionTableProps> = ({
  onRefresh,
}) => {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobWithInterviews[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [animatingRows, setAnimatingRows] = useState<Set<string>>(new Set());
  const [deletingInterview, setDeletingInterview] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchJobsWithInterviews();
  }, []);

  const fetchJobsWithInterviews = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/jobs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }

      const data = await response.json();
      const jobsData = data.jobs || [];

      // Fetch avatar interviews for each job
      const jobsWithInterviews = await Promise.all(
        jobsData.map(async (job: any) => {
          try {
            const interviewsResponse = await fetch(
              `/api/assessments/avatar?jobPostId=${job.id}&includeRecordings=true`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );

            if (interviewsResponse.ok) {
              const interviewsData = await interviewsResponse.json();
              return {
                ...job,
                interviews: interviewsData.assessmentStages || [],
                _count: {
                  interviews: interviewsData.assessmentStages?.length || 0,
                },
              };
            }
            return {
              ...job,
              interviews: [],
              _count: { interviews: 0 },
            };
          } catch (error) {
            console.error(
              `Error fetching interviews for job ${job.id}:`,
              error,
            );
            return {
              ...job,
              interviews: [],
              _count: { interviews: 0 },
            };
          }
        }),
      );

      setJobs(jobsWithInterviews);
    } catch (error) {
      console.error("Error fetching jobs with interviews:", error);
      message.error("Failed to fetch jobs and interviews");
    } finally {
      setLoading(false);
    }
  };

  const handleRowExpand = (jobId: string) => {
    const isCurrentlyExpanded = expandedRows.has(jobId);

    if (isCurrentlyExpanded) {
      setAnimatingRows((prev) => new Set(prev).add(jobId));

      setTimeout(() => {
        setExpandedRows((prev) => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
        setAnimatingRows((prev) => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
      }, 350);
    } else {
      setExpandedRows((prev) => new Set(prev).add(jobId));
      setAnimatingRows((prev) => new Set(prev).add(jobId));

      setTimeout(() => {
        setAnimatingRows((prev) => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
      }, 400);
    }
  };

  const confirmDelete = async () => {
    if (!deletingInterview) return;

    setDeleteLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/assessments/${deletingInterview.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 204 || response.ok) {
        message.success("AI interview deleted successfully");
        setDeletingInterview(null);
        fetchJobsWithInterviews();
      } else {
        const data = await response.json().catch(() => ({}));
        message.error(data.error || "Failed to delete AI interview");
      }
    } catch (error) {
      console.error("Error deleting interview:", error);
      message.error("Error deleting AI interview");
    } finally {
      setDeleteLoading(false);
    }
  };

  const getStatusTag = (status: string) => {
    const statusConfig: Record<
      string,
      { color: string; icon: React.ReactNode }
    > = {
      PENDING: { color: "default", icon: <ClockCircleOutlined /> },
      IN_PROGRESS: { color: "processing", icon: <ClockCircleOutlined /> },
      COMPLETED: { color: "success", icon: <CheckCircleOutlined /> },
      CANCELLED: { color: "error", icon: <CloseCircleOutlined /> },
      NO_SHOW: { color: "warning", icon: <CloseCircleOutlined /> },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    return (
      <Tag color={config.color} icon={config.icon}>
        {status.replace("_", " ")}
      </Tag>
    );
  };

  const renderInterviewTable = (interviews: any[]) => {
    if (interviews.length === 0) {
      return (
        <div style={{ textAlign: "center", padding: "20px", color: "#999" }}>
          <RobotOutlined style={{ fontSize: "24px", marginBottom: "8px" }} />
          <div>No AI interviews found for this job</div>
        </div>
      );
    }

    const interviewColumns = [
      {
        title: "Candidate",
        key: "candidate",
        width: 200,
        render: (_: any, record: any) => (
          <div>
            <div style={{ fontWeight: "bold", fontSize: "13px" }}>
              {record.resume?.candidateName || "Unknown"}
            </div>
            <div style={{ fontSize: "11px", color: "#666" }}>
              {record.resume?.candidateEmail || "No email"}
            </div>
            {record.resume?.matchScore && (
              <div style={{ fontSize: "11px", color: "#1890ff" }}>
                Match: {record.resume.matchScore}%
              </div>
            )}
          </div>
        ),
      },
      {
        title: "Interview Details",
        key: "details",
        width: 200,
        render: (_: any, record: any) => (
          <div>
            <div style={{ fontSize: "12px", fontWeight: "bold" }}>
              {record.avatarAssessment?.title || "Untitled"}
            </div>
            {record.avatarAssessment?.avatarType && (
              <div style={{ fontSize: "11px", color: "#666" }}>
                Type: {record.avatarAssessment.avatarType}
              </div>
            )}
            {record.duration && (
              <div style={{ fontSize: "11px", color: "#666" }}>
                Duration: {record.duration} min
              </div>
            )}
          </div>
        ),
      },
      {
        title: "Status",
        key: "status",
        width: 120,
        render: (_: any, record: any) => getStatusTag(record.status),
      },
      {
        title: "Result Score",
        key: "score",
        width: 100,
        render: (_: any, record: any) =>
          record.resultScore ? (
            <div
              style={{
                fontWeight: "bold",
                color:
                  record.resultScore >= 70
                    ? "#52c41a"
                    : record.resultScore >= 50
                      ? "#faad14"
                      : "#ff4d4f",
                fontSize: "14px",
              }}
            >
              {record.resultScore}%
            </div>
          ) : (
            <div style={{ color: "#999", fontSize: "12px" }}>-</div>
          ),
      },
      {
        title: "Recordings",
        key: "recordings",
        width: 100,
        render: (_: any, record: any) => (
          <div style={{ textAlign: "center" }}>
            <Tag
              icon={<VideoCameraOutlined />}
              color={
                record.avatarAssessment?.recordings?.length > 0
                  ? "blue"
                  : "default"
              }
            >
              {record.avatarAssessment?.recordings?.length || 0}
            </Tag>
          </div>
        ),
      },
      {
        title: "Created",
        key: "created",
        width: 120,
        render: (_: any, record: any) => (
          <div style={{ fontSize: "12px" }}>
            {dayjs(record.createdAt).format("MMM DD, YYYY")}
          </div>
        ),
      },
      {
        title: "Actions",
        key: "actions",
        width: 120,
        render: (_: any, record: any) => (
          <Space size="small">
            <Tooltip title="View Details">
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() => router.push(`/assessment/avatar/${record.id}`)}
              />
            </Tooltip>
            <Tooltip title="Delete">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => setDeletingInterview(record)}
              />
            </Tooltip>
          </Space>
        ),
      },
    ];

    return (
      <div
        style={{
          animation: "fadeIn 0.3s ease-in-out",
          marginTop: "16px",
        }}
      >
        <Table
          columns={interviewColumns}
          dataSource={interviews}
          rowKey="id"
          pagination={false}
          size="small"
          style={{
            marginTop: "16px",
            borderRadius: "8px",
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        />
      </div>
    );
  };

  const jobColumns = [
    {
      title: "",
      key: "expand",
      width: 50,
      render: (_: any, record: JobWithInterviews) => {
        const isExpanded = expandedRows.has(record.id);
        return (
          <Button
            type="text"
            icon={isExpanded ? <DownOutlined /> : <RightOutlined />}
            onClick={() => handleRowExpand(record.id)}
            style={{
              transition: "transform 0.3s ease",
              transform: isExpanded ? "rotate(0deg)" : "rotate(0deg)",
            }}
          />
        );
      },
    },
    {
      title: "Job Title",
      dataIndex: "jobTitle",
      key: "jobTitle",
      render: (text: string, record: JobWithInterviews) => (
        <div>
          <div style={{ fontWeight: "bold", fontSize: "14px" }}>{text}</div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            {record.companyName}
          </div>
        </div>
      ),
    },
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
      width: 150,
    },
    {
      title: "Type",
      dataIndex: "jobType",
      key: "jobType",
      width: 120,
      render: (type: string) => <Tag>{type}</Tag>,
    },
    {
      title: "Experience",
      dataIndex: "experienceLevel",
      key: "experienceLevel",
      width: 120,
      render: (level: string) => <Tag color="blue">{level}</Tag>,
    },
    {
      title: "AI Interviews",
      key: "interviews",
      width: 120,
      render: (_: any, record: JobWithInterviews) => (
        <Tag color={record._count.interviews > 0 ? "purple" : "default"}>
          {record._count.interviews}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? "success" : "default"}>
          {isActive ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (date: string) => (
        <div style={{ fontSize: "12px" }}>
          {dayjs(date).format("MMM DD, YYYY")}
        </div>
      ),
    },
  ];

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .expandable-content {
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
          opacity: 1;
          transform: translateY(0);
          max-height: 1000px;
        }

        .expandable-content.expanding {
          opacity: 1;
          transform: translateY(0);
          max-height: 1000px;
        }

        .expandable-content.collapsing {
          opacity: 0;
          transform: translateY(-10px);
          max-height: 0;
        }

        /* Smooth hover transitions for expand buttons */
        .ant-btn-text:hover {
          background: rgba(114, 46, 209, 0.06) !important;
          border-radius: 6px !important;
        }

        /* Enhanced row hover effects */
        .job-row {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .job-row:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transform: translateY(-1px);
        }

        .ant-table-small .ant-table-thead > tr > th {
          background: #fafafa !important;
          font-weight: 600 !important;
          color: #262626 !important;
          font-size: 12px !important;
        }
      `}</style>
      <Spin spinning={loading}>
        <Card>
          <div style={{ marginBottom: 24 }}>
            <Typography.Title level={3} style={{ margin: 0, marginBottom: 8 }}>
              <RobotOutlined style={{ color: "#722ed1", marginRight: 8 }} />
              AI Interviews
            </Typography.Title>
            <Typography.Text type="secondary">
              Expand job rows to view and manage AI-powered candidate interviews
            </Typography.Text>
          </div>

          {jobs.length === 0 && !loading ? (
            <div
              style={{ textAlign: "center", padding: "40px", color: "#999" }}
            >
              <FileTextOutlined
                style={{ fontSize: "48px", marginBottom: "16px" }}
              />
              <div style={{ fontSize: "16px" }}>No jobs found</div>
              <div style={{ fontSize: "14px", marginTop: "8px" }}>
                Create a job posting to start managing AI interviews
              </div>
            </div>
          ) : (
            <div
              style={{
                background: "white",
                borderRadius: "8px",
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              {/* Proper Table Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "16px 20px",
                  background: "#fafafa",
                  borderBottom: "1px solid #f0f0f0",
                  fontWeight: "600",
                  fontSize: "12px",
                  color: "#666",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                <div style={{ flex: "2", minWidth: "300px" }}>Job Position</div>
                <div
                  style={{ flex: "1", textAlign: "center", minWidth: "150px" }}
                >
                  AI Interviews
                </div>
                <div style={{ width: "120px" }}>Status</div>
                <div style={{ width: "120px" }}>Created</div>
                <div style={{ width: "60px" }}></div>
              </div>

              {/* Job Rows */}
              {jobs.map((job, index) => (
                <div
                  key={job.id}
                  style={{
                    borderBottom:
                      index < jobs.length - 1 ? "1px solid #f0f0f0" : "none",
                    background: "white",
                  }}
                >
                  {/* Main Job Row */}
                  <div
                    className="job-row"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "20px",
                      cursor: job._count.interviews > 0 ? "pointer" : "default",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                    onClick={() =>
                      job._count.interviews > 0 && handleRowExpand(job.id)
                    }
                    onMouseEnter={(e) => {
                      if (job._count.interviews > 0) {
                        e.currentTarget.style.backgroundColor = "#f8f9fa";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "white";
                    }}
                  >
                    {/* Job Position */}
                    <div style={{ flex: "2", minWidth: "300px" }}>
                      <div
                        style={{
                          fontWeight: "bold",
                          fontSize: "14px",
                          marginBottom: "4px",
                          color: "#262626",
                        }}
                      >
                        {job.jobTitle}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          marginBottom: "2px",
                        }}
                      >
                        {job.companyName} • {job.location}
                      </div>
                      <div style={{ fontSize: "11px", color: "#999" }}>
                        {job.jobType} • {job.experienceLevel}
                      </div>
                    </div>

                    {/* AI Interviews Count */}
                    <div
                      style={{
                        flex: "1",
                        textAlign: "center",
                        minWidth: "150px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "20px",
                          fontWeight: "bold",
                          color: "#722ed1",
                          marginBottom: "2px",
                        }}
                      >
                        {job._count.interviews}
                      </div>
                      <div style={{ fontSize: "11px", color: "#666" }}>
                        {job._count.interviews === 1
                          ? "AI Interview"
                          : "AI Interviews"}
                      </div>
                    </div>

                    {/* Status */}
                    <div style={{ width: "120px" }}>
                      <Tag color={job.isActive ? "green" : "red"}>
                        {job.isActive ? "Active" : "Inactive"}
                      </Tag>
                    </div>

                    {/* Created Date */}
                    <div
                      style={{
                        width: "120px",
                        fontSize: "12px",
                        color: "#666",
                      }}
                    >
                      {dayjs(job.createdAt).format("MMM DD, YYYY")}
                    </div>

                    {/* Expand Button */}
                    <div style={{ width: "60px", textAlign: "center" }}>
                      {job._count.interviews > 0 && (
                        <Button
                          type="text"
                          icon={
                            <DownOutlined
                              style={{
                                transform: `rotate(${
                                  expandedRows.has(job.id) ||
                                  animatingRows.has(job.id)
                                    ? 180
                                    : 0
                                }deg)`,
                                transition:
                                  "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                                color: "#722ed1",
                              }}
                            />
                          }
                          style={{
                            border: "none",
                            background: "transparent",
                            boxShadow: "none",
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Expanded Interview Table */}
                  {(expandedRows.has(job.id) || animatingRows.has(job.id)) && (
                    <div
                      className={`expandable-content ${
                        animatingRows.has(job.id)
                          ? expandedRows.has(job.id)
                            ? "expanding"
                            : "collapsing"
                          : ""
                      }`}
                      style={{
                        background: "#fafafa",
                        borderTop: "1px solid #f0f0f0",
                      }}
                    >
                      {job._count.interviews > 0 ? (
                        <div style={{ padding: "16px" }}>
                          {renderInterviewTable(job.interviews)}
                        </div>
                      ) : (
                        <div
                          style={{
                            textAlign: "center",
                            padding: "40px 20px",
                            color: "#999",
                          }}
                        >
                          <RobotOutlined
                            style={{ fontSize: "24px", marginBottom: "8px" }}
                          />
                          <div>No AI interviews found for this job</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </Spin>

      {/* Delete Confirmation Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <DeleteOutlined style={{ color: "#ff4d4f" }} />
            <span>Delete AI Interview</span>
          </div>
        }
        open={!!deletingInterview}
        onOk={confirmDelete}
        onCancel={() => setDeletingInterview(null)}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{
          danger: true,
          loading: deleteLoading,
          icon: <DeleteOutlined />,
        }}
        cancelButtonProps={{ disabled: deleteLoading }}
        closable={!deleteLoading}
        maskClosable={!deleteLoading}
      >
        <div style={{ marginTop: "16px" }}>
          <p style={{ marginBottom: "16px" }}>
            Are you sure you want to delete this AI interview? This action
            cannot be undone.
          </p>
          {deletingInterview && (
            <Card size="small" style={{ background: "#f5f5f5" }}>
              <p style={{ margin: 0, marginBottom: "8px" }}>
                <strong>Candidate:</strong>{" "}
                {deletingInterview.resume?.candidateName}
              </p>
              <p style={{ margin: 0, marginBottom: "8px" }}>
                <strong>Interview:</strong>{" "}
                {deletingInterview.avatarAssessment?.title || "Untitled"}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Status:</strong>{" "}
                {getStatusTag(deletingInterview.status)}
              </p>
            </Card>
          )}
        </div>
      </Modal>
    </>
  );
};

export default AvatarJobAccordionTable;
