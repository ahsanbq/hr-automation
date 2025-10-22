import React from "react";
import { Progress, Card, Typography, Space, Divider } from "antd";
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
  FileTextOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

interface BatchProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  currentBatch: number;
  totalBatches: number;
  batchSize: number;
  isComplete: boolean;
  currentFile?: string;
  recentlyProcessed: string[];
  errors: Array<{
    file: string;
    error: string;
  }>;
}

interface BatchProgressBarProps {
  progress: BatchProgress;
  visible: boolean;
}

export const BatchProgressBar: React.FC<BatchProgressBarProps> = ({
  progress,
  visible,
}) => {
  if (!visible) return null;

  const percentage =
    progress.total > 0
      ? Math.round((progress.processed / progress.total) * 100)
      : 0;
  const batchPercentage =
    progress.totalBatches > 0
      ? Math.round((progress.currentBatch / progress.totalBatches) * 100)
      : 0;

  return (
    <Card
      style={{
        margin: "16px 0",
        background: "linear-gradient(135deg, #f6f9fc 0%, #e9f3ff 100%)",
        border: "1px solid #d4e7ff",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        {/* Header */}
        <div style={{ textAlign: "center" }}>
          <Title level={4} style={{ margin: 0, color: "#1890ff" }}>
            <LoadingOutlined style={{ marginRight: 8 }} />
            AI Resume Analysis in Progress
          </Title>
          <Text type="secondary">
            Processing resumes with advanced AI technology
          </Text>
        </div>

        {/* Overall Progress */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <Text strong>Overall Progress</Text>
            <Text strong style={{ color: "#1890ff" }}>
              {progress.processed}/{progress.total} resumes
            </Text>
          </div>
          <Progress
            percent={percentage}
            status={progress.isComplete ? "success" : "active"}
            strokeColor={{
              "0%": "#108ee9",
              "100%": "#87d068",
            }}
            trailColor="#f0f0f0"
            strokeWidth={8}
            format={(percent) => (
              <span style={{ color: "#1890ff", fontWeight: "bold" }}>
                {percent}%
              </span>
            )}
          />
        </div>

        {/* Batch Progress */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <Text strong>Batch Progress</Text>
            <Text strong style={{ color: "#722ed1" }}>
              Batch {progress.currentBatch}/{progress.totalBatches}
            </Text>
          </div>
          <Progress
            percent={batchPercentage}
            status={progress.isComplete ? "success" : "active"}
            strokeColor="#722ed1"
            trailColor="#f0f0f0"
            size="small"
            format={(percent) => (
              <span
                style={{
                  color: "#722ed1",
                  fontWeight: "bold",
                  fontSize: "12px",
                }}
              >
                {percent}%
              </span>
            )}
          />
          <Text type="secondary" style={{ fontSize: "12px" }}>
            Processing {progress.batchSize} resumes per batch
          </Text>
        </div>

        <Divider style={{ margin: "12px 0" }} />

        {/* Stats Row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            textAlign: "center",
          }}
        >
          <div>
            <div
              style={{ color: "#52c41a", fontSize: "24px", fontWeight: "bold" }}
            >
              {progress.successful}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
              }}
            >
              <CheckCircleOutlined style={{ color: "#52c41a" }} />
              <Text type="secondary" style={{ fontSize: "12px" }}>
                Successful
              </Text>
            </div>
          </div>

          <div>
            <div
              style={{ color: "#ff4d4f", fontSize: "24px", fontWeight: "bold" }}
            >
              {progress.failed}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
              }}
            >
              <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />
              <Text type="secondary" style={{ fontSize: "12px" }}>
                Failed
              </Text>
            </div>
          </div>

          <div>
            <div
              style={{ color: "#1890ff", fontSize: "24px", fontWeight: "bold" }}
            >
              {progress.total - progress.processed}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
              }}
            >
              <LoadingOutlined style={{ color: "#1890ff" }} />
              <Text type="secondary" style={{ fontSize: "12px" }}>
                Remaining
              </Text>
            </div>
          </div>
        </div>

        {/* Currently Processing */}
        {progress.currentFile && !progress.isComplete && (
          <div
            style={{
              background: "#f0f9ff",
              border: "1px solid #bae7ff",
              borderRadius: "8px",
              padding: "12px",
            }}
          >
            <Text strong style={{ color: "#1890ff" }}>
              <FileTextOutlined style={{ marginRight: 6 }} />
              Currently Processing:
            </Text>
            <br />
            <Text code style={{ fontSize: "11px", wordBreak: "break-all" }}>
              {progress.currentFile}
            </Text>
          </div>
        )}

        {/* Recently Processed */}
        {progress.recentlyProcessed.length > 0 && (
          <div
            style={{
              background: "#f6ffed",
              border: "1px solid #b7eb8f",
              borderRadius: "8px",
              padding: "12px",
            }}
          >
            <Text
              strong
              style={{ color: "#52c41a", marginBottom: 8, display: "block" }}
            >
              <CheckCircleOutlined style={{ marginRight: 6 }} />
              Recently Completed:
            </Text>
            <div style={{ maxHeight: "80px", overflowY: "auto" }}>
              {progress.recentlyProcessed.slice(-3).map((file, index) => (
                <div
                  key={index}
                  style={{
                    fontSize: "12px",
                    color: "#52c41a",
                    marginBottom: 4,
                  }}
                >
                  ✅ {file}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Errors */}
        {progress.errors.length > 0 && (
          <div
            style={{
              background: "#fff2f0",
              border: "1px solid #ffccc7",
              borderRadius: "8px",
              padding: "12px",
            }}
          >
            <Text
              strong
              style={{ color: "#ff4d4f", marginBottom: 8, display: "block" }}
            >
              <ExclamationCircleOutlined style={{ marginRight: 6 }} />
              Errors ({progress.errors.length}):
            </Text>
            <div style={{ maxHeight: "100px", overflowY: "auto" }}>
              {progress.errors.slice(-2).map((error, index) => (
                <div key={index} style={{ fontSize: "11px", marginBottom: 8 }}>
                  <Text code style={{ color: "#ff4d4f" }}>
                    {error.file}
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: "10px" }}>
                    {error.error}
                  </Text>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completion Message */}
        {progress.isComplete && (
          <div
            style={{
              background: "#f6ffed",
              border: "2px solid #52c41a",
              borderRadius: "8px",
              padding: "16px",
              textAlign: "center",
            }}
          >
            <CheckCircleOutlined
              style={{ color: "#52c41a", fontSize: "32px", marginBottom: 8 }}
            />
            <br />
            <Title level={4} style={{ color: "#52c41a", margin: 0 }}>
              Analysis Complete!
            </Title>
            <Text type="secondary">
              Successfully processed {progress.successful} out of{" "}
              {progress.total} resumes
            </Text>
          </div>
        )}
      </Space>
    </Card>
  );
};

export default BatchProgressBar;
