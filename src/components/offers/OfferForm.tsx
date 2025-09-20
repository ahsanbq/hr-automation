import { Card, Form, Input, Button } from "antd";

export default function OfferForm() {
  return (
    <Card title="Offer Generator">
      <Form layout="vertical" onFinish={() => {}}>
        <Form.Item
          label="Candidate"
          name="candidate"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item label="Email" name="email" rules={[{ type: "email" }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Content" name="content">
          <Input.TextArea rows={8} placeholder="Offer details..." />
        </Form.Item>
        <Button type="primary" htmlType="submit">
          Generate
        </Button>
      </Form>
    </Card>
  );
}
