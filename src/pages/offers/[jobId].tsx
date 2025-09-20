import AppLayout from "@/components/layout/AppLayout";
import { useRouter } from "next/router";
import {
  Card,
  Row,
  Col,
  Form,
  Input,
  Button,
  Table,
  Tag,
  Space,
  message,
} from "antd";
import { useState } from "react";

export default function JobOffersPage() {
  const router = useRouter();
  const { jobId } = router.query as { jobId?: string };
  const [offers, setOffers] = useState<any[]>([
    {
      id: "1",
      candidate: "Maria",
      email: "maria@example.com",
      status: "DRAFT",
    },
    { id: "2", candidate: "Ibrahim", email: "ib@example.com", status: "SENT" },
  ]);
  const [form] = Form.useForm();

  const columns = [
    { title: "Candidate", dataIndex: "candidate" },
    { title: "Email", dataIndex: "email" },
    {
      title: "Status",
      dataIndex: "status",
      render: (s: string) => (
        <Tag
          color={s === "SENT" ? "green" : s === "DRAFT" ? "default" : "blue"}
        >
          {s}
        </Tag>
      ),
    },
  ];

  const onSend = async () => {
    try {
      const v = await form.validateFields();
      setOffers((prev) => [
        {
          id: String(Date.now()),
          candidate: v.candidate,
          email: v.email,
          status: "SENT",
        },
        ...prev,
      ]);
      form.resetFields();
      message.success("Offer sent");
    } catch {}
  };

  return (
    <AppLayout
      title={`Offers - ${jobId || "..."}`}
      subtitle="Send offers to candidates"
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} md={10}>
          <Card title="Compose Offer">
            <Form form={form} layout="vertical" onFinish={onSend}>
              <Form.Item
                label="Candidate"
                name="candidate"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                label="Email"
                name="email"
                rules={[{ required: true, type: "email" }]}
              >
                <Input />
              </Form.Item>
              <Form.Item label="Content" name="content">
                <Input.TextArea rows={8} placeholder="Offer details..." />
              </Form.Item>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button type="primary" htmlType="submit">
                  Send Offer
                </Button>
              </div>
            </Form>
          </Card>
        </Col>
        <Col xs={24} md={14}>
          <Card title="Offer History">
            <Table rowKey="id" columns={columns as any} dataSource={offers} />
          </Card>
        </Col>
      </Row>
    </AppLayout>
  );
}
