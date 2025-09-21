import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { meetingId } = req.query;

  if (!meetingId || typeof meetingId !== "string") {
    return res.status(400).json({ error: "Meeting ID is required" });
  }

  if (req.method === "GET") {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        resume: {
          include: {
            jobPost: {
              select: {
                id: true,
                jobTitle: true,
                companyName: true,
                location: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    return res.json(meeting);
  }

  if (req.method === "PUT") {
    const { notes, agenda, meetingTime, meetingLink, status, interviewType } =
      req.body;

    // Prepare update data - only include fields that are provided
    const updateData: any = {};
    if (notes !== undefined) updateData.notes = notes;
    if (agenda !== undefined) updateData.agenda = agenda;
    if (meetingTime !== undefined)
      updateData.meetingTime = new Date(meetingTime);
    if (meetingLink !== undefined) updateData.meetingLink = meetingLink;
    if (status !== undefined) updateData.status = status;
    if (interviewType !== undefined) updateData.interviewType = interviewType;

    const updated = await prisma.meeting.update({
      where: { id: meetingId },
      data: updateData,
      include: {
        resume: {
          include: {
            jobPost: {
              select: {
                id: true,
                jobTitle: true,
                companyName: true,
                location: true,
              },
            },
          },
        },
      },
    });

    return res.json(updated);
  }

  if (req.method === "DELETE") {
    await prisma.meeting.delete({ where: { id: meetingId } });
    return res.status(204).end();
  }

  return res.status(405).json({ error: "Method not allowed" });
}
