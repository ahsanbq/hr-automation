import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    id: number;
    email: string;
    type: string;
    companyId?: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    (req as AuthenticatedRequest).user = decoded;
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const { method } = req;
  const { user } = req as AuthenticatedRequest;
  const { assessmentId } = req.query;

  if (!assessmentId || typeof assessmentId !== "string") {
    return res.status(400).json({ error: "Invalid assessment ID" });
  }

  if (method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${method} not allowed` });
  }

  try {
    return await handleSendInvite(req, res, user!, assessmentId);
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleSendInvite(
  req: NextApiRequest,
  res: NextApiResponse,
  user: { id: number; type: string; companyId?: number },
  assessmentId: string,
) {
  const { customMessage } = req.body;

  // Verify assessment exists and user has access
  const assessment = await prisma.assessmentStage.findFirst({
    where: {
      id: assessmentId,
      type: "AVATAR",
      ...(user.type !== "ADMIN"
        ? {
            jobPost: {
              companyId: user.companyId,
            },
          }
        : {}),
    },
    include: {
      avatarAssessment: true,
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

  if (!assessment || !assessment.avatarAssessment) {
    return res.status(404).json({ error: "Assessment not found" });
  }

  if (!assessment.resume.candidateEmail) {
    return res.status(400).json({ error: "Candidate email not available" });
  }

  // Generate interview link
  const interviewLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/assessment/avatar/${assessmentId}/take`;

  // Prepare email
  const emailSubject = `AI Interview Invitation - ${assessment.jobPost.jobTitle}`;
  const emailBody = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1890ff;">AI Interview Invitation</h2>
          
          <p>Dear ${assessment.resume.candidateName},</p>
          
          <p>You have been invited to participate in an AI-powered interview for the position of <strong>${assessment.jobPost.jobTitle}</strong> at <strong>${assessment.jobPost.companyName}</strong>.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Interview Details:</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Position:</strong> ${assessment.jobPost.jobTitle}</li>
              <li><strong>Company:</strong> ${assessment.jobPost.companyName}</li>
              <li><strong>Interview Type:</strong> AI Interview</li>
              ${assessment.avatarAssessment.timeLimit ? `<li><strong>Time Limit:</strong> ${assessment.avatarAssessment.timeLimit} minutes</li>` : ""}
              ${assessment.scheduledAt ? `<li><strong>Scheduled:</strong> ${new Date(assessment.scheduledAt).toLocaleString()}</li>` : ""}
            </ul>
          </div>
          
          ${customMessage ? `<p>${customMessage}</p>` : ""}
          
          <p><strong>Instructions:</strong></p>
          <ul>
            <li>Click the button below to start your interview</li>
            <li>Ensure you have a stable internet connection</li>
            <li>Find a quiet place for the interview</li>
            ${assessment.avatarAssessment.recordingEnabled ? "<li>Make sure your camera and microphone are working</li>" : ""}
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${interviewLink}" 
               style="background-color: #1890ff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Start AI Interview
            </a>
          </div>
          
          <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
            This is an automated message. If you have any questions, please contact the hiring team.
          </p>
        </div>
      </body>
    </html>
  `;

  try {
    // Send email using the existing email service
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@company.com",
      to: assessment.resume.candidateEmail,
      subject: emailSubject,
      html: emailBody,
    });

    // Update assessment to track invite sent
    await prisma.assessmentStage.update({
      where: { id: assessmentId },
      data: {
        metadata: {
          ...(assessment.metadata as any),
          inviteSentAt: new Date().toISOString(),
          inviteLink: interviewLink,
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Interview invitation sent successfully",
      sentTo: assessment.resume.candidateEmail,
      interviewLink,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({
      error: "Failed to send invitation email",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
