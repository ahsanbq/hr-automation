import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  message,
  Spin,
  Row,
  Col,
  Statistic,
  Typography,
  Divider,
  Alert,
  Tooltip,
} from "antd";
import {
  DownOutlined,
  EyeOutlined,
  DeleteOutlined,
  EditOutlined,
  CalendarOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import EditMeetingModal from "./EditMeetingModal";

const { Title, Text } = Typography;

interface JobWithMeetings {
  id: string;
  jobTitle: string;
  companyName: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    meetings: number;
  };
  meetings: Meeting[];
}

interface Meeting {
  id: string;
  meetingTime: string;
  meetingLink?: string;
  meetingSummary?: string;
  meetingRating?: string;
  meetingType?: string;
  agenda?: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  resumeId: string;
  createdById: number;
  jobId: string;
  Resume: {
    candidateName: string;
    candidateEmail: string;
    candidatePhone?: string;
    matchScore?: number;
  };
  User: {
    name: string;
    email: string;
  };
}

interface ManualMeetingJobAccordionTableProps {
  onRefresh: () => void;
}

const ManualMeetingJobAccordionTable: React.FC<
  ManualMeetingJobAccordionTableProps
> = ({ onRefresh }) => {
  const [jobs, setJobs] = useState<JobWithMeetings[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [animatingRows, setAnimatingRows] = useState<Set<string>>(new Set());
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  useEffect(() => {
    fetchJobsWithMeetings();
  }, []);

  const fetchJobsWithMeetings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/meetings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      } else {
        message.error("Failed to fetch meetings data");
      }
    } catch (error) {
      console.error("Error fetching meetings:", error);
      message.error("Failed to fetch meetings data");
    } finally {
      setLoading(false);
    }
  };

  const handleRowExpand = (jobId: string) => {
    const isCurrentlyExpanded = expandedRows.has(jobId);

    if (isCurrentlyExpanded) {
      // Collapsing - start animation but keep content visible
      setAnimatingRows((prev) => new Set(prev).add(jobId));

      // After animation completes, remove from expanded rows and animation state
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
      // Expanding - add to expanded rows immediately and start animation
      setExpandedRows((prev) => new Set(prev).add(jobId));
      setAnimatingRows((prev) => new Set(prev).add(jobId));

      // Remove animation class after animation completes
      setTimeout(() => {
        setAnimatingRows((prev) => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
      }, 400);
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        message.success("Meeting deleted successfully");
        fetchJobsWithMeetings();
      } else {
        message.error("Failed to delete meeting");
      }
    } catch (error) {
      console.error("Error deleting meeting:", error);
      message.error("Failed to delete meeting");
    }
  };

  const handleViewDetails = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setDetailModalVisible(true);
  };

  const handleEditMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setEditModalVisible(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "blue";
      case "IN_PROGRESS":
        return "orange";
      case "COMPLETED":
        return "green";
      case "CANCELLED":
        return "red";
      case "NO_SHOW":
        return "red";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return <CalendarOutlined />;
      case "IN_PROGRESS":
        return <ClockCircleOutlined />;
      case "COMPLETED":
        return <CheckCircleOutlined />;
      case "CANCELLED":
        return <CloseCircleOutlined />;
      case "NO_SHOW":
        return <ExclamationCircleOutlined />;
      default:
        return <CalendarOutlined />;
    }
  };

  const renderMeetingTable = (meetings: Meeting[]) => {
    const columns = [
      {
        title: "Candidate",
        key: "candidate",
        render: (_: any, record: Meeting) => (
          <div>
            <div style={{ fontWeight: "bold", fontSize: "14px" }}>
              {record.Resume?.candidateName || "Unknown"}
            </div>
            <div style={{ fontSize: "12px", color: "#666" }}>
              {record.Resume?.candidateEmail || "No email"}
            </div>
          </div>
        ),
      },
      {
        title: "Meeting Time",
        key: "meetingTime",
        render: (_: any, record: Meeting) => (
          <div>
            <div style={{ fontWeight: "500" }}>
              {dayjs(record.meetingTime).format("MMM DD, YYYY")}
            </div>
            <div style={{ fontSize: "12px", color: "#666" }}>
              {dayjs(record.meetingTime).format("HH:mm")}
            </div>
          </div>
        ),
      },
      {
        title: "Type",
        key: "meetingType",
        render: (_: any, record: Meeting) => (
          <Tag color="purple">{record.meetingType || "N/A"}</Tag>
        ),
      },
      {
        title: "Status",
        key: "status",
        render: (_: any, record: Meeting) => (
          <Tag
            color={getStatusColor(record.status)}
            icon={getStatusIcon(record.status)}
          >
            {record.status}
          </Tag>
        ),
      },
      {
        title: "Rating",
        key: "rating",
        render: (_: any, record: Meeting) => (
          <div>
            {record.meetingRating ? (
              <Tag color="gold">{record.meetingRating}</Tag>
            ) : (
              <Text type="secondary">Not rated</Text>
            )}
          </div>
        ),
      },
      {
        title: "Actions",
        key: "actions",
        render: (_: any, record: Meeting) => (
          <Space>
            <Tooltip title="View Details">
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() => handleViewDetails(record)}
                size="small"
              />
            </Tooltip>
            <Tooltip title="Edit Meeting">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleEditMeeting(record)}
                size="small"
              />
            </Tooltip>
            <Tooltip title="Delete Meeting">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteMeeting(record.id)}
                size="small"
              />
            </Tooltip>
          </Space>
        ),
      },
    ];

    return (
      <Table
        columns={columns}
        dataSource={meetings}
        rowKey="id"
        pagination={false}
        size="small"
        style={{ marginTop: 16 }}
      />
    );
  };

  const renderMeetingDetailsModal = () => {
    if (!selectedMeeting) return null;

    return (
      <Modal
        title="Meeting Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Title level={5}>
              <UserOutlined /> Candidate Information
            </Title>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Name:</Text>{" "}
              {selectedMeeting.Resume?.candidateName || "Unknown"}
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Email:</Text>{" "}
              {selectedMeeting.Resume?.candidateEmail || "No email"}
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Phone:</Text>{" "}
              {selectedMeeting.Resume?.candidatePhone || "Not provided"}
            </div>
            {selectedMeeting.Resume?.matchScore && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>Match Score:</Text>{" "}
                {selectedMeeting.Resume.matchScore}%
              </div>
            )}
          </Col>

          <Col span={12}>
            <Title level={5}>
              <CalendarOutlined /> Meeting Information
            </Title>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Meeting Time:</Text>{" "}
              {dayjs(selectedMeeting.meetingTime).format("MMM DD, YYYY HH:mm")}
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Type:</Text> {selectedMeeting.meetingType || "N/A"}
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Status:</Text>{" "}
              <Tag color={getStatusColor(selectedMeeting.status)}>
                {selectedMeeting.status}
              </Tag>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Rating:</Text>{" "}
              {selectedMeeting.meetingRating ? (
                <Tag color="gold">{selectedMeeting.meetingRating}</Tag>
              ) : (
                <Text type="secondary">Not rated</Text>
              )}
            </div>
          </Col>

          {selectedMeeting.agenda && (
            <Col span={24}>
              <Divider />
              <Title level={5}>
                <FileTextOutlined /> Meeting Agenda
              </Title>
              <div
                style={{ background: "#f5f5f5", padding: 16, borderRadius: 6 }}
              >
                <Text>{selectedMeeting.agenda}</Text>
              </div>
            </Col>
          )}

          {selectedMeeting.meetingSummary && (
            <Col span={24}>
              <Divider />
              <Title level={5}>
                <FileTextOutlined /> Meeting Summary
              </Title>
              <div
                style={{ background: "#f5f5f5", padding: 16, borderRadius: 6 }}
              >
                <Text>{selectedMeeting.meetingSummary}</Text>
              </div>
            </Col>
          )}

          {selectedMeeting.notes && (
            <Col span={24}>
              <Divider />
              <Title level={5}>
                <FileTextOutlined /> Notes
              </Title>
              <div
                style={{ background: "#f5f5f5", padding: 16, borderRadius: 6 }}
              >
                <Text>{selectedMeeting.notes}</Text>
              </div>
            </Col>
          )}

          {selectedMeeting.meetingLink && (
            <Col span={24}>
              <Divider />
              <Title level={5}>
                <CalendarOutlined /> Meeting Link
              </Title>
              <div
                style={{ background: "#f5f5f5", padding: 16, borderRadius: 6 }}
              >
                <Text copyable>{selectedMeeting.meetingLink}</Text>
              </div>
            </Col>
          )}
        </Row>
      </Modal>
    );
  };

  return (
    <>
      <style jsx>{`
        .expandable-content {
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
          opacity: 1;
          transform: translateY(0);
          max-height: 1000px;
        }

        .expandable-content.collapsing {
          opacity: 0;
          transform: translateY(-10px);
          max-height: 0;
        }

        .ant-btn-text:hover {
          background: rgba(114, 46, 209, 0.06) !important;
          border-radius: 6px !important;
        }

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
        }

        .ant-table-small .ant-table-tbody > tr:hover > td {
          background: #f0f9ff !important;
        }
      `}</style>
      <Card>
        <div style={{ marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0, marginBottom: 8 }}>
            <TeamOutlined style={{ color: "#722ed1", marginRight: 8 }} />
            Manual Meetings
          </Title>
          <Text type="secondary">
            Expand job rows to view and manage manual meetings for each position
          </Text>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <Spin size="large" style={{ marginBottom: "20px" }} />
            <div
              style={{
                color: "#722ed1",
                fontSize: "16px",
                fontWeight: "500",
                marginBottom: "8px",
              }}
            >
              Loading Manual Meetings
            </div>
            <div style={{ color: "#666", fontSize: "14px" }}>
              Fetching job positions and meeting data...
            </div>
          </div>
        ) : jobs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px" }}>
            <div
              style={{ fontSize: "16px", color: "#999", marginBottom: "16px" }}
            >
              📅 No meetings found
            </div>
            <div style={{ color: "#666" }}>
              Create your first meeting to start managing manual interviews
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
                Meetings
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
                    cursor: job._count.meetings > 0 ? "pointer" : "default",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                  onClick={() =>
                    job._count.meetings > 0 && handleRowExpand(job.id)
                  }
                  onMouseEnter={(e) => {
                    if (job._count.meetings > 0) {
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

                  {/* Meetings Count */}
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
                      {job._count.meetings}
                    </div>
                    <div style={{ fontSize: "11px", color: "#666" }}>
                      {job._count.meetings === 1 ? "Meeting" : "Meetings"}
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
                    style={{ width: "120px", fontSize: "12px", color: "#666" }}
                  >
                    {dayjs(job.createdAt).format("MMM DD, YYYY")}
                  </div>

                  {/* Expand Button */}
                  <div style={{ width: "60px", textAlign: "center" }}>
                    {job._count.meetings > 0 && (
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

                {/* Expanded Meeting Table */}
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
                    {job._count.meetings > 0 ? (
                      <div style={{ padding: "16px" }}>
                        {renderMeetingTable(job.meetings)}
                      </div>
                    ) : (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "40px 20px",
                          color: "#999",
                        }}
                      >
                        <CalendarOutlined
                          style={{ fontSize: "24px", marginBottom: "8px" }}
                        />
                        <div>No meetings found for this job</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {renderMeetingDetailsModal()}

      <EditMeetingModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        meeting={selectedMeeting}
        onUpdate={fetchJobsWithMeetings}
      />
    </>
  );
};

export default ManualMeetingJobAccordionTable;
