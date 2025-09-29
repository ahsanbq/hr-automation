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
  Row,
  Col,
  Divider,
  Upload,
} from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";
import AppLayout from "@/components/layout/AppLayout";

export default function ProfilePage() {
  const [form] = Form.useForm();
  const [companyForm] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFileList, setLogoFileList] = useState<UploadFile[]>([]);

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
        companyForm.setFieldsValue({
          companyName: data?.company?.name || "",
          address: data?.company?.address || "",
          country: data?.company?.country || "",
          logo: data?.company?.logo || "",
          linkedinProfile: data?.company?.linkedinProfile || "",
          website: data?.company?.website || "",
        });
        // hydrate logo Upload list if existing
        const logoUrl = data?.company?.logo;
        if (logoUrl) {
          setLogoFileList([
            {
              uid: "-1",
              name: logoUrl.split("/").pop() || "logo.png",
              status: "done",
              url: logoUrl,
            },
          ]);
        } else {
          setLogoFileList([]);
        }
      } catch {}
      setLoading(false);
    })();
  }, [form, companyForm]);

  const onSave = async (values: any) => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        name: values.name,
        company: companyForm.getFieldsValue(),
      };
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
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

  const primaryColor = "#1e3a8a";
  const secondaryColor = "#0ea5a4";
  const wrapperBg = "#f5f7fb";

  // Upload handlers
  const uploadProps = {
    name: "file",
    action: "/api/upload/logo",
    fileList: logoFileList,
    onChange(info: any) {
      setLogoFileList(info.fileList);
      const file = info.file;
      if (file.status === "done") {
        const urlPath = file.response?.url;
        if (urlPath) {
          companyForm.setFieldsValue({ logo: urlPath });
          message.success("Logo uploaded");
        }
      } else if (file.status === "error") {
        message.error("Upload failed");
      }
    },
    onRemove() {
      companyForm.setFieldsValue({ logo: "" });
      setLogoFileList([]);
      message.info("Logo removed");
    },
    maxCount: 1,
    accept: ".png,.jpg,.jpeg,.webp,.svg",
    listType: "picture" as const,
  };

  return (
    <AppLayout
      title="Profile"
      subtitle="Manage your account and company details"
    >
      <div
        style={{
          background: wrapperBg,
          padding: 16,
          borderRadius: 16,
        }}
      >
        <Spin spinning={loading} size="large">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card
                style={{
                  height: "100%",
                  borderRadius: 16,
                  border: `1px solid ${primaryColor}20`,
                }}
                headStyle={{
                  backgroundColor: primaryColor,
                  color: "#fff",
                  borderRadius: "12px 12px 0 0",
                }}
                title={<span style={{ color: "#fff" }}>User Info</span>}
                extra={<span style={{ color: "#e0f2fe" }}>Account</span>}
              >
                <Space align="center" size="large" style={{ marginBottom: 16 }}>
                  <Avatar size={64} style={{ backgroundColor: primaryColor }}>
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
                      {form.getFieldValue("name") || "Your Profile"}
                    </Typography.Title>
                    <Typography.Text type="secondary">
                      {form.getFieldValue("email")}
                    </Typography.Text>
                  </div>
                </Space>
                <Form form={form} layout="vertical" onFinish={onSave}>
                  <Form.Item label="Email" name="email">
                    <Input disabled />
                  </Form.Item>
                  <Form.Item label="Role" name="type">
                    <Input disabled />
                  </Form.Item>
                  <Form.Item
                    label="Name"
                    name="name"
                    rules={[{ required: true }]}
                  >
                    <Input />
                  </Form.Item>
                  <Divider />
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={saving}
                    block
                    style={{
                      height: 44,
                      borderRadius: 10,
                      backgroundColor: primaryColor,
                      border: "none",
                    }}
                  >
                    Save Changes
                  </Button>
                </Form>
              </Card>
            </Col>

            <Col xs={24} md={16}>
              <Card
                style={{
                  borderRadius: 16,
                  border: `1px solid ${secondaryColor}33`,
                }}
                headStyle={{
                  backgroundColor: secondaryColor,
                  color: "#fff",
                  borderRadius: "12px 12px 0 0",
                }}
                title={<span style={{ color: "#fff" }}>Company Details</span>}
              >
                <Form form={companyForm} layout="vertical">
                  <Row gutter={12}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label="Company Name"
                        name="companyName"
                        rules={[{ required: true }]}
                      >
                        <Input placeholder="Company name" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label="Country"
                        name="country"
                        rules={[{ required: true }]}
                      >
                        <Input placeholder="Country" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item
                    label="Address"
                    name="address"
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="Street, City" />
                  </Form.Item>
                  <Row gutter={12}>
                    <Col xs={24} md={12}>
                      <Form.Item label="Upload/Remove Logo">
                        <Upload {...uploadProps}>
                          <Button icon={<UploadOutlined />}>Upload Logo</Button>
                        </Upload>
                        {companyForm.getFieldValue("logo") && (
                          <Button
                            icon={<DeleteOutlined />}
                            danger
                            style={{ marginTop: 8 }}
                            onClick={() => {
                              companyForm.setFieldsValue({ logo: "" });
                              setLogoFileList([]);
                              message.info("Logo removed");
                            }}
                          >
                            Remove Logo
                          </Button>
                        )}
                      </Form.Item>
                      {/* Hidden form field to store path only */}
                      <Form.Item name="logo" style={{ display: "none" }}>
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item label="Website" name="website">
                    <Input placeholder="https://example.com" />
                  </Form.Item>
                  <Form.Item label="LinkedIn Profile" name="linkedinProfile">
                    <Input placeholder="https://linkedin.com/company/..." />
                  </Form.Item>
                </Form>
                <Divider />
                <Space>
                  <Button
                    type="primary"
                    onClick={() => form.submit()}
                    loading={saving}
                    style={{
                      height: 44,
                      borderRadius: 10,
                      backgroundColor: secondaryColor,
                      border: "none",
                    }}
                  >
                    Save All
                  </Button>
                  <Button
                    onClick={() => {
                      form.resetFields();
                      companyForm.resetFields();
                      setLogoFileList([]);
                    }}
                    style={{ borderRadius: 10 }}
                  >
                    Reset
                  </Button>
                </Space>
              </Card>
            </Col>
          </Row>
        </Spin>
      </div>
    </AppLayout>
  );
}
