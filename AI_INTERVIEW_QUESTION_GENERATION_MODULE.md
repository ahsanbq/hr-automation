# AI Interview Question Generation Module - Complete Documentation

## 📋 Overview

The **AI Interview Question Generation Module** is a restructured, scalable system that allows HR users to generate three types of AI-powered interview questions:

1. **Behavioral Questions** - Focus on soft skills, problem-solving, and past experiences
2. **Technical Questions** - Based on job requirements and technical skills
3. **Customized Candidate-Specific Questions** - Tailored to individual candidate's resume and experience

---

## 🏗️ Architecture

### File Structure

```
src/
├── types/
│   └── ai-interview.ts                    # TypeScript type definitions
├── lib/
│   └── ai-interview-service.ts            # AI service client functions
├── components/
│   └── interview/
│       └── AIQuestionGenerator.tsx        # Frontend question generator component
└── pages/
    └── api/
        └── interview/
            ├── generate-behavioral.ts     # Behavioral questions API
            ├── generate-technical.ts      # Technical questions API
            └── generate-customized.ts     # Customized questions API
```

---

## 📊 Database Schema Mapping

### JobPost Table Fields Used

The module automatically extracts the following fields from the `JobPost` table:

| Database Field | API Field | Description |
|---------------|-----------|-------------|
| `jobTitle` | `title` | Job position title |
| `companyName` | `company` | Company name |
| `location` | `location` | Job location |
| `jobType` | `job_type` | Employment type (Full-time, Part-time, etc.) |
| `experienceLevel` | `experience_level` | Required experience level |
| `skillsRequired` | `skills_required` | Array of required skills |
| `keyResponsibilities` | `responsibilities` | Job responsibilities |
| `qualifications` | `qualifications` | Required qualifications |
| `jobDescription` | `description` | Full job description |
| `salaryRange` | `salary_range` | Salary range (optional) |
| `benefits` | `benefits` | Job benefits (optional) |

### Resume (Candidate) Table Fields Used

The module automatically extracts the following fields from the `Resume` table:

| Database Field | API Field | Description |
|---------------|-----------|-------------|
| `resumeUrl` / `s3Key` | `resume_path` | Path to candidate's resume |
| `candidateName` | `name` | Candidate's full name |
| `candidateEmail` | `email` | Email address |
| `candidatePhone` | `phone` | Phone number |
| `skills` | `skills` | Array of candidate skills |
| `experienceYears` | `experience_years` | Years of experience |
| `education` | `education` | Education background |
| `matchScore` | `match_score` | AI-calculated match score |
| `summary` | `summary` | Resume summary |
| `location` | `location` | Candidate location |
| `linkedinUrl` | `linkedin_url` | LinkedIn profile |
| `githubUrl` | `github_url` | GitHub profile |
| `processingMethod` | `processing_method` | How resume was processed |
| `analysisTimestamp` | `analysis_timestamp` | When resume was analyzed |

### Manual Input Fields (Provided by HR)

These fields are **NOT** in the database and must be provided by HR users through the frontend:

- `number_of_questions` - How many questions to generate (1-20)
- `difficulty` - Question difficulty level (Easy, Medium, Hard)
- `focus_areas` - Specific areas to focus on (only for Behavioral questions)

---

## 🔌 API Endpoints

### 1. Generate Behavioral Questions

**Endpoint:** `POST /api/interview/generate-behavioral`

**Purpose:** Generate questions focused on soft skills, problem-solving, and behavioral competencies.

**Request Body:**
```json
{
  "jobPostId": "clx1y2z3a4b5c6d7e8f9g0h1",
  "number_of_questions": 5,
  "difficulty": "Medium",
  "focus_areas": [
    "Leadership",
    "Teamwork",
    "Problem Solving",
    "Communication"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "questions": [
      {
        "question": "Tell me about a time when you had to lead a team through a challenging project. How did you handle it?",
        "expected_answer_points": [
          "Clear communication with team members",
          "Setting realistic goals and deadlines",
          "Handling conflicts and maintaining team morale",
          "Adapting to unexpected challenges"
        ]
      }
    ]
  },
  "jobPost": {
    "id": "clx1y2z3a4b5c6d7e8f9g0h1",
    "title": "Backend Developer",
    "company": "TechNova Solutions"
  }
}
```

**FastAPI Backend Expectation:**
```
POST {{baseUrl}}/generate-behavioral-questions

Request Body:
{
  "job_requirement": { ... },
  "number_of_questions": 5,
  "focus_areas": [...],
  "difficulty": "Medium"
}
```

---

### 2. Generate Technical Questions

**Endpoint:** `POST /api/interview/generate-technical?difficulty=Medium&num_questions=5`

**Purpose:** Generate technical questions based on job requirements and required skills.

