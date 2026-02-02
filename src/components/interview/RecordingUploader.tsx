import React, { useState } from "react";
import {
  Card,
  Upload,
  Button,
  Progress,
  message,
  Space,
  Typography,
  Tag,
} from "antd";
import {
  UploadOutlined,
  VideoCameraOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import type { UploadProps } from "antd";

const { Text, Title } = Typography;

interface RecordingUploaderProps {
  assessmentId: string;
  onUploadSuccess?: () => void;
}

export default function RecordingUploader({
  assessmentId,
  onUploadSuccess,
}: RecordingUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<any>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // In a real implementation, upload to S3 first
      // For now, we'll create a metadata record
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/assessments/avatar/${assessmentId}/recordings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            filename: file.name,
            fileSize: file.size,
            duration: 0, // Would be extracted from video
          }),
        },
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const data = await response.json();
        setUploadedFile(data.recording);
        message.success("Recording uploaded successfully");
        onUploadSuccess?.();
      } else {
        message.error("Failed to upload recording");
      }
    } catch (error) {
      console.error("Error uploading recording:", error);
      message.error("Error uploading recording");
    } finally {
      setUploading(false);
    }

    return false; // Prevent default upload behavior
  };

  const uploadProps: UploadProps = {
    accept: "video/*,audio/*",
    beforeUpload: handleUpload,
    showUploadList: false,
    disabled: uploading || !!uploadedFile,
  };

  return (
    <Card
      title={
        <Space>
          <VideoCameraOutlined />
          Upload Interview Recording
        </Space>
      }
      size="small"
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {!uploadedFile ? (
          <>
            <Upload {...uploadProps}>
              <Button
                icon={<UploadOutlined />}
                loading={uploading}
                disabled={uploading || !!uploadedFile}
                size="large"
                type="primary"
              >
                Select Recording File
              </Button>
            </Upload>

            {uploading && (
              <div>
                <Text type="secondary">Uploading recording...</Text>
                <Progress percent={uploadProgress} status="active" />
              </div>
            )}

            <Text type="secondary">
              Supported formats: MP4, WebM, MOV, AVI (Max size: 500MB)
            </Text>
          </>
        ) : (
          <div>
            <Space direction="vertical">
              <Tag icon={<CheckCircleOutlined />} color="success">
                Recording Uploaded Successfully
              </Tag>
              <Text strong>{uploadedFile.filename}</Text>
              <Text type="secondary">
                Size: {(uploadedFile.fileSize / 1024 / 1024).toFixed(2)} MB
              </Text>
            </Space>
          </div>
        )}
      </Space>
    </Card>
  );
}
