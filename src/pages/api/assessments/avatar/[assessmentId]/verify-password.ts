import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { SessionPasswordService } from "@/lib/session-password-service";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const { assessmentId } = req.query;
  const { sessionPassword } = req.body;

  if (!assessmentId || typeof assessmentId !== "string") {
    return res.status(400).json({ error: "Invalid assessment ID" });
  }

  if (!sessionPassword || typeof sessionPassword !== "string") {
    return res.status(400).json({ error: "Session password is required" });
  }

  try {
    // Fetch the assessment with avatar assessment details
    const assessment = await prisma.assessmentStage.findUnique({
      where: { id: assessmentId },
      include: {
        avatarAssessment: {
          select: {
            sessionPasswordHash: true,
            sessionPassword: true,
          },
        },
      },
    });

    if (!assessment || !assessment.avatarAssessment) {
      return res.status(404).json({ error: "Assessment not found" });
    }

    const { sessionPasswordHash, sessionPassword: plainPassword } =
      assessment.avatarAssessment;

    // Check if session password is required
    if (!sessionPasswordHash && !plainPassword) {
      // No password required
      return res.status(200).json({ success: true, verified: true });
    }

    // Verify password using bcrypt hash (preferred method)
    if (sessionPasswordHash) {
      const isValid = await SessionPasswordService.verifyPassword(
        sessionPassword,
        sessionPasswordHash,
      );

      if (isValid) {
        return res.status(200).json({ success: true, verified: true });
      }
    }

    // Fallback to plain text comparison (legacy support)
    if (plainPassword && sessionPassword === plainPassword) {
      return res.status(200).json({ success: true, verified: true });
    }

    // Invalid password
    return res.status(401).json({
      error: "Invalid session password",
      verified: false,
    });
  } catch (error) {
    console.error("Error verifying password:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  } finally {
    await prisma.$disconnect();
  }
}
