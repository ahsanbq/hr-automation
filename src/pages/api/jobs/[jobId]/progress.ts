import { NextApiRequest, NextApiResponse } from "next";
import { getProgress } from "@/lib/progress-store";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { jobId } = req.query;
    const { userId } = req.query; // Get userId from query params

    if (!jobId || !userId) {
      console.log("❌ Missing jobId or userId:", { jobId, userId });
      return res.status(400).json({ error: "Missing jobId or userId" });
    }

    const progress = getProgress(userId as string, jobId as string);

    // Set cache-control headers to prevent caching
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    // Check if this is a default progress (no actual progress found)
    const found =
      (progress.total || 0) > 0 ||
      (progress.processed || 0) > 0 ||
      progress.isComplete;

    return res.status(200).json({
      ...progress,
      found,
    });
  } catch (error) {
    console.error("❌ Error fetching progress:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
