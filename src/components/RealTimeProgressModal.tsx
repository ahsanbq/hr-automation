import React from "react";
import { Modal, Progress, Typography, Space, Card, Tag } from "antd";
import {
  LoadingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  RocketOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

interface RealTimeProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  currentBatch: number;
  totalBatches: number;
  isComplete: boolean;
  currentFile?: string;
  percentage: number;
}

interface RealTimeProgressModalProps {
  visible: boolean;
  progress: RealTimeProgress;
  onCancel?: () => void;
}

export const RealTimeProgressModal: React.FC<RealTimeProgressModalProps> = ({
  visible,
  progress,
  onCancel,
}) => {
  const getStatusIcon = () => {
    if (progress.isComplete) {
      return (
        <CheckCircleOutlined style={{ color: "#52c41a", fontSize: "28px" }} />
      );
    }
    return <LoadingOutlined style={{ color: "#1890ff", fontSize: "28px" }} />;
  };

  const getStatusText = () => {
    if (progress.isComplete) {
      return `Analysis Complete! ${progress.successful}/${progress.total} resumes processed successfully`;
    }
    if (progress.currentFile) {
      return `Analyzing: ${progress.currentFile}`;
    }
    return `Processing batch ${progress.currentBatch}/${progress.totalBatches}...`;
  };

  const getProgressColor = () => {
    if (progress.percentage === 100) return "#52c41a";
    if (progress.percentage > 75) return "#1890ff";
    if (progress.percentage > 50) return "#722ed1";
    if (progress.percentage > 25) return "#faad14";
    return "#ff4d4f";
  };

  return (
    <Modal
      title={null}
      open={visible}
      footer={null}
      closable={false}
      centered
      width={480}
      style={{ borderRadius: "12px" }}
      bodyStyle={{
        padding: "40px 32px",
        background: "linear-gradient(135deg, #f6f9fc 0%, #e9f3ff 100%)",
        borderRadius: "12px",
      }}
    >
      <Space
        direction="vertical"
        style={{ width: "100%", textAlign: "center" }}
        size="large"
      >
        {/* Status Icon */}
        <div style={{ marginBottom: "16px" }}>{getStatusIcon()}</div>

        {/* Title */}
        <Title level={3} style={{ margin: 0, color: "#1890ff" }}>
          {progress.isComplete
            ? "🎉 Analysis Complete!"
            : "🤖 AI Resume Analysis"}
        </Title>

        {/* Main Progress Bar */}
        <div style={{ width: "100%", marginBottom: "24px" }}>
          <Progress
            type="circle"
            percent={progress.percentage}
            size={120}
            strokeColor={{
              "0%": getProgressColor(),
              "100%": "#52c41a",
            }}
            trailColor="#f0f0f0"
            strokeWidth={8}
            format={(percent) => (
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: getProgressColor(),
                  }}
                >
                  {percent}%
                </div>
                <div
                  style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}
                >
                  {progress.processed}/{progress.total}
                </div>
              </div>
            )}
          />
        </div>

        {/* Status Text */}
        <Text
          style={{
            fontSize: "16px",
            color: "#333",
            fontWeight: 500,
            display: "block",
            marginBottom: "16px",
          }}
        >
          {getStatusText()}
        </Text>

        {/* Linear Progress for Batch */}
        {!progress.isComplete && (
          <div style={{ width: "100%", marginBottom: "16px" }}>
            <Text
              type="secondary"
              style={{
                fontSize: "12px",
                marginBottom: "8px",
                display: "block",
              }}
            >
              Batch Progress ({progress.currentBatch}/{progress.totalBatches})
            </Text>
            <Progress
              percent={
                progress.totalBatches > 0
                  ? Math.round(
                      (progress.currentBatch / progress.totalBatches) * 100
                    )
                  : 0
              }
              size="small"
              strokeColor="#722ed1"
              trailColor="#f0f0f0"
              showInfo={false}
            />
          </div>
        )}

        {/* Stats Cards */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            width: "100%",
            marginTop: "20px",
          }}
        >
          <Card
            size="small"
            style={{
              textAlign: "center",
              minWidth: "80px",
              borderColor: "#52c41a",
            }}
          >
            <div
              style={{ color: "#52c41a", fontSize: "20px", fontWeight: "bold" }}
            >
              {progress.successful}
            </div>
            <Text type="secondary" style={{ fontSize: "11px" }}>
              ✅ Success
            </Text>
          </Card>

          <Card
            size="small"
            style={{
              textAlign: "center",
              minWidth: "80px",
              borderColor: "#ff4d4f",
            }}
          >
            <div
              style={{ color: "#ff4d4f", fontSize: "20px", fontWeight: "bold" }}
            >
              {progress.failed}
            </div>
            <Text type="secondary" style={{ fontSize: "11px" }}>
              ❌ Failed
            </Text>
          </Card>

          <Card
            size="small"
            style={{
              textAlign: "center",
              minWidth: "80px",
              borderColor: "#1890ff",
            }}
          >
            <div
              style={{ color: "#1890ff", fontSize: "20px", fontWeight: "bold" }}
            >
              {progress.total - progress.processed}
            </div>
            <Text type="secondary" style={{ fontSize: "11px" }}>
              ⏳ Remaining
            </Text>
          </Card>
        </div>

        {/* Current File Being Processed */}
        {progress.currentFile && !progress.isComplete && (
          <Card
            size="small"
            style={{
              background: "#f0f9ff",
              border: "1px solid #bae7ff",
              borderRadius: "8px",
              width: "100%",
              marginTop: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FileTextOutlined style={{ color: "#1890ff" }} />
              <div style={{ flex: 1, overflow: "hidden" }}>
                <Text strong style={{ color: "#1890ff", fontSize: "12px" }}>
                  Processing:
                </Text>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#666",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {progress.currentFile}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Processing Speed Indicator */}
        {!progress.isComplete && progress.processed > 0 && (
          <div style={{ marginTop: "16px" }}>
            <Tag
              icon={<RocketOutlined />}
              color="processing"
              style={{ fontSize: "11px" }}
            >
              AI Processing at High Speed
            </Tag>
          </div>
        )}

        {/* Completion Message */}
        {progress.isComplete && (
          <Card
            style={{
              background: "#f6ffed",
              border: "2px solid #52c41a",
              borderRadius: "8px",
              width: "100%",
              marginTop: "16px",
            }}
          >
            <Text
              style={{ color: "#52c41a", fontSize: "14px", fontWeight: 500 }}
            >
              🎯 Ready! You can now review the analyzed resumes in the table
              below.
            </Text>
          </Card>
        )}
      </Space>
    </Modal>
  );
};

export default RealTimeProgressModal;
