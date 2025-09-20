import { Table, Tag } from "antd";

export default function OfferTable() {
  const columns = [
    { title: "Candidate", dataIndex: "candidate" },
    { title: "Email", dataIndex: "email" },
    {
      title: "Status",
      dataIndex: "status",
      render: (s: string) => (
        <Tag
          color={s === "SENT" ? "green" : s === "DRAFT" ? "default" : "blue"}
        >
          {s}
        </Tag>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      columns={columns as any}
      dataSource={[
        {
          id: "1",
          candidate: "Maria",
          email: "maria@example.com",
          status: "DRAFT",
        },
        {
          id: "2",
          candidate: "Ibrahim",
          email: "ib@example.com",
          status: "SENT",
        },
      ]}
    />
  );
}
