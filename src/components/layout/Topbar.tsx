import React, { useEffect, useState } from "react";
import {
  Layout,
  Typography,
  Space,
  Dropdown,
  Badge,
  Button,
  Avatar,
  Tooltip,
  Divider,
} from "antd";
import {
  BellOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  TeamOutlined,
  DashboardOutlined,
} from "@ant-design/icons";
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
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const u = localStorage.getItem("user");
        if (u) setCurrentUser(JSON.parse(u));
      } catch {}
    }

    // Add scroll listener for dynamic styling
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isAdmin = (currentUser?.type || "").toUpperCase() === "ADMIN";
  const avatarColor = isAdmin ? "#ff4d4f" : "#52c41a";
  const avatarInitials = (currentUser?.name || currentUser?.email || "U")
    .slice(0, 1)
    .toUpperCase();

  const notifications = (
    <Dropdown
      menu={{
        items: [
          {
            key: "1",
            label: (
              <div style={{ padding: "8px 0" }}>
                <div style={{ fontWeight: "600", color: "#1890ff" }}>
                  New Application
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  John Doe applied for Senior Developer
                </div>
                <div style={{ fontSize: "11px", color: "#999" }}>
                  2 minutes ago
                </div>
              </div>
            ),
          },
          {
            key: "2",
            label: (
              <div style={{ padding: "8px 0" }}>
                <div style={{ fontWeight: "600", color: "#52c41a" }}>
                  Interview Scheduled
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  Technical interview at 3:00 PM
                </div>
                <div style={{ fontSize: "11px", color: "#999" }}>
                  1 hour ago
                </div>
              </div>
            ),
          },
          {
            key: "3",
            label: (
              <div style={{ padding: "8px 0" }}>
                <div style={{ fontWeight: "600", color: "#fa8c16" }}>
                  Offer Accepted
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  Sarah Wilson accepted the offer
                </div>
                <div style={{ fontSize: "11px", color: "#999" }}>
                  3 hours ago
                </div>
              </div>
            ),
          },
        ],
      }}
      placement="bottomRight"
      trigger={["click"]}
      overlayStyle={{ minWidth: "300px" }}
    >
      <Tooltip title="Notifications">
        <Badge count={3} size="small">
          <Button
            type="text"
            icon={<BellOutlined />}
            style={{
              borderRadius: "8px",
              padding: "8px 12px",
              height: "auto",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f0f0f0";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          />
        </Badge>
      </Tooltip>
    </Dropdown>
  );

  const userMenu = (
    <Dropdown
      menu={{
        items: [
          {
            key: "profile",
            label: (
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <UserOutlined />
                Profile
              </div>
            ),
            onClick: () => router.push("/profile"),
          },
          ...(isAdmin
            ? [
                {
                  key: "users",
                  label: (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <TeamOutlined />
                      Manage Users
                    </div>
                  ),
                  onClick: () => router.push("/users"),
                },
              ]
            : []),
          {
            key: "settings",
            label: (
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <SettingOutlined />
                Settings
              </div>
            ),
            onClick: () => router.push("/profile"),
          },
          {
            type: "divider",
          },
          {
            key: "logout",
            label: (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#ff4d4f",
                }}
              >
                <LogoutOutlined />
                Logout
              </div>
            ),
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
      trigger={["click"]}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 16px",
          borderRadius: "12px",
          cursor: "pointer",
          transition: "all 0.3s ease",
          background: "rgba(255, 255, 255, 0.1)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          minWidth: "200px",
          height: "56px", // Fixed height
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        <Avatar
          style={{
            backgroundColor: avatarColor,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            border: "2px solid white",
            flexShrink: 0,
          }}
          size="default"
        >
          {avatarInitials}
        </Avatar>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center", // Center the text vertically
            alignItems: "flex-start", // Align text to the left
          }}
        >
          <div
            style={{
              fontWeight: "600",
              fontSize: "14px",
              color: "#1f2937",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineHeight: "1.2",
              marginBottom: "2px",
            }}
          >
            {currentUser?.name || currentUser?.email || "User"}
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#6b7280",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineHeight: "1.2",
            }}
          >
            {isAdmin ? "Administrator" : "User"}
          </div>
        </div>
      </div>
    </Dropdown>
  );

  return (
    <Header
      style={{
        background: isScrolled
          ? "rgba(255, 255, 255, 0.95)"
          : "rgba(255, 255, 255, 0.8)",
        backdropFilter: "saturate(180%) blur(20px)",
        padding: "0 24px",
        borderBottom: isScrolled
          ? "1px solid rgba(0, 0, 0, 0.06)"
          : "1px solid rgba(0, 0, 0, 0.05)",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        transition: "all 0.3s ease",
        boxShadow: isScrolled ? "0 4px 6px -1px rgba(0, 0, 0, 0.1)" : "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: "100%",
          gap: "20px",
        }}
      >
        {/* Left side - Title and subtitle */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "4px",
                height: "32px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                borderRadius: "2px",
              }}
            />
            <div>
              <Typography.Title
                level={4}
                style={{
                  margin: 0,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontWeight: "700",
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
                    fontSize: "13px",
                    fontWeight: "500",
                  }}
                >
                  {subtitle}
                </Typography.Text>
              )}
            </div>
          </div>
        </div>

        {/* Right side - Notifications and User menu */}
        <Space size="middle">
          {notifications}
          {userMenu}
        </Space>
      </div>
    </Header>
  );
}
