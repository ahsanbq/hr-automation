import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Link ID required" });
  }

  switch (req.method) {
    case "DELETE":
      return handleDelete(req, res, id, user);
    case "PATCH":
      return handlePatch(req, res, id, user);
    default:
      return res.status(405).json({ error: "Method not allowed" });
  }
}

// DELETE /api/job-links/:id — deactivate link
async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string,
  user: any
) {
  try {
    const link = await prisma.jobApplicationLink.findFirst({
      where: { id, createdById: user.userId },
    });

    if (!link) {
      return res.status(404).json({ error: "Link not found" });
    }

    await prisma.jobApplicationLink.update({
      where: { id },
      data: { status: "CLOSED" },
    });

    return res.status(200).json({ message: "Link deactivated successfully" });
  } catch (error: any) {
    console.error("Error deactivating link:", error);
    return res.status(500).json({ error: "Failed to deactivate link" });
  }
}

// PATCH /api/job-links/:id — update link (e.g., extend expiry)
async function handlePatch(
  req: NextApiRequest,
  res: NextApiResponse,
  id: string,
  user: any
) {
  try {
    const link = await prisma.jobApplicationLink.findFirst({
      where: { id, createdById: user.userId },
    });

    if (!link) {
      return res.status(404).json({ error: "Link not found" });
    }

    const { validityDays, maxCvLimit, status } = req.body;
    const updateData: any = {};

    if (validityDays) {
      updateData.expiresAt = new Date(
        link.createdAt.getTime() + Number(validityDays) * 24 * 60 * 60 * 1000
      );
    }
    if (maxCvLimit) {
      updateData.maxCvLimit = Number(maxCvLimit);
    }
    if (status && ["ACTIVE", "CLOSED", "EXPIRED"].includes(status)) {
      updateData.status = status;
    }

    const updated = await prisma.jobApplicationLink.update({
      where: { id },
      data: updateData,
      include: {
        jobPost: {
          select: { id: true, jobTitle: true, companyName: true },
        },
      },
    });

    return res.status(200).json({ link: updated });
  } catch (error: any) {
    console.error("Error updating link:", error);
    return res.status(500).json({ error: "Failed to update link" });
  }
}

