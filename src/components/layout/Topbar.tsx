import React, { useEffect, useState } from "react";
import {
  Layout,
  Typography,
  Space,
  Dropdown,
  Badge,
  Button,
  Avatar,
} from "antd";
import { BellOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";

const { Header } = Layout;

type CurrentUser = {
  id: number;
  email: string;
  name?: string;
  type?: string;
} | null;

export type TopbarProps = {
  title: string;
  subtitle?: string;
};

export default function Topbar({ title, subtitle }: TopbarProps) {
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
  const avatarColor = isAdmin ? "#ff4d4f" : "#52c41a"; // red for admin, green for others
  const avatarInitials = (currentUser?.name || currentUser?.email || "U")
    .slice(0, 1)
    .toUpperCase();

  const notifications = (
    <Dropdown
      menu={{
        items: [
          { key: "1", label: "New application received" },
          { key: "2", label: "Interview scheduled for 3 PM" },
          { key: "3", label: "Offer accepted" },
        ],
      }}
      placement="bottomRight"
      trigger={["click"]}
    >
      <Badge count={3}>
        <Button type="text" icon={<BellOutlined />} />
      </Badge>
    </Dropdown>
  );

  const userMenu = (
    <Dropdown
      menu={{
        items: [
          {
            key: "profile",
            label: "Profile",
            onClick: () => router.push("/profile"),
          },
          ...(isAdmin
            ? [
                {
                  key: "users",
                  label: "Manage Users",
                  onClick: () => router.push("/users"),
                },
              ]
            : []),
          {
            key: "logout",
            label: "Logout",
            onClick: () => {
              if (typeof window !== "undefined") {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                router.replace("/auth");
              }
            },
          },
        ],
      }}
      placement="bottomRight"
    >
      <Space>
        <Avatar style={{ cursor: "pointer", backgroundColor: avatarColor }}>
          {avatarInitials}
        </Avatar>
        <Typography.Text strong style={{ cursor: "pointer" }}>
          {currentUser?.name || currentUser?.email || "User"}
        </Typography.Text>
      </Space>
    </Dropdown>
  );

  return (
    <Header
      style={{
        background: "rgba(255,255,255,0.8)",
        backdropFilter: "saturate(180%) blur(8px)",
        padding: "0 16px",
        borderBottom: "1px solid #f0f0f0",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: "100%",
          gap: 16,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <Typography.Title
            level={4}
            style={{
              margin: 0,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </Typography.Title>
          {subtitle && (
            <Typography.Text
              type="secondary"
              style={{
                display: "block",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {subtitle}
            </Typography.Text>
          )}
        </div>
        <Space size="large">
          {notifications}
          {userMenu}
        </Space>
      </div>
    </Header>
  );
}
