import { useState, useEffect } from "react";
import MultipleNotesComponent from "@/components/MultipleNotesComponent";
import { useRouter } from "next/router";
import AppLayout from "@/components/layout/AppLayout";
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
  Alert
} from "antd";
import {
  CalendarOutlined,
  UserOutlined,
  StarOutlined,
  MessageOutlined,
  SaveOutlined,
  RobotOutlined,
  EditOutlined,
  LoadingOutlined
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
  const router = useRouter();
  const { resumeId } = router.query;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingAgenda, setGeneratingAgenda] = useState(false);
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
        headers: { Authorization: `Bearer ${token}` }
      });

      if (resumeResponse.ok) {
        const resumeData = await resumeResponse.json();
        setResume(resumeData);

        // Fetch job data
        const jobResponse = await fetch(`/api/jobs/${resumeData.jobPost.id}`, {
          headers: { Authorization: `Bearer ${token}` }
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
            meetingTime: existingMeeting.meetingTime ? dayjs(existingMeeting.meetingTime) : null,
            meetingLink: existingMeeting.meetingLink,
            status: existingMeeting.status,
            meetingType: existingMeeting.meetingType
          });

          notesForm.setFieldsValue({
            notes: existingMeeting.notes || ""
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

    setGeneratingAgenda(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/generate-interview-agenda", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          resumeId: resume.id,
          interview_type: interviewType
        })
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
      setGeneratingAgenda(false);
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
        jobId: resume?.jobPost.id
      };

      let response;
      if (meeting) {
        // Update existing meeting
        response = await fetch(`/api/meetings/${meeting.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ id: meeting.id, ...meetingData })
        });
      } else {
        // Create new meeting
        response = await fetch("/api/meetings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(meetingData)
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
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          notes: values.notes
        })
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

  const saveAgenda = () => {
    setAgendaModalVisible(false);
    message.success("Agenda updated! Click 'Save Meeting' to persist changes.");
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
      <Row gutter={24}>
        {/* Left Column - Meeting Details */}
        <Col span={10}>
          <Card title="Meeting Details" style={{ marginBottom: 16 }}>
            <Form
              form={form}
              layout="vertical"
              onFinish={saveMeeting}
            >
              <Form.Item
                label="Meeting Date & Time"
                name="meetingTime"
                rules={[{ required: true, message: "Please select meeting time" }]}
              >
                <DatePicker 
                  showTime 
                  style={{ width: "100%" }}
                  placeholder="Select date and time"
                />
              </Form.Item>

              <Form.Item
                label="Meeting Link"
                name="meetingLink"
              >
                <Input placeholder="Zoom/Teams/Meet link" />
              </Form.Item>

              <Form.Item
                label="Status"
                name="status"
                initialValue="SCHEDULED"
              >
                <Select>
                  <Select.Option value="SCHEDULED">Scheduled</Select.Option>
                  <Select.Option value="IN_PROGRESS">In Progress</Select.Option>
                  <Select.Option value="COMPLETED">Completed</Select.Option>
                  <Select.Option value="CANCELLED">Cancelled</Select.Option>
                  <Select.Option value="NO_SHOW">No Show</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Meeting Type"
                name="meetingType"
              >
                <Select placeholder="Select meeting type">
                  <Select.Option value="TECHNICAL">Technical</Select.Option>
                  <Select.Option value="BEHAVIORAL">Behavioral</Select.Option>
                  <Select.Option value="SITUATIONAL">Situational</Select.Option>
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
          <Card title="Candidate Summary">
            <div style={{ marginBottom: 12 }}>
              <strong>Match Score:</strong>{" "}
              <Tag color={resume.matchScore >= 80 ? "green" : resume.matchScore >= 60 ? "orange" : "red"}>
                {resume.matchScore}%
              </Tag>
            </div>
            <div style={{ marginBottom: 12 }}>
              <strong>Experience:</strong> {resume.experienceYears} years
            </div>
            <div style={{ marginBottom: 12 }}>
              <strong>Email:</strong> {resume.candidateEmail}
            </div>
            <div style={{ marginBottom: 12 }}>
              <strong>Phone:</strong> {resume.candidatePhone}
            </div>
            <div style={{ marginBottom: 12 }}>
              <strong>Education:</strong> {resume.education}
            </div>
            <div style={{ marginBottom: 12 }}>
              <strong>Skills:</strong>{" "}
              {resume.skills.map(skill => (
                <Tag key={skill}>{skill}</Tag>
              ))}
            </div>
            {resume.summary && (
              <div>
                <strong>Summary:</strong>
                <Paragraph style={{ marginTop: 8 }}>
                  {resume.summary}
                </Paragraph>
              </div>
            )}
          </Card>
        </Col>

        {/* Center Column - Interview Agenda */}
        <Col span={8}>
          <Card 
            title="Interview Agenda"
            extra={
              <Space>
                <Button 
                  type="primary" 
                  icon={<RobotOutlined />}
                  onClick={() => generateAgenda("Technical")}
                  loading={generatingAgenda}
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
                <RobotOutlined style={{ fontSize: 48, color: "#ccc", marginBottom: 16 }} />
                <p>No agenda generated yet</p>
                <Space direction="vertical">
                  <p>Select interview type to generate agenda:</p>
                  <Space wrap>
                    <Button onClick={() => generateAgenda("Technical")} loading={generatingAgenda}>
                      Technical
                    </Button>
                    <Button onClick={() => generateAgenda("Behavioral")} loading={generatingAgenda}>
                      Behavioral
                    </Button>
                    <Button onClick={() => generateAgenda("Easy")} loading={generatingAgenda}>
                      Easy
                    </Button>
                    <Button onClick={() => generateAgenda("Medium")} loading={generatingAgenda}>
                      Medium
                    </Button>
                    <Button onClick={() => generateAgenda("Complex")} loading={generatingAgenda}>
                      Complex
                    </Button>
                  </Space>
                </Space>
              </div>
            ) : (
              <div style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.6 }}>
                {editableAgenda}
              </div>
            )}
          </Card>
        </Col>


        {/* Right Column - Multiple Notes */}
        <Col span={6}>
          <MultipleNotesComponent
            meeting={meeting}
            onSaveNotes={fetchResumeData}
          />
        </Col>
      </Row>

      {/* Agenda Editor Modal */}
      <Modal
        title="Edit Interview Agenda"
        open={agendaModalVisible}
        onCancel={() => setAgendaModalVisible(false)}
        onOk={saveAgenda}
        width={800}
        okText="Save Agenda"
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
