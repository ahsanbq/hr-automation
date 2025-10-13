import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Card,
  Row,
  Col,
  message,
  Spin,
  Alert,
  Space,
} from "antd";
import {
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { Interview } from "@/types/interview";

const { Option } = Select;
const { TextArea } = Input;

interface JobPost {
  id: string;
  jobTitle: string;
  companyName: string;
  location: string;
  skillsRequired: string;
}

interface Resume {
  id: string;
  candidateName: string;
  candidateEmail?: string;
  candidatePhone?: string;
  matchScore?: number;
  experienceYears?: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  type: string;
}

interface InterviewFormProps {
  jobId?: string;
  resumeId?: string;
  interviewerId?: number;
  onSuccess?: (interview: Interview) => void;
  onCancel?: () => void;
  initialValues?: Partial<Interview>;
  mode?: "create" | "edit";
}

const InterviewForm: React.FC<InterviewFormProps> = ({
  jobId,
  resumeId,
  interviewerId,
  onSuccess,
  onCancel,
  initialValues,
  mode = "create",
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [interviewers, setInterviewers] = useState<User[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>(jobId || "");

  useEffect(() => {
    fetchJobs();
    fetchInterviewers();
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        scheduledAt: initialValues.scheduledAt
          ? dayjs(initialValues.scheduledAt)
          : null,
      });
    }
  }, [initialValues, jobId]);

  useEffect(() => {
    if (selectedJobId) {
      fetchResumes(selectedJobId);
    }
  }, [selectedJobId]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        message.error("Please log in to access jobs");
        return;
      }

      const response = await fetch("/api/jobs", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }

      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      message.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const fetchResumes = async (jobId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/jobs/${jobId}/resumes`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch resumes");
      }

      const data = await response.json();
      setResumes(data.resumes || []);
    } catch (error) {
      console.error("Error fetching resumes:", error);
      message.error("Failed to load resumes");
    }
  };

  const fetchInterviewers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      // Filter for admin and manager users who can conduct interviews
      const availableInterviewers =
        data.users?.filter(
          (user: User) => user.type === "ADMIN" || user.type === "MANAGER"
        ) || [];
      setInterviewers(availableInterviewers);
    } catch (error) {
      console.error("Error fetching interviewers:", error);
      message.error("Failed to load interviewers");
    }
  };

  const handleJobChange = (value: string) => {
    setSelectedJobId(value);
    form.setFieldsValue({ resumeId: undefined });
    setResumes([]);
  };

  const handleSubmit = async (values: any) => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      if (!token) {
        message.error("Please log in to create interview");
        return;
      }

      const payload = {
        title: values.title,
        description: values.description,
        jobPostId: values.jobPostId,
        resumeId: values.resumeId,
        interviewerId: values.interviewerId,
        duration: values.duration,
        scheduledAt: values.scheduledAt?.toISOString(),
      };

      const url =
        mode === "edit" && initialValues?.id
          ? `/api/interviews/${initialValues.id}`
          : "/api/interviews";

      const method = mode === "edit" ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save interview");
      }

      const data = await response.json();
      message.success(
        `Interview ${mode === "edit" ? "updated" : "created"} successfully!`
      );

      if (onSuccess) {
        onSuccess(data.interview);
      }
    } catch (error) {
      console.error("Error saving interview:", error);
      message.error(
        error instanceof Error ? error.message : "Failed to save interview"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Card>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          jobPostId: jobId,
          resumeId: resumeId,
          interviewerId: interviewerId,
          scheduledAt: dayjs().add(1, "day").hour(10).minute(0),
          duration: 60,
        }}
      >
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Form.Item
              name="title"
              label={
                <span>
                  <FileTextOutlined style={{ marginRight: "8px" }} />
                  Interview Title
                </span>
              }
              rules={[
                { required: true, message: "Please enter interview title" },
              ]}
            >
              <Input placeholder="e.g., Technical Interview for Senior Developer" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Form.Item name="description" label="Description">
              <TextArea
                rows={3}
                placeholder="Brief description of the interview process and expectations..."
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Form.Item
              name="jobPostId"
              label={
                <span>
                  <FileTextOutlined style={{ marginRight: "8px" }} />
                  Job Position
                </span>
              }
              rules={[
                { required: true, message: "Please select a job position" },
              ]}
            >
              <Select
                placeholder="Select job position"
                onChange={handleJobChange}
                disabled={!!jobId}
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children as unknown as string)
                    ?.toLowerCase()
                    .includes(input.toLowerCase())
                }
              >
                {jobs.map((job) => (
                  <Option key={job.id} value={job.id}>
                    <div>
                      <div style={{ fontWeight: "bold" }}>{job.jobTitle}</div>
                      <div style={{ fontSize: "12px", color: "#666" }}>
                        {job.companyName} - {job.location}
                      </div>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="resumeId"
              label={
                <span>
                  <UserOutlined style={{ marginRight: "8px" }} />
                  Candidate
                </span>
              }
              rules={[{ required: true, message: "Please select a candidate" }]}
            >
              <Select
                placeholder="Select candidate"
                disabled={!!resumeId}
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children as unknown as string)
                    ?.toLowerCase()
                    .includes(input.toLowerCase())
                }
              >
                {resumes.map((resume) => (
                  <Option key={resume.id} value={resume.id}>
                    <div>
                      <div style={{ fontWeight: "bold" }}>
                        {resume.candidateName}
                      </div>
                      <div style={{ fontSize: "12px", color: "#666" }}>
                        {resume.candidateEmail}
                        {resume.matchScore && ` • Match: ${resume.matchScore}%`}
                      </div>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Form.Item
              name="interviewerId"
              label={
                <span>
                  <UserOutlined style={{ marginRight: "8px" }} />
                  Interviewer
                </span>
              }
              rules={[
                { required: true, message: "Please select an interviewer" },
              ]}
            >
              <Select
                placeholder="Select interviewer"
                disabled={!!interviewerId}
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children as unknown as string)
                    ?.toLowerCase()
                    .includes(input.toLowerCase())
                }
              >
                {interviewers.map((interviewer) => (
                  <Option key={interviewer.id} value={interviewer.id}>
                    <div>
                      <div style={{ fontWeight: "bold" }}>
                        {interviewer.name}
                      </div>
                      <div style={{ fontSize: "12px", color: "#666" }}>
                        {interviewer.email}
                      </div>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="duration"
              label={
                <span>
                  <ClockCircleOutlined style={{ marginRight: "8px" }} />
                  Duration (minutes)
                </span>
              }
              rules={[{ required: true, message: "Please enter duration" }]}
            >
              <Input type="number" placeholder="60" min={15} max={300} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Form.Item
              name="scheduledAt"
              label={
                <span>
                  <CalendarOutlined style={{ marginRight: "8px" }} />
                  Scheduled Date & Time
                </span>
              }
            >
              <DatePicker
                showTime
                format="YYYY-MM-DD HH:mm"
                style={{ width: "100%" }}
                placeholder="Select date and time"
              />
            </Form.Item>
          </Col>
        </Row>

        {selectedJobId && resumes.length === 0 && (
          <Alert
            message="No candidates available"
            description="No resumes found for the selected job position."
            type="warning"
            style={{ marginBottom: "16px" }}
          />
        )}

        <Form.Item>
          <Row justify="end">
            <Col>
              <Space>
                <Button onClick={onCancel}>Cancel</Button>
                <Button type="primary" htmlType="submit" loading={submitting}>
                  {mode === "edit" ? "Update Interview" : "Create Interview"}
                </Button>
              </Space>
            </Col>
          </Row>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default InterviewForm;
