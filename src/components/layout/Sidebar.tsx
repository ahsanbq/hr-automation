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
  TeamOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";

const { Sider } = Layout;

type CurrentUser = {
  id: number;
  email: string;
  name?: string;
  type?: string;
} | null;

export default function Sidebar({
  collapsed = false,
  onToggle,
}: {
  collapsed?: boolean;
  onToggle?: () => void;
}) {
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
        label: (
          <Link href="/analytics" className="manrope-medium">
            Analytics
          </Link>
        ),
      },
      {
        key: "/job-requirements",
        icon: <FileTextOutlined />,
        label: (
          <Link href="/job-requirements" className="manrope-medium">
            Job Requirements
          </Link>
        ),
      },
      {
        key: "/linkedin",
        icon: <LinkedinOutlined />,
        label: (
          <Link href="/linkedin" className="manrope-medium">
            LinkedIn
          </Link>
        ),
      },
      {
        key: "/cv-sorting",
        icon: <InboxOutlined />,
        label: (
          <Link href="/cv-sorting" className="manrope-medium">
            CV Sorting
          </Link>
        ),
      },
      {
        key: "/meeting",
        icon: <QuestionCircleOutlined />,
        label: (
          <Link href="/meeting" className="manrope-medium">
            Meeting
          </Link>
        ),
      },
      {
        key: "/scheduler",
        icon: <ScheduleOutlined />,
        label: (
          <Link href="/scheduler" className="manrope-medium">
            Scheduler
          </Link>
        ),
      },
      {
        key: "/offers",
        icon: <FileDoneOutlined />,
        label: (
          <Link href="/offers" className="manrope-medium">
            Offers
          </Link>
        ),
      },
      ...(isAdmin
        ? [
            {
              key: "/users",
              icon: <TeamOutlined />,
              label: (
                <Link href="/users" className="manrope-medium">
                  Users
                </Link>
              ),
            },
            {
              key: "/profile",
              icon: <UserOutlined />,
              label: (
                <Link href="/profile" className="manrope-medium">
                  Profile
                </Link>
              ),
            },
          ]
        : [
            {
              key: "/profile",
              icon: <UserOutlined />,
              label: (
                <Link href="/profile" className="manrope-medium">
                  Profile
                </Link>
              ),
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
      onCollapse={onToggle}
      width={240}
      collapsedWidth={64}
      breakpoint="lg"
      style={{
        minHeight: "100vh",
        position: "sticky",
        top: 0,
        left: 0,
        background: "#1a1a2e",
        borderRight: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "4px 0 24px rgba(0,0,0,0.12)",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        backdropFilter: "blur(10px)",
      }}
    >
      {/* Header */}
      <div
        style={{
          height: 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: collapsed ? "0 12px" : "0 20px",
          position: "relative",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            textAlign: "center",
          }}
        >
          <div
            style={{
              color: "#ffffff",
              fontSize: collapsed ? 18 : 20,
              fontWeight: "600",
              letterSpacing: 0.5,
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              lineHeight: 1.2,
            }}
          >
            {collapsed ? "SH" : "Synchro Hire"}
          </div>
          {!collapsed && (
            <div
              style={{
                color: "#e8e8e8",
                fontSize: 11,
                fontWeight: "400",
                letterSpacing: 0.3,
                marginTop: 2,
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                lineHeight: 1.2,
                opacity: 0.8,
              }}
            >
              Streamline hiring
            </div>
          )}
        </div>
      </div>

      {/* Menu - Takes up available space */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          paddingBottom: currentUser ? "120px" : "12px",
        }}
      >
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={items as any}
          style={{
            background: "transparent",
            padding: collapsed ? "12px 8px" : "16px 12px",
            borderInlineEnd: 0,
          }}
          inlineCollapsed={collapsed}
        />
      </div>

      {/* User Info Section - Positioned with proper spacing from trigger */}
      {currentUser && (
        <div
          style={{
            position: "absolute",
            bottom: "50px",
            left: 0,
            right: 0,
            padding: collapsed ? "16px 8px" : "20px 16px",
            background: "rgba(255, 255, 255, 0.03)",
            borderTop: "1px solid rgba(255, 255, 255, 0.06)",
            margin: collapsed ? "0 8px 8px 8px" : "0 12px 8px 12px",
            borderRadius: "16px",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: collapsed ? "0" : "12px",
              justifyContent: collapsed ? "center" : "flex-start",
            }}
          >
            <div
              style={{
                width: collapsed ? "36px" : "40px",
                height: collapsed ? "36px" : "40px",
                background: isAdmin
                  ? "linear-gradient(135deg, #ff4757 0%, #ff3742 100%)"
                  : "linear-gradient(135deg, #2ed573 0%, #1dd1a1 100%)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: "bold",
                fontSize: collapsed ? "14px" : "16px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                border: "2px solid rgba(255, 255, 255, 0.1)",
              }}
              title={
                collapsed
                  ? `${currentUser.name || currentUser.email} (${
                      isAdmin ? "Admin" : "User"
                    })`
                  : undefined
              }
            >
              {(currentUser.name || currentUser.email || "U")
                .slice(0, 1)
                .toUpperCase()}
            </div>
            {!collapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    color: "#fff",
                    fontSize: "14px",
                    fontWeight: "600",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {currentUser.name || currentUser.email}
                </div>
                <div
                  style={{
                    color: "rgba(255, 255, 255, 0.6)",
                    fontSize: "12px",
                  }}
                >
                  {isAdmin ? "Administrator" : "User"}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Sider>
  );
}
