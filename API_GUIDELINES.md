# HR Automation Application - API Guidelines & Architecture

## Table of Contents

1. [Application Overview](#application-overview)
2. [Database Schema Analysis](#database-schema-analysis)
3. [API Architecture](#api-architecture)
4. [External AI API Integration](#external-ai-api-integration)
5. [Internal API Structure](#internal-api-structure)
6. [Folder Structure Guidelines](#folder-structure-guidelines)
7. [Workflow Process](#workflow-process)
8. [Missing Database Schema Elements](#missing-database-schema-elements)
9. [Implementation Guidelines](#implementation-guidelines)

## Application Overview

This is an HR automation application built with Next.js that enables companies to:

- Manage company profiles and users
- Create and manage job listings
- Process and analyze resumes
- Schedule and conduct interviews
- Generate offer letters
- Automate LinkedIn posting
- Leverage AI for various HR tasks

## Database Schema Analysis

### Current Schema Structure

The current Prisma schema includes:

- **Company**: Company information and settings
- **User**: Users with different roles (ADMIN, MANAGER, COMPANY_USER)
- **JobPost**: Job listings with AI-generated content support
- **GeneratedJobPost**: AI-generated job post versions
- **Resume**: Resume storage and analysis data
- **Meeting**: Interview scheduling and management
- **ApiLog**: API usage tracking

### Current Relationships

```
Company (1) -> (Many) User
Company (1) -> (Many) JobPost
User (1) -> (Many) JobPost (creator)
User (1) -> (Many) GeneratedJobPost
User (1) -> (Many) Meeting
JobPost (1) -> (Many) GeneratedJobPost
JobPost (1) -> (Many) Resume
Resume (1) -> (Many) Meeting
```

## API Architecture

### External AI APIs (hr-recruitment-ai-api.onrender.com)

These APIs handle AI-powered content generation and analysis:

1. **POST /create-job-post** - Generate job descriptions
2. **POST /make-linkedin-post** - Create LinkedIn posts
3. **POST /analyze-resumes** - Analyze resume compatibility
4. **POST /analyze-resumes-v2** - Enhanced resume analysis
5. **POST /generate-interview-agenda** - Create interview agendas
6. **POST /generate-offer-letter** - Generate offer letters
7. **POST /generate-offer-letter-document** - Create formatted offer documents
8. **POST /format-offer-letter-document** - Format offer letter documents
9. **POST /generate-behavioral-questions** - Create behavioral interview questions
10. **POST /generate-technical-questions** - Create technical interview questions
11. **POST /generate-customized-questions** - Create custom interview questions

### Internal APIs (Next.js API Routes)

These APIs handle data persistence and business logic:

**Current APIs:**

- `/api/companies` - Company management
- `/api/jobs` - Job post CRUD operations
- `/api/resumes` - Resume management
- `/api/meetings` - Meeting/interview scheduling
- `/api/offers` - Offer management
- `/api/questions` - Question bank management
- `/api/auth/login` - User authentication
- `/api/auth/register` - User registration
- `/api/generate-job-description` - AI job description wrapper
- `/api/sort-cvs` - Resume sorting logic

## External AI API Integration

### Example Workflow: Job Description Generation

**Input (from user):**

```json
{
  "title": "Senior Software Engineer",
  "company": "TechCorp Inc",
  "department": "Engineering",
  "location": "Remote",
  "job_type": "Full-time",
  "experience_level": "Senior (5+ years)",
  "key_skills": ["React", "Node.js", "PostgreSQL"],
  "budget_range": "$80,000 - $120,000",
  "additional_requirements": "Must have experience with microservices"
}
```

**External AI API Call:**

```javascript
// External API generates content
POST https://hr-recruitment-ai-api.onrender.com/create-job-post
// Returns: { job_requirement: "Generated job description..." }
```

**Internal API Processing:**

```javascript
// Internal API saves to database
POST / api / jobs;
// Saves job post with AI-generated content
// Links to company and user
// Creates GeneratedJobPost record
```

## Internal API Structure

### Recommended Folder Structure

```
src/
├── pages/
│   └── api/
│       ├── auth/
│       │   ├── login.ts
│       │   ├── register.ts
│       │   └── refresh.ts
│       ├── companies/
│       │   ├── index.ts              # GET /api/companies, POST /api/companies
│       │   ├── [id].ts               # GET, PUT, DELETE /api/companies/[id]
│       │   └── [id]/
│       │       ├── users.ts          # GET /api/companies/[id]/users
│       │       └── jobs.ts           # GET /api/companies/[id]/jobs
│       ├── jobs/
│       │   ├── index.ts              # GET, POST /api/jobs
│       │   ├── [id].ts               # GET, PUT, DELETE /api/jobs/[id]
│       │   └── [id]/
│       │       ├── resumes.ts        # GET, POST /api/jobs/[id]/resumes
│       │       ├── interviews.ts     # GET, POST /api/jobs/[id]/interviews
│       │       └── offers.ts         # GET, POST /api/jobs/[id]/offers
│       ├── resumes/
│       │   ├── index.ts              # GET, POST /api/resumes
│       │   ├── [id].ts               # GET, PUT, DELETE /api/resumes/[id]
│       │   └── [id]/
│       │       └── meetings.ts       # GET, POST /api/resumes/[id]/meetings
│       ├── meetings/
│       │   ├── index.ts              # GET, POST /api/meetings
│       │   └── [id].ts               # GET, PUT, DELETE /api/meetings/[id]
│       ├── ai/
│       │   ├── generate-job.ts       # POST /api/ai/generate-job
│       │   ├── analyze-resume.ts     # POST /api/ai/analyze-resume
│       │   ├── generate-questions.ts # POST /api/ai/generate-questions
│       │   ├── generate-offer.ts     # POST /api/ai/generate-offer
│       │   └── linkedin-post.ts      # POST /api/ai/linkedin-post
│       └── upload/
│           └── resume.ts             # POST /api/upload/resume
├── lib/
│   ├── db.ts                         # Prisma client
│   ├── auth.ts                       # Auth utilities
│   ├── ai-client.ts                  # External AI API client
│   ├── validators/                   # Input validation schemas
│   │   ├── job.ts
│   │   ├── resume.ts
│   │   └── meeting.ts
│   └── utils/
│       ├── file-upload.ts
│       └── date-helpers.ts
```

## Workflow Process

### 1. Company Registration & Setup

```
1. Admin creates company account → Company table
2. Company admin creates company users → User table (linked to company)
3. Users can have roles: ADMIN, MANAGER, COMPANY_USER
```

### 2. Job Management Workflow

```
1. User creates job requirements → JobPost table
2. Optional: Use AI to generate job description → External AI API
3. AI-generated content saved → GeneratedJobPost table
4. Job post published and activated
```

### 3. Resume Management Workflow

```
1. Resumes uploaded for specific job → Resume table (linked to JobPost)
2. Optional: AI analysis of resume compatibility → External AI API
3. Resume analysis results stored in Resume.jsonData
4. Resumes can be sorted/filtered based on AI scores
```

### 4. Interview Process Workflow

```
1. Select candidates from resumes → Create Meeting records
2. Optional: Generate interview questions → External AI API
3. Schedule interview meetings → Meeting table
4. Conduct interviews and store results → Update Meeting.meetingSummary
```

### 5. Offer Management Workflow

```
1. Select candidates after interviews → OfferLetter table
2. Optional: Generate offer letter → External AI API
3. Send and track offer status → Update OfferLetter status
```

## Missing Database Schema Elements

### 1. OfferLetter Table

```prisma
model OfferLetter {
  id              String        @id @default(cuid())
  candidateName   String
  candidateEmail  String
  position        String
  salary          String
  startDate       DateTime
  benefits        String?       @db.Text
  terms           String?       @db.Text
  generatedContent String?      @db.Text  // AI-generated offer letter
  status          OfferStatus   @default(PENDING)
  sentAt          DateTime?
  respondedAt     DateTime?
  expiresAt       DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  // Relationships
  jobPostId   String
  jobPost     JobPost   @relation(fields: [jobPostId], references: [id])

  resumeId    String
  resume      Resume    @relation(fields: [resumeId], references: [id])

  createdById Int
  createdBy   User      @relation(fields: [createdById], references: [id])

  @@map("offer_letters")
}

enum OfferStatus {
  PENDING
  SENT
  ACCEPTED
  REJECTED
  EXPIRED
  WITHDRAWN
}
```

### 2. InterviewQuestion Table

```prisma
model InterviewQuestion {
  id           String        @id @default(cuid())
  question     String        @db.Text
  questionType QuestionType
  difficulty   Difficulty?
  category     String?       // e.g., "JavaScript", "System Design", "Leadership"
  aiGenerated  Boolean       @default(false)
  isActive     Boolean       @default(true)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  // Relationships
  jobPostId   String?
  jobPost     JobPost?  @relation(fields: [jobPostId], references: [id])

  createdById Int
  createdBy   User      @relation(fields: [createdById], references: [id])

  // Many-to-many with meetings
  meetingQuestions MeetingQuestion[]

  @@map("interview_questions")
}

model MeetingQuestion {
  id         String @id @default(cuid())
  answer     String? @db.Text
  rating     Int?    // 1-10 scale
  notes      String? @db.Text

  meetingId  String
  meeting    Meeting @relation(fields: [meetingId], references: [id], onDelete: Cascade)

  questionId String
  question   InterviewQuestion @relation(fields: [questionId], references: [id])

  @@unique([meetingId, questionId])
  @@map("meeting_questions")
}

enum QuestionType {
  TECHNICAL
  BEHAVIORAL
  SITUATIONAL
  CUSTOM
}

enum Difficulty {
  EASY
  MEDIUM
  HARD
}
```

### 3. LinkedInPost Table

```prisma
model LinkedInPost {
  id              String    @id @default(cuid())
  content         String    @db.Text
  jobPostId       String?
  postUrl         String?
  status          PostStatus @default(DRAFT)
  scheduledAt     DateTime?
  publishedAt     DateTime?
  aiGenerated     Boolean   @default(false)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relationships
  jobPost     JobPost?  @relation(fields: [jobPostId], references: [id])

  companyId   Int
  company     Company   @relation(fields: [companyId], references: [id])

  createdById Int
  createdBy   User      @relation(fields: [createdById], references: [id])

  @@map("linkedin_posts")
}

enum PostStatus {
  DRAFT
  SCHEDULED
  PUBLISHED
  FAILED
}
```

### 4. Update Existing Models

Add missing relationships:

```prisma
// Add to JobPost model
model JobPost {
  // ...existing fields...

  // Add new relationships
  interviewQuestions InterviewQuestion[]
  offerLetters       OfferLetter[]
  linkedinPosts      LinkedInPost[]
}

// Add to Resume model
model Resume {
  // ...existing fields...

  // Add new relationship
  offerLetters OfferLetter[]
}

// Add to Meeting model
model Meeting {
  // ...existing fields...

  // Add new relationship
  meetingQuestions MeetingQuestion[]
}

// Add to Company model
model Company {
  // ...existing fields...

  // Add new relationship
  linkedinPosts LinkedInPost[]
}

// Add to User model
model User {
  // ...existing fields...

  // Add new relationships
  interviewQuestions InterviewQuestion[]
  offerLetters       OfferLetter[]
  linkedinPosts      LinkedInPost[]
}
```

## Implementation Guidelines

### 1. API Naming Convention

- Use RESTful conventions
- Group related endpoints under folders
- Use descriptive names for AI-specific endpoints

### 2. Error Handling

```javascript
// Standardized error response format
{
  "error": true,
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": {} // Optional additional details
}
```

### 3. AI API Integration Pattern

```javascript
// 1. Validate input
// 2. Call external AI API
// 3. Handle AI API response
// 4. Save to database
// 5. Return combined result

export default async function handler(req, res) {
  try {
    // Validate input
    const validatedData = validateInput(req.body);

    // Call external AI API
    const aiResponse = await callExternalAI(validatedData);

    // Save to database
    const savedRecord = await saveToDatabase({
      ...validatedData,
      aiGeneratedContent: aiResponse.data,
    });

    // Return response
    res.json({
      success: true,
      data: savedRecord,
      aiGenerated: aiResponse.data,
    });
  } catch (error) {
    handleError(error, res);
  }
}
```

### 4. Authentication & Authorization

- Implement role-based access control
- Company users can only access their company's data
- Admins have system-wide access
- Managers have department-level access

### 5. File Upload Handling

- Implement secure file upload for resumes
- Store files in cloud storage (AWS S3, Cloudinary)
- Save file URLs in database
- Implement file type validation

### 6. API Rate Limiting

- Implement rate limiting for AI API calls
- Track usage in ApiLog table
- Implement quotas per company/user

### 7. Caching Strategy

- Cache AI-generated content to avoid redundant API calls
- Implement Redis for session management
- Cache frequently accessed data (companies, job posts)

### 8. Testing Strategy

- Unit tests for utility functions
- Integration tests for API endpoints
- Mock external AI API calls in tests
- Test database operations with test database

This comprehensive guideline provides the foundation for building a robust, scalable HR automation application with proper separation between AI-powered content generation and internal business logic management.
