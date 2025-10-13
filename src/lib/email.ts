/**
 * Email service using Nodemailer
 */

import nodemailer from "nodemailer";

// Email configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "ahsantamim49@gmail.com",
    pass: process.env.EMAIL_PASSWORD || "", // You'll need to set this in .env
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || "ahsantamim49@gmail.com",
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ""), // Strip HTML for text version
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", result.messageId);
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

export async function sendMCQInvitation(
  candidateEmail: string,
  candidateName: string,
  testLink: string,
  sessionPassword: string,
  duration: number,
  totalQuestions: number,
  customMessage?: string
): Promise<boolean> {
  const subject = "Technical Assessment Invitation";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Technical Assessment</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 30px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .info-box { background: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; }
            .credentials { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .footer { background: #f8fafc; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; color: #6b7280; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎯 Technical Assessment Invitation</h1>
            </div>
            
            <div class="content">
                <h2>Hello ${candidateName}!</h2>
                
                <p>You have been invited to take a technical assessment. Please find the details below:</p>
                
                <div class="info-box">
                    <h3>📋 Assessment Details</h3>
                    <ul>
                        <li><strong>Duration:</strong> ${duration} minutes</li>
                        <li><strong>Questions:</strong> ${totalQuestions} questions</li>
                        <li><strong>Type:</strong> Multiple Choice Questions (MCQ)</li>
                    </ul>
                </div>
                
                <div class="credentials">
                    <h3>🔐 Access Credentials</h3>
                    <p><strong>Test Link:</strong> <a href="${testLink}">${testLink}</a></p>
                    <p><strong>Session Password:</strong> <code>${sessionPassword}</code></p>
                </div>
                
                ${
                  customMessage
                    ? `<div class="info-box"><p><strong>Additional Message:</strong><br>${customMessage}</p></div>`
                    : ""
                }
                
                <div style="text-align: center;">
                    <a href="${testLink}" class="button">🚀 Start Assessment</a>
                </div>
                
                <div class="info-box">
                    <h3>⚠️ Important Instructions</h3>
                    <ul>
                        <li>Ensure you have a stable internet connection</li>
                        <li>Complete the assessment within the time limit</li>
                        <li>You cannot pause or restart the assessment once started</li>
                        <li>Keep your session password ready before starting</li>
                    </ul>
                </div>
                
                <p>Good luck with your assessment!</p>
                
                <p>Best regards,<br>HR Team</p>
            </div>
            
            <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: candidateEmail,
    subject,
    html,
  });
}
