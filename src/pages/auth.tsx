import { useState } from "react";
import { Tabs, Form, Input, Button, Typography, message, Card } from "antd";
import { useRouter } from "next/router";

export default function AuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any, endpoint: "login" | "auth/signup") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      localStorage.setItem("token", data.token);
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
      message.success("Welcome!");
      router.replace("/analytics");
    } catch (e: any) {
      message.error(e.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        padding: 16,
      }}
    >
      <Card style={{ maxWidth: 600, width: "100%" }}>
        <Typography.Title level={3} style={{ textAlign: "center" }}>
          HR Automation
        </Typography.Title>
        <Typography.Paragraph style={{ textAlign: "center" }}>
          Sign in to continue
        </Typography.Paragraph>
        <Tabs
          items={[
            {
              key: "signin",
              label: "Sign In",
              children: (
                <Form layout="vertical" onFinish={(v) => onFinish(v, "login")}>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[{ required: true, type: "email" }]}
                  >
                    <Input placeholder="you@example.com" />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    label="Password"
                    rules={[{ required: true }]}
                  >
                    <Input.Password placeholder="••••••••" />
                  </Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    loading={loading}
                  >
                    Sign In
                  </Button>
                </Form>
              ),
            },
            {
              key: "signup",
              label: "Company Sign Up",
              children: (
                <Form
                  layout="vertical"
                  onFinish={(v) => onFinish(v, "auth/signup")}
                >
                  <Form.Item
                    name="companyName"
                    label="Company Name"
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="Your company name" />
                  </Form.Item>
                  <Form.Item
                    name="companyAddress"
                    label="Company Address"
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="Street, City" />
                  </Form.Item>
                  <Form.Item
                    name="companyCountry"
                    label="Country"
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="Country" />
                  </Form.Item>
                  <Form.Item name="companyWebsite" label="Website">
                    <Input placeholder="https://example.com" />
                  </Form.Item>
                  <Form.Item
                    name="adminName"
                    label="Admin Name"
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="Admin full name" />
                  </Form.Item>
                  <Form.Item
                    name="adminEmail"
                    label="Admin Email"
                    rules={[{ required: true, type: "email" }]}
                  >
                    <Input placeholder="admin@example.com" />
                  </Form.Item>
                  <Form.Item
                    name="adminPassword"
                    label="Admin Password"
                    rules={[{ required: true, min: 6 }]}
                  >
                    <Input.Password placeholder="At least 6 characters" />
                  </Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    loading={loading}
                  >
                    Create Company
                  </Button>
                </Form>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
