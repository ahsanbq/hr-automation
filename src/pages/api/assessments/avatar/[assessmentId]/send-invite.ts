import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { SessionPasswordService } from "@/lib/session-password-service";

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

  // Generate secure session password with bcrypt hash
  const { plainPassword, hashedPassword } =
    await SessionPasswordService.generateHashedPassword();

  // Update avatar assessment with session password
  await prisma.avatarAssessment.update({
    where: { id: assessment.avatarAssessment.id },
    data: {
      sessionPassword: plainPassword, // Keep plain text for email display
      sessionPasswordHash: hashedPassword, // Store bcrypt hash for validation
    },
  });

  // Generate interview link
  const interviewLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/assessment/avatar/${assessmentId}/take`;

  // Prepare email
  const emailSubject = `AI Interview Invitation - ${assessment.jobPost.jobTitle}`;
  const emailBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI Interview Invitation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { padding: 30px; }
          .info-box { background-color: #f0f7ff; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #1890ff; }
          .info-box h3 { margin-top: 0; color: #1890ff; }
          .info-box ul { list-style: none; padding: 0; margin: 10px 0; }
          .info-box li { padding: 8px 0; border-bottom: 1px solid #e8f4ff; }
          .info-box li:last-child { border-bottom: none; }
          .info-box strong { color: #333; font-weight: 600; }
          .password-box { background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%); color: white; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0; }
          .password-box h3 { margin: 0 0 10px 0; font-size: 18px; }
          .password-box .password { font-size: 32px; font-weight: bold; letter-spacing: 3px; font-family: 'Courier New', monospace; padding: 10px; background: rgba(255,255,255,0.2); border-radius: 5px; margin: 10px 0; }
          .button { display: inline-block; background-color: #1890ff; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .button:hover { background-color: #096dd9; }
          .instructions { background-color: #fff7e6; padding: 20px; border-radius: 5px; border-left: 4px solid #fa8c16; margin: 20px 0; }
          .instructions h3 { margin-top: 0; color: #fa8c16; }
          .instructions ul { margin: 10px 0; padding-left: 20px; }
          .instructions li { margin: 5px 0; }
          .footer { background-color: #f5f5f5; padding: 20px; text-align: center; color: #999; font-size: 12px; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🤖 AI Interview Invitation</h1>
          </div>
          
          <div class="content">
            <p>Dear <strong>${assessment.resume.candidateName}</strong>,</p>
            
            <p>You have been invited to participate in an AI-powered interview for the position of <strong>${assessment.jobPost.jobTitle}</strong> at <strong>${assessment.jobPost.companyName}</strong>.</p>
            
            <div class="info-box">
              <h3>📋 Interview Details:</h3>
              <ul>
                <li><strong>Position:</strong> ${assessment.jobPost.jobTitle}</li>
                <li><strong>Company:</strong> ${assessment.jobPost.companyName}</li>
                <li><strong>Interview Type:</strong> AI Avatar Interview</li>
                ${assessment.avatarAssessment.timeLimit ? `<li><strong>Time Limit:</strong> ${assessment.avatarAssessment.timeLimit} minutes</li>` : ""}
                ${assessment.scheduledAt ? `<li><strong>Scheduled:</strong> ${new Date(assessment.scheduledAt).toLocaleString()}</li>` : ""}
              </ul>
            </div>

            <div class="password-box">
              <h3>🔐 Session Password</h3>
              <div class="password">${plainPassword}</div>
              <p style="margin: 10px 0 0 0; font-size: 14px;">Please keep this password ready before starting the interview</p>
            </div>
            
            ${customMessage ? `<div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;"><p><strong>Message from HR:</strong><br>${customMessage}</p></div>` : ""}
            
            <div class="instructions">
              <h3>⚠️ Important Instructions:</h3>
              <ul>
                <li>Click the button below to start your interview</li>
                <li>Enter your session password when prompted</li>
                <li>Ensure you have a stable internet connection</li>
                <li>Find a quiet place for the interview</li>
                ${assessment.avatarAssessment.recordingEnabled ? "<li>Make sure your camera and microphone are working</li>" : ""}
                <li>You cannot pause or restart the interview once started</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${interviewLink}" class="button">🚀 Start AI Interview</a>
            </div>
            
            <p>Good luck with your interview!</p>
            <p>Best regards,<br>HR Team</p>
          </div>
          
          <div class="footer">
            <p>This is an automated message. If you have any questions, please contact the hiring team.</p>
          </div>
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
