import AppLayout from "@/components/layout/AppLayout";
import StatCards from "@/components/analytics/StatCards";
import Charts from "@/components/analytics/Charts";
import RecentActivity from "@/components/analytics/RecentActivity";
import { Row, Col } from "antd";

export default function AnalyticsPage() {
  return (
    <AppLayout
      title="Analytics Dashboard"
      subtitle="Overview of recruiting metrics"
    >
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <StatCards />
        </Col>
        <Col span={24}>
          <Charts />
        </Col>
        <Col span={24}>
          <RecentActivity />
        </Col>
      </Row>
    </AppLayout>
  );
}
