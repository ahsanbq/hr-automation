/**
 * Modal component to display and manage saved MCQ questions with selection capability
 */

import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Typography,
  message,
  Row,
  Col,
  Divider,
  Steps,
  Space,
} from "antd";
import {
  SendOutlined,
  CheckSquareOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";

// Import step components
import QuestionSelectionStep from "./steps/QuestionSelectionStep";
import JobSelectionStep from "./steps/JobSelectionStep";
import CandidateSelectionStep from "./steps/CandidateSelectionStep";
import ConfirmationStep from "./steps/ConfirmationStep";

const { Title, Text } = Typography;

interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  topic: string;
  difficulty: string;
  explanation?: string;
  createdAt: string;
  createdBy: {
    name: string;
  };
}

interface Job {
  id: string;
  jobTitle: string;
  companyName: string;
  location: string;
  jobType: string;
  status?: string;
  createdAt: string;
  _count: {
    Resume: number;
  };
}

interface Candidate {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  experienceYears?: number;
  skills: string[];
  recommendation?: string;
  matchScore?: number;
  createdAt: string;
  summary?: string;
  education?: string;
  location?: string;
  User?: {
    id: number;
    name: string;
    email: string;
  };
}

interface SavedMCQModalProps {
  visible: boolean;
  onClose: () => void;
  jobId?: string;
  onSelectTemplate?: (template: any) => void;
}

export default function SavedMCQModal({
  visible,
  onClose,
  jobId,
  onSelectTemplate,
}: SavedMCQModalProps) {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Step 1: Question Selection
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);

  // Step 2: Job Selection
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Step 3: Candidate Selection
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);

  const steps = [
    {
      title: "Select Questions",
      description: "Choose MCQ questions to send",
      icon: <CheckSquareOutlined />,
    },
    {
      title: "Select Job",
      description: "Choose target job position",
      icon: <TeamOutlined />,
    },
    {
      title: "Select Candidates",
      description: "Pick candidates to send MCQ to",
      icon: <UserOutlined />,
    },
    {
      title: "Confirm & Send",
      description: "Review and send MCQ",
      icon: <SendOutlined />,
    },
  ];

  useEffect(() => {
    if (visible) {
      setCurrentStep(0);
      setSelectedQuestions([]);
      setSelectedJob(null);
      setSelectedCandidates([]);
      fetchInitialData();
    }
  }, [visible]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Fetch questions and jobs in parallel
      const [questionsResponse, jobsResponse] = await Promise.all([
        fetch("/api/assessments/mcq/templates", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }),
        fetch("/api/jobs", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }),
      ]);

      if (questionsResponse.ok) {
        const questionsData = await questionsResponse.json();
        setQuestions(questionsData.questions || []);
      }

      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        setJobs(jobsData.jobs || []);
      }
    } catch (error) {
      message.error("Failed to fetch initial data");
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidates = async (jobId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}/resumes`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCandidates(data.resumes || []);
      } else {
        message.error("Failed to fetch candidates");
      }
    } catch (error) {
      message.error("Failed to fetch candidates");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 0) {
      // Step 1: Validate question selection
      if (selectedQuestions.length === 0) {
        message.warning("Please select at least one question");
        return;
      }
      setCurrentStep(1);
    } else if (currentStep === 1) {
      // Step 2: Validate job selection
      if (!selectedJob) {
        message.warning("Please select a job");
        return;
      }
      fetchCandidates(selectedJob.id);
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Step 3: Validate candidate selection
      if (selectedCandidates.length === 0) {
        message.warning("Please select at least one candidate");
        return;
      }
      setCurrentStep(3);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSendMCQ = async () => {
    setLoading(true);
    try {
      // Send MCQ test with multiple questions to each selected candidate
      const promises = selectedCandidates.map(async (candidateId) => {
        const candidate = candidates.find((c) => c.id === candidateId);
        if (!candidate) return;

        const selectedQuestionObjects = questions.filter((q) =>
          selectedQuestions.includes(q.id)
        );
        const testTitle = `MCQ Assessment - ${selectedQuestionObjects.length} Questions - ${candidate.candidateName}`;
        const testDuration = Math.max(selectedQuestionObjects.length * 2, 15); // 2 minutes per question, minimum 15 minutes

        const response = await fetch("/api/interview/send-mcq-test", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            questionIds: selectedQuestions, // Send all selected questions
            title: testTitle,
            message: `MCQ Assessment for ${selectedJob?.jobTitle} - ${selectedQuestionObjects.length} questions`,
            duration: testDuration,
            jobId: selectedJob?.id,
            resumeId: candidate.id,
            candidateEmail: candidate.candidateEmail,
            candidateName: candidate.candidateName,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `Failed to send MCQ test to ${candidate.candidateName}: ${
              errorData.error || response.statusText
            }`
          );
        }

        return candidate;
      });

      await Promise.all(promises);

      message.success(
        `MCQ test with ${selectedQuestions.length} questions sent successfully to ${selectedCandidates.length} candidate(s)`
      );
      onClose();
    } catch (error) {
      message.error("Failed to send MCQ test to some candidates");
      console.error("Send MCQ test error:", error);
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return selectedQuestions.length > 0;
      case 1:
        return selectedJob !== null;
      case 2:
        return selectedCandidates.length > 0;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <QuestionSelectionStep
            questions={questions}
            selectedQuestions={selectedQuestions}
            onSelectionChange={setSelectedQuestions}
            loading={loading}
          />
        );
      case 1:
        return (
          <JobSelectionStep
            jobs={jobs}
            selectedJob={selectedJob}
            onJobSelect={setSelectedJob}
            loading={loading}
          />
        );
      case 2:
        return (
          <CandidateSelectionStep
            candidates={candidates}
            selectedCandidates={selectedCandidates}
            onSelectionChange={setSelectedCandidates}
            loading={loading}
          />
        );
      case 3:
        return (
          <ConfirmationStep
            selectedQuestions={selectedQuestions}
            selectedJob={selectedJob}
            selectedCandidates={selectedCandidates}
            questions={questions}
            candidates={candidates}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      title={
        <div style={{ textAlign: "center" }}>
          <Title level={3} style={{ margin: 0, marginBottom: 8 }}>
            Send MCQ Questions to Candidates
          </Title>
          <Text type="secondary">
            Multi-step process to select and distribute MCQ questions
          </Text>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={null}
      destroyOnClose
      style={{ top: 20 }}
    >
      {/* Progress Steps */}
      <div style={{ marginBottom: 32 }}>
        <Steps
          current={currentStep}
          items={steps}
          size="small"
          style={{ padding: "0 20px" }}
        />
      </div>

      {/* Step Content */}
      <div style={{ minHeight: 450, marginBottom: 24, padding: "0 8px" }}>
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <Divider />
      <Row justify="space-between" align="middle">
        <Col>
          {currentStep > 0 && (
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handlePrevious}
              disabled={loading}
            >
              Previous
            </Button>
          )}
        </Col>
        <Col>
          <Space>
            <Button onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            {currentStep < 3 ? (
              <Button
                type="primary"
                icon={<ArrowRightOutlined />}
                onClick={handleNext}
                disabled={!canProceed() || loading}
                loading={loading}
              >
                Next
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendMCQ}
                loading={loading}
              >
                Send MCQ Test ({selectedQuestions.length} Questions) to{" "}
                {selectedCandidates.length} Candidate(s)
              </Button>
            )}
          </Space>
        </Col>
      </Row>
    </Modal>
  );
}
