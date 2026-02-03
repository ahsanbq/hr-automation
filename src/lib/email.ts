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
  customMessage?: string,
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

export async function sendAIInterviewInvitation(
  candidateEmail: string,
  candidateName: string,
  interviewLink: string,
  sessionPassword: string,
  jobTitle: string,
  companyName: string,
  timeLimit?: number,
  customMessage?: string,
): Promise<boolean> {
  const subject = `AI Interview Invitation - ${jobTitle}`;

  const html = `
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
            <p>Dear <strong>${candidateName}</strong>,</p>
            
            <p>You have been invited to participate in an AI-powered interview for the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
            
            <div class="info-box">
              <h3>📋 Interview Details:</h3>
              <ul>
                <li><strong>Position:</strong> ${jobTitle}</li>
                <li><strong>Company:</strong> ${companyName}</li>
                <li><strong>Interview Type:</strong> AI Avatar Interview</li>
                ${timeLimit ? `<li><strong>Time Limit:</strong> ${timeLimit} minutes</li>` : ""}
              </ul>
            </div>

            <div class="password-box">
              <h3>🔐 Session Password</h3>
              <div class="password">${sessionPassword}</div>
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
                <li>Make sure your camera and microphone are working</li>
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

  return await sendEmail({
    to: candidateEmail,
    subject,
    html,
  });
}
