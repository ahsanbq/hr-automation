# 🧪 Testing AI Question Generator Endpoints

## ✅ Configuration Status

Your system is correctly configured to use the external FastAPI endpoints:

**Base URL:** `https://ai.synchro-hire.com`

**Endpoints:**
1. ✅ `POST /generate-behavioral-questions`
2. ✅ `POST /generate-technical-questions?difficulty={difficulty}&num_questions={num}`
3. ✅ `POST /generate-customized-questions?num_questions={num}&difficulty={difficulty}`

---

## 🔍 How to Test

### 1. Test from UI (Easiest)

1. **Navigate to:** `http://localhost:3000/assessment/avatar`
2. **Click:** "Generate AI Questions" button (purple gradient)
3. **Select a job** (it will auto-populate from the table if you click "AI Q's" on a job row)
4. **Configure:**
   - Select question type (Behavioral, Technical, or Customized)
   - Set number of questions (1-20)
   - Set difficulty (Easy, Medium, Hard)
   - Add focus areas if Behavioral
5. **Click:** "Generate Questions"
6. **Wait:** 10-30 seconds for AI processing
7. **View:** Generated questions with expected answer points

### 2. Test API Directly (Advanced)

#### Test Behavioral Questions
```bash
curl -X POST http://localhost:3000/api/interview/generate-behavioral \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "jobPostId": "YOUR_JOB_ID",
    "number_of_questions": 3,
    "difficulty": "Medium",
    "focus_areas": ["Leadership", "Problem Solving"]
  }'
```

#### Test Technical Questions
```bash
curl -X POST "http://localhost:3000/api/interview/generate-technical?difficulty=Medium&num_questions=3" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "jobPostId": "YOUR_JOB_ID"
  }'
```

#### Test Customized Questions
```bash
curl -X POST "http://localhost:3000/api/interview/generate-customized?num_questions=3&difficulty=Medium" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "jobPostId": "YOUR_JOB_ID",
    "resumeId": "YOUR_RESUME_ID"
  }'
```

---

## 🎯 Expected Request Flow

```
Your Frontend (localhost:3000)
    ↓
Your Next.js API (/api/interview/generate-*)
    ↓ (Fetches job/resume from database)
    ↓ (Maps data to AI format)
    ↓
External FastAPI (https://ai.synchro-hire.com)
    ↓ (AI processes request)
    ↓
Response with Generated Questions
    ↓
Display in UI
```

---

## 📊 Request Format Sent to FastAPI

### Behavioral Questions Request
```json
POST https://ai.synchro-hire.com/generate-behavioral-questions
Content-Type: application/json

{
  "job_requirement": {
    "title": "Backend Developer",
    "company": "TechNova Solutions",
    "location": "Dhaka, Bangladesh",
    "job_type": "Full-time",
    "experience_level": "Mid-level (2-4 years)",
    "skills_required": ["Node.js", "Express.js", "MongoDB"],
    "responsibilities": ["Develop APIs", "Design database schemas"],
    "qualifications": ["Bachelor's degree", "2+ years experience"],
    "description": "We are looking for...",
    "salary_range": "BDT 80,000 - 130,000",
    "benefits": ["Remote work", "Health insurance"]
  },
  "number_of_questions": 5,
  "focus_areas": ["Leadership", "Problem Solving"],
  "difficulty": "Medium"
}
```

### Technical Questions Request
```json
POST https://ai.synchro-hire.com/generate-technical-questions?difficulty=Hard&num_questions=5
Content-Type: application/json

{
  "title": "Backend Developer",
  "company": "TechNova Solutions",
  "location": "Dhaka, Bangladesh",
  "job_type": "Full-time",
  "experience_level": "Mid-level (2-4 years)",
  "skills_required": ["Node.js", "Express.js", "MongoDB"],
  "responsibilities": ["Develop APIs", "Design database schemas"],
  "qualifications": ["Bachelor's degree", "2+ years experience"],
  "description": "We are looking for...",
  "salary_range": "BDT 80,000 - 130,000",
  "benefits": ["Remote work", "Health insurance"]
}
```

### Customized Questions Request
```json
POST https://ai.synchro-hire.com/generate-customized-questions?num_questions=4&difficulty=Medium
Content-Type: application/json

{
  "candidate": {
    "resume_path": "/resumes/candidate.pdf",
    "name": "Ahsan Tamim",
    "email": "ahsan@example.com",
    "phone": "+8801712345678",
    "skills": ["JavaScript", "React.js", "Node.js"],
    "experience_years": 3,
    "education": ["Bachelor's in CS"],
    "match_score": 87,
    "summary": "Full Stack Engineer...",
    "location": "Dhaka, Bangladesh",
    "linkedin_url": "",
    "github_url": "",
    "portfolio_url": "",
    "work_experience": [],
    "projects": [],
    "certifications": [],
    "languages": [],
    "awards": [],
    "volunteer_experience": [],
    "interests": [],
    "processing_method": "AI Resume Parser",
    "analysis_timestamp": "2026-02-04T05:30:00.000Z"
  },
  "job_requirement": {
    "title": "Backend Developer",
    "company": "TechNova Solutions",
    ...
  }
}
```

---

## 🔧 Troubleshooting

### Issue: "Failed to generate questions"
**Possible Causes:**
1. FastAPI server at `https://ai.synchro-hire.com` is down
2. Network connectivity issue
3. FastAPI timeout (>30 seconds)
4. Invalid request format

**How to Debug:**
1. Open browser DevTools → Network tab
2. Generate questions
3. Look for the API call to `/api/interview/generate-*`
4. Check the request payload and response
5. Check browser console for errors

### Issue: "Job post not found" or "Resume not found"
**Solution:** Ensure valid job and resume IDs exist in your database

### Issue: Timeout after 30 seconds
**Solution:** 
- Reduce number of questions
- Check FastAPI server performance
- Increase timeout in `ai-interview-service.ts` if needed

---

## 📝 Verify Checklist

- [ ] FastAPI server is accessible at `https://ai.synchro-hire.com`
- [ ] You can access `/assessment/avatar` page
- [ ] You see "Generate AI Questions" button
- [ ] Jobs are loading in the table
- [ ] You see "AI Q's" buttons on each job row
- [ ] Clicking button opens the modal
- [ ] Modal shows three question type options
- [ ] You can configure parameters (quantity, difficulty, focus areas)
- [ ] Clicking "Generate Questions" shows loading state
- [ ] Questions appear after generation
- [ ] Success message is shown
- [ ] Questions have expected answer points

---

## ✅ System is Ready!

Your AI Question Generator is fully integrated and ready to use. The system will:

1. ✅ Automatically fetch job data from your database
2. ✅ Automatically fetch candidate data (for customized questions)
3. ✅ Map data to the correct format for FastAPI
4. ✅ Send requests to `https://ai.synchro-hire.com`
5. ✅ Display results in a beautiful UI

**Start generating AI questions now!** 🚀
