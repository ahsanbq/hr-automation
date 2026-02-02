import React from "react";
import { Card, Typography, Button, Space, Result } from "antd";
import { CheckCircleOutlined, HomeOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";
import Head from "next/head";

const { Title, Paragraph } = Typography;

export default function ThankYouPage() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Thank You - Interview Submitted</title>
      </Head>
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px",
        }}
      >
        <Card style={{ maxWidth: "600px", width: "100%" }}>
          <Result
            status="success"
            icon={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
            title="Interview Submitted Successfully!"
            subTitle="Thank you for completing the AI interview. Your responses have been recorded and will be reviewed by our team."
            extra={[
              <div
                key="content"
                style={{ textAlign: "left", marginBottom: "24px" }}
              >
                <Title level={4}>What Happens Next?</Title>
                <Paragraph>
                  <ul style={{ paddingLeft: "20px" }}>
                    <li>
                      Your interview will be analyzed by our AI system within
                      the next 24-48 hours
                    </li>
                    <li>
                      Our hiring team will review your responses and AI
                      evaluation
                    </li>
                    <li>
                      You will receive an email update about the next steps in
                      the hiring process
                    </li>
                    <li>
                      If you advance to the next round, we'll reach out to
                      schedule further discussions
                    </li>
                  </ul>
                </Paragraph>
                <Paragraph type="secondary">
                  If you have any questions, feel free to reach out to our HR
                  team.
                </Paragraph>
              </div>,
            ]}
          />
        </Card>
      </div>
    </>
  );
}
