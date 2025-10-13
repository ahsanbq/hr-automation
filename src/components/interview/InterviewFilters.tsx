import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Select,
  DatePicker,
  Button,
  Space,
  message,
  Modal,
  Form,
  Input,
  Switch,
  InputNumber,
} from "antd";
import {
  FilterOutlined,
  DownloadOutlined,
  SettingOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { InterviewStatus, ShortlistStatus } from "@/types/interview";

const { Option } = Select;
const { RangePicker } = DatePicker;

interface InterviewFiltersProps {
  onFiltersChange: (filters: any) => void;
  onExport: (filters: any, format: "csv" | "json") => void;
  onRefresh: () => void;
  loading?: boolean;
}

interface User {
  id: number;
  name: string;
  email: string;
  type: string;
}

interface JobPost {
  id: string;
  jobTitle: string;
  companyName: string;
}

const InterviewFilters: React.FC<InterviewFiltersProps> = ({
  onFiltersChange,
  onExport,
  onRefresh,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [configForm] = Form.useForm();
  const [interviewers, setInterviewers] = useState<User[]>([]);
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    fetchInterviewers();
    fetchJobs();
  }, []);

  const fetchInterviewers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const availableInterviewers =
          data.users?.filter(
            (user: User) => user.type === "ADMIN" || user.type === "MANAGER"
          ) || [];
        setInterviewers(availableInterviewers);
      }
    } catch (error) {
      console.error("Error fetching interviewers:", error);
    }
  };

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/jobs", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
  };

  const handleFiltersChange = (changedValues: any, allValues: any) => {
    // Convert date range to strings
    const filters = { ...allValues };
    if (filters.dateRange) {
      filters.dateFrom = filters.dateRange[0]?.format("YYYY-MM-DD");
      filters.dateTo = filters.dateRange[1]?.format("YYYY-MM-DD");
      delete filters.dateRange;
    }

    // Remove undefined values
    Object.keys(filters).forEach((key) => {
      if (filters[key] === undefined || filters[key] === null) {
        delete filters[key];
      }
    });

    onFiltersChange(filters);
  };

  const handleExport = async (format: "csv" | "json") => {
    try {
      setExportLoading(true);
      const values = form.getFieldsValue();

      // Convert date range to strings
      const filters = { ...values };
      if (filters.dateRange) {
        filters.dateFrom = filters.dateRange[0]?.format("YYYY-MM-DD");
        filters.dateTo = filters.dateRange[1]?.format("YYYY-MM-DD");
        delete filters.dateRange;
      }

      // Remove undefined values
      Object.keys(filters).forEach((key) => {
        if (filters[key] === undefined || filters[key] === null) {
          delete filters[key];
        }
      });

      onExport(filters, format);
    } catch (error) {
      console.error("Error exporting data:", error);
      message.error("Failed to export data");
    } finally {
      setExportLoading(false);
    }
  };

  const handleConfigSubmit = async (values: any) => {
    try {
      const token = localStorage.getItem("token");
      // This would be implemented when you have the interview config API
      message.success("Configuration updated successfully!");
      setConfigModalVisible(false);
    } catch (error) {
      console.error("Error updating configuration:", error);
      message.error("Failed to update configuration");
    }
  };

  return (
    <>
      <Card>
        <Form
          form={form}
          layout="vertical"
          onValuesChange={handleFiltersChange}
          initialValues={{
            status: "",
            shortlistStatus: "",
            interviewerId: "",
            jobPostId: "",
            dateRange: null,
          }}
        >
          <Row gutter={[16, 16]} align="bottom">
            <Col span={4}>
              <Form.Item name="status" label="Status">
                <Select placeholder="All Statuses" allowClear>
                  <Option value="PENDING">Pending</Option>
                  <Option value="IN_PROGRESS">In Progress</Option>
                  <Option value="COMPLETED">Completed</Option>
                  <Option value="CANCELLED">Cancelled</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="shortlistStatus" label="Shortlist Status">
                <Select placeholder="All Shortlist Statuses" allowClear>
                  <Option value="SHORTLISTED">Shortlisted</Option>
                  <Option value="REJECTED">Rejected</Option>
                  <Option value="NOT_SHORTLISTED">Not Shortlisted</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="interviewerId" label="Interviewer">
                <Select placeholder="All Interviewers" allowClear showSearch>
                  {interviewers.map((interviewer) => (
                    <Option key={interviewer.id} value={interviewer.id}>
                      {interviewer.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="jobPostId" label="Job Position">
                <Select placeholder="All Jobs" allowClear showSearch>
                  {jobs.map((job) => (
                    <Option key={job.id} value={job.id}>
                      {job.jobTitle}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="dateRange" label="Date Range">
                <RangePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={onRefresh}
                  loading={loading}
                >
                  Refresh
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => handleExport("csv")}
                  loading={exportLoading}
                >
                  Export CSV
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => handleExport("json")}
                  loading={exportLoading}
                >
                  Export JSON
                </Button>
                <Button
                  icon={<SettingOutlined />}
                  onClick={() => setConfigModalVisible(true)}
                >
                  Config
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Configuration Modal */}
      <Modal
        title="Interview Configuration"
        open={configModalVisible}
        onCancel={() => setConfigModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={configForm}
          layout="vertical"
          onFinish={handleConfigSubmit}
          initialValues={{
            autoShortlistEnabled: false,
            shortlistThreshold: 70,
            topNCandidates: 10,
          }}
        >
          <Form.Item
            name="autoShortlistEnabled"
            label="Enable Auto-Shortlisting"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="shortlistThreshold"
            label="Shortlist Threshold (%)"
            tooltip="Minimum percentage score to automatically shortlist candidates"
          >
            <InputNumber min={0} max={100} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="topNCandidates"
            label="Top N Candidates"
            tooltip="Number of top-performing candidates to automatically shortlist"
          >
            <InputNumber min={1} max={50} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Save Configuration
              </Button>
              <Button onClick={() => setConfigModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default InterviewFilters;
