# Resume Module Implementation Plan

## Overview

This document outlines the complete implementation plan for the Resume/CV module that integrates with the external AI API for resume analysis and scoring.

## IMPORTANT: Fixed External AI API Format

⚠️ **The external AI API format is FIXED and cannot be changed**

**Request Format (EXACT):**

```json
{
  "resume_paths": [
    "https://drive.google.com/file/d/1AkY8_bitQCPEixPHGgQW9KN23Xbcd5J4/view?usp=sharing"
  ],
  "job_req": {
    "title": "Junior Developer",
    "company": "Tech Solutions Ltd.",
    "location": "Dhaka, Bangladesh",
    "job_type": "Full-time",
    "experience_level": "Entry-level (0-1 years)",
    "skills_required": ["JavaScript", "HTML", "CSS"],
    "responsibilities": ["Develop applications", "Debug code"],
    "qualifications": ["Bachelor's degree"],
    "description": "Job description text",
    "salary_range": "BDT 25,000 - 35,000/month",
    "benefits": ["Health insurance", "Flexible hours"]
  }
}
```

**Response Format (EXACT):**

```json
{
  "analyses": [
    {
      "resume_path": "https://drive.google.com/...",
      "success": true,
      "candidate": {
        "name": "Ahsanul Karim",
        "email": "ahsantamim49@gmail.com",
        "phone": "+8801775288311",
        "skills": ["python", "javascript"],
        "experience_years": 2,
        "education": "BSC IN ELECTRONICS...",
        "match_score": 60,
        "summary": "Recent graduate with...",
        "location": null,
        "linkedin_url": "https://linkedin.com/in/...",
        "github_url": "https://github.com/...",
        "current_job_title": null,
        "processing_method": "vision",
        "analysis_timestamp": "2025-09-13T05:27:55.022863"
      },
      "analysis": {
        "file_name": "resume.pdf",
        "processing_method": "vision",
        "processing_time": 3.64,
        "file_size_mb": 0.04,
        "match_score": 60,
        "matched_skills": ["javascript"],
        "recommendation": "Consider"
      }
    }
  ],
  "success": true
}
```

All implementation must work with this EXACT format.

## Database Schema Updates

### Current Resume Model Analysis

The existing `Resume` model needs enhancement:

```prisma
model Resume {
  id         String    @id @default(cuid())
  resumeUrl  String
  name       String?
  email      String?
  matchScore Float?
  createdAt  DateTime  @default(now())
  jsonData   Json?
  jobPostId  String
  jobPost    JobPost   @relation(fields: [jobPostId], references: [id])
  meetings   Meeting[]
}
```

### Required Schema Enhancements

```prisma
model Resume {
  id                 String    @id @default(cuid())
  resumeUrl          String    // Original resume URL/path from AI response "resume_path"
  candidateName      String    // From AI response "candidate.name"
  candidateEmail     String?   // From AI response "candidate.email"
  candidatePhone     String?   // From AI response "candidate.phone"
  matchScore         Float?    // From AI response "candidate.match_score" (0-100)
  recommendation     String?   // From AI response "analysis.recommendation"

  // Extended candidate information from AI response
  skills             String[]  // From AI response "candidate.skills" array
  experienceYears    Int?      // From AI response "candidate.experience_years"
  education          String?   // From AI response "candidate.education"
  summary            String?   // From AI response "candidate.summary"
  location           String?   // From AI response "candidate.location"
  linkedinUrl        String?   // From AI response "candidate.linkedin_url"
  githubUrl          String?   // From AI response "candidate.github_url"
  currentJobTitle    String?   // From AI response "candidate.current_job_title"

  // Analysis metadata from AI response
  processingMethod   String?   // From AI response "candidate.processing_method"
  analysisTimestamp  DateTime? // From AI response "candidate.analysis_timestamp"
  fileName           String?   // From AI response "analysis.file_name"
  fileSizeMb         Float?    // From AI response "analysis.file_size_mb"
  processingTime     Float?    // From AI response "analysis.processing_time"
  matchedSkills      String[]  // From AI response "analysis.matched_skills" array

  // System fields
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
  jobPostId          String
  uploadedById       Int?      // User who uploaded

  // Relations
  jobPost            JobPost   @relation(fields: [jobPostId], references: [id], onDelete: Cascade)
  uploadedBy         User?     @relation(fields: [uploadedById], references: [id])
  meetings           Meeting[]

  @@index([jobPostId, matchScore])
  @@index([candidateEmail])
}
```

