import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { sendEmail } from "../../../lib/email";

const prisma = new PrismaClient();

// Validation schema for the request body
const sendMCQTestSchema = z.object({
  questionIds: z.array(z.string()).min(1, "At least one question is required"),
  title: z.string().min(1, "Title is required"),
  message: z.string().optional(),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  jobId: z.string().min(1, "Job ID is required"),
  resumeId: z.string().min(1, "Resume ID is required"),
  candidateEmail: z.string().email().optional(),
  candidateName: z.string().optional(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Validate request body
    const validatedData = sendMCQTestSchema.parse(req.body);
    const {
      questionIds,
      title,
      message = "MCQ Assessment",
      duration,
      jobId,
      resumeId,
      candidateEmail,
      candidateName,
    } = validatedData;

    console.log("Creating MCQ test with questions:", questionIds);

    // Fetch all selected questions from MCQTemplate
    const questions = await prisma.mCQTemplate.findMany({
      where: {
        id: {
          in: questionIds,
        },
      },
      include: {
        createdBy: {
          select: {
            name: true,
          },
        },
      },
    });

    if (questions.length === 0) {
      return res.status(400).json({
        error: "No valid questions found",
        details: "Please check the question IDs",
      });
    }

    console.log(`Found ${questions.length} questions for the test`);

    // Validate that jobId and resumeId exist in database
    const jobExists = await prisma.jobPost.findUnique({
      where: { id: jobId },
      select: { id: true },
    });

    const resumeExists = await prisma.resume.findUnique({
      where: { id: resumeId },
      select: { id: true },
    });

    if (!jobExists) {
      return res.status(400).json({
        error: "Job not found",
        details: `Job with ID ${jobId} does not exist`,
      });
    }

    if (!resumeExists) {
      return res.status(400).json({
        error: "Resume not found",
        details: `Resume with ID ${resumeId} does not exist`,
      });
    }

    console.log("Job and Resume validation passed");

    // Create Interview record with multiple questions
    const interview = await prisma.interview.create({
      data: {
        title,
        description: `MCQ test with ${questions.length} questions`,
        duration,
        status: "PUBLISHED",
        attempted: false,
        candidateEmail: candidateEmail || null,
        sessionPassword: Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase(),
        jobPostId: jobId,
        resumeId: resumeId,
        userId: 1, // TODO: Get from JWT token - using default for now
        questions: {
          create: questions.map((question, index) => ({
            type: "MULTIPLE_CHOICE",
            question: question.question,
            options: question.options as any, // JSON array
            correct: question.correctAnswer,
            points: 1,
            order: index + 1,
          })),
        },
      },
      include: {
        questions: true,
        jobPost: {
          select: {
            jobTitle: true,
            companyName: true,
          },
        },
        resume: {
          select: {
            candidateName: true,
            candidateEmail: true,
          },
        },
      },
    });

    console.log("Created interview:", interview.id);

    // Create initial interview attempt
    await prisma.interviewAttempt.create({
      data: {
        interviewId: interview.id,
        interviewerId: 1, // TODO: Get from JWT token - using default for now
        status: "IN_PROGRESS",
        score: 0,
        maxScore: questions.length,
        timeSpent: 0,
        startedAt: new Date(),
        violations: 0, // Changed from [] to 0 as it's an Int field
      },
    });

    console.log("Created interview attempt for interview:", interview.id);

    // Send email notification if candidate email is provided
    if (candidateEmail) {
      try {
        const testUrl = `https://exam.synchro-hire.com/`;
        const emailContent = `
          <h2>MCQ Assessment Invitation</h2>
          <p>Dear ${candidateName || "Candidate"},</p>
          <p>You have been invited to take an MCQ assessment for the position: <strong>${
            interview.jobPost?.jobTitle || "N/A"
          }</strong></p>
          <p><strong>Assessment Details:</strong></p>
          <ul>
            <li>Title: ${title}</li>
            <li>Duration: ${duration} minutes</li>
            <li>Number of Questions: ${questions.length}</li>
            <li>Session Password: <strong>${
              interview.sessionPassword
            }</strong></li>
          </ul>
          <p><strong>Test Link:</strong> <a href="${testUrl}">Click here to start the assessment</a></p>
          <p>Please use the session password when prompted.</p>
          <p>Good luck!</p>
          <hr>
          <p><em>This is an automated message from the HR system.</em></p>
        `;

        await sendEmail({
          to: candidateEmail,
          subject: `MCQ Assessment - ${title}`,
          html: emailContent,
        });

        console.log(`Email sent to ${candidateEmail}`);
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        // Don't fail the entire request if email fails
      }
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: `MCQ test created successfully with ${questions.length} questions`,
      data: {
        interviewId: interview.id,
        title: interview.title,
        questionCount: questions.length,
        duration: interview.duration,
        sessionPassword: interview.sessionPassword,
        candidateEmail: interview.candidateEmail,
        testUrl: `https://exam.synchro-hire.com/`,
      },
    });
  } catch (error: any) {
    console.error("Error creating MCQ test:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation error",
        details: error.issues.map((err) => err.message).join(", "),
      });
    }

    res.status(500).json({
      error: "Failed to create MCQ test",
      details: error.message || "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
}
