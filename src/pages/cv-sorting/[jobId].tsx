import { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Table,
  Button,
  Modal,
  Input,
  message,
  Tag,
  Drawer,
  Space,
  Statistic,
  Popconfirm,
  Spin,
  Tabs,
  Upload,
  Dropdown,
} from "antd";
import {
  UploadOutlined,
  EyeOutlined,
  MailOutlined,
  PhoneOutlined,
  DeleteOutlined,
  FileTextOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import AppLayout from "@/components/layout/AppLayout";
import ResumeUploader from "@/components/ResumeUploader";
import RealTimeProgressModal from "@/components/RealTimeProgressModal";
import UploadProgressModal from "@/components/UploadProgressModal";

interface JobPost {
  id: string;
  jobTitle: string;
  companyName: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  skillsRequired: string;
  jobDescription: string;
  keyResponsibilities: string;
  qualifications: string;
  salaryRange: string;
  benefits: string;
}

interface Resume {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  matchScore: number;
  recommendation: string;
  skills: string[];
  experienceYears: number;
  education: string;
  summary: string;
  resumeUrl: string;
  uploadedBy?: {
    name: string;
    email: string;
  };
}

export default function JobResumePage() {
  const router = useRouter();
  const { jobId } = router.query;
  const [job, setJob] = useState<JobPost | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [resumeUrls, setResumeUrls] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeUploadTab, setActiveUploadTab] = useState<string>("urls");
  const [urlFields, setUrlFields] = useState<string[]>([""]);
  const [fileList, setFileList] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [uploadStep, setUploadStep] = useState<"select" | "upload" | "analyze">(
    "select"
  );

  // Upload progress tracking states
  const [showUploadProgress, setShowUploadProgress] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    total: 0,
    uploaded: 0,
    currentFile: "",
    percentage: 0,
    isComplete: false,
    errors: [] as string[],
  });

  // Analysis progress tracking states
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState({
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    currentBatch: 0,
    totalBatches: 0,
    isComplete: false,
    currentFile: "",
    percentage: 0,
  });
  const [progressInterval, setProgressInterval] =
    useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (jobId) {
      fetchJobAndResumes();
    }
  }, []);

  const fetchJobAndResumes = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        message.error("Please login first");
        router.push("/auth");
        return;
      }

      const [jobResponse, resumesResponse] = await Promise.all([
        fetch(`/api/jobs/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/jobs/${jobId}/resumes?sortBy=matchScore&order=desc`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      // Check if responses are ok before parsing JSON
      if (!jobResponse.ok) {
        const errorText = await jobResponse.text();
        console.error("Job API Error:", errorText);
        throw new Error(`Failed to fetch job: ${jobResponse.status}`);
      }

      if (!resumesResponse.ok) {
        const errorText = await resumesResponse.text();
        console.error("Resumes API Error:", errorText);
        throw new Error(`Failed to fetch resumes: ${resumesResponse.status}`);
      }

      const jobData = await jobResponse.json();
      const resumesData = await resumesResponse.json();

      setJob(jobData.job || jobData);
      setResumes(resumesData.resumes || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("Failed to load job data");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadFiles = async () => {
    if (fileList.length === 0) {
      message.error("Please select at least one file to upload");
      return;
    }

    setUploading(true);
    setUploadStep("upload");
    setShowUploadProgress(true);

    // Initialize upload progress
    setUploadProgress({
      total: fileList.length,
      uploaded: 0,
      currentFile: "",
      percentage: 0,
      isComplete: false,
      errors: [],
    });

    try {
      const token = localStorage.getItem("token");
      const uploadedResults = [];
      const errors: string[] = [];

      // Upload files one by one to track progress
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const fileName =
          file.name || file.originFileObj?.name || `File ${i + 1}`;

        // Update current file being uploaded
        setUploadProgress((prev) => ({
          ...prev,
          currentFile: fileName,
          percentage: Math.round((i / fileList.length) * 100),
        }));

        try {
          const formData = new FormData();
          formData.append("resumes", file.originFileObj || file);

          const response = await fetch(`/api/jobs/${jobId}/upload-resumes`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });

          const data = await response.json();

          if (response.ok && data.results && data.results.length > 0) {
            uploadedResults.push(...data.results);

            // Update progress for successful upload
            setUploadProgress((prev) => ({
              ...prev,
              uploaded: i + 1,
              percentage: Math.round(((i + 1) / fileList.length) * 100),
            }));

            console.log(`✅ Uploaded ${i + 1}/${fileList.length}: ${fileName}`);
          } else {
            const errorMsg = data.error || "Unknown upload error";
            errors.push(`${fileName}: ${errorMsg}`);
            console.error(`❌ Failed to upload ${fileName}:`, errorMsg);
          }
        } catch (uploadError) {
          const errorMsg =
            uploadError instanceof Error
              ? uploadError.message
              : "Network error";
          errors.push(`${fileName}: ${errorMsg}`);
          console.error(`❌ Upload error for ${fileName}:`, uploadError);
        }

        // Small delay between uploads to prevent overwhelming the server
        if (i < fileList.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      // Mark upload as complete
      setUploadProgress((prev) => ({
        ...prev,
        isComplete: true,
        percentage: 100,
        currentFile: "",
        errors,
      }));

      if (uploadedResults.length > 0) {
        setUploadedFiles(uploadedResults);
        setUploadStep("analyze");

        // Show completion message after a short delay
        setTimeout(() => {
          setShowUploadProgress(false);
          if (errors.length > 0) {
            message.warning(
              `${uploadedResults.length} file(s) uploaded successfully, ${errors.length} failed. Ready for analysis.`
            );
          } else {
            message.success(
              `All ${uploadedResults.length} file(s) uploaded successfully! Ready for analysis.`
            );
          }
        }, 1500);
      } else {
        setUploadStep("select");
        setTimeout(() => {
          setShowUploadProgress(false);
          message.error("All uploads failed. Please try again.");
        }, 1500);
      }
    } catch (error) {
      console.error("Error during upload process:", error);
      setUploadStep("select");
      setTimeout(() => {
        setShowUploadProgress(false);
        message.error("Upload process failed. Please try again.");
      }, 1500);
    } finally {
      setUploading(false);
    }
  };

  const startProgressPolling = () => {
    if (progressInterval) clearInterval(progressInterval);

    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem("token");

        // Decode userId from token
        let userId = null;
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            userId = payload.userId;
          } catch (e) {
            console.error("Error decoding token:", e);
          }
        }

        if (!userId) {
          console.error("No userId found in token");
          return;
        }

        // Add timestamp to prevent caching
        const timestamp = Date.now();
        const response = await fetch(
          `/api/jobs/${jobId}/progress?t=${timestamp}&userId=${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Cache-Control": "no-cache",
            },
          }
        );

        console.log("📊 Progress API response:", response.status);

        if (response.ok) {
          const data = await response.json();
          console.log("📊 Progress data received:", data);

          // Check if progress was found
          if (data.found) {
            setProgress(data);

            // Stop polling when complete
            if (data.isComplete) {
              console.log("🎉 Analysis complete, stopping polling");
              clearInterval(interval);
              setProgressInterval(null);
              // Keep modal open for 2 seconds to show completion
              setTimeout(() => {
                setShowProgress(false);
                setAnalyzing(false);
                fetchJobAndResumes(); // Refresh the resume list
                message.success(
                  `Analysis complete! ${
                    data.successful || 0
                  } resumes processed successfully.`
                );
              }, 2000);
            }
          } else {
            console.log("📊 No progress found for this job/user combination");
          }
        }
      } catch (error) {
        console.error("Error polling progress:", error);
      }
    }, 1000); // Poll every second

    setProgressInterval(interval);
  };

  const stopProgressPolling = () => {
    if (progressInterval) {
      clearInterval(progressInterval);
      setProgressInterval(null);
    }
  };

  useEffect(() => {
    return () => {
      stopProgressPolling(); // Cleanup on unmount
    };
  }, []);

  const handleAnalyzeUploadedFiles = async () => {
    if (uploadedFiles.length === 0) {
      message.error("No uploaded files to analyze");
      return;
    }

    setAnalyzing(true);
    setShowProgress(true);
    startProgressPolling();

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`/api/jobs/${jobId}/batch-analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          uploaded_files: uploadedFiles,
          batch_size: 5,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Progress polling will handle the completion
        handleCloseModal();
      } else {
        message.error(data.error || "Failed to analyze resumes");
        setAnalyzing(false);
        setShowProgress(false);
        stopProgressPolling();
      }
    } catch (error) {
      console.error("Error analyzing resumes:", error);
      message.error("Failed to analyze resumes");
      setAnalyzing(false);
      setShowProgress(false);
      stopProgressPolling();
    }
  };

  const handleAnalyzeUrls = async () => {
    const urls = urlFields.map((u) => u.trim()).filter((u) => u.length > 0);
    if (urls.length === 0) {
      message.error("Please enter at least one resume URL");
      return;
    }

    setAnalyzing(true);
    setShowProgress(true);
    startProgressPolling();

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/jobs/${jobId}/batch-analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          resume_paths: urls,
          batch_size: 5,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Progress polling will handle the completion
        handleCloseModal();
      } else {
        message.error(data.error || "Failed to analyze resumes");
        setAnalyzing(false);
        setShowProgress(false);
        stopProgressPolling();
      }
    } catch (error) {
      console.error("Error analyzing resumes:", error);
      message.error("Failed to analyze resumes");
      setAnalyzing(false);
      setShowProgress(false);
      stopProgressPolling();
    }
  };

  const handleSingleAnalyzeUrls = async (urls: string[]) => {
    setAnalyzing(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/jobs/${jobId}/resumes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          resume_paths: urls,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        message.success(
          `${data.resumes?.length || 0} resumes analyzed successfully`
        );
        handleCloseModal();
        fetchJobAndResumes();
      } else {
        message.error(data.error || "Failed to analyze resumes");
      }
    } catch (error) {
      console.error("Error analyzing resumes:", error);
      message.error("Failed to analyze resumes");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCloseModal = () => {
    if (!analyzing && !uploading) {
      setUploadModalVisible(false);
      setFileList([]);
      setUrlFields([""]);
      setUploadedFiles([]);
      setUploadStep("select");
      setShowProgress(false);
      setShowUploadProgress(false);
      stopProgressPolling();
      // Reset upload progress
      setUploadProgress({
        total: 0,
        uploaded: 0,
        currentFile: "",
        percentage: 0,
        isComplete: false,
        errors: [],
      });
    }
  };

  const handleAnalyzeResumes = async () => {
    if (activeUploadTab === "urls") {
      await handleAnalyzeUrls();
    } else {
      if (uploadStep === "select") {
        await handleUploadFiles();
      } else if (uploadStep === "analyze") {
        await handleAnalyzeUploadedFiles();
      }
    }
  };

  const handleDeleteResume = async (resumeId: string) => {
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/resumes/${resumeId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        message.success("Resume deleted successfully");
        fetchJobAndResumes();
      } else {
        const data = await response.json();
        message.error(data.error || "Failed to delete resume");
      }
    } catch (error) {
      console.error("Error deleting resume:", error);
      message.error("Failed to delete resume");
    } finally {
      setDeleting(false);
    }
  };

  // Export functions
  const exportToExcel = () => {
    // Calculate statistics
    const totalResumes = resumes.length;
    const avgMatchScore =
      resumes.length > 0
        ? (
            resumes.reduce((sum, r) => sum + (r.matchScore || 0), 0) /
            resumes.length
          ).toFixed(1)
        : 0;
    const highlyRecommended = resumes.filter(
      (r) => r.recommendation?.toLowerCase() === "highly recommended"
    ).length;
    const consider = resumes.filter(
      (r) => r.recommendation?.toLowerCase() === "consider"
    ).length;

    const csvContent = [
      // Title row
      [`Resumes for ${job?.jobTitle || "Job Position"}`],
      // Statistics rows
      [`Total Resumes,${totalResumes}`],
      [`Avg Match Score,${avgMatchScore}%`],
      [`Highly Recommended,${highlyRecommended}`],
      [`Consider,${consider}`],
      // Empty row for spacing
      [""],
      // Headers
      [
        "No.",
        "Candidate Name",
        "Email",
        "Phone",
        "Match Score",
        "Recommendation",
        "Experience",
        "Remarks",
      ],
      // Data rows
      ...resumes.map((resume, index) => [
        index + 1, // Serial number
        resume.candidateName || "",
        resume.candidateEmail || "",
        resume.candidatePhone || "",
        resume.matchScore || 0,
        resume.recommendation || "",
        resume.experienceYears || 0,
        "", // Empty Remarks column
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `resumes_${job?.jobTitle || "job"}_${
        new Date().toISOString().split("T")[0]
      }.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    message.success("Resumes exported to Excel successfully!");
  };

  const exportToPDF = () => {
    // Calculate statistics
    const totalResumes = resumes.length;
    const avgMatchScore =
      resumes.length > 0
        ? (
            resumes.reduce((sum, r) => sum + (r.matchScore || 0), 0) /
            resumes.length
          ).toFixed(1)
        : 0;
    const highlyRecommended = resumes.filter(
      (r) => r.recommendation?.toLowerCase() === "highly recommended"
    ).length;
    const consider = resumes.filter(
      (r) => r.recommendation?.toLowerCase() === "consider"
    ).length;

    // Create a simple HTML table for PDF generation
    const tableHTML = `
      <html>
        <head>
          <title>Resumes Export</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              background: white;
              color: #333;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 20px; 
              border: 1px solid #ddd; 
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 12px 8px; 
              text-align: left; 
              font-size: 14px;
            }
            th { 
              background-color: #f8f9fa; 
              font-weight: bold; 
              color: #495057;
            }
            th:last-child, td:last-child { border-right: 1px solid #ddd !important; }
            tr:last-child td { border-bottom: 1px solid #ddd; }
            td:last-child { border-right: 1px solid #ddd !important; }
            tr:nth-child(even) { background-color: #f8f9fa; }
            tr:hover { background-color: #e9ecef; }
            .header { text-align: center; margin-bottom: 20px; }
            .job-title { font-size: 18px; font-weight: bold; }
            .export-date { font-size: 12px; color: #666; }
            .stats { margin: 20px 0; }
            .stats-row { display: flex; justify-content: space-around; margin: 10px 0; }
            .stat-item { text-align: center; padding: 10px; border: 1px solid #ddd; flex: 1; margin: 0 5px; }
            .stat-label { font-size: 12px; color: #666; }
            .stat-value { font-size: 18px; font-weight: bold; color: #1890ff; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="job-title">Resumes for ${
              job?.jobTitle || "Job Position"
            }</div>
            <div class="export-date">Exported on ${new Date().toLocaleDateString()}</div>
          </div>
          
          <div class="stats">
            <div class="stats-row">
              <div class="stat-item">
                <div class="stat-label">Total Resumes</div>
                <div class="stat-value">${totalResumes}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Avg Match Score</div>
                <div class="stat-value">${avgMatchScore}%</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Highly Recommended</div>
                <div class="stat-value">${highlyRecommended}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Consider</div>
                <div class="stat-value">${consider}</div>
              </div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Candidate Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Match Score</th>
                <th>Recommendation</th>
                <th>Experience</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${resumes
                .map(
                  (resume, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${resume.candidateName || ""}</td>
                  <td>${resume.candidateEmail || ""}</td>
                  <td>${resume.candidatePhone || ""}</td>
                  <td>${resume.matchScore || 0}%</td>
                  <td>${resume.recommendation || ""}</td>
                  <td>${resume.experienceYears || 0} years</td>
                  <td></td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(tableHTML);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }

    message.success("Resumes exported to PDF successfully!");
  };

  const addUrlField = () => setUrlFields((prev) => [...prev, ""]);
  const removeUrlField = (index: number) =>
    setUrlFields((prev) => prev.filter((_, i) => i !== index));
  const changeUrlField = (index: number, value: string) => {
    setUrlFields((prev) => prev.map((v, i) => (i === index ? value : v)));
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#52c41a";
    if (score >= 60) return "#faad14";
    return "#ff4d4f";
  };

  const getRecommendationColor = (recommendation: string) => {
    switch ((recommendation || "").toLowerCase()) {
      case "highly recommended":
        return "green";
      case "consider":
        return "orange";
      case "not suitable":
        return "red";
      default:
        return "default" as any;
    }
  };

  const columns = [
    {
      title: "Candidate Name",
      dataIndex: "candidateName",
      key: "candidateName",
      width: 150,
      sorter: (a: Resume, b: Resume) =>
        a.candidateName.localeCompare(b.candidateName),
      render: (name: string) => (
        <div style={{ fontWeight: 500, color: "#1890ff", fontSize: "13px" }}>
          {name}
        </div>
      ),
    },
    {
      title: "Email",
      dataIndex: "candidateEmail",
      key: "candidateEmail",
      width: 180,
      render: (email: string) =>
        email ? (
          <a
            href={`mailto:${email}`}
            style={{ color: "#1890ff", fontSize: "12px" }}
          >
            {email}
          </a>
        ) : (
          <span style={{ color: "#999", fontSize: "12px" }}>N/A</span>
        ),
    },
    {
      title: "Phone",
      dataIndex: "candidatePhone",
      key: "candidatePhone",
      width: 120,
      render: (phone: string) =>
        phone ? (
          <a
            href={`tel:${phone}`}
            style={{ color: "#1890ff", fontSize: "12px" }}
          >
            {phone}
          </a>
        ) : (
          <span style={{ color: "#999", fontSize: "12px" }}>N/A</span>
        ),
    },
    {
      title: "Match Score",
      dataIndex: "matchScore",
      key: "matchScore",
      width: 100,
      align: "center" as const,
      sorter: (a: Resume, b: Resume) =>
        (a.matchScore || 0) - (b.matchScore || 0),
      render: (score: number) => (
        <Tag
          color={getScoreColor(score)}
          style={{
            fontSize: "11px",
            fontWeight: "bold",
            minWidth: "50px",
            textAlign: "center",
            margin: 0,
          }}
        >
          {score ? `${score}%` : "N/A"}
        </Tag>
      ),
    },
    {
      title: "Recommendation",
      dataIndex: "recommendation",
      key: "recommendation",
      width: 120,
      align: "center" as const,
      render: (recommendation: string) => (
        <Tag
          color={getRecommendationColor(recommendation)}
          style={{ fontSize: "11px", margin: 0 }}
        >
          {recommendation || "N/A"}
        </Tag>
      ),
    },
    {
      title: "Experience",
      dataIndex: "experienceYears",
      key: "experienceYears",
      width: 100,
      align: "center" as const,
      render: (years: number) => (
        <span style={{ color: years ? "#000" : "#999", fontSize: "12px" }}>
          {years ? `${years}y` : "N/A"}
        </span>
      ),
      sorter: (a: Resume, b: Resume) =>
        (a.experienceYears || 0) - (b.experienceYears || 0),
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      align: "center" as const,
      render: (_: unknown, record: Resume) => (
        <Space size="small" wrap>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedResume(record);
              setDrawerVisible(true);
            }}
            style={{ fontSize: "11px", height: "24px" }}
          >
            View
          </Button>
          <Button
            type="default"
            size="small"
            icon={<FileTextOutlined />}
            onClick={async () => {
              try {
                const token = localStorage.getItem("token");

                if (!token) {
                  alert("Please log in to access CV files.");
                  return;
                }

                const response = await fetch(
                  `/api/resumes/${record.id}/presigned-url`,
                  {
                    headers: { Authorization: `Bearer ${token}` },
                  }
                );

                if (response.ok) {
                  const data = await response.json();
                  window.open(
                    data.presignedUrl,
                    "_blank",
                    "noopener,noreferrer"
                  );
                } else if (response.status === 401) {
                  alert("Please log in to access CV files.");
                } else if (response.status === 403) {
                  alert("You don't have permission to access this CV.");
                } else {
                  // Show specific error message
                  const errorData = await response.json();
                  console.error(
                    "Failed to get fresh presigned URL:",
                    errorData
                  );

                  if (errorData.error === "S3 configuration error") {
                    alert(
                      "CV access is temporarily unavailable due to server configuration. Please contact support."
                    );
                  } else {
                    alert(
                      "Unable to access CV. Please try again or contact support."
                    );
                  }
                }
              } catch (error) {
                console.error("Error getting fresh URL:", error);
                // Show error message instead of using expired URL
                alert(
                  "Unable to access CV. Please try again or contact support."
                );
              }
            }}
            style={{ fontSize: "11px", height: "24px" }}
          >
            CV
          </Button>
          <Popconfirm
            title="Delete Resume"
            description="Are you sure?"
            onConfirm={() => handleDeleteResume(record.id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true, loading: deleting }}
          >
            <Button
              type="primary"
              danger
              size="small"
              icon={<DeleteOutlined />}
              style={{ fontSize: "11px", height: "24px" }}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <AppLayout>
        <div style={{ padding: "24px" }}>
          <Spin size="large" spinning={true}>
            <div style={{ minHeight: "400px" }}>
              <div
                style={{
                  textAlign: "center",
                  padding: "100px 0",
                  color: "#666",
                }}
              >
                Loading job and resume data...
              </div>
            </div>
          </Spin>
        </div>
      </AppLayout>
    );
  }

  if (!job) {
    return (
      <AppLayout>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "400px",
            fontSize: "16px",
            color: "#f5222d",
          }}
        >
          Job not found
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Spin size="large" spinning={analyzing} tip="Analyzing resumes...">
        <div style={{ padding: "24px" }}>
          <Row gutter={24}>
            {/* Main Content - Resume List */}
            <Col span={18}>
              <Card
                title={
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: "18px", fontWeight: "bold" }}>
                      Resumes for {job?.jobTitle}
                    </span>
                    <Space>
                      <Dropdown
                        menu={{
                          items: [
                            {
                              key: "excel",
                              label: "Export as Excel",
                              icon: <DownloadOutlined />,
                              onClick: exportToExcel,
                            },
                            {
                              key: "pdf",
                              label: "Export as PDF",
                              icon: <FileTextOutlined />,
                              onClick: exportToPDF,
                            },
                          ],
                        }}
                        trigger={["click"]}
                      >
                        <Button
                          icon={<DownloadOutlined />}
                          size="large"
                          style={{
                            backgroundColor: "#52c41a",
                            borderColor: "#52c41a",
                            color: "white",
                          }}
                        >
                          Export
                        </Button>
                      </Dropdown>
                      <Button
                        type="primary"
                        icon={<UploadOutlined />}
                        onClick={() => setUploadModalVisible(true)}
                        size="large"
                      >
                        Analyze New Resumes
                      </Button>
                    </Space>
                  </div>
                }
                style={{ borderRadius: "8px" }}
              >
                <div style={{ marginBottom: "20px" }}>
                  <Row gutter={16}>
                    <Col span={6}>
                      <Card
                        size="small"
                        style={{ textAlign: "center", borderRadius: "6px" }}
                      >
                        <Statistic
                          title="Total Resumes"
                          value={resumes.length}
                          valueStyle={{ color: "#1890ff", fontSize: "24px" }}
                        />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card
                        size="small"
                        style={{ textAlign: "center", borderRadius: "6px" }}
                      >
                        <Statistic
                          title="Avg Match Score"
                          value={
                            resumes.length > 0
                              ? resumes.reduce(
                                  (sum, r) => sum + (r.matchScore || 0),
                                  0
                                ) / resumes.length
                              : 0
                          }
                          suffix="%"
                          precision={1}
                          valueStyle={{
                            color:
                              resumes.length > 0 &&
                              resumes.reduce(
                                (sum, r) => sum + (r.matchScore || 0),
                                0
                              ) /
                                resumes.length >=
                                70
                                ? "#52c41a"
                                : "#faad14",
                            fontSize: "24px",
                          }}
                        />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card
                        size="small"
                        style={{ textAlign: "center", borderRadius: "6px" }}
                      >
                        <Statistic
                          title="Highly Recommended"
                          value={
                            resumes.filter(
                              (r) =>
                                r.recommendation?.toLowerCase() ===
                                "highly recommended"
                            ).length
                          }
                          valueStyle={{ color: "#52c41a", fontSize: "24px" }}
                        />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card
                        size="small"
                        style={{ textAlign: "center", borderRadius: "6px" }}
                      >
                        <Statistic
                          title="Consider"
                          value={
                            resumes.filter(
                              (r) =>
                                r.recommendation?.toLowerCase() === "consider"
                            ).length
                          }
                          valueStyle={{ color: "#faad14", fontSize: "24px" }}
                        />
                      </Card>
                    </Col>
                  </Row>
                </div>

                {/* Progress Bar */}
                <RealTimeProgressModal
                  progress={progress}
                  visible={showProgress}
                  onCancel={() => setShowProgress(false)}
                />

                <Table
                  dataSource={resumes}
                  columns={columns}
                  rowKey="id"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total, range) =>
                      `${range[0]}-${range[1]} of ${total} resumes`,
                    showQuickJumper: true,
                  }}
                  style={{ borderRadius: "6px" }}
                  size="small"
                  scroll={{ x: 1000 }}
                  bordered
                />
              </Card>
            </Col>

            {/* Sidebar - Job Details */}
            <Col span={6}>
              <Card
                title="Job Details"
                style={{ borderRadius: "8px" }}
                headStyle={{ backgroundColor: "#fafafa" }}
              >
                {job && (
                  <div>
                    <div style={{ marginBottom: "16px" }}>
                      <h3
                        style={{
                          color: "#1890ff",
                          marginBottom: "8px",
                          fontSize: "16px",
                        }}
                      >
                        {job.jobTitle}
                      </h3>
                      <div style={{ lineHeight: "1.6", fontSize: "12px" }}>
                        <p>
                          <strong>Company:</strong> {job.companyName}
                        </p>
                        <p>
                          <strong>Location:</strong> {job.location}
                        </p>
                        <p>
                          <strong>Type:</strong> {job.jobType}
                        </p>
                        <p>
                          <strong>Experience:</strong> {job.experienceLevel}
                        </p>
                        {job.salaryRange && (
                          <p>
                            <strong>Salary:</strong> {job.salaryRange}
                          </p>
                        )}
                      </div>
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                      <h4
                        style={{
                          color: "#1890ff",
                          marginBottom: "6px",
                          fontSize: "14px",
                        }}
                      >
                        Required Skills
                      </h4>
                      <div>
                        {(() => {
                          try {
                            // Handle both string and array formats
                            let skills = [];
                            if (typeof job.skillsRequired === "string") {
                              // Try to parse as JSON first
                              if (job.skillsRequired.startsWith("[")) {
                                skills = JSON.parse(job.skillsRequired);
                              } else {
                                // Split by comma if it's a comma-separated string
                                skills = job.skillsRequired
                                  .split(",")
                                  .map((s) => s.trim());
                              }
                            } else if (Array.isArray(job.skillsRequired)) {
                              skills = job.skillsRequired;
                            }

                            return skills.map(
                              (skill: string, index: number) => (
                                <Tag
                                  key={index}
                                  color="blue"
                                  style={{
                                    marginBottom: "2px",
                                    fontSize: "11px",
                                    marginRight: "4px",
                                    maxWidth: "100%",
                                    whiteSpace: "normal",
                                    wordBreak: "break-word",
                                    lineHeight: "1.4",
                                    padding: "4px 8px",
                                  }}
                                >
                                  {skill.trim()}
                                </Tag>
                              )
                            );
                          } catch (e) {
                            return (
                              <span style={{ color: "#999", fontSize: "11px" }}>
                                No skills specified
                              </span>
                            );
                          }
                        })()}
                      </div>
                    </div>

                    {job.jobDescription && (
                      <div style={{ marginBottom: "16px" }}>
                        <h4
                          style={{
                            color: "#1890ff",
                            marginBottom: "6px",
                            fontSize: "14px",
                          }}
                        >
                          Job Description
                        </h4>
                        <div
                          style={{
                            fontSize: "11px",
                            lineHeight: "1.4",
                            padding: "8px",
                            backgroundColor: "#f5f5f5",
                            borderRadius: "4px",
                            border: "1px solid #d9d9d9",
                          }}
                        >
                          {job.jobDescription.substring(0, 150)}...
                        </div>
                      </div>
                    )}

                    {job.keyResponsibilities && (
                      <div style={{ marginBottom: "16px" }}>
                        <h4
                          style={{
                            color: "#1890ff",
                            marginBottom: "6px",
                            fontSize: "14px",
                          }}
                        >
                          Key Responsibilities
                        </h4>
                        <div>
                          {(() => {
                            try {
                              // Handle both string and array formats
                              let responsibilities = [];
                              if (typeof job.keyResponsibilities === "string") {
                                // Try to parse as JSON first
                                if (job.keyResponsibilities.startsWith("[")) {
                                  responsibilities = JSON.parse(
                                    job.keyResponsibilities
                                  );
                                } else {
                                  // Split by newline if it's a newline-separated string
                                  responsibilities = job.keyResponsibilities
                                    .split("\n")
                                    .filter((r) => r.trim());
                                }
                              } else if (
                                Array.isArray(job.keyResponsibilities)
                              ) {
                                responsibilities = job.keyResponsibilities;
                              }

                              return responsibilities.length > 0 ? (
                                responsibilities.map(
                                  (item: any, index: any) => (
                                    <Tag
                                      key={index}
                                      color="green"
                                      style={{
                                        marginBottom: "4px",
                                        fontSize: "11px",
                                        display: "inline-block",
                                        marginRight: "4px",
                                        maxWidth: "100%",
                                        whiteSpace: "normal",
                                        wordBreak: "break-word",
                                        lineHeight: "1.4",
                                        padding: "4px 8px",
                                      }}
                                    >
                                      {item.trim()}
                                    </Tag>
                                  )
                                )
                              ) : (
                                <span
                                  style={{ color: "#999", fontSize: "11px" }}
                                >
                                  No responsibilities specified
                                </span>
                              );
                            } catch (e) {
                              return (
                                <span
                                  style={{ color: "#999", fontSize: "11px" }}
                                >
                                  No responsibilities specified
                                </span>
                              );
                            }
                          })()}
                        </div>
                      </div>
                    )}

                    {job.qualifications && (
                      <div>
                        <h4
                          style={{
                            color: "#1890ff",
                            marginBottom: "6px",
                            fontSize: "14px",
                          }}
                        >
                          Qualifications
                        </h4>
                        <div>
                          {(() => {
                            try {
                              // Handle both string and array formats
                              let qualifications = [];
                              if (typeof job.qualifications === "string") {
                                // Try to parse as JSON first
                                if (job.qualifications.startsWith("[")) {
                                  qualifications = JSON.parse(
                                    job.qualifications
                                  );
                                } else {
                                  // Split by newline if it's a newline-separated string
                                  qualifications = job.qualifications
                                    .split("\n")
                                    .filter((q) => q.trim());
                                }
                              } else if (Array.isArray(job.qualifications)) {
                                qualifications = job.qualifications;
                              }

                              return qualifications.length > 0 ? (
                                qualifications.map((item: any, index: any) => (
                                  <Tag
                                    key={index}
                                    color="orange"
                                    style={{
                                      marginBottom: "4px",
                                      fontSize: "11px",
                                      display: "inline-block",
                                      marginRight: "4px",
                                      maxWidth: "100%",
                                      whiteSpace: "normal",
                                      wordBreak: "break-word",
                                      lineHeight: "1.4",
                                      padding: "4px 8px",
                                    }}
                                  >
                                    {item.trim()}
                                  </Tag>
                                ))
                              ) : (
                                <span
                                  style={{ color: "#999", fontSize: "11px" }}
                                >
                                  No qualifications specified
                                </span>
                              );
                            } catch (e) {
                              return (
                                <span
                                  style={{ color: "#999", fontSize: "11px" }}
                                >
                                  No qualifications specified
                                </span>
                              );
                            }
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </Col>
          </Row>

          {/* Upload Modal */}
          <Modal
            title="Analyze New Resumes"
            open={uploadModalVisible}
            onCancel={handleCloseModal}
            onOk={undefined}
            footer={[
              <Button
                key="cancel"
                onClick={handleCloseModal}
                disabled={analyzing || uploading}
              >
                Cancel
              </Button>,
              <Button
                key="submit"
                type="primary"
                loading={analyzing || uploading}
                onClick={handleAnalyzeResumes}
                disabled={
                  activeUploadTab === "urls"
                    ? urlFields.every((u) => !u.trim())
                    : (uploadStep === "select" && fileList.length === 0) ||
                      (uploadStep === "analyze" && uploadedFiles.length === 0)
                }
              >
                {activeUploadTab === "urls"
                  ? "Analyze URLs"
                  : uploadStep === "select"
                  ? "Upload Files"
                  : uploadStep === "upload"
                  ? "Uploading..."
                  : "Analyze CVs"}
              </Button>,
            ]}
            confirmLoading={false}
            width={700}
            closable={!analyzing && !uploading}
            maskClosable={!analyzing && !uploading}
          >
            <Tabs
              activeKey={activeUploadTab}
              onChange={(k) => {
                if (!analyzing && !uploading) {
                  setActiveUploadTab(k);
                  if (k === "files") {
                    setUploadStep("select");
                    setUploadedFiles([]);
                  }
                }
              }}
              items={[
                {
                  key: "urls",
                  label: "Upload by URLs",
                  children: (
                    <div>
                      <p style={{ color: "#666", marginBottom: 12 }}>
                        Add one or more resume URLs. The AI will analyze these
                        resumes against the job requirements.
                      </p>
                      <Space direction="vertical" style={{ width: "100%" }}>
                        {urlFields.map((value, idx) => (
                          <div key={idx} style={{ display: "flex", gap: 8 }}>
                            <Input
                              value={value}
                              onChange={(e) =>
                                changeUrlField(idx, e.target.value)
                              }
                              placeholder="https://example.com/resume.pdf"
                              disabled={analyzing}
                            />
                            {urlFields.length > 1 && (
                              <Button
                                danger
                                onClick={() => removeUrlField(idx)}
                                disabled={analyzing}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          onClick={addUrlField}
                          disabled={analyzing}
                          type="dashed"
                        >
                          Add another URL
                        </Button>
                      </Space>
                    </div>
                  ),
                },
                {
                  key: "files",
                  label: "Upload Files",
                  children: (
                    <div>
                      {/* Step Progress Indicator */}
                      <div style={{ marginBottom: 20 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: 12,
                          }}
                        >
                          <div
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: "50%",
                              background:
                                uploadStep === "select"
                                  ? "#1890ff"
                                  : uploadStep === "upload" ||
                                    uploadStep === "analyze"
                                  ? "#52c41a"
                                  : "#d9d9d9",
                              color: "white",
                              fontSize: "12px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              marginRight: 8,
                            }}
                          >
                            {uploadStep === "upload" && uploading ? "⏳" : "1"}
                          </div>
                          <span
                            style={{
                              color:
                                uploadStep === "select"
                                  ? "#1890ff"
                                  : uploadStep === "upload" ||
                                    uploadStep === "analyze"
                                  ? "#52c41a"
                                  : "#666",
                              fontWeight:
                                uploadStep === "select" ? "bold" : "normal",
                            }}
                          >
                            Select & Upload Files
                          </span>

                          <div
                            style={{
                              width: 40,
                              height: 2,
                              background:
                                uploadStep === "analyze"
                                  ? "#52c41a"
                                  : "#d9d9d9",
                              margin: "0 8px",
                            }}
                          />

                          <div
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: "50%",
                              background:
                                uploadStep === "analyze"
                                  ? "#1890ff"
                                  : uploadedFiles.length > 0
                                  ? "#52c41a"
                                  : "#d9d9d9",
                              color: "white",
                              fontSize: "12px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              marginRight: 8,
                            }}
                          >
                            {uploadStep === "analyze" && analyzing ? "🤖" : "2"}
                          </div>
                          <span
                            style={{
                              color:
                                uploadStep === "analyze"
                                  ? "#1890ff"
                                  : uploadedFiles.length > 0
                                  ? "#52c41a"
                                  : "#666",
                              fontWeight:
                                uploadStep === "analyze" ? "bold" : "normal",
                            }}
                          >
                            Analyze with AI
                          </span>
                        </div>
                      </div>

                      {/* Step 1: File Selection & Upload */}
                      {uploadStep === "select" && (
                        <div>
                          <p
                            style={{
                              color: "#666",
                              marginBottom: 16,
                              fontSize: "15px",
                            }}
                          >
                            � <strong>Step 1:</strong> Select resume files to
                            upload to secure S3 storage
                          </p>
                          <ResumeUploader
                            fileList={fileList}
                            onChange={setFileList}
                            uploading={uploading}
                            disabled={analyzing}
                            maxCount={20}
                          />
                        </div>
                      )}

                      {/* Step 2: Upload Progress */}
                      {uploadStep === "upload" && (
                        <div
                          style={{ textAlign: "center", padding: "40px 20px" }}
                        >
                          <div style={{ fontSize: "48px", marginBottom: 16 }}>
                            📤
                          </div>
                          <h3 style={{ color: "#1890ff", marginBottom: 8 }}>
                            Uploading to S3...
                          </h3>
                          <p style={{ color: "#666" }}>
                            Uploading {fileList.length} file
                            {fileList.length > 1 ? "s" : ""} to secure cloud
                            storage
                          </p>
                          <div style={{ marginTop: 20 }}>
                            <Spin size="large" />
                          </div>
                        </div>
                      )}

                      {uploadStep === "analyze" && uploadedFiles.length > 0 && (
                        <div style={{ padding: "20px" }}>
                          <div
                            style={{
                              background: "#e6f7ff",
                              border: "1px solid #91d5ff",
                              borderRadius: 6,
                              padding: 16,
                              marginBottom: 16,
                            }}
                          >
                            <p
                              style={{
                                margin: 0,
                                color: "#1890ff",
                                fontSize: "14px",
                              }}
                            >
                              🤖 <strong>Ready for AI Analysis:</strong> Click
                              "Analyze CVs" to process these resumes against the
                              job requirements using advanced AI.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Step 4: Analyzing */}
                      {uploadStep === "analyze" && analyzing && (
                        <div
                          style={{ textAlign: "center", padding: "40px 20px" }}
                        >
                          <div style={{ fontSize: "48px", marginBottom: 16 }}>
                            🤖
                          </div>
                          <h3 style={{ color: "#1890ff", marginBottom: 8 }}>
                            Analyzing with AI...
                          </h3>
                          <p style={{ color: "#666" }}>
                            Processing {uploadedFiles.length} resume
                            {uploadedFiles.length > 1 ? "s" : ""} against job
                            requirements
                          </p>
                          <div style={{ marginTop: 20 }}>
                            <div className="ant-spin ant-spin-spinning">
                              <span className="ant-spin-dot ant-spin-dot-spin">
                                <i className="ant-spin-dot-item"></i>
                                <i className="ant-spin-dot-item"></i>
                                <i className="ant-spin-dot-item"></i>
                                <i className="ant-spin-dot-item"></i>
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </Modal>

          {/* Resume Details Drawer */}
          <Drawer
            title={
              <div style={{ display: "flex", alignItems: "center" }}>
                <FileTextOutlined
                  style={{ marginRight: "8px", color: "#1890ff" }}
                />
                {selectedResume?.candidateName}
              </div>
            }
            placement="right"
            size="large"
            open={drawerVisible}
            onClose={() => setDrawerVisible(false)}
            style={{ borderRadius: "8px" }}
          >
            {selectedResume && (
              <div>
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Card
                      size="small"
                      title="Contact Information"
                      style={{ borderRadius: "6px" }}
                    >
                      <div style={{ lineHeight: "1.8" }}>
                        <p>
                          <MailOutlined
                            style={{ marginRight: "8px", color: "#1890ff" }}
                          />
                          {selectedResume.candidateEmail || "N/A"}
                        </p>
                        <p>
                          <PhoneOutlined
                            style={{ marginRight: "8px", color: "#1890ff" }}
                          />
                          {selectedResume.candidatePhone || "N/A"}
                        </p>
                      </div>
                    </Card>
                  </Col>

                  <Col span={24}>
                    <Card
                      size="small"
                      title="Match Analysis"
                      style={{ borderRadius: "6px" }}
                    >
                      <Row gutter={16}>
                        <Col span={12}>
                          <Statistic
                            title="Match Score"
                            value={selectedResume.matchScore || 0}
                            suffix="%"
                            valueStyle={{
                              color: getScoreColor(
                                selectedResume.matchScore || 0
                              ),
                              fontSize: "20px",
                            }}
                          />
                        </Col>
                        <Col span={12}>
                          <div>
                            <p
                              style={{
                                marginBottom: "8px",
                                fontSize: "14px",
                                color: "#666",
                              }}
                            >
                              Recommendation
                            </p>
                            <Tag
                              color={getRecommendationColor(
                                selectedResume.recommendation
                              )}
                              style={{ fontSize: "14px", padding: "4px 8px" }}
                            >
                              {selectedResume.recommendation || "N/A"}
                            </Tag>
                          </div>
                        </Col>
                      </Row>
                    </Card>
                  </Col>

                  <Col span={24}>
                    <Card
                      size="small"
                      title="Skills"
                      style={{ borderRadius: "6px" }}
                    >
                      <div>
                        {selectedResume.skills?.map((skill, index) => (
                          <Tag
                            key={index}
                            color="blue"
                            style={{ marginBottom: "6px", fontSize: "12px" }}
                          >
                            {skill}
                          </Tag>
                        ))}
                      </div>
                    </Card>
                  </Col>

                  <Col span={24}>
                    <Card
                      size="small"
                      title="Education & Experience"
                      style={{ borderRadius: "6px" }}
                    >
                      <div style={{ lineHeight: "1.8" }}>
                        <p>
                          <strong>Education:</strong>{" "}
                          {selectedResume.education || "N/A"}
                        </p>
                        <p>
                          <strong>Experience:</strong>{" "}
                          {selectedResume.experienceYears
                            ? `${selectedResume.experienceYears} years`
                            : "N/A"}
                        </p>
                      </div>
                    </Card>
                  </Col>

                  {selectedResume.summary && (
                    <Col span={24}>
                      <Card
                        size="small"
                        title="AI Summary"
                        style={{ borderRadius: "6px" }}
                      >
                        <p style={{ lineHeight: "1.6", color: "#666" }}>
                          {selectedResume.summary}
                        </p>
                      </Card>
                    </Col>
                  )}

                  <Col span={24}>
                    <Card
                      size="small"
                      title="Resume Document"
                      style={{ borderRadius: "6px" }}
                    >
                      <Button
                        type="primary"
                        icon={<FileTextOutlined />}
                        onClick={async () => {
                          try {
                            const token = localStorage.getItem("token");

                            if (!token) {
                              alert("Please log in to access CV files.");
                              return;
                            }

                            const response = await fetch(
                              `/api/resumes/${selectedResume.id}/presigned-url`,
                              {
                                headers: { Authorization: `Bearer ${token}` },
                              }
                            );

                            if (response.ok) {
                              const data = await response.json();
                              window.open(
                                data.presignedUrl,
                                "_blank",
                                "noopener,noreferrer"
                              );
                            } else if (response.status === 401) {
                              alert("Please log in to access CV files.");
                            } else if (response.status === 403) {
                              alert(
                                "You don't have permission to access this CV."
                              );
                            } else {
                              // Show specific error message
                              const errorData = await response.json();
                              console.error(
                                "Failed to get fresh presigned URL:",
                                errorData
                              );

                              if (
                                errorData.error === "S3 configuration error"
                              ) {
                                alert(
                                  "CV access is temporarily unavailable due to server configuration. Please contact support."
                                );
                              } else {
                                alert(
                                  "Unable to access CV. Please try again or contact support."
                                );
                              }
                            }
                          } catch (error) {
                            console.error("Error getting fresh URL:", error);
                            // Show error message instead of using expired URL
                            alert(
                              "Unable to access CV. Please try again or contact support."
                            );
                          }
                        }}
                        block
                        size="large"
                      >
                        View Full Resume
                      </Button>
                    </Card>
                  </Col>
                </Row>
              </div>
            )}
          </Drawer>

          {/* Upload Progress Modal */}
          <UploadProgressModal
            visible={showUploadProgress}
            progress={uploadProgress}
            onCancel={() => setShowUploadProgress(false)}
          />

          {/* Analysis Progress Modal */}
          <RealTimeProgressModal
            visible={showProgress}
            progress={progress}
            onCancel={() => setShowProgress(false)}
          />
        </div>
      </Spin>
    </AppLayout>
  );
}
