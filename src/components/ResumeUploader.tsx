import React from 'react';
import { Upload, Button, message, Progress } from 'antd';
import { UploadOutlined, CloudUploadOutlined } from '@ant-design/icons';
import type { UploadProps, UploadFile } from 'antd/es/upload/interface';

interface ResumeUploaderProps {
  fileList: UploadFile[];
  onChange: (fileList: UploadFile[]) => void;
  uploading?: boolean;
  disabled?: boolean;
  maxCount?: number;
  onAnalyze?: () => void;
}

const ResumeUploader: React.FC<ResumeUploaderProps> = ({
  fileList,
  onChange,
  uploading = false,
  disabled = false,
  maxCount = 20,
  onAnalyze,
}) => {
  const uploadProps: UploadProps = {
    multiple: true,
    fileList,
    beforeUpload: (file) => {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/rtf',
      ];

      if (!allowedTypes.includes(file.type)) {
        message.error(`${file.name} is not a supported file type`);
        return false;
      }

      // Validate file size (10MB)
      const isValidSize = file.size / 1024 / 1024 < 10;
      if (!isValidSize) {
        message.error(`${file.name} is larger than 10MB`);
        return false;
      }

      return false; // Prevent automatic upload
    },
    onChange: ({ fileList: newFileList }) => {
      onChange(newFileList);
    },
    onRemove: (file) => {
      const newFileList = fileList.filter((item) => item.uid !== file.uid);
      onChange(newFileList);
    },
    accept: '.pdf,.doc,.docx,.rtf,.txt',
    disabled: disabled || uploading,
    showUploadList: {
      showPreviewIcon: false,
      showDownloadIcon: false,
      showRemoveIcon: !disabled && !uploading,
    },
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled || uploading) return;

    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter((file) => {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/rtf',
      ];
      return allowedTypes.includes(file.type) && file.size / 1024 / 1024 < 10;
    });

    if (validFiles.length !== files.length) {
      message.warning('Some files were ignored due to type or size restrictions');
    }

    if (validFiles.length > 0) {
      const newFiles: UploadFile[] = validFiles.map((file, index) => ({
        uid: `${Date.now()}-${index}`,
        name: file.name,
        status: 'done' as const,
        size: file.size,
        type: file.type,
        originFileObj: file as any, // Cast to RcFile equivalent
      }));

      onChange([...fileList, ...newFiles].slice(0, maxCount));
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'txt':
        return '📃';
      case 'rtf':
        return '📄';
      default:
        return '📄';
    }
  };

  return (
    <div>
      <Upload.Dragger
        {...uploadProps}
        style={{
          background: uploading ? '#f5f5f5' : '#fafafa',
          borderColor: uploading ? '#d9d9d9' : '#d9d9d9',
        }}
        onDrop={handleDrop}
      >
        <p className="ant-upload-drag-icon">
          {uploading ? <CloudUploadOutlined spin /> : <UploadOutlined />}
        </p>
        <p className="ant-upload-text" style={{ fontSize: '16px', fontWeight: 500 }}>
          {uploading ? 'Uploading files...' : 'Click or drag resume files here'}
        </p>
        <p className="ant-upload-hint" style={{ fontSize: '14px', color: '#666' }}>
          Supports PDF, DOC, DOCX, RTF, TXT files up to 10MB each
          <br />
          Maximum {maxCount} files
        </p>
      </Upload.Dragger>

      {fileList.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ 
            background: '#f0f8ff', 
            border: '1px solid #b3d8ff', 
            borderRadius: 6, 
            padding: 12,
            marginBottom: 12 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#1890ff', fontWeight: 500 }}>
                📁 {fileList.length} file{fileList.length > 1 ? 's' : ''} ready for upload
              </span>
              <span style={{ color: '#666', fontSize: '12px' }}>
                Total: {(fileList.reduce((sum, file) => sum + (file.size || 0), 0) / 1024 / 1024).toFixed(1)}MB
              </span>
            </div>
          </div>

          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {fileList.map((file) => (
              <div
                key={file.uid}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  border: '1px solid #f0f0f0',
                  borderRadius: 4,
                  marginBottom: 4,
                  background: '#fafafa',
                }}
              >
                <span style={{ fontSize: '18px', marginRight: 8 }}>
                  {getFileIcon(file.name)}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: 500, 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {file.name}
                  </div>
                  {file.size && (
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {(file.size / 1024 / 1024).toFixed(1)}MB
                    </div>
                  )}
                </div>
                {!disabled && !uploading && (
                  <Button
                    type="text"
                    size="small"
                    danger
                    onClick={() => {
                      const newFileList = fileList.filter((item) => item.uid !== file.uid);
                      onChange(newFileList);
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>

          {onAnalyze && fileList.length > 0 && (
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Button
                type="primary"
                size="large"
                icon={<CloudUploadOutlined />}
                onClick={onAnalyze}
                loading={uploading}
                disabled={disabled}
                style={{ minWidth: 200 }}
              >
                {uploading ? 'Uploading & Analyzing...' : `Upload & Analyze ${fileList.length} Resume${fileList.length > 1 ? 's' : ''}`}
              </Button>
            </div>
          )}
        </div>
      )}

      {uploading && (
        <div style={{ marginTop: 16 }}>
          <Progress
            percent={100}
            status="active"
            showInfo={false}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
          <div style={{ textAlign: 'center', marginTop: 8, color: '#1890ff' }}>
            📤 Uploading to secure S3 storage and analyzing with AI...
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeUploader;
