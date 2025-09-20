import {
  Form,
  Input,
  Button,
  Modal,
  Space,
  Row,
  Col,
  Select,
  Card,
  Typography,
  Divider,
  Tag,
  message,
  List,
  Table,
} from "antd";
import { useState } from "react";
import {
  FileTextOutlined,
  BankOutlined,
  EnvironmentOutlined,
  ApartmentOutlined,
  TagsOutlined,
  DollarOutlined,
  FormOutlined,
  LoadingOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

const { TextArea } = Input;

type JobRequirement = {
  title: string;
  company: string;
  location: string;
  job_type: string;
  experience_level: string;
  skills_required: string[];
  responsibilities: string[];
  qualifications: string[];
  salary_range: string;
  benefits: string[];
  description: string;
};

export default function CreateJobForm() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [jobRequirement, setJobRequirement] = useState<JobRequirement | null>(
    null
  );
  const [form] = Form.useForm();

  const onPreview = async () => {
    try {
      const values = await form.validateFields();
      setGenerating(true);

      const requestBody = {
        title: values.title,
        company: values.company,
        department: values.department,
        location: values.location,
        job_type: values.job_type,
        experience_level: values.experience_level || "Entry-level (0–1 year)",
        key_skills: values.key_skills || [],
        budget_range: values.budget_range,
        additional_requirements: values.additional_requirements,
      };

      try {
        const response = await fetch("/api/generate-job-description", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to generate job description");
        }

        if (data.success && data.job_requirement) {
          setJobRequirement(data.job_requirement);
          setOpen(true);
          message.success(
            "Job description generated! Edit and save when ready."
          );
        } else {
          throw new Error("Invalid response format");
        }
      } catch (error: any) {
        console.error("API Error:", error);
        message.error(
          error.message ||
            "Failed to generate job description. Please try again."
        );
      }
    } catch (validationError) {
      message.error("Please fill in all required fields");
    } finally {
      setGenerating(false);
    }
  };

  const onSave = async () => {
    setSaving(true);
    try {
      if (!jobRequirement) {
        message.error("No job requirement to save");
        return;
      }

      const token = localStorage.getItem("token");
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ jobRequirement }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save job");
      }

      message.success("Job post saved successfully!");
      window.location.reload();
      setOpen(false);
      form.resetFields();
      setJobRequirement(null);
    } catch (error: any) {
      console.error("Save error:", error);
      message.error(error.message || "Failed to save job post");
    } finally {
      setSaving(false);
    }
  };

  const updateJobRequirement = (field: keyof JobRequirement, value: any) => {
    if (jobRequirement) {
      setJobRequirement({ ...jobRequirement, [field]: value });
    }
  };

  const addListItem = (
    field: "responsibilities" | "qualifications" | "benefits"
  ) => {
    if (jobRequirement) {
      const newList = [...jobRequirement[field], ""];
      updateJobRequirement(field, newList);
    }
  };

  const updateListItem = (
    field: "responsibilities" | "qualifications" | "benefits",
    index: number,
    value: string
  ) => {
    if (jobRequirement) {
      const newList = [...jobRequirement[field]];
      newList[index] = value;
      updateJobRequirement(field, newList);
    }
  };

  const removeListItem = (
    field: "responsibilities" | "qualifications" | "benefits",
    index: number
  ) => {
    if (jobRequirement) {
      const newList = jobRequirement[field].filter((_, i) => i !== index);
      updateJobRequirement(field, newList);
    }
  };

  const addSkill = () => {
    if (jobRequirement) {
      const newSkills = [...jobRequirement.skills_required, ""];
      updateJobRequirement("skills_required", newSkills);
    }
  };

  const updateSkill = (index: number, value: string) => {
    if (jobRequirement) {
      const newSkills = [...jobRequirement.skills_required];
      newSkills[index] = value;
      updateJobRequirement("skills_required", newSkills);
    }
  };

  const removeSkill = (index: number) => {
    if (jobRequirement) {
      const newSkills = jobRequirement.skills_required.filter(
        (_, i) => i !== index
      );
      updateJobRequirement("skills_required", newSkills);
    }
  };

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <Typography.Text style={{ color: "#1677ff", fontWeight: 700 }}>
      {children}
    </Typography.Text>
  );

  const jdData = jobRequirement
    ? [
        {
          key: "title",
          field: "Title",
          value: (
            <Input
              value={jobRequirement.title}
              onChange={(e) => updateJobRequirement("title", e.target.value)}
              placeholder="Enter job title"
              size="small"
            />
          ),
        },
        {
          key: "company",
          field: "Company",
          value: (
            <Input
              value={jobRequirement.company}
              onChange={(e) => updateJobRequirement("company", e.target.value)}
              placeholder="Enter company name"
              size="small"
            />
          ),
        },
        {
          key: "location",
          field: "Location",
          value: (
            <Input
              value={jobRequirement.location}
              onChange={(e) => updateJobRequirement("location", e.target.value)}
              placeholder="Enter location"
              size="small"
            />
          ),
        },
        {
          key: "job_type",
          field: "Job Type",
          value: (
            <Input
              value={jobRequirement.job_type}
              onChange={(e) => updateJobRequirement("job_type", e.target.value)}
              placeholder="Enter job type"
              size="small"
            />
          ),
        },
        {
          key: "experience_level",
          field: "Experience Level",
          value: (
            <Input
              value={jobRequirement.experience_level}
              onChange={(e) =>
                updateJobRequirement("experience_level", e.target.value)
              }
              placeholder="Enter experience level"
              size="small"
            />
          ),
        },
        {
          key: "salary_range",
          field: "Salary Range",
          value: (
            <Input
              value={jobRequirement.salary_range}
              onChange={(e) =>
                updateJobRequirement("salary_range", e.target.value)
              }
              placeholder="Enter salary range"
              size="small"
            />
          ),
        },
        {
          key: "skills_required",
          field: "Skills Required",
          value: (
            <div>
              {jobRequirement.skills_required.map((skill, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Input
                    value={skill}
                    onChange={(e) => updateSkill(index, e.target.value)}
                    placeholder="Enter skill"
                    style={{ flex: 1 }}
                    size="small"
                  />
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => removeSkill(index)}
                  />
                </div>
              ))}
              <Button
                type="dashed"
                size="small"
                icon={<PlusOutlined />}
                onClick={addSkill}
                style={{ width: "100%", marginTop: 8 }}
              >
                Add Skill
              </Button>
            </div>
          ),
        },
        {
          key: "description",
          field: "Job Description",
          value: (
            <TextArea
              value={jobRequirement.description}
              onChange={(e) =>
                updateJobRequirement("description", e.target.value)
              }
              rows={4}
              placeholder="Job description..."
              style={{ fontSize: 13 }}
            />
          ),
        },
        {
          key: "responsibilities",
          field: "Key Responsibilities",
          value: (
            <div>
              {jobRequirement.responsibilities.map((responsibility, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      marginTop: 6,
                      color: "#1677ff",
                      fontSize: 12,
                      fontWeight: 600,
                      minWidth: 20,
                    }}
                  >
                    {index + 1}.
                  </div>
                  <TextArea
                    value={responsibility}
                    onChange={(e) =>
                      updateListItem("responsibilities", index, e.target.value)
                    }
                    placeholder="Enter responsibility"
                    rows={2}
                    style={{ flex: 1, fontSize: 13 }}
                    size="small"
                  />
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => removeListItem("responsibilities", index)}
                    style={{ marginTop: 4 }}
                  />
                </div>
              ))}
              <Button
                type="dashed"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => addListItem("responsibilities")}
                style={{ width: "100%", marginTop: 8 }}
              >
                Add Responsibility
              </Button>
            </div>
          ),
        },
        {
          key: "qualifications",
          field: "Qualifications",
          value: (
            <div>
              {jobRequirement.qualifications.map((qualification, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      marginTop: 6,
                      color: "#1677ff",
                      fontSize: 12,
                      fontWeight: 600,
                      minWidth: 20,
                    }}
                  >
                    {index + 1}.
                  </div>
                  <TextArea
                    value={qualification}
                    onChange={(e) =>
                      updateListItem("qualifications", index, e.target.value)
                    }
                    placeholder="Enter qualification"
                    rows={2}
                    style={{ flex: 1, fontSize: 13 }}
                    size="small"
                  />
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => removeListItem("qualifications", index)}
                    style={{ marginTop: 4 }}
                  />
                </div>
              ))}
              <Button
                type="dashed"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => addListItem("qualifications")}
                style={{ width: "100%", marginTop: 8 }}
              >
                Add Qualification
              </Button>
            </div>
          ),
        },
        {
          key: "benefits",
          field: "Benefits",
          value: (
            <div>
              {jobRequirement.benefits.map((benefit, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      marginTop: 6,
                      color: "#1677ff",
                      fontSize: 12,
                      fontWeight: 600,
                      minWidth: 20,
                    }}
                  >
                    {index + 1}.
                  </div>
                  <TextArea
                    value={benefit}
                    onChange={(e) =>
                      updateListItem("benefits", index, e.target.value)
                    }
                    placeholder="Enter benefit"
                    rows={2}
                    style={{ flex: 1, fontSize: 13 }}
                    size="small"
                  />
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => removeListItem("benefits", index)}
                    style={{ marginTop: 4 }}
                  />
                </div>
              ))}
              <Button
                type="dashed"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => addListItem("benefits")}
                style={{ width: "100%", marginTop: 8 }}
              >
                Add Benefit
              </Button>
            </div>
          ),
        },
      ]
    : [];

  const columns = [
    {
      title: "Field",
      dataIndex: "field",
      key: "field",
      width: 200,
      render: (text: string) => (
        <Typography.Text strong>{text}</Typography.Text>
      ),
    },
    { title: "Value", dataIndex: "value", key: "value" },
  ];

  return (
    <Card style={{ borderRadius: 10 }} bodyStyle={{ padding: 16 }}>
      <Form form={form} layout="vertical" initialValues={{}}>
        <Row gutter={[16, 0]}>
          <Col xs={24} md={12}>
            <SectionTitle>Role Details</SectionTitle>
            <Divider style={{ margin: "8px 0 12px" }} />
            <Form.Item label="Title" name="title" rules={[{ required: true }]}>
              <Input
                prefix={<FileTextOutlined />}
                placeholder="e.g., Junior Software Developer"
              />
            </Form.Item>
            <Form.Item
              label="Company"
              name="company"
              rules={[{ required: true }]}
            >
              <Input
                prefix={<BankOutlined />}
                placeholder="e.g., TechNova Solutions"
              />
            </Form.Item>
            <Form.Item
              label="Location"
              name="location"
              rules={[{ required: true }]}
            >
              <Input
                prefix={<EnvironmentOutlined />}
                placeholder="City, Country"
              />
            </Form.Item>
            <Form.Item
              label="Job Type"
              name="job_type"
              rules={[{ required: true }]}
            >
              <Select
                placeholder="Select job type"
                options={[
                  "Full-time",
                  "Part-time",
                  "Contract",
                  "Internship",
                ].map((v) => ({ value: v, label: v }))}
              />
            </Form.Item>
            <Form.Item label="Department" name="department">
              <Input
                prefix={<ApartmentOutlined />}
                placeholder="e.g., Engineering"
              />
            </Form.Item>
            <Form.Item label="Experience Level" name="experience_level">
              <Select
                placeholder="Select experience level"
                options={[
                  "Entry-level (0–1 year)",
                  "Mid-level (2–5 years)",
                  "Senior-level (5+ years)",
                  "Executive-level (10+ years)",
                ].map((v) => ({ value: v, label: v }))}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <SectionTitle>Skills & Compensation</SectionTitle>
            <Divider style={{ margin: "8px 0 12px" }} />
            <Form.Item
              label="Key Skills"
              name="key_skills"
              rules={[
                { required: true, message: "Please add at least one skill" },
              ]}
            >
              <Select
                mode="tags"
                placeholder="Add skills (press Enter)"
                tokenSeparators={[","]}
                suffixIcon={<TagsOutlined />}
              />
            </Form.Item>
            <Form.Item label="Budget Range" name="budget_range">
              <Input
                prefix={<DollarOutlined />}
                placeholder="e.g., BDT 25,000 – 35,000 per month"
              />
            </Form.Item>
            <Form.Item
              label="Additional Requirements"
              name="additional_requirements"
            >
              <Input.TextArea
                rows={4}
                placeholder="Any additional requirements"
                allowClear
              />
            </Form.Item>
          </Col>
        </Row>
        <Divider style={{ margin: "16px 0 12px" }} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button
            icon={generating ? <LoadingOutlined /> : <FormOutlined />}
            type="primary"
            onClick={onPreview}
            loading={generating}
            size="large"
          >
            {generating ? "Generating..." : "Generate Job Description with AI"}
          </Button>
        </div>
      </Form>

      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <EditOutlined style={{ color: "#1677ff" }} />
            <span>Edit Job Description</span>
          </div>
        }
        open={open}
        onCancel={() => setOpen(false)}
        footer={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Make your changes and save when ready
            </Typography.Text>
            <Space>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="primary" loading={saving} onClick={onSave}>
                Save Job Post
              </Button>
            </Space>
          </div>
        }
        width={900}
        style={{ top: 20 }}
      >
        <Table
          size="small"
          bordered
          rowKey="key"
          columns={columns}
          dataSource={jdData}
          pagination={false}
          scroll={{ y: 600 }}
        />
      </Modal>
    </Card>
  );
}
