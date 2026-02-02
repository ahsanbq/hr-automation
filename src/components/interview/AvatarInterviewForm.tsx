import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Switch,
  Button,
  Space,
  message,
  Spin,
  Card,
  Divider,
} from "antd";
import { RobotOutlined, SaveOutlined, CloseOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Option } = Select;
const { TextArea } = Input;

interface AvatarInterviewFormProps {
  interviewId?: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface JobPost {
  id: string;
  jobTitle: string;
  companyName: string;
  location: string;
}

interface Resume {
  id: string;
  candidateName: string;
  candidateEmail: string;
  matchScore: number | null;
}

export default function AvatarInterviewForm({
  interviewId,
  onSuccess,
  onCancel,
}: AvatarInterviewFormProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [interviewers, setInterviewers] = useState<any[]>([]);

  useEffect(() => {
    fetchJobPosts();
    fetchInterviewers();
    if (interviewId) {
      fetchInterviewDetails();
    }
  }, [interviewId]);

  useEffect(() => {
    if (selectedJobId) {
      fetchResumesForJob(selectedJobId);
    }
  }, [selectedJobId]);

  const fetchJobPosts = async () => {
    setLoadingJobs(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/jobs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        console.log("Job posts fetched:", data);
        setJobPosts(data.jobs || []);
        if (!data.jobs || data.jobs.length === 0) {
          message.warning(
            "No job positions found. Please create a job post first.",
          );
        }
      } else {
        const error = await response.json();
        console.error("Failed to fetch job posts:", error);
        message.error("Failed to load job positions");
      }
    } catch (error) {
      console.error("Error fetching job posts:", error);
      message.error("Error loading job positions");
    } finally {
      setLoadingJobs(false);
    }
  };

