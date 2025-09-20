import { Card, Form, Select, List } from "antd";

export default function QuestionBank({ questions }: { questions: string[] }) {
  return (
    <Card title="Question Bank">
      <Form layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item label="Category">
          <Select
            style={{ width: 160 }}
            options={[{ value: "All" }, { value: "JS" }, { value: "React" }]}
            defaultValue="All"
          />
        </Form.Item>
        <Form.Item label="Difficulty">
          <Select
            style={{ width: 160 }}
            options={[
              { value: "All" },
              { value: "Easy" },
              { value: "Medium" },
              { value: "Hard" },
            ]}
            defaultValue="All"
          />
        </Form.Item>
      </Form>
      <List
        dataSource={questions}
        renderItem={(item) => <List.Item>{item}</List.Item>}
      />
    </Card>
  );
}
