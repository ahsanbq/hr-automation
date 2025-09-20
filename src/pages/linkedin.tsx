import AppLayout from "@/components/layout/AppLayout";
import Composer from "@/components/linkedin/Composer";
import RecentPosts from "@/components/linkedin/RecentPosts";
import { Row, Col } from "antd";

export default function LinkedInPage() {
  return (
    <AppLayout
      title="LinkedIn Publishing"
      subtitle="Compose and schedule posts"
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} md={16}>
          <Composer />
        </Col>
        <Col xs={24} md={8}>
          <RecentPosts />
        </Col>
      </Row>
    </AppLayout>
  );
}
