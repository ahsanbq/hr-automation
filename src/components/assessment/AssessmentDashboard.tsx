import React, { useState, useEffect } from "react";
import {
  Card,
  Tabs,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Statistic,
  Row,
  Col,
  Typography,
  Badge,
  Tooltip,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import {
  AssessmentStage,
  StageType,
  StageStatus,
  AssessmentStats,
} from "@/types/assessment";
import { formatDateTime, formatDate } from "@/utils/dateUtils";

const { TabPane } = Tabs;
const { Option } = Select;
const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

interface AssessmentDashboardProps {
  jobPostId?: string;
  resumeId?: string;
  onStageSelect?: (stage: AssessmentStage) => void;
}

export default function AssessmentDashboard({
  jobPostId,
  resumeId,
  onStageSelect,
}: AssessmentDashboardProps) {
  const [loading, setLoading] = useState(false);
  const [assessmentStages, setAssessmentStages] = useState<AssessmentStage[]>(
    []
  );
  const [stats, setStats] = useState<AssessmentStats | null>(null);
  const [activeTab, setActiveTab] = useState<StageType>(StageType.MCQ);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedStage, setSelectedStage] = useState<AssessmentStage | null>(
    null
  );
  const [filters, setFilters] = useState({
    status: "",
    dateRange: null as [any, any] | null,
  });

  useEffect(() => {
    fetchAssessmentStages();
    fetchStats();
  }, [jobPostId, resumeId, activeTab, filters]);

  const fetchAssessmentStages = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        type: activeTab,
        page: "1",
        limit: "50",
        includeDetails: "true",
      });

      if (jobPostId) params.append("jobPostId", jobPostId);
      if (resumeId) params.append("resumeId", resumeId);
      if (filters.status) params.append("status", filters.status);
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.append("dateFrom", formatDate(filters.dateRange[0].toDate(), "short"));
        params.append("dateTo", formatDate(filters.dateRange[1].toDate(), "short"));
      }

      const response = await fetch(`/api/assessments?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAssessmentStages(data.assessmentStages || []);
      } else {
        message.error("Failed to fetch assessment stages");
      }
    } catch (error) {
      console.error("Error fetching assessment stages:", error);
      message.error("Error fetching assessment stages");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (jobPostId) params.append("jobPostId", jobPostId);

      const response = await fetch(`/api/assessments/stats?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleCreateStage = async (values: any) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/assessments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...values,
          type: activeTab,
          jobPostId,
          resumeId,
        }),
      });

      if (response.ok) {
        message.success(`${activeTab} assessment created successfully`);
        setCreateModalVisible(false);
        fetchAssessmentStages();
        fetchStats();
      } else {
        const error = await response.json();
        message.error(error.error || "Failed to create assessment");
      }
    } catch (error) {
      console.error("Error creating assessment:", error);
      message.error("Error creating assessment");
    }
  };

  const handleUpdateStage = async (stageId: string, updates: any) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/assessments/${stageId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        message.success("Assessment updated successfully");
        fetchAssessmentStages();
        fetchStats();
      } else {
        const error = await response.json();
        message.error(error.error || "Failed to update assessment");
      }
    } catch (error) {
      console.error("Error updating assessment:", error);
      message.error("Error updating assessment");
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/assessments/${stageId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        message.success("Assessment deleted successfully");
        fetchAssessmentStages();
        fetchStats();
      } else {
        const error = await response.json();
        message.error(error.error || "Failed to delete assessment");
      }
    } catch (error) {
      console.error("Error deleting assessment:", error);
      message.error("Error deleting assessment");
    }
  };

  const getStatusTag = (status: StageStatus) => {
    const statusConfig = {
      PENDING: { color: "orange", icon: <ClockCircleOutlined /> },
      IN_PROGRESS: { color: "blue", icon: <PlayCircleOutlined /> },
      COMPLETED: { color: "green", icon: <CheckCircleOutlined /> },
      CANCELLED: { color: "red", icon: <CloseCircleOutlined /> },
      NO_SHOW: { color: "gray", icon: <UserOutlined /> },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    return (
      <Tag color={config.color} icon={config.icon}>
        {status.replace("_", " ")}
      </Tag>
    );
  };

  const getStageTypeTag = (type: StageType) => {
    const typeConfig = {
      MCQ: { color: "blue" },
      AVATAR: { color: "purple" },
      MANUAL: { color: "green" },
    };

    const config = typeConfig[type] || typeConfig.MCQ;
    return <Tag color={config.color}>{type}</Tag>;
  };

  const columns = [
    {
      title: "Candidate",
      key: "candidate",
      render: (record: AssessmentStage) => (
        <div>
          <Text strong>{record.resume?.candidateName}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {record.resume?.candidateEmail}
          </Text>
        </div>
      ),
    },
    {
      title: "Job Post",
      key: "jobPost",
      render: (record: AssessmentStage) => (
        <div>
          <Text strong>{record.jobPost?.jobTitle}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {record.jobPost?.companyName}
          </Text>
        </div>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: StageType) => getStageTypeTag(type),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: StageStatus) => getStatusTag(status),
    },
    {
      title: "Score",
      key: "score",
      render: (record: AssessmentStage) =>
        record.resultScore !== null && record.resultScore !== undefined ? (
          <Badge
            count={`${record.resultScore.toFixed(1)}%`}
            style={{
              backgroundColor:
                record.resultScore >= 70
                  ? "#52c41a"
                  : record.resultScore >= 50
                  ? "#faad14"
                  : "#ff4d4f",
            }}
          />
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "Scheduled",
      key: "scheduled",
      render: (record: AssessmentStage) =>
        record.scheduledAt ? (
          <div>
            <CalendarOutlined style={{ marginRight: 4 }} />
            {formatDateTime(record.scheduledAt).date}
            <br />
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {formatDateTime(record.scheduledAt).time}
            </Text>
          </div>
        ) : (
          <Text type="secondary">Not scheduled</Text>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (record: AssessmentStage) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => onStageSelect?.(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => setSelectedStage(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this assessment?"
            onConfirm={() => handleDeleteStage(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Statistics Cards */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Assessments"
                value={stats.totalStages}
                prefix={<TrophyOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Completed"
                value={stats.completedStages}
                suffix={`/ ${stats.totalStages}`}
                valueStyle={{ color: "#3f8600" }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Average Score"
                value={stats.averageScore}
                suffix="%"
                precision={1}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Completion Rate"
                value={stats.completionRate}
                suffix="%"
                precision={1}
                valueStyle={{ color: "#722ed1" }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Main Dashboard */}
      <Card>
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            Candidate Assessments
          </Title>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              Create Assessment
            </Button>
          </Space>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as StageType)}
        >
          <TabPane
            tab={`MCQ Tests (${stats?.stagesByType.MCQ || 0})`}
            key="MCQ"
          >
            <Table
              columns={columns}
              dataSource={assessmentStages}
              loading={loading}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} items`,
              }}
            />
          </TabPane>
          <TabPane
            tab={`AI Interviews (${stats?.stagesByType.AVATAR || 0})`}
            key="AVATAR"
          >
            <Table
              columns={columns}
              dataSource={assessmentStages}
              loading={loading}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} items`,
              }}
            />
          </TabPane>
          <TabPane
            tab={`Manual Meetings (${stats?.stagesByType.MANUAL || 0})`}
            key="MANUAL"
          >
            <Table
              columns={columns}
              dataSource={assessmentStages}
              loading={loading}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} items`,
              }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Create Assessment Modal */}
      <Modal
        title={`Create ${activeTab} Assessment`}
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form layout="vertical" onFinish={handleCreateStage}>
          <Form.Item
            name="resumeId"
            label="Candidate"
            rules={[{ required: true, message: "Please select a candidate" }]}
          >
            <Select placeholder="Select a candidate">
              {/* This would be populated with actual resume data */}
            </Select>
          </Form.Item>

          <Form.Item name="interviewerId" label="Interviewer">
            <Select placeholder="Select an interviewer">
              {/* This would be populated with actual user data */}
            </Select>
          </Form.Item>

          <Form.Item name="scheduledAt" label="Scheduled Date & Time">
            <DatePicker
              showTime
              style={{ width: "100%" }}
              placeholder="Select date and time"
            />
          </Form.Item>

          <Form.Item name="duration" label="Duration (minutes)">
            <Input type="number" placeholder="Enter duration in minutes" />
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} placeholder="Enter any additional notes" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Create Assessment
              </Button>
              <Button onClick={() => setCreateModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
