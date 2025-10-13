import { useState, useEffect } from "react";
import type { ColumnsType } from "antd/es/table";
import {
  Table,
  Space,
  Button,
  Modal,
  message,
  Tag,
  Card,
  Spin,
  Drawer,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  EyeOutlined,
  DeleteOutlined,
  ProfileOutlined,
  CalendarOutlined,
  TeamOutlined,
  FileDoneOutlined,
  UserOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  StarOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";

export type JobRow = {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  salaryRange?: string;
  skillsRequired: string[];
  jobDescription?: string;
  keyResponsibilities: string[];
  qualifications: string[];
  benefits: string[];
  status?: string;
  createdAt?: string;
  createdBy?: { id: number; name: string; email: string };
  _count?: { Resume: number };
  avgMatchScore?: number;
};

export type ManageMode =
  | "manage"
  | "cv"
  | "meeting"
  | "scheduler"
  | "offers"
  | "interview";

export default function ManageJobsTable({ mode = "manage" as ManageMode }) {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<JobRow | null>(null);
  const [deleting, setDeleting] = useState<JobRow | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const url = mode === "cv" ? "/api/jobs?include=resumeStats" : "/api/jobs";
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setJobs(
          data?.jobs?.map((job: any) => ({
            id: job.id,
            jobTitle: job.jobTitle,
            company: job.companyName,
            location: job.location,
            jobType: job.jobType,
            experienceLevel: job.experienceLevel,
            salaryRange: job.salaryRange,
            skillsRequired: job.skillsRequired
              ? typeof job.skillsRequired === "string"
                ? job.skillsRequired.startsWith("[")
                  ? JSON.parse(job.skillsRequired)
                  : job.skillsRequired.split(",").map((s: string) => s.trim())
                : job.skillsRequired
              : [],
            jobDescription: job.jobDescription,
            keyResponsibilities: job.keyResponsibilities
              ? typeof job.keyResponsibilities === "string"
                ? job.keyResponsibilities.startsWith("[")
                  ? JSON.parse(job.keyResponsibilities)
                  : job.keyResponsibilities
                      .split("\n")
                      .filter((s: string) => s.trim())
                : job.keyResponsibilities
              : [],
            qualifications: job.qualifications
              ? typeof job.qualifications === "string"
                ? job.qualifications.startsWith("[")
                  ? JSON.parse(job.qualifications)
                  : job.qualifications
                      .split("\n")
                      .filter((s: string) => s.trim())
                : job.qualifications
              : [],
            benefits: job.benefits
              ? typeof job.benefits === "string"
                ? job.benefits.startsWith("[")
                  ? JSON.parse(job.benefits)
                  : job.benefits.split("\n").filter((s: string) => s.trim())
                : job.benefits
              : [],
            status: job.isActive ? "OPEN" : "CLOSED",
            createdAt: job.createdAt,
            createdBy: job.createdBy,
            _count: job._count,
            avgMatchScore: job.avgMatchScore,
          })) || []
        );
      } else {
        console.error("Failed to fetch jobs");
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const primaryAction = (record: JobRow) => {
    if (mode === "cv")
      return {
        text: "Manage CVs",
        icon: <ProfileOutlined />,
        href: `/cv-sorting/${record.id}`,
      };
    if (mode === "meeting")
      return {
        text: "Manage Meeting",
        icon: <TeamOutlined />,
        href: `/meeting/${record.id}`,
      };
    if (mode === "scheduler")
      return {
        text: "Manage Scheduler",
        icon: <CalendarOutlined />,
        href: `/scheduler/${record.id}`,
      };
    if (mode === "offers")
      return {
        text: "Manage Offers",
        icon: <FileDoneOutlined />,
        href: `/offers/${record.id}`,
      };
    if (mode === "interview")
      return {
        text: "Manage Interview",
        icon: <EditOutlined />,
        href: `/interview/${record.id}`,
      };
    return null;
  };

  const getColumns = () => {
    const baseColumns: ColumnsType<JobRow> = [
      {
        title: "Job Title",
        dataIndex: "jobTitle",
        key: "jobTitle",
        width: 150,
        render: (title: string) => (
          <div style={{ fontWeight: 500, color: "#1890ff", fontSize: "13px" }}>
            {title}
          </div>
        ),
      },
      {
        title: "Company",
        dataIndex: "company",
        key: "company",
        width: 120,
        render: (company: string) => (
          <span style={{ fontSize: "12px" }}>{company}</span>
        ),
      },
      {
        title: "Location",
        dataIndex: "location",
        key: "location",
        width: 120,
        render: (location: string) => (
          <span style={{ fontSize: "12px" }}>{location}</span>
        ),
      },
      {
        title: "Type",
        dataIndex: "jobType",
        key: "jobType",
        width: 100,
        align: "center" as const,
        render: (type: string) => (
          <span style={{ fontSize: "12px" }}>{type}</span>
        ),
      },
      {
        title: "Experience",
        dataIndex: "experienceLevel",
        key: "experienceLevel",
        width: 100,
        align: "center" as const,
        render: (level: string) => (
          <span style={{ fontSize: "12px" }}>{level}</span>
        ),
      },
      {
        title: "Salary",
        dataIndex: "salaryRange",
        key: "salaryRange",
        width: 120,
        render: (salary: string) => (
          <span style={{ color: salary ? "#000" : "#999", fontSize: "12px" }}>
            {salary || "N/A"}
          </span>
        ),
      },
      {
        title: "Created By",
        dataIndex: "createdBy",
        key: "createdBy",
        width: 120,
        render: (createdBy: any) => (
          <span style={{ fontSize: "12px" }}>
            {createdBy?.name || createdBy?.email || "N/A"}
          </span>
        ),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 100,
        align: "center" as const,
        render: (status: string) => (
          <Tag
            color={status === "OPEN" ? "green" : "default"}
            style={{ fontSize: "11px", margin: 0 }}
          >
            {status}
          </Tag>
        ),
      },
    ];

    // Add resume statistics columns for CV mode
    if (mode === "cv") {
      baseColumns.splice(
        6,
        0,
        {
          title: "Total Resumes",
          dataIndex: "_count",
          key: "_count",
          width: 100,
          align: "center" as const,
          render: (count: any) => (
            <span style={{ fontSize: "12px" }}>{count?.Resume || 0}</span>
          ),
        },
        {
          title: "Avg Match Score",
          dataIndex: "avgMatchScore",
          key: "avgMatchScore",
          width: 100,
          align: "center" as const,
          render: (score: any) => (
            <Tag
              color={score >= 70 ? "green" : score >= 50 ? "orange" : "red"}
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
        }
      );
    }

    baseColumns.push({
      title: "Actions",
      key: "actions",
      width: 200,
      align: "center" as const,
      render: (_: unknown, record: JobRow) => {
        const act = primaryAction(record);
        if (act) {
          return (
            <Space size="small" wrap>
              <Button
                type="primary"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => {
                  setViewing(record);
                  setDrawerVisible(true);
                }}
                style={{ fontSize: "11px", height: "24px" }}
              >
                View
              </Button>
              <Button
                type="default"
                size="small"
                icon={act.icon}
                style={{ fontSize: "11px", height: "24px" }}
                onClick={() => router.push(act.href)}
              >
                {act.text}
              </Button>
            </Space>
          );
        }
        return (
          <Space size="small" wrap>
            <Button
              type="primary"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setViewing(record);
                setDrawerVisible(true);
              }}
              style={{ fontSize: "11px", height: "24px" }}
            >
              View
            </Button>
            <Button
              type="primary"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => setDeleting(record)}
              style={{ fontSize: "11px", height: "24px" }}
            >
              Delete
            </Button>
          </Space>
        );
      },
    });

    return baseColumns;
  };

  const handleConfirmDelete = () => {
    if (!deleting) return;
    const id = deleting.id;
    setJobs((prev) => prev.filter((j) => j.id !== id));
    setDeleting(null);
    message.success("Job deleted");
  };

  return (
    <>
      <Card size="small" style={{ borderRadius: "8px" }}>
        <Spin spinning={loading} size="large">
          <Table
            dataSource={jobs}
            columns={getColumns()}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} jobs`,
              showQuickJumper: true,
            }}
            style={{ borderRadius: "6px" }}
            size="small"
            scroll={{ x: 1000 }}
            bordered
          />
        </Spin>
      </Card>

      {/* Beautiful Job Details Drawer */}
      <Drawer
        title={
          <div style={{ display: "flex", alignItems: "center" }}>
            <UserOutlined style={{ marginRight: "8px", color: "#1890ff" }} />
            {viewing?.jobTitle}
          </div>
        }
        placement="right"
        size="large"
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        style={{ borderRadius: "8px" }}
      >
        {viewing ? (
          <div>
            <Row gutter={[16, 16]}>
              {/* Basic Information */}
              <Col span={24}>
                <Card
                  size="small"
                  title="Basic Information"
                  style={{ borderRadius: "6px" }}
                >
                  <div style={{ lineHeight: "1.8" }}>
                    <p>
                      <UserOutlined
                        style={{ marginRight: "8px", color: "#1890ff" }}
                      />
                      <strong>Company:</strong> {viewing.company || "N/A"}
                    </p>
                    <p>
                      <EnvironmentOutlined
                        style={{ marginRight: "8px", color: "#1890ff" }}
                      />
                      <strong>Location:</strong> {viewing.location || "N/A"}
                    </p>
                    <p>
                      <ClockCircleOutlined
                        style={{ marginRight: "8px", color: "#1890ff" }}
                      />
                      <strong>Job Type:</strong> {viewing.jobType || "N/A"}
                    </p>
                    <p>
                      <UserOutlined
                        style={{ marginRight: "8px", color: "#1890ff" }}
                      />
                      <strong>Experience Level:</strong>{" "}
                      {viewing.experienceLevel || "N/A"}
                    </p>
                    {viewing.salaryRange && (
                      <p>
                        <DollarOutlined
                          style={{ marginRight: "8px", color: "#1890ff" }}
                        />
                        <strong>Salary Range:</strong> {viewing.salaryRange}
                      </p>
                    )}
                    <p>
                      <CheckCircleOutlined
                        style={{ marginRight: "8px", color: "#1890ff" }}
                      />
                      <strong>Status:</strong>
                      <Tag
                        color={viewing.status === "OPEN" ? "green" : "default"}
                        style={{ marginLeft: "8px" }}
                      >
                        {viewing.status}
                      </Tag>
                    </p>
                  </div>
                </Card>
              </Col>

              {/* Resume Statistics (for CV mode) */}
              {mode === "cv" && (
                <Col span={24}>
                  <Card
                    size="small"
                    title="Resume Statistics"
                    style={{ borderRadius: "6px" }}
                  >
                    <Row gutter={16}>
                      <Col span={12}>
                        <Statistic
                          title="Total Resumes"
                          value={viewing._count?.Resume || 0}
                          prefix={<UserOutlined />}
                          valueStyle={{ color: "#1890ff" }}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="Average Match Score"
                          value={viewing.avgMatchScore || 0}
                          suffix="%"
                          precision={1}
                          valueStyle={{
                            color:
                              (viewing.avgMatchScore || 0) >= 70
                                ? "#52c41a"
                                : (viewing.avgMatchScore || 0) >= 50
                                ? "#faad14"
                                : "#f5222d",
                          }}
                        />
                      </Col>
                    </Row>
                  </Card>
                </Col>
              )}

              {/* Skills Required */}
              <Col span={24}>
                <Card
                  size="small"
                  title="Required Skills"
                  style={{ borderRadius: "6px" }}
                >
                  <div>
                    {viewing.skillsRequired &&
                    Array.isArray(viewing.skillsRequired) &&
                    viewing.skillsRequired.length > 0 ? (
                      viewing.skillsRequired.map(
                        (skill: string, index: number) => (
                          <Tag
                            key={index}
                            color="blue"
                            style={{ marginBottom: "6px", fontSize: "12px" }}
                          >
                            <StarOutlined style={{ marginRight: "4px" }} />
                            {skill}
                          </Tag>
                        )
                      )
                    ) : (
                      <span style={{ color: "#999" }}>No skills specified</span>
                    )}
                  </div>
                </Card>
              </Col>

              {/* Job Description */}
              {viewing.jobDescription && (
                <Col span={24}>
                  <Card
                    size="small"
                    title="Job Description"
                    style={{ borderRadius: "6px" }}
                  >
                    <p style={{ lineHeight: "1.6", color: "#666" }}>
                      {viewing.jobDescription}
                    </p>
                  </Card>
                </Col>
              )}

              {/* Key Responsibilities */}
              {viewing.keyResponsibilities &&
                Array.isArray(viewing.keyResponsibilities) &&
                viewing.keyResponsibilities.length > 0 && (
                  <Col span={24}>
                    <Card
                      size="small"
                      title="Key Responsibilities"
                      style={{ borderRadius: "6px" }}
                    >
                      <div>
                        {viewing.keyResponsibilities.map(
                          (item: string, index: number) => (
                            <div
                              key={index}
                              style={{
                                marginBottom: "8px",
                                display: "flex",
                                alignItems: "flex-start",
                                lineHeight: "1.5",
                                fontSize: "13px",
                                color: "#666",
                              }}
                            >
                              <span
                                style={{
                                  color: "#1890ff",
                                  fontWeight: "bold",
                                  marginRight: "8px",
                                  minWidth: "20px",
                                }}
                              >
                                {index + 1}.
                              </span>
                              <span>{item}</span>
                            </div>
                          )
                        )}
                      </div>
                    </Card>
                  </Col>
                )}

              {/* Qualifications */}
              {viewing.qualifications &&
                Array.isArray(viewing.qualifications) &&
                viewing.qualifications.length > 0 && (
                  <Col span={24}>
                    <Card
                      size="small"
                      title="Qualifications"
                      style={{ borderRadius: "6px" }}
                    >
                      <div>
                        {viewing.qualifications.map(
                          (item: string, index: number) => (
                            <div
                              key={index}
                              style={{
                                marginBottom: "8px",
                                display: "flex",
                                alignItems: "flex-start",
                                lineHeight: "1.5",
                                fontSize: "13px",
                                color: "#666",
                              }}
                            >
                              <span
                                style={{
                                  color: "#1890ff",
                                  fontWeight: "bold",
                                  marginRight: "8px",
                                  minWidth: "20px",
                                }}
                              >
                                {index + 1}.
                              </span>
                              <span>{item}</span>
                            </div>
                          )
                        )}
                      </div>
                    </Card>
                  </Col>
                )}

              {/* Benefits */}
              {viewing.benefits &&
                Array.isArray(viewing.benefits) &&
                viewing.benefits.length > 0 && (
                  <Col span={24}>
                    <Card
                      size="small"
                      title="Benefits"
                      style={{ borderRadius: "6px" }}
                    >
                      <div>
                        {viewing.benefits.map((item: string, index: number) => (
                          <div
                            key={index}
                            style={{
                              marginBottom: "8px",
                              display: "flex",
                              alignItems: "flex-start",
                              lineHeight: "1.5",
                              fontSize: "13px",
                              color: "#666",
                            }}
                          >
                            <CheckCircleOutlined
                              style={{
                                color: "#1890ff",
                                marginRight: "8px",
                                marginTop: "2px",
                                fontSize: "12px",
                              }}
                            />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </Col>
                )}

              {/* Job Information */}
              <Col span={24}>
                <Card
                  size="small"
                  title="Job Information"
                  style={{ borderRadius: "6px" }}
                >
                  <div style={{ lineHeight: "1.8", fontSize: "13px" }}>
                    <p>
                      <UserOutlined
                        style={{ marginRight: "8px", color: "#1890ff" }}
                      />
                      <strong>Created By:</strong>{" "}
                      {viewing.createdBy?.name ||
                        viewing.createdBy?.email ||
                        "N/A"}
                    </p>
                    <p>
                      <CalendarOutlined
                        style={{ marginRight: "8px", color: "#1890ff" }}
                      />
                      <strong>Created At:</strong>{" "}
                      {viewing.createdAt
                        ? new Date(viewing.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : "N/A"}
                    </p>
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
        ) : (
          <div>Loading job details...</div>
        )}
      </Drawer>

      <Modal
        title="Delete Job"
        open={!!deleting}
        onCancel={() => setDeleting(null)}
        onOk={handleConfirmDelete}
        okText="Delete"
        okButtonProps={{ danger: true }}
      >
        Are you sure you want to delete "{deleting?.jobTitle}"?
      </Modal>
    </>
  );
}
