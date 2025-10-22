import React from "react";
import {
  Progress,
  Card,
  Typography,
  Space,
  Statistic,
  Row,
  Col,
  Tag,
  Spin,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

interface BatchProgressProps {
  progress: {
    total: number;
    processed: number;
    successful: number;
    failed: number;
    currentBatch: number;
    totalBatches: number;
    percentage: number;
    status: "processing" | "completed" | "failed";
    elapsedTime: number;
    estimatedRemaining: number;
    isActive: boolean;
    error?: string;
  } | null;
  visible: boolean;
}

export default function BatchProgressModal({
  progress,
  visible,
}: BatchProgressProps) {
  if (!visible) return null;

  // Show loading state if no progress data yet
  if (!progress) {
    return (
      <Card
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 500,
          zIndex: 1000,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          borderRadius: 12,
          border: "1px solid #f0f0f0",
        }}
        bodyStyle={{ padding: 24 }}
      >
        <div style={{ textAlign: "center" }}>
          <Space direction="vertical" align="center" size="large">
            <Spin size="large" />
            <div>
              <Title level={4} style={{ margin: 0, color: "#1677ff" }}>
                Initializing Batch Processing...
              </Title>
              <Text type="secondary">
                Setting up analysis pipeline and preparing batches
              </Text>
            </div>
          </Space>
        </div>
      </Card>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getStatusColor = () => {
    switch (progress.status) {
      case "completed":
        return "#52c41a";
      case "failed":
        return "#ff4d4f";
      default:
        return "#1677ff";
    }
  };

  const getStatusIcon = () => {
    switch (progress.status) {
      case "completed":
        return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
      case "failed":
        return <CloseCircleOutlined style={{ color: "#ff4d4f" }} />;
      default:
        return <SyncOutlined spin style={{ color: "#1677ff" }} />;
    }
  };

  return (
    <Card
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 500,
        zIndex: 1000,
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        borderRadius: 12,
        border: "1px solid #f0f0f0",
      }}
      bodyStyle={{ padding: 24 }}
    >
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <Space align="center" size="middle">
          {getStatusIcon()}
          <Title level={4} style={{ margin: 0, color: getStatusColor() }}>
            {progress.status === "processing" && "Analyzing Resumes..."}
            {progress.status === "completed" && "Analysis Complete!"}
            {progress.status === "failed" && "Analysis Failed"}
          </Title>
        </Space>
      </div>

      {/* Main Progress Bar */}
      <div style={{ marginBottom: 24 }}>
        <Progress
          percent={progress.percentage}
          status={
            progress.status === "failed"
              ? "exception"
              : progress.status === "completed"
              ? "success"
              : "active"
          }
          strokeColor={{
            from: "#108ee9",
            to: "#87d068",
          }}
          trailColor="#f0f0f0"
          strokeWidth={12}
          showInfo={true}
          format={(percent) => (
            <Text strong style={{ fontSize: 16, color: getStatusColor() }}>
              {percent}%
            </Text>
          )}
        />
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <Text type="secondary">
            {progress.processed} of {progress.total} resumes processed
          </Text>
        </div>
      </div>

      {/* Batch Progress */}
      {progress.totalBatches > 1 && (
        <div style={{ marginBottom: 20 }}>
          <Text strong style={{ display: "block", marginBottom: 8 }}>
            Batch Progress:
          </Text>
          <Progress
            percent={Math.round(
              (progress.currentBatch / progress.totalBatches) * 100
            )}
            size="small"
            showInfo={false}
            strokeColor="#722ed1"
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 4,
            }}
          >
            <Text type="secondary" style={{ fontSize: 12 }}>
              Batch {progress.currentBatch} of {progress.totalBatches}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Processing 5 resumes per batch
            </Text>
          </div>
        </div>
      )}

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={8}>
          <Statistic
            title="Successful"
            value={progress.successful}
            prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
            valueStyle={{ color: "#52c41a", fontSize: 18 }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Failed"
            value={progress.failed}
            prefix={<CloseCircleOutlined style={{ color: "#ff7875" }} />}
            valueStyle={{
              color: progress.failed > 0 ? "#ff7875" : "#8c8c8c",
              fontSize: 18,
            }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Remaining"
            value={progress.total - progress.processed}
            prefix={<FileTextOutlined style={{ color: "#1677ff" }} />}
            valueStyle={{ color: "#1677ff", fontSize: 18 }}
          />
        </Col>
      </Row>

      {/* Time Information */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <div
            style={{
              textAlign: "center",
              padding: 8,
              backgroundColor: "#f9f9f9",
              borderRadius: 6,
            }}
          >
            <ClockCircleOutlined style={{ color: "#1677ff", marginRight: 4 }} />
            <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
              Elapsed
            </Text>
            <Text strong>
              {formatTime(Math.floor(progress.elapsedTime / 1000))}
            </Text>
          </div>
        </Col>
        {progress.status === "processing" &&
          progress.estimatedRemaining > 0 && (
            <Col span={12}>
              <div
                style={{
                  textAlign: "center",
                  padding: 8,
                  backgroundColor: "#f9f9f9",
                  borderRadius: 6,
                }}
              >
                <ClockCircleOutlined
                  style={{ color: "#722ed1", marginRight: 4 }}
                />
                <Text
                  type="secondary"
                  style={{ fontSize: 12, display: "block" }}
                >
                  Remaining
                </Text>
                <Text strong>{formatTime(progress.estimatedRemaining)}</Text>
              </div>
            </Col>
          )}
      </Row>

      {/* Status Tag */}
      <div style={{ textAlign: "center" }}>
        <Tag
          color={
            progress.status === "completed"
              ? "success"
              : progress.status === "failed"
              ? "error"
              : "processing"
          }
          style={{ fontSize: 12, padding: "4px 12px", borderRadius: 16 }}
        >
          {progress.isActive && progress.status === "processing" && (
            <Spin size="small" style={{ marginRight: 6 }} />
          )}
          {progress.status === "processing" && "Processing resumes in batches"}
          {progress.status === "completed" &&
            "All resumes analyzed successfully"}
          {progress.status === "failed" &&
            (progress.error || "Analysis failed")}
        </Tag>
      </div>

      {/* Loading overlay for inactive progress */}
      {progress.status === "processing" && !progress.isActive && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255,255,255,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 12,
          }}
        >
          <Space direction="vertical" align="center">
            <Spin size="large" />
            <Text>Connecting to progress...</Text>
          </Space>
        </div>
      )}
    </Card>
  );
}
