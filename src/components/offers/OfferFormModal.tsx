import { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  DatePicker,
  Button,
  Typography,
  Card,
  Row,
  Col,
  Space,
  message,
} from "antd";
import {
  UserOutlined,
  DollarOutlined,
  CalendarOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { OfferLetterWithDetails } from "@/types/offer";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface OfferFormModalProps {
  visible: boolean;
  resume: any;
  offer: OfferLetterWithDetails | null;
  jobDetails: any;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function OfferFormModal({
  visible,
  resume,
  offer,
  jobDetails,
  onClose,
  onSubmit,
}: OfferFormModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      if (offer) {
        // Edit mode - populate form with existing offer data
        form.setFieldsValue({
          offeredPosition: offer.offeredPosition,
          salary: offer.salary,
          joiningDate: offer.joiningDate ? dayjs(offer.joiningDate) : null,
          notes: offer.notes,
        });
      } else {
        // Create mode - set default values
        form.setFieldsValue({
          offeredPosition: jobDetails?.jobTitle || "",
          salary: jobDetails?.salaryRange || "",
          joiningDate: null,
          notes: "",
        });
      }
    }
  }, [visible, offer, jobDetails, form]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const formData = {
        ...values,
        joiningDate: values.joiningDate
          ? values.joiningDate.toISOString()
          : null,
      };
      await onSubmit(formData);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center" }}>
          <FileTextOutlined style={{ marginRight: 8, color: "#1890ff" }} />
          {offer ? "Edit Offer Letter" : "Generate Offer Letter"}
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      width={700}
      footer={null}
    >
      <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
        {/* Candidate and Job Info */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Row gutter={[16, 8]}>
            <Col span={24}>
              <Title level={5} style={{ margin: 0 }}>
                <UserOutlined style={{ marginRight: 8 }} />
                {resume?.candidateName || "Candidate"}
              </Title>
              <Text type="secondary">
                {resume?.candidateEmail} • {resume?.candidatePhone}
              </Text>
            </Col>
            <Col span={24}>
              <Text strong>Applied for: </Text>
              <Text>{jobDetails?.jobTitle}</Text>
              <br />
              <Text type="secondary">
                {jobDetails?.companyName} • {jobDetails?.location}
              </Text>
            </Col>
          </Row>
        </Card>

        {/* Offer Form */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Offered Position"
                name="offeredPosition"
                rules={[
                  {
                    required: true,
                    message: "Please enter the offered position",
                  },
                ]}
              >
                <Input
                  placeholder="e.g., Senior Software Engineer"
                  prefix={<UserOutlined />}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Salary"
                name="salary"
                rules={[{ required: true, message: "Please enter the salary" }]}
              >
                <Input
                  placeholder="e.g., $80,000 - $100,000"
                  prefix={<DollarOutlined />}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item label="Joining Date" name="joiningDate">
                <DatePicker
                  style={{ width: "100%" }}
                  placeholder="Select joining date"
                  suffixIcon={<CalendarOutlined />}
                  disabledDate={(current) =>
                    current && current < dayjs().startOf("day")
                  }
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Offer Date"
                name="offerDate"
                initialValue={dayjs()}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  disabled
                  suffixIcon={<CalendarOutlined />}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Additional Notes" name="notes">
            <TextArea
              rows={4}
              placeholder="Any additional notes or terms for the offer letter..."
            />
          </Form.Item>

          {/* Form Actions */}
          <div style={{ textAlign: "right", marginTop: 24 }}>
            <Space>
              <Button onClick={handleCancel}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<FileTextOutlined />}
              >
                {offer ? "Update Offer" : "Generate Offer"}
              </Button>
            </Space>
          </div>
        </Form>
      </div>
    </Modal>
  );
}



