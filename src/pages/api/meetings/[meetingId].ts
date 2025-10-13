import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Validation schema for the request body
const updateMeetingSchema = z.object({
  meetingTime: z.string().min(1, "Meeting time is required"),
  meetingType: z.string().optional(),
  status: z.string().min(1, "Status is required"),
  meetingSummary: z.string().optional(),
  meetingRating: z.string().optional(),
  notes: z.string().optional(),
  agenda: z.string().optional(),
  meetingLink: z.string().optional(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { meetingId } = req.query;

  if (!meetingId || typeof meetingId !== "string") {
    return res.status(400).json({ message: "Invalid meeting ID" });
  }

  if (req.method === "GET") {
    try {
      const meeting = await prisma.meetings.findUnique({
        where: { id: meetingId },
        include: {
          Resume: {
            select: {
              candidateName: true,
              candidateEmail: true,
              candidatePhone: true,
              matchScore: true,
            },
          },
          User: {
            select: {
              name: true,
              email: true,
            },
          },
          JobPost: {
            select: {
              jobTitle: true,
              companyName: true,
            },
          },
        },
      });

      if (!meeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }

      return res.status(200).json({
        success: true,
        meeting,
      });
    } catch (error: any) {
      console.error("Error fetching meeting:", error);
      return res.status(500).json({
        error: "Failed to fetch meeting",
        details: error.message,
      });
    }
  }

  if (req.method === "PUT") {
    try {
      // Validate request body
      const validatedData = updateMeetingSchema.parse(req.body);
      const {
        meetingTime,
        meetingType,
        status,
        meetingSummary,
        meetingRating,
        notes,
        agenda,
        meetingLink,
      } = validatedData;

      console.log("Updating meeting:", meetingId, validatedData);

      const updatedMeeting = await prisma.meetings.update({
        where: { id: meetingId },
        data: {
          meetingTime: new Date(meetingTime),
          meetingType: meetingType as any,
          status: status as any,
          meetingSummary: meetingSummary || null,
          meetingRating: meetingRating || null,
          notes: notes || null,
          agenda: agenda || null,
          meetingLink: meetingLink || null,
          updatedAt: new Date(),
        },
        include: {
          Resume: {
            select: {
              candidateName: true,
              candidateEmail: true,
              candidatePhone: true,
              matchScore: true,
            },
          },
          User: {
            select: {
              name: true,
              email: true,
            },
          },
          JobPost: {
            select: {
              jobTitle: true,
              companyName: true,
            },
          },
        },
      });

      console.log("Meeting updated successfully:", updatedMeeting.id);

      return res.status(200).json({
        success: true,
        message: "Meeting updated successfully",
        meeting: updatedMeeting,
      });
    } catch (error: any) {
      console.error("Error updating meeting:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation Error",
          details: error.issues,
        });
      }
      return res.status(500).json({
        error: "Failed to update meeting",
        details: error.message,
      });
    }
  }

  if (req.method === "DELETE") {
    try {
      await prisma.meetings.delete({
        where: { id: meetingId },
      });

      console.log("Meeting deleted successfully:", meetingId);

      return res.status(200).json({
        success: true,
        message: "Meeting deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting meeting:", error);
      return res.status(500).json({
        error: "Failed to delete meeting",
        details: error.message,
      });
    }
  }

  return res.status(405).json({ message: "Method Not Allowed" });
}
