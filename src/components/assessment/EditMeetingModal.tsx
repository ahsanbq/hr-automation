import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  Typography,
  Space,
  message,
  Rate,
  DatePicker,
  TimePicker,
} from "antd";
import {
  EditOutlined,
  SaveOutlined,
  CalendarOutlined,
  FileTextOutlined,
  StarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

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

interface EditMeetingModalProps {
  visible: boolean;
  onClose: () => void;
  meeting: Meeting | null;
  onUpdate: () => void;
}

const EditMeetingModal: React.FC<EditMeetingModalProps> = ({
  visible,
  onClose,
  meeting,
  onUpdate,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (meeting && visible) {
      form.setFieldsValue({
        meetingTime: dayjs(meeting.meetingTime),
        meetingType: meeting.meetingType || "TECHNICAL",
        status: meeting.status,
        meetingSummary: meeting.meetingSummary || "",
        meetingRating: meeting.meetingRating || "",
        notes: meeting.notes || "",
        agenda: meeting.agenda || "",
        meetingLink: meeting.meetingLink || "",
      });
    }
  }, [meeting, visible, form]);

  const handleSave = async (values: any) => {
    if (!meeting) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/meetings/${meeting.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          meetingTime: values.meetingTime.format("YYYY-MM-DD HH:mm:ss"),
          meetingType: values.meetingType,
          status: values.status,
          meetingSummary: values.meetingSummary,
          meetingRating: values.meetingRating,
          notes: values.notes,
          agenda: values.agenda,
          meetingLink: values.meetingLink,
        }),
      });

      if (response.ok) {
        message.success("Meeting updated successfully");
        onUpdate();
        onClose();
      } else {
        const errorData = await response.json().catch(() => ({}));
        message.error(
          `Failed to update meeting: ${errorData.error || response.statusText}`
        );
      }
    } catch (error) {
      console.error("Error updating meeting:", error);
      message.error("Failed to update meeting");
    } finally {
      setLoading(false);
    }
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

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <EditOutlined style={{ color: "#722ed1" }} />
          <span>Edit Meeting</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={null}
      destroyOnClose
    >
      {meeting && (
        <div>
          {/* Candidate Information */}
          <div
            style={{
              background: "#f5f5f5",
              padding: 16,
              borderRadius: 8,
              marginBottom: 24,
            }}
          >
            <Title level={5} style={{ margin: 0, marginBottom: 8 }}>
              Candidate Information
            </Title>
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>Name:</Text> {meeting.Resume.candidateName}
              </Col>
              <Col span={12}>
                <Text strong>Email:</Text> {meeting.Resume.candidateEmail}
              </Col>
            </Row>
            {meeting.Resume.candidatePhone && (
              <Row gutter={16} style={{ marginTop: 8 }}>
                <Col span={12}>
                  <Text strong>Phone:</Text> {meeting.Resume.candidatePhone}
                </Col>
                {meeting.Resume.matchScore && (
                  <Col span={12}>
                    <Text strong>Match Score:</Text> {meeting.Resume.matchScore}
                    %
                  </Col>
                )}
              </Row>
            )}
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            initialValues={{
              meetingType: "TECHNICAL",
              status: "SCHEDULED",
            }}
          >
            <Row gutter={16}>
              <Col span={12}>
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
                    format="YYYY-MM-DD HH:mm"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Meeting Type"
                  name="meetingType"
                  rules={[
                    { required: true, message: "Please select meeting type" },
                  ]}
                >
                  <Select>
                    <Option value="TECHNICAL">Technical Interview</Option>
                    <Option value="BEHAVIORAL">Behavioral Interview</Option>
                    <Option value="SITUATIONAL">Situational Interview</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Status"
                  name="status"
                  rules={[{ required: true, message: "Please select status" }]}
                >
                  <Select>
                    <Option value="SCHEDULED">Scheduled</Option>
                    <Option value="IN_PROGRESS">In Progress</Option>
                    <Option value="COMPLETED">Completed</Option>
                    <Option value="CANCELLED">Cancelled</Option>
                    <Option value="NO_SHOW">No Show</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Meeting Link" name="meetingLink">
                  <Input placeholder="Enter meeting link (e.g., Google Meet, Zoom)" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Meeting Agenda" name="agenda">
              <TextArea
                rows={4}
                placeholder="Enter meeting agenda..."
                style={{ resize: "vertical" }}
              />
            </Form.Item>

            <Form.Item label="Meeting Summary" name="meetingSummary">
              <TextArea
                rows={3}
                placeholder="Enter meeting summary..."
                style={{ resize: "vertical" }}
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Meeting Rating" name="meetingRating">
                  <Select placeholder="Select rating">
                    <Option value="EXCELLENT">Excellent</Option>
                    <Option value="GOOD">Good</Option>
                    <Option value="AVERAGE">Average</Option>
                    <Option value="POOR">Poor</Option>
                    <Option value="NOT_RATED">Not Rated</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Overall Rating (1-5)">
                  <Rate allowHalf />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Notes" name="notes">
              <TextArea
                rows={3}
                placeholder="Enter additional notes..."
                style={{ resize: "vertical" }}
              />
            </Form.Item>

            <div style={{ textAlign: "right", marginTop: 24 }}>
              <Space>
                <Button onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<SaveOutlined />}
                  style={{ backgroundColor: "#722ed1", borderColor: "#722ed1" }}
                >
                  Save Changes
                </Button>
              </Space>
            </div>
          </Form>
        </div>
      )}
    </Modal>
  );
};

export default EditMeetingModal;
