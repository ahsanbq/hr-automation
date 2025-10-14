import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const startTime = Date.now();

  try {
    const response = await fetch(
      `${req.headers.origin}/api/analytics/dashboard`
    );
    const data = await response.json();
    const endTime = Date.now();

    return res.status(200).json({
      success: true,
      performance: {
        responseTime: endTime - startTime,
        cached: data.cached || false,
        timestamp: new Date().toISOString(),
      },
      data: {
        summary: data.data?.summary,
      },
    });
  } catch (error) {
    const endTime = Date.now();
    return res.status(500).json({
      success: false,
      performance: {
        responseTime: endTime - startTime,
        error: true,
        timestamp: new Date().toISOString(),
      },
      error: "Performance test failed",
    });
  }
}
