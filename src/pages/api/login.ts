import type { NextApiRequest, NextApiResponse } from "next";
import { loginUser } from "@/lib/auth";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });
  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });

  // Dev bypass: admin / admin@agmail.com (case-insensitive) with password 'admin'
  const normalizedEmail = String(email).trim().toLowerCase();
  if (
    (normalizedEmail === "admin" || normalizedEmail === "admin@agmail.com") &&
    password === "admin"
  ) {
    const token = jwt.sign(
      { userId: 1, email: normalizedEmail, type: "ADMIN", companyId: null },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    return res.status(200).json({
      user: {
        id: -1,
        email: normalizedEmail,
        name: "Admin",
        type: "ADMIN",
        companyId: null,
      },
      token,
    });
  }

  try {
    const { user, token } = await loginUser(email, password);
    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        type: user.type,
        companyId: user.companyId ?? null,
      },
      token,
    });
  } catch (e: any) {
    res.status(401).json({ error: e.message || "Invalid credentials" });
  }
}
