# HR Automation Platform - Complete Application Workflow

## 📋 Table of Contents

1. [Application Overview](#application-overview)
2. [System Architecture](#system-architecture)
3. [Complete Recruitment Workflow](#complete-recruitment-workflow)
4. [Module Details](#module-details)
5. [Database Schema](#database-schema)
6. [API Endpoints Reference](#api-endpoints-reference)

---

## Application Overview

### Platform Description

**Synchro-Hire** is a comprehensive AI-powered HR automation platform that streamlines the entire recruitment process from job posting to offer letter generation. The platform leverages artificial intelligence for resume parsing, MCQ generation, interview question creation, and offer letter drafting.

### Technology Stack

- **Frontend**: Next.js 15.5.3, React, TypeScript, Ant Design UI
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: JWT-based custom auth
- **AI Integration**: External FastAPI service at `https://ai.synchro-hire.com`
- **Email**: Nodemailer with Gmail SMTP
- **File Storage**: AWS S3 for resume storage
- **Candidate Portal**: `https://exam.synchro-hire.com`

### Key Features

✅ Multi-company support with role-based access
✅ AI-powered job description generation
✅ Automated resume parsing and ranking
✅ AI-generated MCQ assessments
✅ AI-generated interview questions
✅ Avatar-based AI interviews
✅ Meeting scheduling and management
✅ AI-powered offer letter generation
✅ Session-based candidate authentication
✅ Real-time progress tracking
✅ Comprehensive analytics dashboard

---

## System Architecture

### User Roles

1. **Admin** - Full system access, manage all companies
2. **HR Manager** - Company-specific access, manage recruitment
3. **Recruiter** - Limited access, manage candidates
4. **Candidate** - Portal access for assessments and interviews

### Authentication Flow

```
User Login → JWT Token Generation → Token Storage (localStorage)
→ Protected API Routes (Authorization Header) → Role-based Access Control
```

---

## Complete Recruitment Workflow

### 🎯 End-to-End Process

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         RECRUITMENT LIFECYCLE                            │
└─────────────────────────────────────────────────────────────────────────┘

1. COMPANY SETUP
   └─> Create Company Account → Add HR Users → Configure Settings

2. JOB CREATION
   └─> Create Job Post (AI/Manual) → Define Requirements → Publish

3. JOB POSTING [NOT FULLY IMPLEMENTED]
   └─> Generate Custom URL → Set CV Limit → Set Time Limit → Post to LinkedIn

4. CANDIDATE APPLICATION
   └─> Upload Resume → AI Parsing → Scoring → Ranking

5. MCQ ASSESSMENT
   └─> AI Generate Questions → Save Template → Send to Candidate → Evaluate

6. AI INTERVIEW
   └─> AI Generate Questions → Save Template → Send to Candidate → Review

7. MANUAL MEETING
   └─> Schedule Meeting → Send Invite → Conduct Interview → Record Notes

8. OFFER GENERATION
   └─> AI Generate Offer Letter → Review → Send to Candidate

9. ONBOARDING
   └─> Candidate Accepts → Update Status → Start Onboarding
```

---

## Module Details

### 1️⃣ COMPANY ACCOUNT CREATION

#### Overview

Multi-tenant system where each company has isolated data and users.

#### Process Flow

```
Step 1: Company Registration
├─> Navigate to /auth
├─> Fill company details:
│   ├─> Company Name
│   ├─> Address
│   ├─> Country
│   ├─> Website (optional)
│   ├─> LinkedIn Profile (optional)
│   └─> Logo (optional)
└─> Submit → Company Created

Step 2: Admin User Creation
├─> First user becomes Company Admin
├─> Email verification (optional)
└─> Login with credentials

Step 3: Add Team Members
├─> Navigate to /users
├─> Click "Add User"
├─> Fill user details:
│   ├─> Name
│   ├─> Email
│   ├─> Role (HR/Recruiter)
│   └─> Password
└─> User receives invitation email
```

#### Database Tables

- **companies** - Store company information
- **User** - Store user accounts with companyId reference

#### API Endpoints

- `POST /api/auth/signup` - Create company and admin user
- `POST /api/auth/login` - User authentication
- `GET /api/users` - List company users
- `POST /api/users` - Create new user

#### Features

✅ Multi-company isolation
✅ Role-based access control
✅ Company-specific branding
✅ Team member management

---

### 2️⃣ JOB DESCRIPTION CREATION

#### Overview

Create job postings manually or use AI to generate professional job descriptions.

#### Process Flow - AI Generation

```
Step 1: Navigate to Job Requirements
├─> Click "Create Job Post"
├─> Enter basic information:
│   ├─> Job Title
│   ├─> Company Name
│   ├─> Location
│   ├─> Job Type (Full-time/Part-time/Contract)
│   ├─> Experience Level
│   ├─> Skills Required
│   └─> Salary Range (optional)
└─> Click "Generate with AI"

Step 2: AI Generation Process
├─> System sends request to FastAPI service
├─> AI analyzes requirements
├─> Generates multiple versions:
│   ├─> Job Description
│   ├─> Key Responsibilities
│   ├─> Qualifications
│   └─> Benefits
└─> Returns 2-3 variations

Step 3: Review & Edit
├─> Compare generated versions
├─> Select preferred version
├─> Edit as needed
└─> Publish job post

Step 4: Manual Creation (Alternative)
├─> Fill all fields manually
├─> No AI assistance
└─> Direct publish
```

#### Database Tables

- **JobPost** - Main job posting table
- **GeneratedJobPost** - Store AI-generated versions

#### API Endpoints

- `POST /api/job` - Create job post
- `POST /api/job/generate` - AI generate job description
- `GET /api/jobs` - List all jobs
- `PUT /api/job/:id` - Update job post
- `DELETE /api/job/:id` - Delete job post

#### Features

✅ AI-powered job description generation
✅ Multiple version comparison
✅ Template library
✅ Version history tracking
✅ Duplicate job functionality

---

### 3️⃣ JOB POSTING WITH CUSTOM URL

#### Overview

**Status: ⚠️ NOT FULLY IMPLEMENTED**

This feature is designed to generate shareable job posting links with CV submission limits and deadline controls.

#### Planned Flow

```
Step 1: Generate Posting Link
├─> Select published job
├─> Click "Create Posting Link"
├─> Configure settings:
│   ├─> Maximum CV submissions (e.g., 100)
│   ├─> Deadline date & time
│   ├─> Auto-close on limit reached
│   └─> Public/Private visibility
└─> Generate unique URL

Step 2: Share Link
├─> Copy generated URL (e.g., https://synchro-hire.com/apply/xyz123)
├─> Post on LinkedIn
├─> Share on job boards
├─> Email to network
└─> Embed on company website

Step 3: Candidate Application
├─> Candidate clicks link
├─> Check if limit reached or expired
├─> If valid:
│   ├─> Show job details
│   ├─> Upload resume form
│   └─> Submit application
└─> Auto-process resume

Step 4: Auto-Close
├─> When CV limit reached → Disable link
├─> When deadline passes → Disable link
└─> Display "Position Filled" message
```

#### Features (Planned)

⏳ Custom URL generation
⏳ CV submission limits
⏳ Time-based expiration
⏳ LinkedIn integration
⏳ Analytics tracking
⏳ Auto-close functionality

---

### 4️⃣ RESUME PARSING & RANKING

#### Overview

Automated resume processing using AI to extract information and score candidates against job requirements.

#### Process Flow

```
Step 1: Resume Upload
├─> Navigate to Job Requirements page
├─> Select job post
├─> Click "Upload Resumes"
├─> Upload methods:
│   ├─> Single file upload
│   ├─> Bulk upload (multiple files)
│   └─> Drag & drop
└─> Files uploaded to AWS S3

Step 2: AI Processing
├─> System sends resume to FastAPI service
├─> AI extracts:
│   ├─> Candidate Name
│   ├─> Email & Phone
│   ├─> Current Job Title
│   ├─> Skills (array)
│   ├─> Education
│   ├─> Experience Years
│   ├─> Location
│   ├─> LinkedIn URL
│   ├─> GitHub URL
│   └─> Summary
└─> Processing time tracked

Step 3: Intelligent Scoring
├─> Compare candidate skills vs job requirements
├─> Calculate match score (0-100%)
├─> Factors considered:
│   ├─> Skills alignment (40%)
│   ├─> Experience match (30%)
│   ├─> Education requirements (15%)
│   ├─> Location preference (10%)
│   └─> Keywords match (5%)
└─> Generate recommendation

Step 4: Ranking & Display
├─> Sort candidates by match score
├─> Color-coded badges:
│   ├─> 90-100% → Excellent (Green)
│   ├─> 75-89% → Good (Blue)
│   ├─> 60-74% → Fair (Orange)
│   └─> <60% → Poor (Red)
└─> Display in candidate table
```

#### Database Tables

- **Resume** - Store resume data and analysis
  - Fields: resumeUrl, s3Key, matchScore, candidateEmail, candidateName, skills, education, summary, etc.

#### API Endpoints

- `POST /api/resume-upload` - Upload resume to S3
- `POST /api/resume/parse` - Parse resume with AI
- `GET /api/resumes?jobId=xxx` - Get candidates for job
- `DELETE /api/resume/:id` - Delete candidate

#### Features

✅ AWS S3 integration for file storage
✅ AI-powered data extraction
✅ Intelligent matching algorithm
✅ Batch processing support
✅ Real-time progress tracking
✅ Duplicate detection
✅ Skills matching visualization
✅ Export to CSV
✅ Candidate notes

---

### 5️⃣ MCQ ASSESSMENT MODULE

#### Overview

AI-generated multiple choice question assessments with session-based authentication and automated scoring.

#### Process Flow - Create MCQ Template

```
Step 1: Navigate to MCQ Module
├─> Go to /assessment/mcq
├─> Click "Create MCQ Test"

Step 2: Template Creation (Two Modes)

Mode A: AI Generation
├─> Click "Generate with AI"
├─> Fill parameters:
│   ├─> Topic/Technology
│   ├─> Difficulty (Easy/Medium/Hard)
│   ├─> Number of Questions
│   └─> Focus Areas
├─> AI generates questions
├─> Review and edit
└─> Save as template

Mode B: Manual Creation
├─> Click "Add Question"
├─> Fill question details:
│   ├─> Question text
│   ├─> Options (A, B, C, D)
│   ├─> Correct answer
│   ├─> Explanation (optional)
│   └─> Category
└─> Save as template

Step 3: Template Management
├─> View saved templates
├─> Edit existing templates
├─> Duplicate templates
└─> Delete templates
```

#### Process Flow - Assign MCQ to Candidate

```
Step 1: Select MCQ Template
├─> Navigate to /assessment/mcq
├─> Click "Saved Templates"
├─> Select questions from library
└─> Configure test settings

Step 2: Select Job & Candidate
├─> Select job position
├─> View candidates for that job
├─> Select candidate(s)
└─> Can send to multiple candidates

Step 3: Configure Test
├─> Set duration (minutes)
├─> Add custom message
├─> Review test details
└─> Click "Send Test"

Step 4: System Processing
├─> Create Interview record
├─> Generate session password:
│   ├─> Plain text (6 chars, e.g., "A3X9K2")
│   └─> Bcrypt hash for validation
├─> Create InterviewAttempt record
├─> Link Question records
└─> Set status to PUBLISHED

Step 5: Email Notification
├─> Send email to candidate:
│   ├─> Test link: https://exam.synchro-hire.com
│   ├─> Session password
│   ├─> Duration
│   ├─> Number of questions
│   └─> Instructions
└─> Email template with branding
```

#### Candidate Experience

```
Step 1: Receive Email
└─> Candidate gets email with link & password

Step 2: Access Exam Portal
├─> Visit https://exam.synchro-hire.com
├─> Enter email
├─> Enter session password
└─> System validates with bcrypt hash

Step 3: Take Test
├─> View questions one by one
├─> Select answers
├─> Timer countdown
├─> Can review before submit
└─> Submit answers

Step 4: Auto-Scoring
├─> System compares with correct answers
├─> Calculate score
├─> Update InterviewAttempt:
│   ├─> resultScore
│   ├─> completedAt
│   └─> status: COMPLETED
└─> Store in database

Step 5: HR Review
├─> HR sees results in dashboard
├─> View score and percentage
├─> Review answers
└─> Decide next steps
```

#### Database Tables

- **MCQTemplate** - Store question templates
- **Interview** - MCQ test instances
- **Question** - Individual questions (type: MULTIPLE_CHOICE)
- **InterviewAttempt** - Candidate submissions
- **Answer** - Individual answers

#### API Endpoints

- `POST /api/mcq-templates` - Create MCQ template
- `GET /api/mcq-templates` - List templates
- `POST /api/interview/send-mcq-simple` - Send single question test
- `POST /api/interview/send-mcq-test` - Send multiple question test
- `POST /api/interview/submit/:attemptId` - Submit answers
- `GET /api/interviews` - List all interviews/tests

#### Features

✅ AI-powered question generation
✅ Template library management
✅ Session password security (bcrypt)
✅ Timed assessments
✅ Automated scoring
✅ Email notifications
✅ Bulk candidate sending
✅ Question bank/library
✅ Difficulty levels
✅ Category tagging
✅ Results analytics

---

### 6️⃣ AI INTERVIEW MODULE

#### Overview

AI-generated behavioral, technical, and customized interview questions with multi-step workflow for creation and assignment.

#### Process Flow - Create AI Interview Template

```
Step 1: Navigate to AI Interviews
├─> Go to /assessment/avatar
├─> Click "Create AI Interview" (Purple button)

Step 2: Multi-Step Wizard

└─> STEP 1: Select Job
    ├─> Select job position from dropdown
    └─> Click "Next"

└─> STEP 2: Configure Questions
    ├─> Select Question Type:
    │   ├─> Behavioral (Leadership, Communication)
    │   ├─> Technical (Job-specific skills)
    │   └─> Customized (Resume-based, personalized)
    │
    ├─> Set parameters:
    │   ├─> Number of questions (1-20)
    │   ├─> Difficulty (Easy/Medium/Hard)
    │   ├─> Duration (10-120 minutes)
    │   └─> Focus areas (for behavioral)
    │
    ├─> If Customized:
    │   └─> Select specific candidate from dropdown
    │
    └─> Click "Generate Questions"

└─> STEP 3: Review & Save
    ├─> AI generates questions via FastAPI
    ├─> Review generated questions
    ├─> Edit template title
    ├─> Add description
    ├─> Choose action:
    │   ├─> "Save as Template" (reusable)
    │   └─> "Send to Candidate" (for customized only)
    └─> Template saved to database
```

#### Question Types Explained

**A. Behavioral Questions**

- Focus: Soft skills, past experiences, situational responses
- Example: "Tell me about a time when you had to resolve a conflict..."
- Uses: Leadership, teamwork, problem-solving assessment
- Generation: Based on job title and focus areas

**B. Technical Questions**

- Focus: Job-specific technical knowledge
- Example: "Explain the difference between REST and GraphQL..."
- Uses: Technical skill validation
- Generation: Based on job requirements and skills

**C. Customized Questions**

- Focus: Candidate's specific background and resume
- Example: "I see you worked on [Project X] at [Company]. Tell me about..."
- Uses: Personalized deep-dive interviews
- Generation: Based on resume analysis and job requirements

#### Process Flow - Assign AI Interview

```
Step 1: Navigate to AI Interviews
├─> Go to /assessment/avatar
├─> Click "Assign AI Interview" (Blue button)

Step 2: Multi-Step Assignment Wizard

└─> STEP 1: Select Template
    ├─> View saved AI interview templates
    ├─> See template details:
    │   ├─> Title
    │   ├─> Question type
    │   ├─> Number of questions
    │   ├─> Difficulty
    │   └─> Created by & date
    └─> Select template → Click "Next"

└─> STEP 2: Select Job
    ├─> Choose job position
    └─> Click "Next"

└─> STEP 3: Select Candidate
    ├─> View candidates for selected job
    ├─> See candidate details:
    │   ├─> Name
    │   ├─> Email
    │   └─> Match score
    └─> Select candidate → Click "Next"

└─> STEP 4: Review & Send
    ├─> Review all selections:
    │   ├─> Interview template
    │   ├─> Job position
    │   └─> Candidate
    └─> Click "Send Interview"

Step 3: System Processing
├─> Create Interview record (type: ESSAY)
├─> Generate session password
├─> Link questions to interview
├─> Create InterviewAttempt
└─> Send email notification

Step 4: Email to Candidate
├─> Subject: "AI Interview Invitation"
├─> Contains:
│   ├─> Interview link
│   ├─> Session password
│   ├─> Job details
│   ├─> Duration
│   └─> Instructions
└─> Branded email template
```

#### Candidate Experience - Avatar Interview

```
Step 1: Receive Email
└─> Candidate gets interview invitation

Step 2: Access Portal
├─> Visit interview link
├─> Enter session password
└─> System validates

Step 3: AI Avatar Interview
├─> Avatar introduces itself
├─> Questions displayed one by one
├─> Candidate provides answers (text/voice)
├─> Timer tracks duration
└─> Can review before submit

Step 4: Submit Responses
├─> Candidate submits all answers
├─> Status updated to COMPLETED
└─> HR notified

Step 5: HR Review
├─> HR views candidate responses
├─> Evaluate answers manually
├─> Compare to expected answers
└─> Decide next steps
```

#### Database Tables

- **AIInterviewTemplate** - Saved question templates
- **Interview** - Interview instances
- **Question** - Questions (type: ESSAY)
- **InterviewAttempt** - Candidate submissions
- **Answer** - Candidate responses

#### API Endpoints

**Question Generation:**

- `POST /api/interview/generate-behavioral` - Generate behavioral questions
- `POST /api/interview/generate-technical` - Generate technical questions
- `POST /api/interview/generate-customized` - Generate customized questions

**Template Management:**

- `POST /api/interview/ai-templates` - Save template
- `GET /api/interview/ai-templates` - List templates

**Sending Interviews:**

- `POST /api/interview/send-ai-interview` - Send to candidate

**Avatar Assessment:**

- `GET /api/assessments/avatar/:id` - Get avatar assessment
- `POST /api/assessments/avatar/:id/send-invite` - Send invite

#### Features

✅ Three question types (Behavioral, Technical, Customized)
✅ AI-powered generation via FastAPI
✅ Template library system
✅ Multi-step creation wizard
✅ Multi-step assignment wizard
✅ Resume-based personalization
✅ Session password authentication
✅ Email notifications
✅ Avatar interview interface
✅ Text/voice response support
✅ Duration tracking
✅ Manual evaluation

---

### 7️⃣ MANUAL MEETING/INTERVIEW

#### Overview

Schedule and conduct traditional manual interviews with meeting notes and ratings.

#### Process Flow

```
Step 1: Schedule Meeting
├─> Navigate to Meeting Scheduler
├─> Select candidate
├─> Fill meeting details:
│   ├─> Meeting Type:
│   │   ├─> Technical Interview
│   │   ├─> HR Interview
│   │   ├─> Cultural Fit
│   │   └─> Final Round
│   ├─> Date & Time
│   ├─> Duration
│   ├─> Meeting Link (Zoom/Teams/Google Meet)
│   ├─> Interviewers (multiple)
│   └─> Agenda/Notes
└─> Send invite

Step 2: Email Notification
├─> Candidate receives:
│   ├─> Meeting date & time
│   ├─> Meeting link
│   ├─> Interviewer names
│   ├─> Interview type
│   └─> Calendar invite (.ics)
└─> Auto-add to calendar

Step 3: Conduct Interview
├─> Join meeting at scheduled time
├─> Follow agenda
├─> Take notes in system
└─> Record in platform

Step 4: Post-Interview
├─> Update meeting status
├─> Add meeting notes
├─> Rate candidate:
│   ├─> Excellent
│   ├─> Good
│   ├─> Average
│   └─> Poor
├─> Add feedback
└─> Recommend next steps
```

#### Database Tables

- **meetings** - Store meeting details
  - Fields: meetingTime, meetingLink, meetingType, status, notes, meetingRating, agenda

#### API Endpoints

- `POST /api/meetings/send-meeting` - Schedule meeting
- `GET /api/meetings` - List meetings
- `PUT /api/meetings/:id` - Update meeting
- `DELETE /api/meetings/:id` - Cancel meeting

#### Features

✅ Multiple meeting types
✅ Calendar integration
✅ Meeting link management
✅ Agenda templates
✅ Notes and ratings
✅ Multiple interviewers
✅ Reminder emails
✅ Meeting history

---

### 8️⃣ SCHEDULING & CALENDAR

#### Overview

Integrated scheduling system for managing all recruitment-related appointments.

#### Features

```
Calendar View
├─> Month/Week/Day views
├─> Color-coded by type:
│   ├─> MCQ Tests (Blue)
│   ├─> AI Interviews (Purple)
│   ├─> Manual Meetings (Green)
│   └─> Deadlines (Red)
└─> Drag & drop rescheduling

Automated Reminders
├─> 24 hours before
├─> 1 hour before
└─> Email & in-app notifications

Availability Management
├─> Set interviewer availability
├─> Block time slots
├─> Time zone support
└─> Conflict detection

Meeting Room Integration
├─> Zoom integration
├─> Google Meet integration
├─> Microsoft Teams integration
└─> Auto-generate links
```

#### API Endpoints

- `GET /api/scheduler/availability` - Get availability
- `POST /api/scheduler/block` - Block time slot
- `GET /api/scheduler/upcoming` - Get upcoming events

---

### 9️⃣ OFFER LETTER GENERATION

#### Overview

AI-powered offer letter generation with customization and e-signature integration.

#### Process Flow

```
Step 1: Initiate Offer
├─> Navigate to candidate profile
├─> Click "Generate Offer"
├─> System checks:
│   ├─> All assessments completed?
│   ├─> Final interview done?
│   └─> Approvals received?
└─> Proceed if eligible

Step 2: Fill Offer Details
├─> Job Information:
│   ├─> Job Title
│   ├─> Department
│   ├─> Location
│   └─> Start Date
│
├─> Compensation:
│   ├─> Base Salary
│   ├─> Bonus/Incentives
│   ├─> Stock Options
│   └─> Other Benefits
│
├─> Terms:
│   ├─> Employment Type
│   ├─> Probation Period
│   ├─> Notice Period
│   └─> Special Conditions
│
└─> Additional Info:
    ├─> Benefits package
    ├─> Working hours
    └─> Reporting structure

Step 3: AI Generation
├─> System sends data to FastAPI
├─> AI generates offer letter:
│   ├─> Professional formatting
│   ├─> Legal compliance
│   ├─> Company branding
│   └─> Terms and conditions
├─> Returns formatted document
└─> Preview generated

Step 4: Review & Edit
├─> HR reviews generated offer
├─> Edit any sections
├─> Add custom clauses
├─> Legal team review
└─> Finalize

Step 5: Send to Candidate
├─> Generate PDF
├─> Send via email
├─> Include:
│   ├─> Offer letter PDF
│   ├─> Benefits document
│   ├─> Company handbook
│   └─> E-signature link
└─> Track delivery

Step 6: Candidate Response
├─> Candidate receives offer
├─> Reviews documents
├─> Options:
│   ├─> Accept → E-signature
│   ├─> Negotiate → Respond
│   └─> Decline → Reason
└─> Status updated in system

Step 7: Post-Acceptance
├─> Store signed document
├─> Update candidate status
├─> Trigger onboarding
├─> Send welcome email
└─> Archive in records
```

#### Database Tables

- **OfferLetter** - Store offer letters
  - Fields: jobPostId, resumeId, position, salary, startDate, status, generatedContent, signedAt

#### API Endpoints

- `POST /api/offers/generate` - AI generate offer letter
- `POST /api/offers` - Create offer
- `GET /api/offers` - List offers
- `PUT /api/offers/:id` - Update offer status
- `GET /api/offers/:id` - Get offer details

#### Features

✅ AI-powered generation
✅ Template library
✅ Legal compliance checks
✅ Company branding
✅ E-signature integration
✅ Version tracking
✅ Approval workflow
✅ Negotiation tracking
✅ Document archive

---

## Database Schema

### Core Tables

```
companies
├─ id (PK)
├─ companyUuid
├─ name
├─ address
├─ country
├─ logo
├─ linkedinProfile
└─ website

User
├─ id (PK)
├─ email
├─ name
├─ password (hashed)
├─ type (ADMIN/HR/RECRUITER)
├─ companyId (FK → companies)
└─ createdAt

JobPost
├─ id (PK)
├─ jobTitle
├─ companyName
├─ location
├─ jobType
├─ experienceLevel
├─ salaryRange
├─ skillsRequired
├─ jobDescription
├─ keyResponsibilities
├─ qualifications
├─ benefits
├─ isActive
├─ companyId (FK → companies)
├─ createdById (FK → User)
├─ createdAt
└─ updatedAt

Resume
├─ id (PK)
├─ resumeUrl
├─ s3Key
├─ matchScore (0-100)
├─ candidateEmail
├─ candidateName
├─ candidatePhone
├─ currentJobTitle
├─ education
├─ experienceYears
├─ skills (array)
├─ matchedSkills (array)
├─ summary
├─ recommendation
├─ jobPostId (FK → JobPost)
├─ uploadedById (FK → User)
└─ createdAt

MCQTemplate
├─ id (PK)
├─ question
├─ options (JSON)
├─ correctAnswer
├─ topic
├─ difficulty (EASY/MEDIUM/HARD)
├─ explanation
├─ isActive
├─ companyId (FK → companies)
├─ createdById (FK → User)
└─ createdAt

AIInterviewTemplate
├─ id (PK)
├─ title
├─ description
├─ questionType (BEHAVIORAL/TECHNICAL/CUSTOMIZED)
├─ questions (JSON array)
├─ jobPostId (FK → JobPost, optional)
├─ difficulty
├─ totalQuestions
├─ companyId (FK → companies)
├─ createdById (FK → User)
└─ createdAt

Interview
├─ id (PK)
├─ title
├─ description
├─ duration
├─ status (DRAFT/PUBLISHED/COMPLETED)
├─ attempted
├─ candidateEmail
├─ sessionPassword (plain for email)
├─ sessionPasswordHash (bcrypt)
├─ jobPostId (FK → JobPost)
├─ resumeId (FK → Resume)
├─ userId (FK → User)
└─ createdAt

Question
├─ id (PK)
├─ interviewId (FK → Interview)
├─ type (MULTIPLE_CHOICE/ESSAY/TRUE_FALSE)
├─ question
├─ options (JSON, for MCQ)
├─ correct (answer or key points)
├─ points
└─ order

InterviewAttempt
├─ id (PK)
├─ interviewerId (FK → User)
├─ interviewId (FK → Interview)
├─ status (IN_PROGRESS/COMPLETED)
├─ resultScore
├─ maxScore
├─ timeSpent
├─ submittedAt
└─ createdAt

meetings
├─ id (PK)
├─ meetingTime
├─ meetingLink
├─ meetingType (TECHNICAL/HR/CULTURAL_FIT)
├─ status (SCHEDULED/COMPLETED/CANCELLED)
├─ notes
├─ meetingRating (EXCELLENT/GOOD/AVERAGE/POOR)
├─ agenda
├─ resumeId (FK → Resume)
├─ createdById (FK → User)
└─ createdAt

OfferLetter
├─ id (PK)
├─ jobPostId (FK → JobPost)
├─ resumeId (FK → Resume)
├─ position
├─ salary
├─ startDate
├─ status (DRAFT/SENT/ACCEPTED/DECLINED)
├─ generatedContent (JSON)
├─ signedAt
├─ createdById (FK → User)
└─ createdAt
```

---

## API Endpoints Reference

### Authentication

```
POST   /api/auth/signup          Create company & admin user
POST   /api/auth/login           User login
GET    /api/auth/me              Get current user
POST   /api/auth/logout          User logout
```

### Company & Users

```
GET    /api/users                List company users
POST   /api/users                Create user
PUT    /api/users/:id            Update user
DELETE /api/users/:id            Delete user
```

### Job Management

```
POST   /api/job                  Create job post
GET    /api/jobs                 List jobs
GET    /api/job/:id              Get job details
PUT    /api/job/:id              Update job
DELETE /api/job/:id              Delete job
POST   /api/job/generate         AI generate job description
```

### Resume Management

```
POST   /api/resume-upload        Upload resume to S3
POST   /api/resume/parse         Parse resume with AI
GET    /api/resumes              List all resumes
GET    /api/resumes?jobId=xxx    Get candidates for job
DELETE /api/resume/:id           Delete resume
```

### MCQ Module

```
POST   /api/mcq-templates              Create MCQ template
GET    /api/mcq-templates              List templates
GET    /api/mcq-templates/:id          Get template details
PUT    /api/mcq-templates/:id          Update template
DELETE /api/mcq-templates/:id          Delete template
POST   /api/interview/send-mcq-simple  Send MCQ test
POST   /api/interview/send-mcq-test    Send multiple question test
POST   /api/interview/submit/:id       Submit MCQ answers
```

### AI Interview Module

```
POST   /api/interview/generate-behavioral    Generate behavioral questions
POST   /api/interview/generate-technical     Generate technical questions
POST   /api/interview/generate-customized    Generate customized questions
POST   /api/interview/ai-templates           Save AI template
GET    /api/interview/ai-templates           List AI templates
POST   /api/interview/send-ai-interview      Send AI interview to candidate
```

### Meeting Management

```
POST   /api/meetings/send-meeting      Schedule meeting
GET    /api/meetings                   List meetings
GET    /api/meetings/:id               Get meeting details
PUT    /api/meetings/:id               Update meeting
DELETE /api/meetings/:id               Cancel meeting
```

### Offer Letters

```
POST   /api/offers/generate            AI generate offer letter
POST   /api/offers                     Create offer
GET    /api/offers                     List offers
GET    /api/offers/:id                 Get offer details
PUT    /api/offers/:id                 Update offer status
```

### Analytics

```
GET    /api/analytics/company          Company analytics
GET    /api/analytics/job/:id          Job-specific analytics
GET    /api/analytics/candidate/:id    Candidate analytics
```

---

## Complete Candidate Journey

### From Application to Offer

```
┌──────────────────────────────────────────────────────────────────┐
│                     CANDIDATE JOURNEY                             │
└──────────────────────────────────────────────────────────────────┘

Day 1: Application
└─> Candidate uploads resume → AI parsing → Match score calculated
    Status: "Applied"

Day 2: Initial Screening
└─> HR reviews candidates → Top candidates selected
    Status: "Screening"

Day 3: MCQ Assessment
└─> HR sends MCQ test → Candidate receives email
    └─> Candidate takes test (30 mins)
        └─> Auto-scored → Results to HR
            Status: "MCQ Completed" (Score: 85%)

Day 5: AI Interview
└─> HR assigns AI interview → Candidate receives invite
    └─> Candidate completes avatar interview (45 mins)
        └─> Responses recorded → HR reviews
            Status: "AI Interview Completed"

Day 7: Technical Interview
└─> HR schedules meeting → Calendar invite sent
    └─> Live interview conducted → Notes recorded
        └─> Rating: "Excellent"
            Status: "Technical Interview Passed"

Day 9: Final Interview
└─> HR schedules final round → Meet hiring manager
    └─> Cultural fit assessment → Salary discussion
        Status: "Final Interview Completed"

Day 10: Offer Decision
└─> HR generates offer letter → AI creates document
    └─> Legal review → Approvals obtained
        Status: "Offer Prepared"

Day 11: Offer Extended
└─> Offer sent to candidate → Email with PDF
    └─> Candidate reviews (3 days)
        Status: "Offer Sent"

Day 14: Offer Accepted
└─> Candidate signs → E-signature captured
    └─> Onboarding triggered → Welcome email sent
        Status: "Accepted" → "Onboarding"

Day 21: Start Date
└─> Candidate joins → Onboarding complete
    Status: "Hired"
```

---

## System Configuration

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# JWT Authentication
JWT_SECRET=your-secret-key

# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your-bucket-name

# Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@synchro-hire.com

# AI Service
AI_API_URL=https://ai.synchro-hire.com
AI_API_KEY=your-api-key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
EXAM_PORTAL_URL=https://exam.synchro-hire.com
```

### Security Features

✅ JWT-based authentication
✅ Bcrypt password hashing
✅ Session password encryption
✅ Role-based access control (RBAC)
✅ Company data isolation
✅ Secure file storage (S3)
✅ API rate limiting (planned)
✅ HTTPS enforcement (production)

---

## Future Enhancements

### Planned Features

⏳ Job posting URL generation with limits
⏳ LinkedIn API integration
⏳ Video interview recording
⏳ Automated reference checks
⏳ Background verification integration
⏳ Candidate portal dashboard
⏳ Mobile applications (iOS/Android)
⏳ WhatsApp notifications
⏳ Slack integration
⏳ Advanced analytics & reporting
⏳ AI-powered candidate recommendations
⏳ Automated interview scheduling
⏳ Multi-language support
⏳ E-signature integration (DocuSign)
⏳ Onboarding workflow automation

---

## Support & Documentation

### Getting Started

1. Clone repository
2. Install dependencies: `npm install`
3. Configure environment variables
4. Setup database: `npx prisma migrate dev`
5. Run development server: `npm run dev`

### Additional Documentation

- API Documentation: `/docs/api`
- User Guide: `USER_GUIDE.md`
- MCQ Module: `MCQ_WORKFLOW_COMPLETE_STORY.md`
- AI Interview Module: `AI_INTERVIEW_MODULE_IMPLEMENTATION_SUMMARY.md`
- Migration Guide: `MIGRATION_GUIDE.md`

### Contact

- Email: support@synchro-hire.com
- Website: https://synchro-hire.com

---

**Version:** 1.0.0  
**Last Updated:** February 4, 2026  
**Platform:** Synchro-Hire HR Automation
