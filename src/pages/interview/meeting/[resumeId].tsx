import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AppLayout from "@/components/layout/AppLayout";
import styles from "@/styles/meeting.module.css";
import {
  Card,
  Button,
  Select,
  DatePicker,
  Input,
  Form,
  Row,
  Col,
  Space,
  message,
  Spin,
  Modal,
  Typography,
  Divider,
  Tag,
  Alert,
} from "antd";
import {
  CalendarOutlined,
  UserOutlined,
  StarOutlined,
  MessageOutlined,
  SaveOutlined,
  RobotOutlined,
  EditOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { TextArea } = Input;
const { Title, Paragraph } = Typography;

interface Resume {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  matchScore: number;
  skills: string[];
  experienceYears: number;
  education: string;
  summary: string;
  jobPostId: string;
  meetings?: Meeting[];
}

interface Meeting {
  id: string;
  meetingTime: string;
  meetingLink: string;
  status: string;
  meetingType: string;
  agenda: string;
  notes: string;
}

interface Job {
  id: string;
  jobTitle: string;
  companyName: string;
  location: string;
}

export default function MeetingManagementPage() {
  // Force recompilation - Updated with new color scheme v2.0
  const router = useRouter();
  const { resumeId } = router.query;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingAgenda, setGeneratingAgenda] = useState<string | null>(null); // Track which button is loading
  const [resume, setResume] = useState<Resume | null>(null);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [agendaModalVisible, setAgendaModalVisible] = useState(false);
  const [generatedAgenda, setGeneratedAgenda] = useState("");
  const [editableAgenda, setEditableAgenda] = useState("");
  const [form] = Form.useForm();
  const [notesForm] = Form.useForm();

  useEffect(() => {
    if (resumeId) {
      fetchResumeData();
    }
  }, [resumeId]);

  const fetchResumeData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      // Fetch resume data
      const resumeResponse = await fetch(`/api/resumes/${resumeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (resumeResponse.ok) {
        const resumeData = await resumeResponse.json();
        setResume(resumeData);

        // Fetch job data
        const jobResponse = await fetch(`/api/jobs/${resumeData.jobPostId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (jobResponse.ok) {
          const jobData = await jobResponse.json();
          setJob(jobData);
        }

        // Check if meeting exists
        if (resumeData.meetings && resumeData.meetings.length > 0) {
          const existingMeeting = resumeData.meetings[0];
          setMeeting(existingMeeting);

          // Populate form with existing meeting data
          form.setFieldsValue({
            meetingTime: existingMeeting.meetingTime
              ? dayjs(existingMeeting.meetingTime)
              : null,
            meetingLink: existingMeeting.meetingLink,
            status: existingMeeting.status,
            meetingType: existingMeeting.meetingType,
          });

          notesForm.setFieldsValue({
            notes: existingMeeting.notes || "",
          });

          if (existingMeeting.agenda) {
            setEditableAgenda(existingMeeting.agenda);
          }
        }
      } else {
        message.error("Failed to fetch resume data");
      }
    } catch (error) {
      message.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const generateAgenda = async (interviewType: string) => {
    if (!resume) return;

    setGeneratingAgenda(interviewType); // Set which button is loading
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/generate-interview-agenda", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          resumeId: resume.id,
          interview_type: interviewType,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedAgenda(data.agenda);
        setEditableAgenda(data.agenda);
        setAgendaModalVisible(true);
        message.success("Interview agenda generated successfully!");
      } else {
        const errorData = await response.json();
        message.error(errorData.error || "Failed to generate agenda");
      }
    } catch (error) {
      message.error("Failed to generate agenda");
    } finally {
      setGeneratingAgenda(null); // Clear loading state
    }
  };

  const saveMeeting = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const token = localStorage.getItem("token");
      const meetingData = {
        meetingTime: values.meetingTime?.toISOString(),
        meetingLink: values.meetingLink,
        status: values.status,
        meetingType: values.meetingType,
        agenda: editableAgenda,
        resumeId: resume?.id,
        jobId: resume?.jobPostId,
      };

      let response;
      if (meeting) {
        // Update existing meeting
        response = await fetch(`/api/meetings/${meeting.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ id: meeting.id, ...meetingData }),
        });
      } else {
        // Create new meeting
        response = await fetch("/api/meetings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(meetingData),
        });
      }

      if (response.ok) {
        const savedMeeting = await response.json();
        setMeeting(savedMeeting);
        message.success("Meeting saved successfully!");
        fetchResumeData(); // Refresh data
      } else {
        const errorData = await response.json();
        message.error(errorData.error || "Failed to save meeting");
      }
    } catch (error) {
      message.error("Please fill in all required fields");
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async () => {
    if (!meeting) return;

    try {
      const values = await notesForm.validateFields();
      const token = localStorage.getItem("token");

      const response = await fetch(`/api/meetings/${meeting.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          notes: values.notes,
        }),
      });

      if (response.ok) {
        message.success("Notes saved successfully!");
        fetchResumeData(); // Refresh data
      } else {
        message.error("Failed to save notes");
      }
    } catch (error) {
      message.error("Failed to save notes");
    }
  };

  const saveAgenda = async () => {
    if (!resume) return;

    try {
      setAgendaModalVisible(false);
      setSaving(true);

      const token = localStorage.getItem("token");

      if (meeting) {
        // Update existing meeting with new agenda
        const response = await fetch(`/api/meetings/${meeting.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            agenda: editableAgenda,
          }),
        });

        if (response.ok) {
          message.success("Agenda saved successfully!");
          fetchResumeData(); // Refresh data
        } else {
          message.error("Failed to save agenda");
        }
      } else {
        // Create new meeting with agenda
        const formValues = await form.getFieldsValue();
        const meetingData = {
          meetingTime:
            formValues.meetingTime?.toISOString() || new Date().toISOString(),
          meetingLink: formValues.meetingLink || "",
          status: formValues.status || "SCHEDULED",
          meetingType: formValues.meetingType || "TECHNICAL",
          agenda: editableAgenda,
          resumeId: resume.id,
          jobId: resume.jobPostId,
        };

        const response = await fetch("/api/meetings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(meetingData),
        });

        if (response.ok) {
          const savedMeeting = await response.json();
          setMeeting(savedMeeting);
          message.success("Meeting created with agenda!");
          fetchResumeData(); // Refresh data
        } else {
          const errorData = await response.json();
          message.error(errorData.error || "Failed to create meeting");
        }
      }
    } catch (error) {
      message.error("Failed to save agenda");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Meeting Management" subtitle="">
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Spin size="large" />
        </div>
      </AppLayout>
    );
  }

  if (!resume || !job) {
    return (
      <AppLayout title="Meeting Management" subtitle="">
        <div style={{ textAlign: "center", padding: "50px" }}>
          <p>Resume or job not found</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={`Meeting - ${resume.candidateName}`}
      subtitle={`${job.jobTitle} at ${job.companyName}`}
    >
      {/* Add overall container with padding and background */}
      <div className={styles.meetingContainer}>
        <Row gutter={24}>
          {/* Left Column - Meeting Details */}
          <Col span={10}>
            <div className={styles.leftColumn}>
              <Card title="Meeting " className={styles.meetingCard}>
                <Form form={form} layout="vertical" onFinish={saveMeeting}>
                  <Form.Item
                    label="Meeting Date & Time"
                    name="meetingTime"
                    rules={[
                      { required: true, message: "Please select meeting time" },
                    ]}
                  >
                    <DatePicker
                      showTime
                      style={{ width: "100%" }}
                      placeholder="Select date and time"
                    />
                  </Form.Item>

                  <Form.Item label="Meeting Link" name="meetingLink">
                    <Input placeholder="Zoom/Teams/Meet link" />
                  </Form.Item>

                  <Form.Item
                    label="Status"
                    name="status"
                    initialValue="SCHEDULED"
                  >
                    <Select>
                      <Select.Option value="SCHEDULED">Scheduled</Select.Option>
                      <Select.Option value="IN_PROGRESS">
                        In Progress
                      </Select.Option>
                      <Select.Option value="COMPLETED">Completed</Select.Option>
                      <Select.Option value="CANCELLED">Cancelled</Select.Option>
                      <Select.Option value="NO_SHOW">No Show</Select.Option>
                    </Select>
                  </Form.Item>

                  <Form.Item label="Meeting Type" name="meetingType">
                    <Select placeholder="Select meeting type">
                      <Select.Option value="TECHNICAL">Technical</Select.Option>
                      <Select.Option value="BEHAVIORAL">
                        Behavioral
                      </Select.Option>
                      <Select.Option value="SITUATIONAL">
                        Situational
                      </Select.Option>
                    </Select>
                  </Form.Item>

                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={saving}
                    icon={<SaveOutlined />}
                    block
                  >
                    Save Meeting
                  </Button>
                </Form>
              </Card>

              {/* Candidate Summary */}
              <Card title="Candidate Summary" className={styles.meetingCard}>
                <div style={{ marginBottom: 12 }}>
                  <strong>Match Score:</strong>{" "}
                  <Tag
                    color={
                      resume.matchScore >= 80
                        ? "green"
                        : resume.matchScore >= 60
                        ? "orange"
                        : "red"
                    }
                  >
                    {resume.matchScore}%
                  </Tag>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>Experience:</strong> {resume.experienceYears} years
                </div>
                <div style={{ marginBottom: 12, wordBreak: "break-all" }}>
                  <strong>Email:</strong> {resume.candidateEmail}
                </div>
                <div style={{ marginBottom: 12, wordBreak: "break-all" }}>
                  <strong>Phone:</strong> {resume.candidatePhone}
                </div>
                <div style={{ marginBottom: 12, wordBreak: "break-word" }}>
                  <strong>Education:</strong> {resume.education}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <strong>Skills:</strong>
                  <div className={styles.skillsContainer}>
                    {resume.skills.map((skill) => (
                      <Tag key={skill} className={styles.skillTag}>
                        {skill}
                      </Tag>
                    ))}
                  </div>
                </div>
                {resume.summary && (
                  <div>
                    <strong>Summary:</strong>
                    <Paragraph
                      style={{
                        marginTop: 8,
                        wordBreak: "break-word",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {resume.summary}
                    </Paragraph>
                  </div>
                )}
              </Card>
            </div>
          </Col>

          {/* Center Column - Interview Agenda */}
          <Col span={8}>
            <div className={styles.centerColumn}>
              <Card
                title="Interview Agenda"
                className={styles.meetingCard}
                extra={
                  <Space>
                    <Button
                      type="primary"
                      icon={<RobotOutlined />}
                      onClick={() => generateAgenda("Technical")}
                      loading={generatingAgenda === "Technical"}
                      size="small"
                    >
                      Generate
                    </Button>
                    {editableAgenda && (
                      <Button
                        icon={<EditOutlined />}
                        onClick={() => setAgendaModalVisible(true)}
                        size="small"
                      >
                        Edit
                      </Button>
                    )}
                  </Space>
                }
              >
                {!editableAgenda ? (
                  <div style={{ textAlign: "center", padding: "40px" }}>
                    <RobotOutlined
                      style={{ fontSize: 48, color: "#ccc", marginBottom: 16 }}
                    />
                    <p>No agenda generated yet</p>
                    <Space direction="vertical">
                      <p>Select interview type to generate agenda:</p>
                      <Space wrap>
                        <Button
                          onClick={() => generateAgenda("Technical")}
                          loading={generatingAgenda === "Technical"}
                        >
                          Technical
                        </Button>
                        <Button
                          onClick={() => generateAgenda("Behavioral")}
                          loading={generatingAgenda === "Behavioral"}
                        >
                          Behavioral
                        </Button>
                        <Button
                          onClick={() => generateAgenda("Easy")}
                          loading={generatingAgenda === "Easy"}
                        >
                          Easy
                        </Button>
                        <Button
                          onClick={() => generateAgenda("Medium")}
                          loading={generatingAgenda === "Medium"}
                        >
                          Medium
                        </Button>
                        <Button
                          onClick={() => generateAgenda("Complex")}
                          loading={generatingAgenda === "Complex"}
                        >
                          Complex
                        </Button>
                      </Space>
                    </Space>
                  </div>
                ) : (
                  <div
                    style={{
                      whiteSpace: "pre-wrap",
                      fontSize: 14,
                      lineHeight: 1.6,
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                      maxWidth: "100%",
                    }}
                  >
                    {editableAgenda}
                  </div>
                )}
              </Card>
            </div>
          </Col>

          {/* Right Column - Notes */}
          <Col span={6}>
            <div className={styles.rightColumn}>
              <Card title="Meeting Notes" className={styles.meetingCard}>
                <Form form={notesForm} onFinish={saveNotes}>
                  <Form.Item name="notes">
                    <TextArea
                      rows={15}
                      placeholder="Take notes during the interview..."
                      onBlur={saveNotes}
                    />
                  </Form.Item>

                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    size="small"
                    block
                  >
                    Save Notes
                  </Button>
                </Form>
              </Card>
            </div>
          </Col>
        </Row>
      </div>

      {/* Agenda Editor Modal */}
      <Modal
        title="Edit Interview Agenda"
        open={agendaModalVisible}
        onCancel={() => setAgendaModalVisible(false)}
        onOk={saveAgenda}
        width={800}
        okText="Save Agenda"
        confirmLoading={saving}
      >
        <TextArea
          value={editableAgenda}
          onChange={(e) => setEditableAgenda(e.target.value)}
          rows={20}
          placeholder="Edit the interview agenda..."
        />
      </Modal>
    </AppLayout>
  );
}
