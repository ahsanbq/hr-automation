import type { NextApiRequest, NextApiResponse } from "next";
import { registerUser } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });
  const { email, password, name } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });
  try {
    const { user, token } = await registerUser(email, password, name);
    res
      .status(200)
      .json({
        user: { id: user.id, email: user.email, name: user.name },
        token,
      });
  } catch (e: any) {
    res.status(400).json({ error: e.message || "Registration failed" });
  }
}
