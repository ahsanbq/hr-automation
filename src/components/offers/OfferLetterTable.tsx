import { useState, useEffect } from "react";
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Modal,
  message,
  Typography,
  Spin,
  Row,
  Col,
  Statistic,
  Empty,
  Tabs,
} from "antd";
import {
  EyeOutlined,
  FileDoneOutlined,
  DownloadOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { OfferLetterWithDetails } from "@/types/offer";
import CandidateViewModal from "./CandidateViewModal";
import OfferFormModal from "./OfferFormModal";
import ResumeList from "./ResumeList";
import { downloadOfferLetterPDF } from "@/lib/pdf-service";

const { Title, Text } = Typography;

interface OfferLetterTableProps {
  jobId: string;
  jobDetails: any;
}

export default function OfferLetterTable({
  jobId,
  jobDetails,
}: OfferLetterTableProps) {
  const [offers, setOffers] = useState<OfferLetterWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingCandidate, setViewingCandidate] = useState<any>(null);
  const [offerFormVisible, setOfferFormVisible] = useState(false);
  const [selectedResume, setSelectedResume] = useState<any>(null);
  const [editingOffer, setEditingOffer] =
    useState<OfferLetterWithDetails | null>(null);
  const [activeTab, setActiveTab] = useState<"offers" | "candidates">("offers");

  useEffect(() => {
    fetchOffers();
  }, [jobId]);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/offers?jobId=${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setOffers(data.offers || []);
      } else {
        console.error("Failed to fetch offers");
      }
    } catch (error) {
      console.error("Error fetching offers:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "default";
      case "SENT":
        return "blue";
      case "ACCEPTED":
        return "green";
      case "REJECTED":
        return "red";
      case "EXPIRED":
        return "orange";
      case "WITHDRAWN":
        return "purple";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <ClockCircleOutlined />;
      case "SENT":
        return <FileDoneOutlined />;
      case "ACCEPTED":
        return <CheckCircleOutlined />;
      case "REJECTED":
        return <CloseCircleOutlined />;
      case "EXPIRED":
        return <ClockCircleOutlined />;
      case "WITHDRAWN":
        return <CloseCircleOutlined />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  const handleGenerateOffer = (resume: any) => {
    setSelectedResume(resume);
    setOfferFormVisible(true);
  };

  const handleEditOffer = (offer: OfferLetterWithDetails) => {
    setEditingOffer(offer);
    setOfferFormVisible(true);
  };

  const handleDeleteOffer = async (offerId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/offers/${offerId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        message.success("Offer deleted successfully");
        fetchOffers();
      } else {
        message.error("Failed to delete offer");
      }
    } catch (error) {
      console.error("Error deleting offer:", error);
      message.error("Failed to delete offer");
    }
  };

  const handleDownloadPDF = (offer: OfferLetterWithDetails) => {
    try {
      downloadOfferLetterPDF(offer);
      message.success("PDF download initiated");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      message.error("Failed to download PDF");
    }
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      const token = localStorage.getItem("token");
      const url = editingOffer
        ? `/api/offers/${editingOffer.id}`
        : "/api/offers";
      const method = editingOffer ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          jobPostId: jobId,
          resumeId: selectedResume?.id || editingOffer?.resumeId,
        }),
      });

      if (response.ok) {
        message.success(
          editingOffer
            ? "Offer updated successfully"
            : "Offer created successfully"
        );
        setOfferFormVisible(false);
        setEditingOffer(null);
        setSelectedResume(null);
        fetchOffers();
      } else {
        const error = await response.json();
        message.error(error.error || "Failed to save offer");
      }
    } catch (error) {
      console.error("Error saving offer:", error);
      message.error("Failed to save offer");
    }
  };

  const columns = [
    {
      title: "Candidate",
      dataIndex: ["resume", "candidateName"],
      key: "candidate",
      render: (text: string, record: OfferLetterWithDetails) => (
        <div>
          <div style={{ fontWeight: 600 }}>{text}</div>
          {record.resume?.candidateEmail && (
            <div style={{ fontSize: 12, color: "#666" }}>
              {record.resume.candidateEmail}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Position",
      dataIndex: "offeredPosition",
      key: "position",
      render: (text: string) => <span style={{ fontSize: 13 }}>{text}</span>,
    },
    {
      title: "Salary",
      dataIndex: "salary",
      key: "salary",
      render: (text: string) => (
        <div style={{ display: "flex", alignItems: "center" }}>
          <DollarOutlined style={{ marginRight: 4, color: "#52c41a" }} />
          <span style={{ fontWeight: 500, color: "#52c41a" }}>{text}</span>
        </div>
      ),
    },
    {
      title: "Joining Date",
      dataIndex: "joiningDate",
      key: "joiningDate",
      render: (date: string) => (
        <div style={{ display: "flex", alignItems: "center" }}>
          <CalendarOutlined style={{ marginRight: 4, color: "#1890ff" }} />
          <span style={{ fontSize: 12 }}>
            {date ? new Date(date).toLocaleDateString() : "TBD"}
          </span>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status}
        </Tag>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => (
        <span style={{ fontSize: 12 }}>
          {new Date(date).toLocaleDateString()}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      render: (_: any, record: OfferLetterWithDetails) => (
        <Space size="small" wrap>
          <Button
            size="small"
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => setViewingCandidate(record)}
          >
            View
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditOffer(record)}
          >
            Edit
          </Button>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleDownloadPDF(record)}
          >
            PDF
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteOffer(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const stats = {
    total: offers.length,
    pending: offers.filter((o) => o.status === "PENDING").length,
    sent: offers.filter((o) => o.status === "SENT").length,
    accepted: offers.filter((o) => o.status === "ACCEPTED").length,
    rejected: offers.filter((o) => o.status === "REJECTED").length,
  };

  return (
    <>
      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Total Offers"
              value={stats.total}
              prefix={<FileDoneOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Pending"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Accepted"
              value={stats.accepted}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Rejected"
              value={stats.rejected}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: "#f5222d" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Job Details Card */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Title level={4} style={{ margin: 0 }}>
              {jobDetails.jobTitle}
            </Title>
            <Text type="secondary">
              {jobDetails.companyName} • {jobDetails.location} •{" "}
              {jobDetails.jobType}
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Main Content with Tabs */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as "offers" | "candidates")}
          items={[
            {
              key: "offers",
              label: (
                <span>
                  <FileDoneOutlined />
                  Offer Letters ({offers.length})
                </span>
              ),
              children: (
                <Spin spinning={loading}>
                  {offers.length === 0 ? (
                    <Empty
                      description="No offer letters found"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    >
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setActiveTab("candidates")}
                      >
                        Generate First Offer
                      </Button>
                    </Empty>
                  ) : (
                    <Table
                      size="small"
                      rowKey="id"
                      columns={columns}
                      dataSource={offers}
                      pagination={{ pageSize: 10, size: "small" }}
                      scroll={{ x: 800 }}
                    />
                  )}
                </Spin>
              ),
            },
            {
              key: "candidates",
              label: (
                <span>
                  <UserOutlined />
                  Candidates
                </span>
              ),
              children: (
                <ResumeList
                  jobId={jobId}
                  onGenerateOffer={handleGenerateOffer}
                />
              ),
            },
          ]}
        />
      </Card>

      {/* Candidate View Modal */}
      <CandidateViewModal
        visible={!!viewingCandidate}
        candidate={viewingCandidate}
        onClose={() => setViewingCandidate(null)}
        onGenerateOffer={handleGenerateOffer}
      />

      {/* Offer Form Modal */}
      <OfferFormModal
        visible={offerFormVisible}
        resume={selectedResume}
        offer={editingOffer}
        jobDetails={jobDetails}
        onClose={() => {
          setOfferFormVisible(false);
          setEditingOffer(null);
          setSelectedResume(null);
        }}
        onSubmit={handleFormSubmit}
      />
    </>
  );
}
