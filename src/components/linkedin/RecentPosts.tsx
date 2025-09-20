import { Card, List } from "antd";

export default function RecentPosts() {
  return (
    <Card title="Recent Posts">
      <List
        dataSource={[
          "Announcing our new openings!",
          "Hiring Senior Backend Engineers",
          "We are growing our team",
        ]}
        renderItem={(item) => <List.Item>{item}</List.Item>}
      />
    </Card>
  );
}
