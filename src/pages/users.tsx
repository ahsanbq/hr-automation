import { useEffect, useState } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Typography,
  Space,
  Spin,
} from "antd";
import AppLayout from "@/components/layout/AppLayout";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUsers(data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onCreate = async (values: any) => {
    setCreating(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });
      if (!res.ok)
        throw new Error((await res.json())?.error || "Create failed");
      message.success("User created");
      setOpen(false);
      form.resetFields();
      fetchUsers();
    } catch (e: any) {
      message.error(e.message || "Error");
    } finally {
      setCreating(false);
    }
  };

  return (
    <AppLayout title="Users">
      <Card>
        <Spin spinning={loading} size="large">
          <Space
            style={{
              width: "100%",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <div>
              <Typography.Title level={4} style={{ margin: 0 }}>
                Company Users
              </Typography.Title>
              <Typography.Text type="secondary">
                Manage your organization's members
              </Typography.Text>
            </div>
            <Button type="primary" onClick={() => setOpen(true)}>
              Add User
            </Button>
          </Space>
          <Table
            rowKey="id"
            dataSource={users}
            columns={[
              { title: "ID", dataIndex: "id", width: 80 },
              { title: "Name", dataIndex: "name" },
              { title: "Email", dataIndex: "email" },
              { title: "Role", dataIndex: "type" },
            ]}
          />
        </Spin>
      </Card>

      <Modal
        title="Create User"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={creating}
      >
        <Form layout="vertical" form={form} onFinish={onCreate}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: "email" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, min: 6 }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item name="type" label="Role" rules={[{ required: true }]}>
            <Select
              options={[
                { value: "MANAGER", label: "Manager" },
                { value: "COMPANY_USER", label: "Company User" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  );
}
