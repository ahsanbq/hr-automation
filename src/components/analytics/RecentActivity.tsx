import { Card, List } from "antd";

export default function RecentActivity() {
  return (
    <Card title="Recent Activity" size="small">
      <List
        size="small"
        dataSource={[
          "New job posted: Senior FE Engineer",
          "Interview scheduled with Alex",
          "Offer sent to Maria",
        ]}
        renderItem={(item) => <List.Item>{item}</List.Item>}
      />
    </Card>
  );
}
