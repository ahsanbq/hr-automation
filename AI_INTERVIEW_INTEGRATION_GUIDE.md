# AI Interview Module Integration Guide

## 🎯 Quick Integration Steps

This guide shows how to integrate the AI Question Generator into your existing interview management pages.

---

## Option 1: Integration with Job-Based Interview Page

### File: `src/pages/interview/[jobId].tsx`

Add the AI Question Generator button to your candidate selection interface:

```tsx
import { useState } from "react";
import AIQuestionGenerator from "@/components/interview/AIQuestionGenerator";
import { Button } from "antd";
import { ThunderboltOutlined } from "@ant-design/icons";

export default function InterviewManagementPage() {
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<{
    resumeId: string;
    name: string;
  } | null>(null);
  const router = useRouter();
  const { jobId } = router.query;

  const handleGenerateQuestions = (candidate?: { resumeId: string; name: string }) => {
    if (candidate) {
      setSelectedCandidate(candidate);
    }
    setShowAIGenerator(true);
  };

  const handleQuestionsGenerated = (questions: any[]) => {
    console.log("Generated questions:", questions);
    // TODO: Save questions to database or use them in your interview flow
    message.success(`Generated ${questions.length} questions successfully!`);
  };

  return (
    <AppLayout>
      {/* Your existing candidate table */}
      <Table
        columns={[
          // ... your existing columns
          {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
              <Space>
                {/* Your existing action buttons */}
                <Button
                  type="primary"
                  icon={<ThunderboltOutlined />}
                  onClick={() => handleGenerateQuestions({
                    resumeId: record.id,
                    name: record.candidateName,
                  })}
                >
                  Generate AI Questions
                </Button>
              </Space>
            ),
          },
        ]}
        dataSource={candidates}
      />

      {/* Add this component */}
      <AIQuestionGenerator
        visible={showAIGenerator}
        onClose={() => {
          setShowAIGenerator(false);
          setSelectedCandidate(null);
        }}
        jobPostId={jobId as string}
        resumeId={selectedCandidate?.resumeId}
        candidateName={selectedCandidate?.name}
        onQuestionsGenerated={handleQuestionsGenerated}
      />
    </AppLayout>
  );
}
```

---

## Option 2: Standalone AI Question Generator Page

### File: `src/pages/interview/generate-questions.tsx`

Create a dedicated page for question generation:

```tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AppLayout from "@/components/layout/AppLayout";
import AIQuestionGenerator from "@/components/interview/AIQuestionGenerator";
import { Card, Select, Button, Space, Typography, message } from "antd";
import { ThunderboltOutlined } from "@ant-design/icons";
import axios from "axios";

const { Title } = Typography;
const { Option } = Select;

export default function GenerateQuestionsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [showGenerator, setShowGenerator] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (selectedJobId) {
      fetchCandidates(selectedJobId);
    }
  }, [selectedJobId]);

  const fetchJobs = async () => {
    try {
      const response = await axios.get("/api/jobs");
      setJobs(response.data);
    } catch (error) {
      message.error("Failed to fetch jobs");
    }
  };

  const fetchCandidates = async (jobId: string) => {
    try {
      const response = await axios.get(`/api/jobs/${jobId}/candidates`);
      setCandidates(response.data);
    } catch (error) {
      message.error("Failed to fetch candidates");
    }
  };

  return (
    <AppLayout
      title="AI Interview Question Generator"
      subtitle="Generate AI-powered interview questions for your candidates"
    >
      <Card>
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <div>
            <Title level={5}>Select Job Position</Title>
            <Select
              style={{ width: "100%" }}
              placeholder="Select a job position"
              value={selectedJobId}
              onChange={(value) => {
                setSelectedJobId(value);
                setSelectedCandidate(null);
              }}
            >
              {jobs.map((job) => (
                <Option key={job.id} value={job.id}>
                  {job.jobTitle} - {job.companyName}
                </Option>
              ))}
            </Select>
          </div>

          {selectedJobId && (
            <div>
              <Title level={5}>Select Candidate (Optional)</Title>
              <Select
                style={{ width: "100%" }}
                placeholder="Select a candidate for customized questions"
                value={selectedCandidate?.id}
                onChange={(value) => {
                  const candidate = candidates.find((c) => c.id === value);
                  setSelectedCandidate(candidate);
                }}
                allowClear
              >
                {candidates.map((candidate) => (
                  <Option key={candidate.id} value={candidate.id}>
                    {candidate.candidateName} ({candidate.candidateEmail}) - Match Score: {candidate.matchScore}%
                  </Option>
                ))}
              </Select>
            </div>
          )}

          <Button
            type="primary"
            size="large"
            icon={<ThunderboltOutlined />}
            onClick={() => setShowGenerator(true)}
            disabled={!selectedJobId}
          >
            Generate AI Questions
          </Button>
        </Space>
      </Card>

      <AIQuestionGenerator
        visible={showGenerator}
        onClose={() => setShowGenerator(false)}
        jobPostId={selectedJobId}
        resumeId={selectedCandidate?.id}
        candidateName={selectedCandidate?.candidateName}
        onQuestionsGenerated={(questions) => {
          console.log("Generated questions:", questions);
          message.success(`Generated ${questions.length} questions!`);
        }}
      />
    </AppLayout>
  );
}
```

---

