import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "GET") {
    const offers = await prisma.offer.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.json(offers);
  }

  if (req.method === "POST") {
    const { candidate, email, status, content, jobId } = req.body || {};
    const created = await prisma.offer.create({
      data: { candidate, email, status, content, jobId },
    });
    return res.status(201).json(created);
  }

  if (req.method === "PUT") {
    const { id, ...data } = req.body || {};
    const updated = await prisma.offer.update({ where: { id }, data });
    return res.json(updated);
  }

  if (req.method === "DELETE") {
    const { id } = req.body || {};
    await prisma.offer.delete({ where: { id } });
    return res.status(204).end();
  }

  return res.status(405).json({ error: "Method not allowed" });
}
