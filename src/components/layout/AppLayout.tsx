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
    <Layout style={{ minHeight: "100vh", background: "#f5f7fb" }}>
      <Sidebar />
      <Layout>
        <Topbar title={title} subtitle={subtitle} />
        <Content style={{ margin: 16 }}>
          <div style={{ position: "relative" }}>
            <Spin spinning={loading} size="large">
              <div
                style={{
                  padding: 16,
                  minHeight: 360,
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
        <Footer style={{ textAlign: "center", background: "transparent" }}>
          HR Automation © {new Date().getFullYear()}
        </Footer>
      </Layout>
    </Layout>
  );
}
