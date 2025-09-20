import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const auth = getUserFromRequest(req);
  if (!auth) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "GET") {
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        email: true,
        name: true,
        type: true,
        companyId: true,
      },
    });
    return res.json(user);
  }

  if (req.method === "PUT") {
    const { name } = req.body || {};
    const updated = await prisma.user.update({
      where: { id: auth.userId },
      data: { name },
      select: {
        id: true,
        email: true,
        name: true,
        type: true,
        companyId: true,
      },
    });
    return res.json(updated);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
