# HR Automation Application Overview

This document provides a comprehensive overview of the HR Automation Application, identifying key features, their functionalities, and their inter-relationships based on the codebase and database schema.

## Core Features

### 1. Authentication & User Management
- **Functionality**: Handles user sign-up, login, and role-based access control (Admin, Manager, Company User).
- **Files**: `src/pages/auth.tsx`, `src/pages/users.tsx`
- **Data Models**: `User`, `companies`
- **Relationships**: Users belong to Companies. Roles dictate access to features like creating Job Posts or viewing sensitive candidate data.

### 2. Job Management
- **Functionality**: Creating, listing, and managing job postings. Includes AI-powered job description generation.
- **Files**: `src/pages/job-requirements.tsx`
- **Data Models**: `JobPost`, `GeneratedJobPost`
- **Relationships**: Jobs are linked to a Company and the User who created them. They serve as the parent entity for Resumes, Interviews, and Assessments.

### 3. Resume Sorting & Parsing
- **Functionality**: Uploading candidate resumes, parsing content (skills, experience), and providing a "Match Score" against the Job Post.
- **Files**: `src/pages/cv-sorting`
- **Data Models**: `Resume`
- **Relationships**: Resumes are uploaded for a specific `JobPost`. The system parses the file (PDF/Doc) and stores structured data (skills, education) to calculate match scores.

### 4. Unified Assessment Workflow
- **Functionality**: A structured workflow to move candidates through different assessment stages.
- **Files**: `src/pages/assessment`
- **Data Models**: `AssessmentStage`, `MCQAssessment`, `AvatarAssessment`, `ManualMeeting`
- **Stages**:
    - **MCQ Assessment**: Candidates take timed multiple-choice exams.
    - **AI Avatar Interview**: Interactive video interview with an AI avatar.
    - **Manual Meeting**: Traditional human-led interview meeting.

### 5. Interview System (Detailed)
- **Functionality**: Conducting and tracking interviews (Technical, Behavioral). Includes anti-cheat monitoring (tab switching logs) and recording.
- **Files**: `src/pages/interview`
- **Data Models**: `Interview`, `InterviewAttempt`, `Question`, `Answer`, `ActivityLog`, `Recording`
- **Relationships**: An `Interview` is defined for a Job. An `InterviewAttempt` is a specific instance of a candidate taking that interview.

### 6. MCQ System
- **Functionality**: Creating question banks (`MCQTemplate`) and generating specific assessments for candidates.
- **Files**: `src/pages/assessment`
- **Data Models**: `MCQTemplate`, `MCQQuestion`, `MCQAnswer`
- **Relationships**: Templates are reusable. Specific questions are copied to `MCQQuestion` when an assessment is created to preserve the state of the question at that time.

### 7. Meeting Scheduler
- **Functionality**: Scheduling manual meetings with candidates.
- **Files**: `src/pages/meeting`, `src/pages/scheduler`
- **Data Models**: `meetings`, `ManualMeeting`
- **Relationships**: Linked to `User` (interviewer) and `Resume` (candidate).

### 8. Offer Letter Management
- **Functionality**: Generating and sending offer letters to successful candidates.
- **Files**: `src/pages/offers`
- **Data Models**: `OfferLetter`
- **Relationships**: The final stage for a `Resume` within a `JobPost`.

### 9. Company Analytics & Profile
- **Functionality**: Dashboard for viewing hiring metrics and managing company profile.
- **Files**: `src/pages/analytics.tsx`, `src/pages/profile.tsx`
- **Data Models**: `companies`
- **Overview**: Provides high-level view of active jobs, total candidates, and time-to-hire metrics.

## Feature Relationships Diagram

1.  **Company Setup**: User creates Company -> Adds other Users.
2.  **Hiring Cycle**:
    -   User creates `JobPost`.
    -   User uploads/receives `Resume` -> System calculates Match Score.
    -   User creates `AssessmentStage` (Workflow):
        -   **Stage 1: MCQ**: Candidate takes test -> Score recorded.
        -   **Stage 2: AI Interview**: Candidate interacts with Avatar -> Recording & Transcript generated.
        -   **Stage 3: Manual Meeting**: User schedules meeting -> Feedback recorded.
    -   **Decision**: User creates `OfferLetter` or rejects candidate.

## Technical Architecture (Inferred)
-   **Frontend**: Next.js (Pages Router), React, TailwindCSS, Ant Design.
-   **Backend**: Next.js API Routes.
-   **Database**: PostgreSQL via Prisma ORM.
-   **Storage**: AWS S3 (for Resumes, Recordings).
-   **AI Services**: Likely OpenAI (or similar) for Job Description generation, Resume parsing, and AI Avatar interactions (implied by model names like `GeneratedJobPost` and `AvatarAssessment`).