## API Implementation

### 1. External AI API Integration Service

Create `/src/lib/ai-resume-service.ts`:

```typescript
// FIXED API FORMAT - These interfaces match the exact external API structure

export interface ResumeAnalysisRequest {
  resume_paths: string[]; // Array of resume URLs - FIXED FORMAT
  job_req: {
    // Job requirements object - FIXED FORMAT
    title: string;
    company: string;
    location: string;
    job_type: string;
    experience_level: string;
    skills_required: string[];
    responsibilities: string[];
    qualifications: string[];
    description: string;
    salary_range?: string;
    benefits?: string[];
  };
}

// FIXED RESPONSE FORMAT - Exact structure from external API
export interface CandidateData {
  resume_path: string;
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experience_years: number;
  education: string;
  match_score: number;
  summary: string;
  location: string | null;
  linkedin_url: string;
  github_url: string;
  current_job_title: string | null;
  processing_method: string;
  analysis_timestamp: string;
}

export interface AnalysisData {
  file_name: string;
  processing_method: string;
  processing_time: number;
  file_size_mb: number;
  match_score: number;
  matched_skills: string[];
  recommendation: string;
}

export interface ResumeAnalysisItem {
  resume_path: string;
  success: boolean;
  candidate: CandidateData;
  analysis: AnalysisData;
}

export interface ResumeAnalysisResponse {
  analyses: ResumeAnalysisItem[];
  success: boolean;
}

export class AIResumeService {
  private static readonly AI_API_BASE =
    "https://hr-recruitment-ai-api.onrender.com";

  static async analyzeResumes(
    request: ResumeAnalysisRequest
  ): Promise<ResumeAnalysisResponse> {
    const response = await fetch(`${this.AI_API_BASE}/analyze-resumes-v2`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`AI API failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Convert JobPost to the EXACT format expected by external AI API
  static mapJobPostToJobReq(jobPost: any): ResumeAnalysisRequest["job_req"] {
    // Parse skills from comma-separated string to array
    const skillsArray = jobPost.skillsRequired
      ? jobPost.skillsRequired
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [];

    // Parse responsibilities from newline-separated string to array
    const responsibilitiesArray = jobPost.keyResponsibilities
      ? jobPost.keyResponsibilities
          .split("\n")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [];

    // Parse qualifications from newline-separated string to array
    const qualificationsArray = jobPost.qualifications
      ? jobPost.qualifications
          .split("\n")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [];

    // Parse benefits from newline-separated string to array
    const benefitsArray = jobPost.benefits
      ? jobPost.benefits
          .split("\n")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [];

    return {
      title: jobPost.jobTitle,
      company: jobPost.companyName,
      location: jobPost.location,
      job_type: jobPost.jobType,
      experience_level: jobPost.experienceLevel,
      skills_required: skillsArray,
      responsibilities: responsibilitiesArray,
      qualifications: qualificationsArray,
      description: jobPost.jobDescription || "",
      salary_range: jobPost.salaryRange || undefined,
      benefits: benefitsArray.length > 0 ? benefitsArray : undefined,
    };
  }
}
```

### 2. Internal API Routes

#### `/api/jobs/[jobId]/resumes.ts` - Main Resume Management

```typescript
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import {
  AIResumeService,
  ResumeAnalysisRequest,
} from "@/lib/ai-resume-service";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { jobId } = req.query;
  if (!jobId || typeof jobId !== "string") {
    return res.status(400).json({ error: "Job ID required" });
  }

  // Verify job exists and user has access
  const jobPost = await prisma.jobPost.findFirst({
    where: {
      id: jobId,
      companyId: user.companyId,
    },
    include: {
      company: true,
    },
  });

  if (!jobPost) {
    return res.status(404).json({ error: "Job not found" });
  }

  switch (req.method) {
    case "GET":
      return handleGetResumes(req, res, jobId);
    case "POST":
      return handleAnalyzeResumes(req, res, jobPost, user.userId);
    default:
      return res.status(405).json({ error: "Method not allowed" });
  }
}

async function handleGetResumes(
  req: NextApiRequest,
  res: NextApiResponse,
  jobId: string
) {
  const { sortBy = "matchScore", order = "desc" } = req.query;

  const resumes = await prisma.resume.findMany({
    where: { jobPostId: jobId },
    orderBy: {
      [sortBy as string]: order as "asc" | "desc",
    },
    include: {
      uploadedBy: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: { meetings: true },
      },
    },
  });

  return res.status(200).json({ resumes });
}

