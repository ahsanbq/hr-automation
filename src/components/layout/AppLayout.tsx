import React, { useEffect, useState } from "react";
import { Layout, Spin } from "antd";
import { useRouter } from "next/router";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

const { Content, Footer } = Layout;

type AppLayoutProps = {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
};

export default function AppLayout({
  title = "HR Automation",
  subtitle = "Streamline your hiring workflow",
  children,
}: AppLayoutProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (!token && router.pathname !== "/auth") {
        router.replace("/auth");
      }
    }
  }, [router]);

  useEffect(() => {
    const handleStart = (url: string) => {
      if (url !== router.asPath) setLoading(true);
    };
    const handleDone = () => setLoading(false);
    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleDone);
    router.events.on("routeChangeError", handleDone);
    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleDone);
      router.events.off("routeChangeError", handleDone);
    };
  }, [router]);

  return (
    <Layout
      style={{ height: "100vh", background: "#f5f7fb", overflow: "hidden" }}
    >
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <Layout
        style={{
          height: "100vh",
          overflow: "hidden",
          marginLeft: sidebarCollapsed ? 64 : 240,
          transition: "margin-left 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <Topbar title={title} subtitle={subtitle} />
        <Content
          style={{
            margin: 16,
            height: "calc(100vh - 120px)",
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ position: "relative", flex: 1 }}>
            <Spin spinning={loading} size="large">
              <div
                style={{
                  padding: 16,
                  minHeight: "100%",
                  background: "#fff",
                  borderRadius: 12,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                }}
              >
                {children}
              </div>
            </Spin>
          </div>
        </Content>
        <Footer
          style={{
            textAlign: "center",
            background: "transparent",
            flexShrink: 0,
            padding: "8px 0", // 🔹 reduce vertical padding
            lineHeight: "20px", // 🔹 tighten text spacing
            fontSize: "14px", // optional: smaller text
          }}
        >
          Synchro Hire © {new Date().getFullYear()}
        </Footer>
      </Layout>
    </Layout>
  );
}
