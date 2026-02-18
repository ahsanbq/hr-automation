import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Layout,
  Typography,
  Space,
  Dropdown,
  Badge,
  Button,
  Avatar,
  Tooltip,
  Empty,
  Spin,
} from "antd";
import {
  BellOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  TeamOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import axios from "axios";

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

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  jobPostId?: string;
  resumeId?: string;
  metadata?: any;
  createdAt: string;
};

const POLL_INTERVAL = 30_000; // 30 seconds

export default function Topbar({ title, subtitle }: TopbarProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const { data } = await axios.get("/api/notifications?limit=20", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifs(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // silent — don't break the UI
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const u = localStorage.getItem("user");
        if (u) setCurrentUser(JSON.parse(u));
      } catch {}
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);

    fetchNotifications();
    pollRef.current = setInterval(fetchNotifications, POLL_INTERVAL);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchNotifications]);

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      await axios.patch(
        "/api/notifications",
        { markAllRead: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const markOneRead = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      await axios.patch(
        "/api/notifications",
        { notificationId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifs((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  const isAdmin = (currentUser?.type || "").toUpperCase() === "ADMIN";
  const avatarColor = isAdmin ? "#ff4d4f" : "#52c41a";
  const avatarInitials = (currentUser?.name || currentUser?.email || "U")
    .slice(0, 1)
    .toUpperCase();

  const notificationMenuItems = notifs.length > 0
    ? [
        {
          key: "header",
          label: (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "4px 0",
              }}
            >
              <span style={{ fontWeight: 700, fontSize: "14px" }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <Button
                  type="link"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    markAllRead();
                  }}
                  style={{ fontSize: "12px", padding: 0 }}
                >
                  Mark all read
                </Button>
              )}
            </div>
          ),
          disabled: true,
        },
        { type: "divider" as const, key: "div-top" },
        ...notifs.map((n) => ({
          key: n.id,
          label: (
            <div
              style={{
                padding: "8px 0",
                opacity: n.isRead ? 0.6 : 1,
                maxWidth: "320px",
              }}
              onClick={() => {
                if (!n.isRead) markOneRead(n.id);
                if (n.jobPostId) {
                  router.push(`/cv-sorting/${n.jobPostId}`);
                  setDropdownOpen(false);
                }
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {!n.isRead && (
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#1890ff",
                      display: "inline-block",
                      flexShrink: 0,
                    }}
                  />
                )}
                <span style={{ fontWeight: 600, color: "#1890ff" }}>
                  {n.title}
                </span>
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#555",
                  marginTop: 2,
                  whiteSpace: "normal",
                  lineHeight: "1.4",
                }}
              >
                {n.message}
              </div>
              {n.metadata?.matchScore != null && (
                <div style={{ fontSize: "11px", color: "#52c41a", marginTop: 2 }}>
                  Match score: {Math.round(n.metadata.matchScore)}%
                </div>
              )}
              <div style={{ fontSize: "11px", color: "#999", marginTop: 2 }}>
                {timeAgo(n.createdAt)}
              </div>
            </div>
          ),
        })),
      ]
    : [
        {
          key: "empty",
          label: (
            <div style={{ padding: "16px 0", textAlign: "center" as const }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No notifications yet"
                style={{ margin: 0 }}
              />
            </div>
          ),
          disabled: true,
        },
      ];

  const notifications = (
    <Dropdown
      menu={{ items: notificationMenuItems }}
      placement="bottomRight"
      trigger={["click"]}
      overlayStyle={{ minWidth: "340px", maxHeight: "420px", overflowY: "auto" }}
      open={dropdownOpen}
      onOpenChange={(open) => {
        setDropdownOpen(open);
        if (open) fetchNotifications();
      }}
    >
      <Tooltip title="Notifications">
        <Badge count={unreadCount} size="small" overflowCount={99}>
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
        height: "64px",
        lineHeight: "64px",
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