async function handleAnalyzeResumes(
  req: NextApiRequest,
  res: NextApiResponse,
  jobPost: any,
  userId: number
) {
  const { resume_paths } = req.body;

  if (
    !resume_paths ||
    !Array.isArray(resume_paths) ||
    resume_paths.length === 0
  ) {
    return res.status(400).json({ error: "resume_paths array is required" });
  }

  try {
    // Convert JobPost to EXACT format expected by external AI API
    const jobReq = AIResumeService.mapJobPostToJobReq(jobPost);

    // Call external AI API with EXACT format
    const analysisResponse = await AIResumeService.analyzeResumes({
      resume_paths,
      job_req: jobReq,
    });

    // Process the EXACT response format from AI API
    const savedResumes = [];
    for (const analysis of analysisResponse.analyses) {
      if (analysis.success) {
        const resume = await prisma.resume.create({
          data: {
            // Map EXACT field names from AI response
            resumeUrl: analysis.resume_path,
            candidateName: analysis.candidate.name,
            candidateEmail: analysis.candidate.email,
            candidatePhone: analysis.candidate.phone,
            matchScore: analysis.candidate.match_score,
            recommendation: analysis.analysis.recommendation,
            skills: analysis.candidate.skills,
            experienceYears: analysis.candidate.experience_years,
            education: analysis.candidate.education,
            summary: analysis.candidate.summary,
            location: analysis.candidate.location,
            linkedinUrl: analysis.candidate.linkedin_url,
            githubUrl: analysis.candidate.github_url,
            currentJobTitle: analysis.candidate.current_job_title,
            processingMethod: analysis.candidate.processing_method,
            analysisTimestamp: new Date(analysis.candidate.analysis_timestamp),
            fileName: analysis.analysis.file_name,
            fileSizeMb: analysis.analysis.file_size_mb,
            processingTime: analysis.analysis.processing_time,
            matchedSkills: analysis.analysis.matched_skills,
            jobPostId: jobPost.id,
            uploadedById: userId,
          },
        });
        savedResumes.push(resume);
      }
    }

    return res.status(200).json({
      success: true,
      message: `${savedResumes.length} resumes analyzed and saved`,
      resumes: savedResumes,
      // Include original AI response for debugging
      aiResponse: analysisResponse,
    });
  } catch (error: any) {
    console.error("Resume analysis error:", error);
    return res.status(500).json({
      error: "Failed to analyze resumes",
      details: error.message,
    });
  }
}
```

#### `/api/resumes/[resumeId].ts` - Individual Resume Management

```typescript
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { resumeId } = req.query;
  if (!resumeId || typeof resumeId !== "string") {
    return res.status(400).json({ error: "Resume ID required" });
  }

  switch (req.method) {
    case "GET":
      return handleGetResume(req, res, resumeId, user);
    case "PUT":
      return handleUpdateResume(req, res, resumeId, user);
    case "DELETE":
      return handleDeleteResume(req, res, resumeId, user);
    default:
      return res.status(405).json({ error: "Method not allowed" });
  }
}

async function handleGetResume(
  req: NextApiRequest,
  res: NextApiResponse,
  resumeId: string,
  user: any
) {
  const resume = await prisma.resume.findFirst({
    where: {
      id: resumeId,
      jobPost: {
        companyId: user.companyId,
      },
    },
    include: {
      jobPost: {
        select: {
          id: true,
          jobTitle: true,
          companyName: true,
        },
      },
      uploadedBy: {
        select: { id: true, name: true, email: true },
      },
      meetings: {
        orderBy: { meetingTime: "asc" },
      },
    },
  });

  if (!resume) {
    return res.status(404).json({ error: "Resume not found" });
  }

  return res.status(200).json({ resume });
}

async function handleUpdateResume(
  req: NextApiRequest,
  res: NextApiResponse,
  resumeId: string,
  user: any
) {
  const { candidateName, candidateEmail, candidatePhone, notes } = req.body;

  const resume = await prisma.resume.updateMany({
    where: {
      id: resumeId,
      jobPost: {
        companyId: user.companyId,
      },
    },
    data: {
      candidateName,
      candidateEmail,
      candidatePhone,
      // Add notes field to schema if needed
    },
  });

  if (resume.count === 0) {
    return res.status(404).json({ error: "Resume not found" });
  }

  return res.status(200).json({ success: true });
}

