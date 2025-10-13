import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import bcrypt from "bcryptjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const auth = getUserFromRequest(req);
  if (!auth) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "GET") {
    // List users in same company (if company-bound). If no company, return empty list.
    if (!auth.companyId) return res.json([]);
    const users = await prisma.user.findMany({
      where: { companyId: auth.companyId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        type: true,
        createdAt: true,
      },
    });
    return res.json(users);
  }

  if (req.method === "POST") {
    if (auth.type !== "ADMIN")
      return res.status(403).json({ error: "Forbidden" });
    if (!auth.companyId)
      return res.status(400).json({ error: "Admin not bound to a company" });

    const { email, name, password, type } = req.body || {};
    if (!email || !name || !password || !type)
      return res.status(400).json({ error: "Missing fields" });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return res.status(400).json({ error: "Email already in use" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashed,
        type,
        companyId: auth.companyId,
        updatedAt: new Date(),
      },
      select: { id: true, email: true, name: true, type: true },
    });
    return res.status(201).json(user);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
