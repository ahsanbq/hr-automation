import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Tooltip,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Progress,
  Alert,
} from "antd";
import InterviewFilters from "./InterviewFilters";
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  FileTextOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { Interview, InterviewStatus, ShortlistStatus } from "@/types/interview";

const { Option } = Select;
const { TextArea } = Input;

interface InterviewListProps {
  jobId?: string;
  onInterviewSelect?: (interview: Interview) => void;
  onRefresh?: () => void;
}

const InterviewList: React.FC<InterviewListProps> = ({
  jobId,
  onInterviewSelect,
  onRefresh,
}) => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [filters, setFilters] = useState({
    status: "",
    shortlistStatus: "",
    interviewerId: "",
    dateFrom: "",
    dateTo: "",
  });
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(
    null
  );
  const [form] = Form.useForm();

  useEffect(() => {
    fetchInterviews();
  }, [pagination.page, pagination.limit, filters, jobId]);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        message.error("Please log in to view interviews");
        return;
      }

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        includeQuestions: "false",
        includeAnswers: "false",
      });

      if (jobId) params.append("jobPostId", jobId);
      if (filters.status) params.append("status", filters.status);
      if (filters.shortlistStatus)
        params.append("shortlistStatus", filters.shortlistStatus);
      if (filters.interviewerId)
        params.append("interviewerId", filters.interviewerId);
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.append("dateTo", filters.dateTo);

      const response = await fetch(`/api/interviews?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch interviews");
      }

      const data = await response.json();
      setInterviews(data.interviews);
      setPagination((prev) => ({
        ...prev,
        ...data.pagination,
      }));
    } catch (error) {
      console.error("Error fetching interviews:", error);
      message.error("Failed to load interviews");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (value: string) => {
    setFilters((prev) => ({ ...prev, status: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleShortlistStatusChange = (value: string) => {
    setFilters((prev) => ({ ...prev, shortlistStatus: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleDateRangeChange = (dates: any) => {
    setFilters((prev) => ({
      ...prev,
      dateFrom: dates?.[0]?.format("YYYY-MM-DD") || "",
      dateTo: dates?.[1]?.format("YYYY-MM-DD") || "",
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleStartInterview = async (interview: Interview) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/interviews/${interview.id}/start`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to start interview");
      }

      message.success("Interview started successfully!");
      fetchInterviews();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error starting interview:", error);
      message.error("Failed to start interview");
    }
  };

  const handleEditInterview = (interview: Interview) => {
    setSelectedInterview(interview);
    form.setFieldsValue({
      title: interview.title,
      description: interview.description,
      status: interview.status,
      notes: interview.notes,
      scheduledAt: interview.scheduledAt ? dayjs(interview.scheduledAt) : null,
      duration: interview.duration,
      shortlistStatus: interview.shortlistStatus,
    });
    setEditModalVisible(true);
  };

  const handleUpdateInterview = async (values: any) => {
    if (!selectedInterview) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/interviews/${selectedInterview.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...values,
          scheduledAt: values.scheduledAt?.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update interview");
      }

      message.success("Interview updated successfully!");
      setEditModalVisible(false);
      setSelectedInterview(null);
      form.resetFields();
      fetchInterviews();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error updating interview:", error);
      message.error("Failed to update interview");
    }
  };

  const handleDeleteInterview = async (interview: Interview) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/interviews/${interview.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to delete interview");
      }

      message.success("Interview deleted successfully!");
      fetchInterviews();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error deleting interview:", error);
      message.error("Failed to delete interview");
    }
  };

  const handleShortlistUpdate = async (
    interview: Interview,
    status: ShortlistStatus
  ) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/interviews/${interview.id}/shortlist`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ shortlistStatus: status }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update shortlist status");
      }

      message.success(`Candidate ${status.toLowerCase()} successfully!`);
      fetchInterviews();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error updating shortlist status:", error);
      message.error("Failed to update shortlist status");
    }
  };

  const handleExport = async (exportFilters: any, format: "csv" | "json") => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams(exportFilters);
      params.append("format", format);

      const response = await fetch(`/api/interviews/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to export data");
      }

      if (format === "csv") {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `interviews-export-${
          new Date().toISOString().split("T")[0]
        }.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `interviews-export-${
          new Date().toISOString().split("T")[0]
        }.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      message.success(`Data exported successfully as ${format.toUpperCase()}!`);
    } catch (error) {
      console.error("Error exporting data:", error);
      message.error("Failed to export data");
    }
  };

  const getStatusColor = (status: InterviewStatus) => {
    switch (status) {
      case "PENDING":
        return "default";
      case "IN_PROGRESS":
        return "processing";
      case "COMPLETED":
        return "success";
      case "CANCELLED":
        return "error";
      default:
        return "default";
    }
  };

  const getShortlistColor = (status?: ShortlistStatus) => {
    switch (status) {
      case "SHORTLISTED":
        return "green";
      case "REJECTED":
        return "red";
      case "NOT_SHORTLISTED":
        return "default";
      default:
        return "default";
    }
  };

  const columns = [
    {
      title: "Candidate",
      key: "candidate",
      width: 200,
      render: (_: any, record: Interview) => (
        <div>
          <div style={{ fontWeight: "bold", fontSize: "13px" }}>
            {record.resume?.candidateName}
          </div>
          <div style={{ fontSize: "11px", color: "#666" }}>
            {record.resume?.candidateEmail}
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
      title: "Job",
      key: "job",
      width: 180,
      render: (_: any, record: Interview) => (
        <div>
          <div style={{ fontWeight: "bold", fontSize: "12px" }}>
            {record.jobPost?.jobTitle}
          </div>
          <div style={{ fontSize: "11px", color: "#666" }}>
            {record.jobPost?.companyName}
          </div>
        </div>
      ),
    },
    {
      title: "Interviewer",
      key: "interviewer",
      width: 150,
      render: (_: any, record: Interview) => (
        <div style={{ fontSize: "12px" }}>{record.interviewer?.name}</div>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 120,
      render: (_: any, record: Interview) => (
        <Tag color={getStatusColor(record.status)}>
          {record.status.replace("_", " ")}
        </Tag>
      ),
    },
    {
      title: "Score",
      key: "score",
      width: 120,
      render: (_: any, record: Interview) => {
        if (record.status !== "COMPLETED") {
          return <span style={{ color: "#999" }}>-</span>;
        }
        return (
          <div>
            <div style={{ fontWeight: "bold", color: "#1890ff" }}>
              {record.percentage?.toFixed(1)}%
            </div>
            <Progress
              percent={record.percentage || 0}
              size="small"
              showInfo={false}
              strokeColor={
                (record.percentage || 0) >= 80
                  ? "#52c41a"
                  : (record.percentage || 0) >= 60
                  ? "#faad14"
                  : "#ff4d4f"
              }
            />
          </div>
        );
      },
    },
    {
      title: "Shortlist",
      key: "shortlist",
      width: 120,
      render: (_: any, record: Interview) => {
        if (record.status !== "COMPLETED") {
          return <span style={{ color: "#999" }}>-</span>;
        }
        return (
          <Tag color={getShortlistColor(record.shortlistStatus)}>
            {record.shortlistStatus?.replace("_", " ") || "Not Set"}
          </Tag>
        );
      },
    },
    {
      title: "Scheduled",
      key: "scheduled",
      width: 120,
      render: (_: any, record: Interview) => (
        <div style={{ fontSize: "12px" }}>
          {record.scheduledAt
            ? dayjs(record.scheduledAt).format("MMM DD, YYYY")
            : "-"}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      render: (_: any, record: Interview) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => onInterviewSelect?.(record)}
            />
          </Tooltip>

          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditInterview(record)}
            />
          </Tooltip>

          {record.status === "PENDING" && (
            <Tooltip title="Start Interview">
              <Button
                type="text"
                icon={<PlayCircleOutlined />}
                onClick={() => handleStartInterview(record)}
              />
            </Tooltip>
          )}

          {record.status === "COMPLETED" &&
            record.shortlistStatus !== "SHORTLISTED" && (
              <Tooltip title="Shortlist">
                <Button
                  type="text"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleShortlistUpdate(record, ShortlistStatus.SHORTLISTED)}
                />
              </Tooltip>
            )}

          {(record.status === "PENDING" || record.status === "CANCELLED") && (
            <Popconfirm
              title="Are you sure you want to delete this interview?"
              onConfirm={() => handleDeleteInterview(record)}
              okText="Yes"
              cancelText="No"
            >
              <Tooltip title="Delete">
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const stats = {
    total: interviews.length,
    pending: interviews.filter((i) => i.status === "PENDING").length,
    completed: interviews.filter((i) => i.status === "COMPLETED").length,
    shortlisted: interviews.filter((i) => i.shortlistStatus === "SHORTLISTED")
      .length,
    averageScore:
      interviews
        .filter((i) => i.percentage)
        .reduce((sum, i) => sum + (i.percentage || 0), 0) /
        interviews.filter((i) => i.percentage).length || 0,
  };

  return (
    <div>
      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: "16px" }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Interviews"
              value={stats.total}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Completed"
              value={stats.completed}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Shortlisted"
              value={stats.shortlisted}
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <InterviewFilters
        onFiltersChange={(newFilters) => {
          setFilters(newFilters);
          setPagination((prev) => ({ ...prev, page: 1 }));
        }}
        onExport={handleExport}
        onRefresh={() => fetchInterviews()}
        loading={loading}
      />

      {/* Table */}
      <Card>
        <Table
          dataSource={interviews}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} interviews`,
            onChange: (page, pageSize) => {
              setPagination((prev) => ({
                ...prev,
                page,
                limit: pageSize || 10,
              }));
            },
          }}
          scroll={{ x: 1200 }}
          size="small"
        />
      </Card>

      {/* Edit Modal */}
      <Modal
        title="Edit Interview"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setSelectedInterview(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleUpdateInterview}>
          <Form.Item
            name="title"
            label="Interview Title"
            rules={[
              { required: true, message: "Please enter interview title" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={3} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="PENDING">Pending</Option>
                  <Option value="IN_PROGRESS">In Progress</Option>
                  <Option value="COMPLETED">Completed</Option>
                  <Option value="CANCELLED">Cancelled</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="shortlistStatus" label="Shortlist Status">
                <Select allowClear>
                  <Option value="SHORTLISTED">Shortlisted</Option>
                  <Option value="REJECTED">Rejected</Option>
                  <Option value="NOT_SHORTLISTED">Not Shortlisted</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="scheduledAt" label="Scheduled Date & Time">
                <DatePicker showTime style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="duration" label="Duration (minutes)">
                <Input type="number" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Notes">
            <TextArea rows={3} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Update Interview
              </Button>
              <Button
                onClick={() => {
                  setEditModalVisible(false);
                  setSelectedInterview(null);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default InterviewList;
