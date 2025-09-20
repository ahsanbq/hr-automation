import {
  Card,
  Form,
  Input,
  DatePicker,
  TimePicker,
  Select,
  Button,
} from "antd";

export default function ScheduleForm() {
  return (
    <Card title="Schedule Interview">
      <Form layout="vertical" onFinish={() => {}}>
        <Form.Item
          label="Candidate"
          name="candidate"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item label="Role" name="role">
          <Input />
        </Form.Item>
        <Form.Item label="Date" name="date">
          <DatePicker />
        </Form.Item>
        <Form.Item label="Time" name="time">
          <TimePicker format="HH:mm" />
        </Form.Item>
        <Form.Item label="Attendees" name="attendees">
          <Select mode="tags" placeholder="Enter emails" />
        </Form.Item>
        <Button type="primary" htmlType="submit">
          Schedule
        </Button>
      </Form>
    </Card>
  );
}