  const fetchResumesForJob = async (jobId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/resumes?jobId=${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        console.log("Resumes fetched for job:", data);
        setResumes(data.resumes || []);
      } else {
        const error = await response.json();
        console.error("Failed to fetch resumes:", error);
      }
    } catch (error) {
      console.error("Error fetching resumes:", error);
    }
  };

  const fetchInterviewers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        console.log("Interviewers fetched:", data);
        setInterviewers(data.users || []);
      } else {
        const error = await response.json();
        console.error("Failed to fetch interviewers:", error);
      }
    } catch (error) {
      console.error("Error fetching interviewers:", error);
    }
  };

  const fetchInterviewDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/assessments/${interviewId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const stage = data.assessmentStage;
        const avatar = stage.avatarAssessment;

        setSelectedJobId(stage.jobPostId);

        form.setFieldsValue({
          jobPostId: stage.jobPostId,
          resumeId: stage.resumeId,
          interviewerId: stage.interviewerId,
          scheduledAt: stage.scheduledAt ? dayjs(stage.scheduledAt) : null,
          duration: stage.duration,
          notes: stage.notes,
          title: avatar.title,
          description: avatar.description,
          avatarType: avatar.avatarType,
          interviewScript: avatar.interviewScript,
          recordingEnabled: avatar.recordingEnabled,
          timeLimit: avatar.timeLimit,
        });
      }
    } catch (error) {
      console.error("Error fetching interview details:", error);
      message.error("Failed to load interview details");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        jobPostId: values.jobPostId,
        resumeId: values.resumeId,
        interviewerId: values.interviewerId || null,
        scheduledAt: values.scheduledAt
          ? values.scheduledAt.toISOString()
          : null,
        duration: values.duration || null,
        notes: values.notes || null,
        title: values.title,
        description: values.description || null,
        avatarType: values.avatarType || null,
        interviewScript: values.interviewScript || null,
        recordingEnabled: values.recordingEnabled ?? true,
        timeLimit: values.timeLimit || null,
        evaluationCriteria: values.evaluationCriteria || null,
      };

      const url = interviewId
        ? `/api/assessments/${interviewId}`
        : "/api/assessments/avatar";
      const method = interviewId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        message.success(
          interviewId
            ? "Interview updated successfully"
            : "Interview created successfully",
        );
        onSuccess();
      } else {
        const error = await response.json();
        message.error(error.error || "Failed to save interview");
      }
    } catch (error) {
      console.error("Error saving interview:", error);
      message.error("Error saving interview");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        recordingEnabled: true,
        avatarType: "professional",
        duration: 30,
        timeLimit: 45,
      }}
    >
      <Card title="Basic Information" size="small" style={{ marginBottom: 16 }}>
        <Form.Item
          label="Job Position"
          name="jobPostId"
          rules={[{ required: true, message: "Please select a job position" }]}
        >
          <Select
            placeholder={
              loadingJobs ? "Loading job positions..." : "Select job position"
            }
            showSearch
            loading={loadingJobs}
            disabled={loadingJobs}
            notFoundContent={
              loadingJobs
                ? "Loading..."
                : "No job positions found. Please create a job post first."
            }
            filterOption={(input, option) => {
              const label = option?.children || option?.label || "";
              return String(label).toLowerCase().includes(input.toLowerCase());
            }}
            onChange={(value) => {
              setSelectedJobId(value);
              form.setFieldsValue({ resumeId: undefined });
            }}
          >
            {jobPosts.map((job) => (
              <Option key={job.id} value={job.id}>
                {job.jobTitle} - {job.companyName}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Candidate"
          name="resumeId"
          rules={[{ required: true, message: "Please select a candidate" }]}
        >
          <Select
            placeholder="Select candidate"
            disabled={!selectedJobId}
            showSearch
            filterOption={(input, option) => {
              const label = option?.children || option?.label || "";
              return String(label).toLowerCase().includes(input.toLowerCase());
            }}
          >
            {resumes.map((resume) => (
              <Option key={resume.id} value={resume.id}>
                {resume.candidateName} ({resume.candidateEmail})
                {resume.matchScore && ` - ${resume.matchScore.toFixed(1)}%`}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="Interviewer" name="interviewerId">
          <Select placeholder="Select interviewer (optional)" allowClear>
            {interviewers.map((interviewer) => (
              <Option key={interviewer.id} value={interviewer.id}>
                {interviewer.name} ({interviewer.email})
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Card>

      <Card
        title="Interview Configuration"
        size="small"
        style={{ marginBottom: 16 }}
      >
        <Form.Item
          label="Interview Title"
          name="title"
          rules={[{ required: true, message: "Please enter interview title" }]}
        >
          <Input placeholder="e.g., Technical AI Interview - Software Engineer" />
        </Form.Item>

        <Form.Item label="Description" name="description">
          <TextArea
            rows={3}
            placeholder="Brief description of the interview purpose and focus areas"
          />
        </Form.Item>

        <Form.Item label="Avatar Type" name="avatarType">
          <Select placeholder="Select avatar type">
            <Option value="professional">Professional</Option>
            <Option value="friendly">Friendly</Option>
            <Option value="technical">Technical Expert</Option>
            <Option value="conversational">Conversational</Option>
          </Select>
        </Form.Item>

        <Form.Item label="Interview Script" name="interviewScript">
          <TextArea
            rows={6}
            placeholder="AI interview script, questions, and conversation flow. The AI will use this as guidance for the interview."
          />
        </Form.Item>
      </Card>

      <Card
        title="Scheduling & Settings"
        size="small"
        style={{ marginBottom: 16 }}
      >
        <Form.Item label="Scheduled Date & Time" name="scheduledAt">
          <DatePicker
            showTime
            format="YYYY-MM-DD HH:mm"
            style={{ width: "100%" }}
            placeholder="Select date and time"
          />
        </Form.Item>

        <Form.Item
          label="Expected Duration (minutes)"
          name="duration"
          tooltip="Expected duration of the interview"
        >
          <InputNumber
            min={5}
            max={180}
            style={{ width: "100%" }}
            placeholder="30"
          />
        </Form.Item>

        <Form.Item
          label="Time Limit (minutes)"
          name="timeLimit"
          tooltip="Maximum time allowed for the interview"
        >
          <InputNumber
            min={5}
            max={240}
            style={{ width: "100%" }}
            placeholder="45"
          />
        </Form.Item>

        <Form.Item
          label="Enable Recording"
          name="recordingEnabled"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item label="Notes" name="notes">
          <TextArea
            rows={3}
            placeholder="Internal notes (not visible to candidate)"
          />
        </Form.Item>
      </Card>

      <Form.Item>
        <Space style={{ width: "100%", justifyContent: "flex-end" }}>
          <Button icon={<CloseOutlined />} onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            icon={<SaveOutlined />}
          >
            {interviewId ? "Update Interview" : "Create Interview"}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}
