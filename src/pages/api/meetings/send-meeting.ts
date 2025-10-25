import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { sendEmail } from "../../../lib/email";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

// Validation schema for the request body
const sendMeetingSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
  resumeId: z.string().min(1, "Resume ID is required"),
  candidateEmail: z.string().email("Valid email is required"),
  candidateName: z.string().min(1, "Candidate name is required"),
  meetingTime: z.string().min(1, "Meeting time is required"),
  meetingType: z.string().min(1, "Meeting type is required"),
  agenda: z.string().min(1, "Meeting agenda is required"),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // Get current user and verify authentication
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!user.companyId) {
      return res
        .status(403)
        .json({ error: "User must be associated with a company" });
    }

    // Validate request body
    const validatedData = sendMeetingSchema.parse(req.body);
    const {
      jobId,
      resumeId,
      candidateEmail,
      candidateName,
      meetingTime,
      meetingType,
      agenda,
    } = validatedData;

    console.log("Creating meeting with data:", {
      jobId,
      resumeId,
      candidateName,
      meetingTime,
      meetingType,
    });

    // Validate that jobId exists and belongs to user's company
    const jobExists = await prisma.jobPost.findFirst({
      where: {
        id: jobId,
        companyId: user.companyId, // Ensure job belongs to user's company
      },
      select: { id: true, jobTitle: true, companyName: true },
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

    // Parse meeting time and create a proper Date object
    let meetingDateTime: Date;
    try {
      // If meetingTime is just a time string (HH:MM:SS), combine with today's date
      if (meetingTime.match(/^\d{2}:\d{2}:\d{2}$/)) {
        const today = new Date();
        const [hours, minutes, seconds] = meetingTime.split(":").map(Number);
        meetingDateTime = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          hours,
          minutes,
          seconds
        );
      } else {
        // If it's already a full datetime string, parse it directly
        meetingDateTime = new Date(meetingTime);
      }

      // Validate the date is valid
      if (isNaN(meetingDateTime.getTime())) {
        throw new Error(`Invalid date format: ${meetingTime}`);
      }
    } catch (error) {
      console.error("Error parsing meeting time:", error);
      return res.status(400).json({
        error: "Invalid meeting time format",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }

    console.log("Parsed meeting time:", {
      original: meetingTime,
      parsed: meetingDateTime.toISOString(),
      local: meetingDateTime.toLocaleString(),
    });

    // Check if a meeting already exists for this resume
    const existingMeeting = await prisma.meetings.findUnique({
      where: { resumeId: resumeId },
      select: { id: true, status: true, meetingTime: true },
    });

    if (existingMeeting) {
      console.log(
        "Meeting already exists for this resume, updating instead of creating new:",
        existingMeeting
      );

      // Update the existing meeting instead of creating a new one
      const updatedMeeting = await prisma.meetings.update({
        where: { resumeId: resumeId },
        data: {
          meetingTime: meetingDateTime,
          meetingType: meetingType as any,
          agenda: agenda,
          status: "SCHEDULED",
          meetingLink: `https://meet.google.com/${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          updatedAt: new Date(),
        },
        include: {
          JobPost: {
            select: {
              jobTitle: true,
              companyName: true,
            },
          },
          Resume: {
            select: {
              candidateName: true,
            },
          },
        },
      });

      console.log("Updated existing meeting:", updatedMeeting.id);

      // Send email notification for updated meeting
      const emailContent = `
        <h2>Meeting Updated</h2>
        <p>Dear ${candidateName},</p>
        <p>Your <strong>${meetingType}</strong> interview for the position of <strong>${
        jobExists.jobTitle
      }</strong> at <strong>${
        jobExists.companyName
      }</strong> has been updated.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Updated Meeting Details</h3>
          <p><strong>Date & Time:</strong> ${meetingDateTime.toLocaleString()}</p>
          <p><strong>Type:</strong> ${meetingType} Interview</p>
          <p><strong>Meeting Link:</strong> <a href="${
            updatedMeeting.meetingLink
          }">${updatedMeeting.meetingLink}</a></p>
        </div>

        <div style="background: #e6f7ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Meeting Agenda</h3>
          <div style="white-space: pre-wrap;">${agenda}</div>
        </div>

        <p>Please join the meeting at the updated time using the provided link.</p>
        <p>Good luck with your interview!</p>
        
        <p>Best regards,<br>HR Team</p>
      `;

      await sendEmail({
        to: candidateEmail,
        subject: `Interview Updated: ${jobExists.jobTitle} - ${meetingType} Interview`,
        html: emailContent,
      });

      console.log("Update email sent to:", candidateEmail);

      return res.status(200).json({
        success: true,
        message: "Meeting updated and notification sent successfully",
        data: {
          meetingId: updatedMeeting.id,
          meetingTime: updatedMeeting.meetingTime,
          meetingType: updatedMeeting.meetingType,
          meetingLink: updatedMeeting.meetingLink,
          candidateEmail: candidateEmail,
          agenda: updatedMeeting.agenda,
          action: "updated",
        },
      });
    }

    // Create meeting record
    const meeting = await prisma.meetings.create({
      data: {
        id: `meeting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        meetingTime: meetingDateTime,
        meetingType: meetingType as any,
        agenda: agenda,
        status: "SCHEDULED",
        resumeId: resumeId,
        createdById: 1, // TODO: Get from JWT token - using default for now
        jobId: jobId,
        meetingLink: `https://meet.google.com/${Math.random()
          .toString(36)
          .substr(2, 9)}`, // Generate a meeting link
        updatedAt: new Date(), // Add missing updatedAt field
      },
      include: {
        JobPost: {
          select: {
            jobTitle: true,
            companyName: true,
          },
        },
        Resume: {
          select: {
            candidateName: true,
          },
        },
      },
    });

    console.log("Created meeting:", meeting.id);

    // Send email notification
    const emailContent = `
      <h2>Interview Invitation</h2>
      <p>Dear ${candidateName},</p>
      <p>You have been invited to a <strong>${meetingType}</strong> interview for the position of <strong>${
      jobExists.jobTitle
    }</strong> at <strong>${jobExists.companyName}</strong>.</p>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Interview Details</h3>
        <p><strong>Date & Time:</strong> ${meetingDateTime.toLocaleString()}</p>
        <p><strong>Type:</strong> ${meetingType} Interview</p>
        <p><strong>Meeting Link:</strong> <a href="${meeting.meetingLink}">${
      meeting.meetingLink
    }</a></p>
      </div>

      <p>Please join the meeting at the scheduled time using the provided link.</p>
      <p>We look forward to speaking with you!</p>
      
      <p>Best regards,<br>HR Team</p>
    `;

    await sendEmail({
      to: candidateEmail,
      subject: `Interview Invitation: ${jobExists.jobTitle} - ${meetingType} Interview`,
      html: emailContent,
    });

    console.log("Email sent to:", candidateEmail);

    return res.status(200).json({
      success: true,
      message: "Meeting created and invitation sent successfully",
      data: {
        meetingId: meeting.id,
        meetingTime: meeting.meetingTime,
        meetingType: meeting.meetingType,
        meetingLink: meeting.meetingLink,
        candidateEmail: candidateEmail,
        agenda: meeting.agenda,
      },
    });
  } catch (error: any) {
    console.error("Failed to create meeting:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation Error",
        details: error.issues,
      });
    }
    return res.status(500).json({
      error: "Failed to create meeting",
      details: error.message,
    });
  } finally {
    await prisma.$disconnect();
  }
}