**Request Body:**
```json
{
  "jobPostId": "clx1y2z3a4b5c6d7e8f9g0h1"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "questions": [
      {
        "question": "Explain how you would implement JWT-based authentication in a Node.js/Express application.",
        "expected_answer_points": [
          "Use jsonwebtoken library for token generation",
          "Store tokens securely (not in localStorage)",
          "Implement token refresh mechanism",
          "Handle token expiration and validation"
        ],
        "difficulty": "Medium"
      }
    ]
  },
  "jobPost": {
    "id": "clx1y2z3a4b5c6d7e8f9g0h1",
    "title": "Backend Developer",
    "company": "TechNova Solutions"
  }
}
```

**FastAPI Backend Expectation:**
```
POST {{baseUrl}}/generate-technical-questions?difficulty=Medium&num_questions=5

Request Body:
{
  "title": "Backend Developer",
  "company": "TechNova Solutions",
  "location": "Dhaka, Bangladesh",
  "job_type": "Full-time",
  "experience_level": "Mid-level (2-4 years)",
  "skills_required": ["Node.js", "Express.js", "MongoDB"],
  "responsibilities": [...],
  "qualifications": [...],
  "description": "...",
  "salary_range": "BDT 80,000 - 130,000",
  "benefits": [...]
}
```

---

### 3. Generate Customized Candidate-Specific Questions

**Endpoint:** `POST /api/interview/generate-customized?num_questions=4&difficulty=Medium`

**Purpose:** Generate personalized questions tailored to the candidate's resume and the job requirements.

**Request Body:**
```json
{
  "jobPostId": "clx1y2z3a4b5c6d7e8f9g0h1",
  "resumeId": "clz9x8w7v6u5t4s3r2q1p0o9"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "questions": [
      {
        "question": "I see you have experience with MongoDB. Can you explain how you optimized database queries in your previous project?",
        "expected_answer_points": [
          "Use of indexes for frequently queried fields",
          "Query optimization techniques",
          "Aggregation pipeline usage",
          "Performance monitoring and profiling"
        ],
        "reasoning": "Candidate has MongoDB listed as a skill and the job requires database optimization knowledge"
      }
    ]
  },
  "candidate": {
    "id": "clz9x8w7v6u5t4s3r2q1p0o9",
    "name": "Ahsan Tamim",
    "email": "ahsan.tamim@gmail.com",
    "matchScore": 87
  },
  "jobPost": {
    "id": "clx1y2z3a4b5c6d7e8f9g0h1",
    "title": "Backend Developer",
    "company": "TechNova Solutions"
  }
}
```

**FastAPI Backend Expectation:**
```
POST {{baseUrl}}/generate-customized-questions?num_questions=4&difficulty=Medium

Request Body:
{
  "candidate": {
    "resume_path": "/resumes/ahsan_tamim.pdf",
    "name": "Ahsan Tamim",
    "email": "ahsan.tamim@gmail.com",
    "phone": "+8801712345678",
    "skills": ["JavaScript", "React.js", "Node.js"],
    "experience_years": 3,
    "education": [],
    "match_score": 87,
    "summary": "Full Stack Engineer...",
    "location": "Dhaka, Bangladesh",
    ...
  },
  "job_requirement": {
    "title": "Backend Developer",
    "company": "TechNova Solutions",
    ...
  }
}
```

---

## 💻 Frontend Integration

### Using the AIQuestionGenerator Component

```tsx
import AIQuestionGenerator from "@/components/interview/AIQuestionGenerator";

function InterviewPage() {
  const [showGenerator, setShowGenerator] = useState(false);

  const handleQuestionsGenerated = (questions: any[]) => {
    console.log("Generated questions:", questions);
    // Handle the generated questions (e.g., save to database, display in UI)
  };

  return (
    <>
      <Button onClick={() => setShowGenerator(true)}>
        Generate AI Questions
      </Button>

      <AIQuestionGenerator
        visible={showGenerator}
        onClose={() => setShowGenerator(false)}
        jobPostId="clx1y2z3a4b5c6d7e8f9g0h1"
        resumeId="clz9x8w7v6u5t4s3r2q1p0o9" // Optional: for customized questions
        candidateName="Ahsan Tamim" // Optional: display in UI
        onQuestionsGenerated={handleQuestionsGenerated}
      />
    </>
  );
}
```

### Component Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `visible` | `boolean` | Yes | Show/hide modal |
| `onClose` | `() => void` | Yes | Close handler |
| `jobPostId` | `string` | Yes | Job post ID from database |
| `resumeId` | `string` | No | Candidate resume ID (required for customized questions) |
| `candidateName` | `string` | No | Candidate name for display |
| `onQuestionsGenerated` | `(questions: any[]) => void` | No | Callback with generated questions |

