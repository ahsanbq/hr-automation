import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Layout, Menu, Button, Divider, Typography } from "antd";
import { useRouter } from "next/router";
import {
  PieChartOutlined,
  FileTextOutlined,
  LinkedinOutlined,
  ScheduleOutlined,
  FileDoneOutlined,
  InboxOutlined,
  QuestionCircleOutlined,
  DeleteOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";

const { Sider } = Layout;

type CurrentUser = {
  id: number;
  email: string;
  name?: string;
  type?: string;
} | null;

export default function Sidebar({ collapsed }: { collapsed?: boolean }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const u = localStorage.getItem("user");
        if (u) setCurrentUser(JSON.parse(u));
      } catch {}
    }
  }, []);

  const isAdmin = (currentUser?.type || "").toUpperCase() === "ADMIN";

  const items = useMemo(
    () => [
      {
        key: "/analytics",
        icon: <PieChartOutlined />,
        label: <Link href="/analytics" className="manrope-medium">Analytics</Link>,
      },
      {
        key: "/job-requirements",
        icon: <FileTextOutlined />,
        label: <Link href="/job-requirements" className="manrope-medium">Job Requirements</Link>,
      },
      {
        key: "/linkedin",
        icon: <LinkedinOutlined />,
        label: <Link href="/linkedin" className="manrope-medium">LinkedIn</Link>,
      },
      {
        key: "/cv-sorting",
        icon: <InboxOutlined />,
        label: <Link href="/cv-sorting" className="manrope-medium">CV Sorting</Link>,
      },
      {
        key: "/meeting",
        icon: <QuestionCircleOutlined />,
        label: <Link href="/meeting" className="manrope-medium">Meeting</Link>,
      },
      {
        key: "/scheduler",
        icon: <ScheduleOutlined />,
        label: <Link href="/scheduler" className="manrope-medium">Scheduler</Link>,
      },
      {
        key: "/offers",
        icon: <FileDoneOutlined />,
        label: <Link href="/offers" className="manrope-medium">Offers</Link>,
      },
      ...(isAdmin
        ? [
            {
              key: "/users",
              icon: <TeamOutlined />,
              label: <Link href="/users" className="manrope-medium">Users</Link>,
            },
            {
              key: "/profile",
              icon: <UserOutlined />,
              label: <Link href="/profile" className="manrope-medium">Profile</Link>,
            },
          ]
        : [
            {
              key: "/profile",
              icon: <UserOutlined />,
              label: <Link href="/profile" className="manrope-medium">Profile</Link>,
            },
          ]),
    ],
    [isAdmin]
  );

  const selectedKey =
    items.find((i: any) => router.pathname.startsWith(i.key))?.key ||
    "/analytics";

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      breakpoint="lg"
      width={240}
      collapsedWidth={88}
      style={{
        minHeight: "100vh",
        position: "sticky",
        top: 0,
        left: 0,
        background: "linear-gradient(180deg, #001529 0%, #001a2b 100%)",
        boxShadow: "2px 0 12px rgba(0,0,0,0.15)",
      }}
    >
      <div
        style={{
          height: 72,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          padding: collapsed ? 0 : "0 16px",
        }}
      >
        <div style={{ color: "#fff" }}>
          <Typography.Text
            className="sora-bold"
            style={{
              color: "#fff",
              fontSize: collapsed ? 16 : 18,
              letterSpacing: 0.5,
            }}
          >
            Synchro Hire
          </Typography.Text>
          {!collapsed && (
            <div className="manrope-regular" style={{ color: "#9db4c0", fontSize: 12, lineHeight: 1.2 }}>
              Streamline hiring
            </div>
          )}
        </div>
      </div>
      <Divider style={{ margin: "8px 0", borderColor: "#123" }} />
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        items={items as any}
        style={{
          background: "transparent",
          padding: "8px 10px",
          borderInlineEnd: 0,
        }}
      />
      <div style={{ padding: 12, marginTop: "auto" }}>
        <Button block icon={<DeleteOutlined />} danger shape="round" className="manrope-medium">
          Clean Temp Files
        </Button>
      </div>
    </Sider>
  );
}
