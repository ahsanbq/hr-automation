import { Card, Form, Input, Button, Select } from "antd";

export default function Generator({ onAdd }: { onAdd: (q: string) => void }) {
  return (
    <Card title="AI Question Generator (mock)">
      <Form
        layout="vertical"
        onFinish={(v) =>
          onAdd(
            `Q for ${v.role || "General"} (${
              v.difficulty || "Medium"
            }): Describe a challenging problem you solved.`
          )
        }
      >
        <Form.Item label="Role" name="role">
          <Input placeholder="e.g., Frontend Engineer" />
        </Form.Item>
        <Form.Item label="Difficulty" name="difficulty">
          <Select
            options={[
              { value: "Easy" },
              { value: "Medium" },
              { value: "Hard" },
            ]}
          />
        </Form.Item>
        <Button type="primary" htmlType="submit">
          Generate
        </Button>
      </Form>
    </Card>
  );
}
