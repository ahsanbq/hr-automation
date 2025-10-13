import React, { useState, useEffect } from "react";
import {
  Modal,
  Steps,
  Button,
  Row,
  Col,
  Divider,
  Space,
  Typography,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import JobSelectionStep from "./steps/JobSelectionStep";
import MeetingCandidateSelectionStep from "./steps/MeetingCandidateSelectionStep";
import AgendaGenerationStep from "./steps/AgendaGenerationStep";
import MeetingConfirmationStep from "./steps/MeetingConfirmationStep";

const { Title, Text } = Typography;

interface AssignMeetingModalProps {
  visible: boolean;
  onClose: () => void;
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
  matchScore?: number;
  recommendation?: string;
  createdAt: string;
}

const AssignMeetingModal: React.FC<AssignMeetingModalProps> = ({
  visible,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [agenda, setAgenda] = useState<string>("");
  const [meetingTime, setMeetingTime] = useState<string>("");
  const [meetingType, setMeetingType] = useState<string>("TECHNICAL");

  // Fetch jobs when modal opens
  useEffect(() => {
    if (visible) {
      fetchJobs();
    }
  }, [visible]);

  const fetchJobs = async () => {
    setJobsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/jobs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      } else {
        message.error("Failed to fetch jobs");
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      message.error("Failed to fetch jobs");
    } finally {
      setJobsLoading(false);
    }
  };

  const steps = [
    {
      title: "Select Job",
      description: "Choose the job position",
      icon: <CalendarOutlined />,
    },
    {
      title: "Select Candidates",
      description: "Choose candidates to invite",
      icon: <CalendarOutlined />,
    },
    {
      title: "Generate Agenda",
      description: "Create meeting agenda",
      icon: <CalendarOutlined />,
    },
    {
      title: "Confirm & Send",
      description: "Review and send invitations",
      icon: <CalendarOutlined />,
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return selectedJob !== null;
      case 1:
        return selectedCandidates.length > 0;
      case 2:
        return agenda.trim() !== "";
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleSendMeeting = async () => {
    setLoading(true);
    try {
      const promises = selectedCandidates.map(async (candidateId) => {
        const candidate = candidates.find((c) => c.id === candidateId);
        if (!candidate) return;

        const response = await fetch("/api/meetings/send-meeting", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            jobId: selectedJob?.id,
            resumeId: candidate.id,
            candidateEmail: candidate.candidateEmail,
            candidateName: candidate.candidateName,
            meetingTime: meetingTime,
            meetingType: meetingType,
            agenda: agenda,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `Failed to send meeting invitation to ${candidate.candidateName}: ${
              errorData.error || response.statusText
            }`
          );
        }

        return candidate;
      });

      await Promise.all(promises);

      message.success(
        `Meeting invitations sent successfully to ${selectedCandidates.length} candidate(s)`
      );
      onClose();
    } catch (error) {
      message.error("Failed to send meeting invitations to some candidates");
      console.error("Send meeting error:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <JobSelectionStep
            jobs={jobs}
            selectedJob={selectedJob}
            onJobSelect={setSelectedJob}
            loading={jobsLoading}
          />
        );
      case 1:
        return (
          <MeetingCandidateSelectionStep
            jobId={selectedJob?.id}
            selectedCandidates={selectedCandidates}
            onCandidatesSelect={setSelectedCandidates}
            candidates={candidates}
            setCandidates={setCandidates}
          />
        );
      case 2:
        return (
          <AgendaGenerationStep
            selectedJob={selectedJob}
            selectedCandidates={selectedCandidates}
            candidates={candidates}
            agenda={agenda}
            setAgenda={setAgenda}
            meetingTime={meetingTime}
            setMeetingTime={setMeetingTime}
            meetingType={meetingType}
            setMeetingType={setMeetingType}
          />
        );
      case 3:
        return (
          <MeetingConfirmationStep
            selectedJob={selectedJob}
            selectedCandidates={selectedCandidates}
            candidates={candidates}
            agenda={agenda}
            meetingTime={meetingTime}
            meetingType={meetingType}
          />
        );
      default:
        return null;
    }
  };

  const resetModal = () => {
    setCurrentStep(0);
    setJobs([]);
    setJobsLoading(false);
    setSelectedJob(null);
    setSelectedCandidates([]);
    setCandidates([]);
    setAgenda("");
    setMeetingTime("");
    setMeetingType("TECHNICAL");
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Modal
      title={
        <div style={{ textAlign: "center" }}>
          <Title level={3} style={{ margin: 0, marginBottom: 8 }}>
            Schedule Manual Meeting
          </Title>
          <Text type="secondary">
            Multi-step process to schedule and send meeting invitations
          </Text>
        </div>
      }
      open={visible}
      onCancel={handleClose}
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
            <Button onClick={handleClose} disabled={loading}>
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
                icon={<CalendarOutlined />}
                onClick={handleSendMeeting}
                loading={loading}
              >
                Send Meeting Invitations ({selectedCandidates.length} Candidate
                {selectedCandidates.length !== 1 ? "s" : ""})
              </Button>
            )}
          </Space>
        </Col>
      </Row>
    </Modal>
  );
};

export default AssignMeetingModal;