async function handleDeleteResume(
  req: NextApiRequest,
  res: NextApiResponse,
  resumeId: string,
  user: any
) {
  const resume = await prisma.resume.deleteMany({
    where: {
      id: resumeId,
      jobPost: {
        companyId: user.companyId,
      },
    },
  });

  if (resume.count === 0) {
    return res.status(404).json({ error: "Resume not found" });
  }

  return res.status(200).json({ success: true });
}
```

## Frontend Implementation

### 1. Job List Page (`/src/pages/cv-sorting/index.tsx`)

```tsx
import { useState, useEffect } from "react";
import { Card, List, Button, Statistic, Row, Col, Input, Select } from "antd";
import { FileTextOutlined, UserOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";
import AppLayout from "@/components/layout/AppLayout";

interface JobWithStats {
  id: string;
  jobTitle: string;
  companyName: string;
  location: string;
  experienceLevel: string;
  createdAt: string;
  _count: {
    resumes: number;
  };
  avgMatchScore?: number;
}

export default function JobListPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/jobs?include=resumeStats");
      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(
    (job) =>
      job.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.companyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout>
      <div style={{ padding: "24px" }}>
        <div style={{ marginBottom: "24px" }}>
          <h1>Resume Management</h1>
          <p>Manage and analyze resumes for your job postings</p>
        </div>

        <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
          <Col span={12}>
            <Input.Search
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "100%" }}
            />
          </Col>
        </Row>

        <List
          grid={{ gutter: 16, column: 1 }}
          dataSource={filteredJobs}
          loading={loading}
          renderItem={(job) => (
            <List.Item>
              <Card
                title={
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>{job.jobTitle}</span>
                    <Button
                      type="primary"
                      onClick={() => router.push(`/cv-sorting/${job.id}`)}
                    >
                      View Resumes
                    </Button>
                  </div>
                }
                extra={<FileTextOutlined />}
              >
                <Row gutter={16}>
                  <Col span={6}>
                    <Statistic
                      title="Total Resumes"
                      value={job._count.resumes}
                      prefix={<UserOutlined />}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="Avg Match Score"
                      value={job.avgMatchScore || 0}
                      suffix="%"
                      precision={1}
                    />
                  </Col>
                  <Col span={12}>
                    <div>
                      <p>
                        <strong>Company:</strong> {job.companyName}
                      </p>
                      <p>
                        <strong>Location:</strong> {job.location}
                      </p>
                      <p>
                        <strong>Experience:</strong> {job.experienceLevel}
                      </p>
                    </div>
                  </Col>
                </Row>
              </Card>
            </List.Item>
          )}
        />
      </div>
    </AppLayout>
  );
}
```

### 2. Single Job Resume View (`/src/pages/cv-sorting/[jobId].tsx`)

```tsx
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
} from "antd";
import {
  UploadOutlined,
  EyeOutlined,
  MailOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import AppLayout from "@/components/layout/AppLayout";

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
  createdAt: string;
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

  useEffect(() => {
    if (jobId) {
      fetchJobAndResumes();
    }
  }, [jobId]);

  const fetchJobAndResumes = async () => {
    try {
      const [jobResponse, resumesResponse] = await Promise.all([
        fetch(`/api/jobs/${jobId}`),
        fetch(`/api/jobs/${jobId}/resumes?sortBy=matchScore&order=desc`),
      ]);

      const jobData = await jobResponse.json();
      const resumesData = await resumesResponse.json();

      setJob(jobData.job);
      setResumes(resumesData.resumes || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("Failed to load job data");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeResumes = async () => {
    if (!resumeUrls.trim()) {
      message.error("Please enter at least one resume URL");
      return;
    }

    setAnalyzing(true);
    try {
      // Parse URLs from textarea (one per line)
      const urls = resumeUrls
        .split("\n")
        .map((url) => url.trim())
        .filter((url) => url.length > 0);

      // Send EXACT format expected by API
      const response = await fetch(`/api/jobs/${jobId}/resumes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          resume_paths: urls, // EXACT field name from AI API
        }),
      });

      const data = await response.json();

      if (response.ok) {
        message.success(
          `${data.resumes?.length || 0} resumes analyzed successfully`
        );
        setUploadModalVisible(false);
        setResumeUrls("");
        fetchJobAndResumes(); // Refresh the list
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#52c41a";
    if (score >= 60) return "#faad14";
    return "#f5222d";
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation?.toLowerCase()) {
      case "highly recommended":
        return "green";
      case "consider":
        return "orange";
      case "not suitable":
        return "red";
      default:
        return "default";
    }
  };

  const columns = [
    {
      title: "Candidate Name",
      dataIndex: "candidateName",
      key: "candidateName",
      sorter: (a: Resume, b: Resume) =>
        a.candidateName.localeCompare(b.candidateName),
    },
    {
      title: "Email",
      dataIndex: "candidateEmail",
      key: "candidateEmail",
      render: (email: string) =>
        email ? <a href={`mailto:${email}`}>{email}</a> : "N/A",
    },
    {
      title: "Phone",
      dataIndex: "candidatePhone",
      key: "candidatePhone",
      render: (phone: string) => phone || "N/A",
    },
    {
      title: "Match Score",
      dataIndex: "matchScore",
      key: "matchScore",
      sorter: (a: Resume, b: Resume) =>
        (a.matchScore || 0) - (b.matchScore || 0),
      render: (score: number) => (
        <Tag color={getScoreColor(score)}>{score ? `${score}%` : "N/A"}</Tag>
      ),
    },
    {
      title: "Recommendation",
      dataIndex: "recommendation",
      key: "recommendation",
      render: (recommendation: string) => (
        <Tag color={getRecommendationColor(recommendation)}>
          {recommendation || "N/A"}
        </Tag>
      ),
    },
    {
      title: "Experience",
      dataIndex: "experienceYears",
      key: "experienceYears",
      render: (years: number) => (years ? `${years} years` : "N/A"),
      sorter: (a: Resume, b: Resume) =>
        (a.experienceYears || 0) - (b.experienceYears || 0),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record: Resume) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedResume(record);
              setDrawerVisible(true);
            }}
          >
            View Details
          </Button>
          <Button
            type="link"
            href={record.resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Resume
          </Button>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <AppLayout>
        <div>Loading...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{ padding: "24px" }}>
        <Row gutter={24}>
          {/* Main Content - Resume List */}
          <Col span={16}>
            <Card
              title={
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>Resumes for {job?.jobTitle}</span>
                  <Button
                    type="primary"
                    icon={<UploadOutlined />}
                    onClick={() => setUploadModalVisible(true)}
                  >
                    Analyze New Resumes
                  </Button>
                </div>
              }
            >
              <div style={{ marginBottom: "16px" }}>
                <Row gutter={16}>
                  <Col span={6}>
                    <Statistic title="Total Resumes" value={resumes.length} />
                  </Col>
                  <Col span={6}>
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
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="Highly Recommended"
                      value={
                        resumes.filter(
                          (r) =>
                            r.recommendation?.toLowerCase() ===
                            "highly recommended"
                        ).length
                      }
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title="Consider"
                      value={
                        resumes.filter(
                          (r) => r.recommendation?.toLowerCase() === "consider"
                        ).length
                      }
                    />
                  </Col>
                </Row>
              </div>

              <Table
                dataSource={resumes}
                columns={columns}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `Total ${total} resumes`,
                }}
              />
            </Card>
          </Col>

          {/* Sidebar - Job Details */}
          <Col span={8}>
            <Card title="Job Details">
              {job && (
                <div>
                  <div style={{ marginBottom: "16px" }}>
                    <h3>{job.jobTitle}</h3>
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

                  <div style={{ marginBottom: "16px" }}>
                    <h4>Required Skills</h4>
                    <div>
                      {job.skillsRequired.split(",").map((skill, index) => (
                        <Tag key={index}>{skill.trim()}</Tag>
                      ))}
                    </div>
                  </div>

                  {job.jobDescription && (
                    <div style={{ marginBottom: "16px" }}>
                      <h4>Job Description</h4>
                      <p style={{ fontSize: "12px", lineHeight: "1.4" }}>
                        {job.jobDescription.substring(0, 200)}...
                      </p>
                    </div>
                  )}

                  {job.keyResponsibilities && (
                    <div style={{ marginBottom: "16px" }}>
                      <h4>Key Responsibilities</h4>
                      <p style={{ fontSize: "12px", lineHeight: "1.4" }}>
                        {job.keyResponsibilities.substring(0, 200)}...
                      </p>
                    </div>
                  )}

                  {job.qualifications && (
                    <div>
                      <h4>Qualifications</h4>
                      <p style={{ fontSize: "12px", lineHeight: "1.4" }}>
                        {job.qualifications.substring(0, 200)}...
                      </p>
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
          onCancel={() => setUploadModalVisible(false)}
          onOk={handleAnalyzeResumes}
          confirmLoading={analyzing}
          width={600}
        >
          <div style={{ marginBottom: "16px" }}>
            <p>
              Enter resume URLs (one per line). Supported formats: Google Drive
              links, Dropbox links, or direct file URLs.
            </p>
          </div>
          <Input.TextArea
            value={resumeUrls}
            onChange={(e) => setResumeUrls(e.target.value)}
            placeholder="https://drive.google.com/file/d/..."
            rows={6}
          />
        </Modal>

        {/* Resume Details Drawer */}
        <Drawer
          title={selectedResume?.candidateName}
          placement="right"
          size="large"
          open={drawerVisible}
          onClose={() => setDrawerVisible(false)}
        >
          {selectedResume && (
            <div>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Card size="small" title="Contact Information">
                    <p>
                      <MailOutlined /> {selectedResume.candidateEmail || "N/A"}
                    </p>
                    <p>
                      <PhoneOutlined /> {selectedResume.candidatePhone || "N/A"}
                    </p>
                  </Card>
                </Col>

                <Col span={24}>
                  <Card size="small" title="Match Analysis">
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
                          }}
                        />
                      </Col>
                      <Col span={12}>
                        <div>
                          <p
                            style={{
                              marginBottom: "4px",
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
                          >
                            {selectedResume.recommendation || "N/A"}
                          </Tag>
                        </div>
                      </Col>
                    </Row>
                  </Card>
                </Col>

                <Col span={24}>
                  <Card size="small" title="Skills">
                    <div>
                      {selectedResume.skills?.map((skill, index) => (
                        <Tag key={index} style={{ marginBottom: "4px" }}>
                          {skill}
                        </Tag>
                      ))}
                    </div>
                  </Card>
                </Col>

                <Col span={24}>
                  <Card size="small" title="Education & Experience">
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
                  </Card>
                </Col>

                {selectedResume.summary && (
                  <Col span={24}>
                    <Card size="small" title="AI Summary">
                      <p>{selectedResume.summary}</p>
                    </Card>
                  </Col>
                )}

                <Col span={24}>
                  <Card size="small" title="Resume">
                    <Button
                      type="primary"
                      href={selectedResume.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      block
                    >
                      View Full Resume
                    </Button>
                  </Card>
                </Col>
              </Row>
            </div>
          )}
        </Drawer>
      </div>
    </AppLayout>
  );
}
```

## Implementation Steps

### Phase 1: Database & Backend Setup

1. **Update Prisma Schema** - Add the enhanced Resume model fields
2. **Run Migration** - `npx prisma db push`
3. **Create AI Service** - Implement the AI resume analysis service
4. **Create API Routes** - Implement the resume management APIs

### Phase 2: Frontend Implementation

1. **Job List Page** - Create the resume module entry point
2. **Single Job View** - Implement the main resume management interface
3. **Resume Analysis Flow** - Integrate with the AI API
4. **Resume Details View** - Create detailed candidate view

### Phase 3: Enhancement & Testing

1. **Add Error Handling** - Comprehensive error handling for AI API failures
2. **Add Loading States** - Proper loading indicators for long-running operations
3. **Add Validation** - Input validation for resume URLs and job data
4. **Performance Optimization** - Implement pagination and caching

### Phase 4: Advanced Features

1. **Bulk Operations** - Bulk delete, export, and status updates
2. **Advanced Filtering** - Filter by skills, experience, match score ranges
3. **Comparison Tool** - Side-by-side candidate comparison
4. **Email Integration** - Send emails to candidates directly from the platform

## Key Features Summary

✅ **Complete Job-Resume Relationship** - One job can have many resumes
✅ **AI-Powered Analysis** - Automatic resume parsing and scoring
✅ **Rich Candidate Data** - Name, email, phone, skills, experience, education
✅ **Match Scoring** - AI-calculated compatibility scores (0-100)
✅ **Sortable Lists** - Sort by match score, name, experience, etc.
✅ **Job Details Sidebar** - Full job description as payload for AI
✅ **Bulk Resume Upload** - Multiple resume URLs in single API call
✅ **Responsive UI** - Modern, professional interface
✅ **Real-time Updates** - Live data refresh after analysis
✅ **Security** - Company-level data isolation
✅ **Audit Trail** - Track who uploaded resumes and when

This implementation provides a complete, production-ready resume management system that integrates seamlessly with your existing HR automation platform.
