import { Card, List } from "antd";
import Link from "next/link";

export default function JobList() {
  const jobs = [
    { id: "job-1", title: "Frontend Engineer" },
    { id: "job-2", title: "Backend Engineer" },
  ];
  return (
    <Card>
      <List
        dataSource={jobs}
        renderItem={(j) => (
          <List.Item>
            <Link href={`/cv-sorting/${j.id}`}>{j.title}</Link>
          </List.Item>
        )}
      />
    </Card>
  );
}
