import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  message,
  Form,
  Select,
  InputNumber,
  Typography,
  Tooltip,
  Empty,
  Spin,
  Statistic,
  Row,
  Col,
  Input,
} from "antd";
import {
  PlusOutlined,
  LinkOutlined,
  CopyOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StopOutlined,
  ReloadOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import AppLayout from "@/components/layout/AppLayout";

const { Title, Text, Paragraph } = Typography;

interface JobOption {
  id: string;
  jobTitle: string;
  companyName: string;
}

interface LinkRecord {
  id: string;
  jobId: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  maxCvLimit: number;
  currentCvCount: number;
  status: "ACTIVE" | "CLOSED" | "EXPIRED";
  jobPost: {
    id: string;
    jobTitle: string;
    companyName: string;
    location: string;
    jobType: string;
    experienceLevel: string;
    isActive: boolean;
  };
}

export default function JobLinksPage() {
  const [links, setLinks] = useState<LinkRecord[]>([]);
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/job-links", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLinks(data.links || []);
      }
    } catch {
      message.error("Failed to fetch links");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchJobs = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/jobs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(
          (data.jobs || []).map((j: any) => ({
            id: j.id,
            jobTitle: j.jobTitle,
            companyName: j.companyName,
          }))
        );
      }
    } catch {
      // Ignore — jobs dropdown will be empty
    }
  }, []);

  useEffect(() => {
    fetchLinks();
    fetchJobs();
  }, [fetchLinks, fetchJobs]);

  const handleCreate = async (values: any) => {
    setCreating(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/job-links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      if (res.ok) {
        const data = await res.json();
        message.success("Application link created!");
        // Show the generated URL
        Modal.info({
          title: "Application Link Generated",
          width: 600,
          content: (
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">
                Share this link with candidates to collect applications:
              </Text>
              <Input.TextArea
                value={data.publicUrl}
                readOnly
                autoSize={{ minRows: 2 }}
                style={{
                  marginTop: 8,
                  fontFamily: "monospace",
                  fontSize: 13,
                }}
              />
              <Button
                type="primary"
                icon={<CopyOutlined />}
                onClick={() => {
                  navigator.clipboard.writeText(data.publicUrl);
                  message.success("Link copied to clipboard!");
                }}
                style={{ marginTop: 12 }}
                block
              >
                Copy Link
              </Button>
            </div>
          ),
        });
        setModalVisible(false);
        form.resetFields();
        fetchLinks();
      } else {
        const err = await res.json();
        message.error(err.error || "Failed to create link");
      }
    } catch {
      message.error("Failed to create link");
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    Modal.confirm({
      title: "Deactivate Link",
      icon: <ExclamationCircleOutlined />,
      content: "This will permanently close this application link. Continue?",
      okText: "Deactivate",
      okType: "danger",
      onOk: async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`/api/job-links/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            message.success("Link deactivated");
            fetchLinks();
          } else {
            message.error("Failed to deactivate link");
          }
        } catch {
          message.error("Failed to deactivate link");
        }
      },
    });
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/apply/${token}`;
    navigator.clipboard.writeText(url);
    message.success("Link copied to clipboard!");
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Tag icon={<CheckCircleOutlined />} color="success">
            Active
          </Tag>
        );
      case "CLOSED":
        return (
          <Tag icon={<StopOutlined />} color="error">
            Closed
          </Tag>
        );
      case "EXPIRED":
        return (
          <Tag icon={<ClockCircleOutlined />} color="default">
            Expired
          </Tag>
        );
      default:
        return <Tag>{status}</Tag>;
    }
  };

  // Stats
  const activeLinks = links.filter((l) => l.status === "ACTIVE").length;
  const totalApplications = links.reduce(
    (sum, l) => sum + l.currentCvCount,
    0
  );

  const columns = [
    {
      title: "Job Position",
      key: "job",
      render: (_: any, record: LinkRecord) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>
            {record.jobPost.jobTitle}
          </div>
          <div style={{ fontSize: 12, color: "#888" }}>
            {record.jobPost.companyName} • {record.jobPost.location}
          </div>
        </div>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 120,
      render: (_: any, record: LinkRecord) => getStatusTag(record.status),
    },
    {
      title: "Applications",
      key: "cvCount",
      width: 140,
      render: (_: any, record: LinkRecord) => (
        <div>
          <Text strong>
            {record.currentCvCount} / {record.maxCvLimit}
          </Text>
          <div
            style={{
              background: "#f0f0f0",
              borderRadius: 4,
              height: 6,
              marginTop: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                background:
                  record.currentCvCount >= record.maxCvLimit
                    ? "#ff4d4f"
                    : "#52c41a",
                height: "100%",
                width: `${Math.min(
                  (record.currentCvCount / record.maxCvLimit) * 100,
                  100
                )}%`,
                borderRadius: 4,
                transition: "width 0.3s",
              }}
            />
          </div>
        </div>
      ),
    },
    {
      title: "Expires",
      key: "expiresAt",
      width: 150,
      render: (_: any, record: LinkRecord) => {
        const isExpired = dayjs(record.expiresAt).isBefore(dayjs());
        return (
          <div>
            <div style={{ fontWeight: 500, color: isExpired ? "#ff4d4f" : undefined }}>
              {dayjs(record.expiresAt).format("MMM DD, YYYY")}
            </div>
            <div style={{ fontSize: 11, color: "#888" }}>
              {isExpired
                ? "Expired"
                : `${dayjs(record.expiresAt).diff(dayjs(), "day")} days left`}
            </div>
          </div>
        );
      },
    },
    {
      title: "Created",
      key: "createdAt",
      width: 130,
      render: (_: any, record: LinkRecord) =>
        dayjs(record.createdAt).format("MMM DD, YYYY"),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_: any, record: LinkRecord) => (
        <Space>
          <Tooltip title="Copy Link">
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={() => copyLink(record.token)}
              disabled={record.status !== "ACTIVE"}
            />
          </Tooltip>
          <Tooltip title="Deactivate">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeactivate(record.id)}
              disabled={record.status !== "ACTIVE"}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <AppLayout
      title="Job Application Links"
      subtitle="Generate secure public links for candidates to apply"
    >
      {/* Stats Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={8}>
          <Card>
            <Statistic
              title="Total Links"
              value={links.length}
              prefix={<LinkOutlined style={{ color: "#722ed1" }} />}
            />
          </Card>
        </Col>
        <Col xs={8}>
          <Card>
            <Statistic
              title="Active Links"
              value={activeLinks}
              prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
            />
          </Card>
        </Col>
        <Col xs={8}>
          <Card>
            <Statistic
              title="Total Applications"
              value={totalApplications}
              prefix={<GlobalOutlined style={{ color: "#1890ff" }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Table Card */}
      <Card
        title={
          <Space>
            <LinkOutlined style={{ color: "#722ed1" }} />
            <span>Application Links</span>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchLinks}>
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalVisible(true)}
              style={{ backgroundColor: "#722ed1", borderColor: "#722ed1" }}
            >
              Generate Link
            </Button>
          </Space>
        }
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <Spin size="large" />
            <div style={{ marginTop: 16, color: "#722ed1", fontWeight: 500 }}>
              Loading application links...
            </div>
          </div>
        ) : links.length === 0 ? (
          <Empty
            description="No application links created yet"
            style={{ padding: 60 }}
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalVisible(true)}
              style={{ backgroundColor: "#722ed1", borderColor: "#722ed1" }}
            >
              Generate Your First Link
            </Button>
          </Empty>
        ) : (
          <Table
            columns={columns}
            dataSource={links}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            size="middle"
          />
        )}
      </Card>

      {/* Create Modal */}
      <Modal
        title={
          <Space>
            <PlusOutlined style={{ color: "#722ed1" }} />
            <span>Generate Application Link</span>
          </Space>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={520}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
          initialValues={{ validityDays: 30, maxCvLimit: 50 }}
        >
          <Form.Item
            name="jobId"
            label="Select Job Position"
            rules={[
              { required: true, message: "Please select a job position" },
            ]}
          >
            <Select
              placeholder="Choose a job..."
              showSearch
              optionFilterProp="children"
              size="large"
            >
              {jobs.map((j) => (
                <Select.Option key={j.id} value={j.id}>
                  {j.jobTitle} — {j.companyName}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="validityDays"
                label="Validity (Days)"
                rules={[{ required: true, message: "Required" }]}
              >
                <InputNumber
                  min={1}
                  max={365}
                  size="large"
                  style={{ width: "100%" }}
                  placeholder="e.g. 30"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="maxCvLimit"
                label="Max CV Uploads"
                rules={[{ required: true, message: "Required" }]}
              >
                <InputNumber
                  min={1}
                  max={10000}
                  size="large"
                  style={{ width: "100%" }}
                  placeholder="e.g. 50"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 8, marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={creating}
              block
              size="large"
              icon={<LinkOutlined />}
              style={{ backgroundColor: "#722ed1", borderColor: "#722ed1" }}
            >
              Generate Secure Link
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  );
}

