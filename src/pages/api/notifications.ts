import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    return handleGet(req, res, user);
  }

  if (req.method === "PATCH") {
    return handlePatch(req, res, user);
  }

  return res.status(405).json({ error: "Method not allowed" });
}

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  user: { userId: number; companyId?: number | null }
) {
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const unreadOnly = req.query.unreadOnly === "true";

  const where: any = {};
  if (user.companyId) {
    where.companyId = user.companyId;
  }
  if (unreadOnly) {
    where.isRead = false;
  }

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.notification.count({
      where: {
        ...(user.companyId ? { companyId: user.companyId } : {}),
        isRead: false,
      },
    }),
  ]);

  return res.status(200).json({ notifications, unreadCount });
}

async function handlePatch(
  req: NextApiRequest,
  res: NextApiResponse,
  user: { userId: number; companyId?: number | null }
) {
  const { notificationId, markAllRead } = req.body;

  if (markAllRead) {
    await prisma.notification.updateMany({
      where: {
        ...(user.companyId ? { companyId: user.companyId } : {}),
        isRead: false,
      },
      data: { isRead: true },
    });
    return res.status(200).json({ success: true });
  }

  if (notificationId) {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
    return res.status(200).json({ success: true });
  }

  return res.status(400).json({ error: "Provide notificationId or markAllRead" });
}
