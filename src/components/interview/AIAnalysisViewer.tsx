import React, { useState } from "react";
import {
  Card,
  Button,
  Space,
  Typography,
  Descriptions,
  Tag,
  Progress,
  Divider,
  Empty,
} from "antd";
import {
  RobotOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

interface AIAnalysisViewerProps {
  analysis: {
    overallScore?: number;
    communicationScore?: number;
    technicalScore?: number;
    problemSolvingScore?: number;
    confidenceLevel?: number;
    strengths?: string[];
    improvements?: string[];
    transcript?: string;
    keyTopics?: string[];
    sentiment?: string;
    recommendation?: string;
  } | null;
  resultScore?: number | null;
}

export default function AIAnalysisViewer({
  analysis,
  resultScore,
}: AIAnalysisViewerProps) {
  const [showTranscript, setShowTranscript] = useState(false);

  if (!analysis && !resultScore) {
    return (
      <Card>
        <Empty
          description="AI analysis not available yet"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#52c41a";
    if (score >= 60) return "#faad14";
    return "#ff4d4f";
  };

  const getScoreStatus = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 70) return "Very Good";
    if (score >= 60) return "Good";
    if (score >= 50) return "Average";
    return "Needs Improvement";
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {/* Overall Score */}
      <Card>
        <div style={{ textAlign: "center" }}>
          <Title level={4}>
            <RobotOutlined /> AI Evaluation Results
          </Title>
          {resultScore && (
            <>
              <Progress
                type="circle"
                percent={Math.round(resultScore)}
                strokeColor={getScoreColor(resultScore)}
                format={(percent) => (
                  <div>
                    <div style={{ fontSize: "24px", fontWeight: "bold" }}>
                      {percent}%
                    </div>
                    <div style={{ fontSize: "12px", color: "#999" }}>
                      {getScoreStatus(percent || 0)}
                    </div>
                  </div>
                )}
                width={150}
              />
              <Paragraph type="secondary" style={{ marginTop: "16px" }}>
                Overall Interview Performance
              </Paragraph>
            </>
          )}
        </div>
      </Card>

      {/* Detailed Scores */}
      {analysis && (
        <Card title="Detailed Analysis">
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            {analysis.communicationScore !== undefined && (
              <div>
                <Text>Communication Skills</Text>
                <Progress
                  percent={analysis.communicationScore}
                  strokeColor={getScoreColor(analysis.communicationScore)}
                />
              </div>
            )}
            {analysis.technicalScore !== undefined && (
              <div>
                <Text>Technical Knowledge</Text>
                <Progress
                  percent={analysis.technicalScore}
                  strokeColor={getScoreColor(analysis.technicalScore)}
                />
              </div>
            )}
            {analysis.problemSolvingScore !== undefined && (
              <div>
                <Text>Problem Solving</Text>
                <Progress
                  percent={analysis.problemSolvingScore}
                  strokeColor={getScoreColor(analysis.problemSolvingScore)}
                />
              </div>
            )}
            {analysis.confidenceLevel !== undefined && (
              <div>
                <Text>Confidence Level</Text>
                <Progress
                  percent={analysis.confidenceLevel}
                  strokeColor={getScoreColor(analysis.confidenceLevel)}
                />
              </div>
            )}
          </Space>
        </Card>
      )}

      {/* Strengths and Improvements */}
      {analysis && (analysis.strengths || analysis.improvements) && (
        <Card>
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            {analysis.strengths && analysis.strengths.length > 0 && (
              <div>
                <Title level={5}>
                  <TrophyOutlined style={{ color: "#52c41a" }} /> Strengths
                </Title>
                <Space direction="vertical">
                  {analysis.strengths.map((strength, index) => (
                    <div key={index}>
                      <CheckCircleOutlined
                        style={{ color: "#52c41a", marginRight: "8px" }}
                      />
                      <Text>{strength}</Text>
                    </div>
                  ))}
                </Space>
              </div>
            )}

            {analysis.improvements && analysis.improvements.length > 0 && (
              <>
                <Divider />
                <div>
                  <Title level={5}>
                    <WarningOutlined style={{ color: "#faad14" }} /> Areas for
                    Improvement
                  </Title>
                  <Space direction="vertical">
                    {analysis.improvements.map((improvement, index) => (
                      <div key={index}>
                        <WarningOutlined
                          style={{ color: "#faad14", marginRight: "8px" }}
                        />
                        <Text>{improvement}</Text>
                      </div>
                    ))}
                  </Space>
                </div>
              </>
            )}
          </Space>
        </Card>
      )}

      {/* Key Topics and Recommendation */}
      {analysis && (analysis.keyTopics || analysis.recommendation) && (
        <Card title="Summary">
          <Descriptions bordered column={1}>
            {analysis.keyTopics && analysis.keyTopics.length > 0 && (
              <Descriptions.Item label="Key Topics Discussed">
                <Space wrap>
                  {analysis.keyTopics.map((topic, index) => (
                    <Tag key={index} color="blue">
                      {topic}
                    </Tag>
                  ))}
                </Space>
              </Descriptions.Item>
            )}
            {analysis.sentiment && (
              <Descriptions.Item label="Overall Sentiment">
                <Tag
                  color={
                    analysis.sentiment === "positive"
                      ? "green"
                      : analysis.sentiment === "negative"
                        ? "red"
                        : "orange"
                  }
                >
                  {analysis.sentiment.toUpperCase()}
                </Tag>
              </Descriptions.Item>
            )}
            {analysis.recommendation && (
              <Descriptions.Item label="Recommendation">
                <Text strong>{analysis.recommendation}</Text>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}

      {/* Transcript */}
      {analysis && analysis.transcript && (
        <Card
          title="Interview Transcript"
          extra={
            <Button
              type="link"
              onClick={() => setShowTranscript(!showTranscript)}
            >
              {showTranscript ? "Hide" : "Show"}
            </Button>
          }
        >
          {showTranscript && (
            <pre
              style={{
                whiteSpace: "pre-wrap",
                background: "#f5f5f5",
                padding: "16px",
                borderRadius: "4px",
                maxHeight: "400px",
                overflow: "auto",
              }}
            >
              {analysis.transcript}
            </pre>
          )}
        </Card>
      )}
    </Space>
  );
}