---

## 🎨 User Experience Flow

### HR User Journey

1. **Navigate to Interview Management** → Select a job post
2. **Click "Generate AI Questions"** → Modal opens
3. **Select Question Type:**
   - Behavioral (requires focus areas)
   - Technical (automatic from job requirements)
   - Customized (requires candidate selection)
4. **Configure Parameters:**
   - Number of questions (1-20)
   - Difficulty level (Easy, Medium, Hard)
   - Focus areas (if behavioral)
5. **Click "Generate Questions"** → AI generates questions in ~10-30 seconds
6. **Review Results:**
   - See all generated questions
   - View expected answer points
   - View reasoning (for customized questions)
7. **Save or Generate New** → HR can save questions or generate new ones

---

## 🔄 Data Flow

```
Frontend (React) 
    ↓
Next.js API Route (/api/interview/generate-*)
    ↓
Fetch Job + Candidate data from PostgreSQL (Prisma)
    ↓
Map database fields to AI request format
    ↓
Call FastAPI AI Service (ai-interview-service.ts)
    ↓
FastAPI processes with AI/ML model
    ↓
Return structured questions with expected answers
    ↓
Display in frontend UI
```

---

## 🚀 Scalability & Best Practices

### ✅ Clean Architecture

- **Separation of Concerns:** Types, services, APIs, and UI components are separated
- **Reusable Mappers:** Database-to-API mapping functions are centralized
- **Type Safety:** Full TypeScript support with strongly typed interfaces
- **Error Handling:** Comprehensive error handling at every layer

### ✅ Database Optimization

- Queries only fetch required fields (using Prisma `select`)
- Validation ensures resume belongs to job post
- Indexed fields for fast lookups

### ✅ API Design

- RESTful conventions
- Clear request/response structures
- Proper HTTP status codes
- Timeout handling (30 seconds for AI generation)

### ✅ Frontend Best Practices

- Ant Design components for consistent UI
- Loading states and error handling
- Form validation
- Responsive design

---

## 🧪 Testing the Module

### 1. Test Behavioral Questions API

```bash
curl -X POST http://localhost:3000/api/interview/generate-behavioral \
  -H "Content-Type: application/json" \
  -d '{
    "jobPostId": "YOUR_JOB_ID",
    "number_of_questions": 3,
    "difficulty": "Medium",
    "focus_areas": ["Leadership", "Problem Solving"]
  }'
```

### 2. Test Technical Questions API

```bash
curl -X POST "http://localhost:3000/api/interview/generate-technical?difficulty=Hard&num_questions=5" \
  -H "Content-Type: application/json" \
  -d '{
    "jobPostId": "YOUR_JOB_ID"
  }'
```

### 3. Test Customized Questions API

```bash
curl -X POST "http://localhost:3000/api/interview/generate-customized?num_questions=4&difficulty=Medium" \
  -H "Content-Type: application/json" \
  -d '{
    "jobPostId": "YOUR_JOB_ID",
    "resumeId": "YOUR_RESUME_ID"
  }'
```

---

## 🐛 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| "Job post not found" | Verify `jobPostId` exists in database |
| "Resume not found" | Verify `resumeId` exists and belongs to job post |
| "focus_areas must be a non-empty array" | Provide at least one focus area for behavioral questions |
| "Failed to generate questions" | Check FastAPI backend is running and accessible |
| Timeout error | AI generation can take 10-30 seconds; increase timeout if needed |

### Debugging Tips

1. **Check FastAPI URL:** Verify `NEXT_PUBLIC_FASTAPI_URL` is set correctly
2. **Check Database:** Ensure job and resume data exists and is properly formatted
3. **Check Logs:** Review browser console and server logs for detailed errors
4. **Test Endpoints Individually:** Use curl or Postman to test each endpoint

---

## 📝 Future Enhancements

- [ ] Save generated questions to database for reuse
- [ ] Question templates library
- [ ] Multi-language support
- [ ] Question difficulty auto-adjustment based on candidate match score
- [ ] Bulk question generation for multiple candidates
- [ ] Export questions to PDF/Word
- [ ] Integration with video interview system
- [ ] AI-powered answer evaluation

---

## 📞 Support

For issues or questions about the AI Interview Module:

1. Check this documentation first
2. Review the code comments in each file
3. Check the FastAPI backend logs
4. Contact the development team

---

## 🎯 Summary

This module provides a **clean, scalable, and production-ready** solution for AI-powered interview question generation. It:

✅ Automatically extracts data from existing Job and Resume tables  
✅ Supports 3 distinct question generation types  
✅ Provides a user-friendly React UI  
✅ Follows clean architecture principles  
✅ Includes comprehensive type safety  
✅ Is fully documented and testable  

**Ready for production use!** 🚀
