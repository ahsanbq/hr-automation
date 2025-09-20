import { useEffect, useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Space,
  Typography,
  Avatar,
  Spin,
} from "antd";
import AppLayout from "@/components/layout/AppLayout";

export default function ProfilePage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        form.setFieldsValue({
          name: data?.name,
          email: data?.email,
          type: data?.type,
        });
      } catch {}
      setLoading(false);
    })();
  }, [form]);

  const onFinish = async (values: any) => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: values.name }),
      });
      if (!res.ok) throw new Error("Update failed");
      const updated = await res.json();
      localStorage.setItem("user", JSON.stringify(updated));
      message.success("Profile updated");
    } catch (e: any) {
      message.error(e.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title="Profile">
      <Card style={{ maxWidth: 720 }}>
        <Spin spinning={loading} size="large">
          <Space align="center" size="large" style={{ marginBottom: 16 }}>
            <Avatar size={56}>
              {(
                form.getFieldValue("name") ||
                form.getFieldValue("email") ||
                "U"
              )
                .slice(0, 1)
                .toUpperCase()}
            </Avatar>
            <div>
              <Typography.Title level={4} style={{ margin: 0 }}>
                Your Profile
              </Typography.Title>
              <Typography.Text type="secondary">
                Manage your personal information
              </Typography.Text>
            </div>
          </Space>
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item label="Email" name="email">
              <Input disabled />
            </Form.Item>
            <Form.Item label="Role" name="type">
              <Input disabled />
            </Form.Item>
            <Form.Item label="Name" name="name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>
              Save Changes
            </Button>
          </Form>
        </Spin>
      </Card>
    </AppLayout>
  );
}