## Option 3: Add to Interview Form

### File: `src/components/interview/InterviewForm.tsx`

Integrate AI generation into your interview creation form:

```tsx
import AIQuestionGenerator from "./AIQuestionGenerator";
import { Button } from "antd";
import { ThunderboltOutlined } from "@ant-design/icons";

export default function InterviewForm({ jobId, resumeId, candidateName }: Props) {
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);

  const handleAIQuestionsGenerated = (aiQuestions: any[]) => {
    // Convert AI questions to your interview question format
    const formattedQuestions = aiQuestions.map((q, index) => ({
      id: `q-${Date.now()}-${index}`,
      question: q.question,
      type: "ESSAY", // or your question type
      expectedAnswerPoints: q.expected_answer_points,
      order: questions.length + index + 1,
    }));

    setQuestions([...questions, ...formattedQuestions]);
    message.success(`Added ${aiQuestions.length} AI-generated questions!`);
  };

  return (
    <Form>
      {/* Your existing form fields */}
      
      <Form.Item label="Questions">
        <Button
          type="dashed"
          block
          icon={<ThunderboltOutlined />}
          onClick={() => setShowAIGenerator(true)}
        >
          Generate Questions with AI
        </Button>
        
        {/* Your existing question list */}
        {questions.map((q) => (
          <div key={q.id}>{q.question}</div>
        ))}
      </Form.Item>

      <AIQuestionGenerator
        visible={showAIGenerator}
        onClose={() => setShowAIGenerator(false)}
        jobPostId={jobId}
        resumeId={resumeId}
        candidateName={candidateName}
        onQuestionsGenerated={handleAIQuestionsGenerated}
      />
    </Form>
  );
}
```

---

## 🔌 API Usage Examples

### Direct API Calls (without UI component)

```typescript
import axios from "axios";

// Behavioral Questions
async function generateBehavioral(jobId: string) {
  const response = await axios.post("/api/interview/generate-behavioral", {
    jobPostId: jobId,
    number_of_questions: 5,
    difficulty: "Medium",
    focus_areas: ["Leadership", "Problem Solving", "Communication"],
  });
  return response.data;
}

// Technical Questions
async function generateTechnical(jobId: string) {
  const response = await axios.post(
    "/api/interview/generate-technical?difficulty=Hard&num_questions=5",
    { jobPostId: jobId }
  );
  return response.data;
}

// Customized Questions
async function generateCustomized(jobId: string, resumeId: string) {
  const response = await axios.post(
    "/api/interview/generate-customized?num_questions=4&difficulty=Medium",
    { jobPostId: jobId, resumeId: resumeId }
  );
  return response.data;
}
```

---

## 🎨 UI Customization

### Custom Styling

```tsx
<AIQuestionGenerator
  visible={visible}
  onClose={onClose}
  jobPostId={jobId}
  // Custom modal width
  // Add this if you modify the component to accept custom props
/>
```

### Disable Specific Question Types

Modify the component to conditionally hide question types:

```tsx
// In AIQuestionGenerator.tsx
const showBehavioral = props.enableBehavioral !== false;
const showTechnical = props.enableTechnical !== false;
const showCustomized = props.enableCustomized !== false && resumeId;
```

---

## 📊 Save Generated Questions to Database

### Example: Saving to Interview Table

```typescript
const handleQuestionsGenerated = async (questions: any[]) => {
  try {
    // Create interview with AI-generated questions
    const response = await axios.post("/api/interview/create", {
      jobPostId: jobId,
      resumeId: resumeId,
      title: `AI Interview - ${candidateName}`,
      duration: 60,
      questions: questions.map((q, index) => ({
        type: "ESSAY",
        question: q.question,
        order: index + 1,
        points: 10,
        correct: JSON.stringify(q.expected_answer_points),
      })),
    });

    message.success("Interview created with AI questions!");
    router.push(`/interview/${response.data.id}`);
  } catch (error) {
    message.error("Failed to save questions");
  }
};
```

---

## 🚀 Next Steps

1. **Choose Integration Method:** Pick the option that best fits your workflow
2. **Test the Integration:** Generate questions for a test job and candidate
3. **Customize UI:** Adjust styling and behavior to match your design
4. **Add Persistence:** Save generated questions to your database
5. **Monitor Performance:** Track AI generation times and success rates

---

## 📝 Notes

- The AI Question Generator is **stateless** - it doesn't automatically save questions
- You need to handle saving questions to your database in the `onQuestionsGenerated` callback
- Customized questions require a candidate (resumeId) to be selected
- Generation typically takes 10-30 seconds depending on the number of questions

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Component doesn't show | Check that `visible` prop is true |
| No candidates for customized | Ensure resumeId is passed to the component |
| API errors | Verify FastAPI backend is running |
| Questions not saving | Implement `onQuestionsGenerated` callback |

---

## ✅ Complete Integration Checklist

- [ ] Import `AIQuestionGenerator` component
- [ ] Add state for modal visibility
- [ ] Pass required props (jobPostId, etc.)
- [ ] Implement `onQuestionsGenerated` callback
- [ ] Test all three question types
- [ ] Add error handling
- [ ] Style to match your design
- [ ] Add loading indicators
- [ ] Test with real data
- [ ] Deploy to production

**You're ready to generate AI-powered interview questions! 🚀**
