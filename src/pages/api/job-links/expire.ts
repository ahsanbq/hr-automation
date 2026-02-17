import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";

/**
 * POST /api/job-links/expire
 *
 * Scheduler / cron endpoint to expire links that are past their expiresAt.
 * Can be called:
 *   - Via a cron job (e.g., Vercel Cron, AWS CloudWatch)
 *   - Via a manual admin trigger
 *
 * Optionally protected by a secret header to prevent abuse.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Optional: protect with a secret key
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader =
      req.headers["x-cron-secret"] || req.headers.authorization;
    if (authHeader !== cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  try {
    const now = new Date();

    // 1. Expire all ACTIVE links that are past their expiresAt
    const expired = await prisma.jobApplicationLink.updateMany({
      where: {
        status: "ACTIVE",
        expiresAt: { lt: now },
      },
      data: { status: "EXPIRED" },
    });

    // 2. Close all ACTIVE links where currentCvCount >= maxCvLimit
    //    Using raw SQL because Prisma doesn't support field-to-field comparison
    const closedByLimit = await prisma.$executeRaw`
      UPDATE "job_application_links"
      SET "status" = 'CLOSED'
      WHERE "status" = 'ACTIVE'
        AND "currentCvCount" >= "maxCvLimit"
    `;

    console.log(
      `[Cron] Expired ${expired.count} links, closed ${closedByLimit} by CV limit`
    );

    return res.status(200).json({
      success: true,
      expired: expired.count,
      closedByLimit,
    });
  } catch (error: any) {
    console.error("[Cron] Error expiring links:", error);
    return res.status(500).json({ error: "Failed to run expiry job" });
  }
}
