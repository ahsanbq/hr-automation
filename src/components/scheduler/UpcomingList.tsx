import { Card, List } from "antd";

export default function UpcomingList() {
  return (
    <Card title="Upcoming Interviews">
      <List
        dataSource={[
          "Alex - Frontend - Today 3:00 PM",
          "Sam - Backend - Tomorrow 11:00 AM",
        ]}
        renderItem={(item) => <List.Item>{item}</List.Item>}
      />
    </Card>
  );
}
