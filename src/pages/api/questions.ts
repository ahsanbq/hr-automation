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
    const questions = await prisma.question.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.json(questions);
  }

  if (req.method === "POST") {
    const { role, difficulty, category, content } = req.body || {};
    const created = await prisma.question.create({
      data: { role, difficulty, category, content },
    });
    return res.status(201).json(created);
  }

  if (req.method === "PUT") {
    const { id, ...data } = req.body || {};
    const updated = await prisma.question.update({ where: { id }, data });
    return res.json(updated);
  }

  if (req.method === "DELETE") {
    const { id } = req.body || {};
    await prisma.question.delete({ where: { id } });
    return res.status(204).end();
  }

  return res.status(405).json({ error: "Method not allowed" });
}
