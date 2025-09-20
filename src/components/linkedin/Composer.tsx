import { Card, Form, Input, DatePicker, Button, Switch } from "antd";
import dayjs from "dayjs";

export default function Composer() {
  return (
    <Card title="Compose">
      <Form layout="vertical" onFinish={() => {}}>
        <Form.Item
          label="Post Content"
          name="content"
          rules={[{ required: true }]}
        >
          <Input.TextArea rows={6} placeholder="Share your job updates..." />
        </Form.Item>
        <Form.Item
          label="Include Job Details"
          name="includeJob"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
        <Form.Item label="Schedule Time" name="schedule">
          <DatePicker showTime defaultValue={dayjs().add(1, "hour")} />
        </Form.Item>
        <Button type="primary" htmlType="submit">
          Schedule Post
        </Button>
      </Form>
    </Card>
  );
}
