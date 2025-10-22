import React from "react";
import { Modal, Progress, Typography, Space, List, Alert } from "antd";
import {
  LoadingOutlined,
  CheckCircleOutlined,
  CloudUploadOutlined,
  FileTextOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

interface UploadProgress {
  total: number;
  uploaded: number;
  currentFile: string;
  percentage: number;
  isComplete: boolean;
  errors: string[];
}

interface UploadProgressModalProps {
  visible: boolean;
  progress: UploadProgress;
  onCancel?: () => void;
}

export const UploadProgressModal: React.FC<UploadProgressModalProps> = ({
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
      const successCount = progress.total - progress.errors.length;
      if (progress.errors.length === 0) {
        return `All ${progress.total} files uploaded successfully! 🎉`;
      } else {
        return `${successCount}/${progress.total} files uploaded successfully`;
      }
    }
    if (progress.currentFile) {
      return `Uploading: ${progress.currentFile}`;
    }
    return `Uploading files to S3...`;
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
      width={520}
      style={{ borderRadius: "12px" }}
      bodyStyle={{
        padding: "40px 32px",
        background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
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
          {progress.isComplete ? "📁 Upload Complete!" : "☁️ Uploading Files"}
        </Title>

        {/* Status Text */}
        <Text style={{ fontSize: "16px", color: "#666" }}>
          {getStatusText()}
        </Text>

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
                  {progress.uploaded}/{progress.total}
                </div>
              </div>
            )}
          />
        </div>

        {/* Upload Stats */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            width: "100%",
            backgroundColor: "rgba(255, 255, 255, 0.7)",
            padding: "16px",
            borderRadius: "8px",
            marginBottom: "16px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{ fontSize: "20px", fontWeight: "bold", color: "#1890ff" }}
            >
              <CloudUploadOutlined /> {progress.total}
            </div>
            <Text style={{ fontSize: "12px", color: "#666" }}>Total Files</Text>
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{ fontSize: "20px", fontWeight: "bold", color: "#52c41a" }}
            >
              <CheckCircleOutlined /> {progress.uploaded}
            </div>
            <Text style={{ fontSize: "12px", color: "#666" }}>Uploaded</Text>
          </div>
          {progress.errors.length > 0 && (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: "#ff4d4f",
                }}
              >
                ❌ {progress.errors.length}
              </div>
              <Text style={{ fontSize: "12px", color: "#666" }}>Failed</Text>
            </div>
          )}
        </div>

        {/* Current File Info */}
        {progress.currentFile && !progress.isComplete && (
          <div
            style={{
              width: "100%",
              textAlign: "left",
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              padding: "12px 16px",
              borderRadius: "6px",
              border: "1px dashed #1890ff",
            }}
          >
            <Space>
              <FileTextOutlined style={{ color: "#1890ff" }} />
              <Text style={{ fontSize: "14px" }}>
                <strong>Current:</strong> {progress.currentFile}
              </Text>
            </Space>
          </div>
        )}

        {/* Error List */}
        {progress.errors.length > 0 && progress.isComplete && (
          <div style={{ width: "100%", textAlign: "left" }}>
            <Alert
              message="Some files failed to upload"
              description={
                <List
                  size="small"
                  dataSource={progress.errors.slice(0, 5)} // Show max 5 errors
                  renderItem={(error) => (
                    <List.Item style={{ padding: "4px 0", fontSize: "12px" }}>
                      <Text type="danger">• {error}</Text>
                    </List.Item>
                  )}
                />
              }
              type="warning"
              showIcon
              style={{ marginTop: "16px" }}
            />
            {progress.errors.length > 5 && (
              <Text style={{ fontSize: "12px", color: "#666" }}>
                ... and {progress.errors.length - 5} more errors
              </Text>
            )}
          </div>
        )}

        {/* Linear Progress Bar */}
        <div style={{ width: "100%" }}>
          <Progress
            percent={progress.percentage}
            strokeColor={getProgressColor()}
            trailColor="#f0f0f0"
            strokeWidth={6}
            showInfo={false}
          />
        </div>
      </Space>
    </Modal>
  );
};

export default UploadProgressModal;
