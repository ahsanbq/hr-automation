import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    id: number;
    email: string;
    type: string;
    companyId?: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    (req as AuthenticatedRequest).user = decoded;
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const { method } = req;
  const { user } = req as AuthenticatedRequest;
  const { interviewId } = req.query;

  if (!interviewId || typeof interviewId !== "string") {
    return res.status(400).json({ error: "Invalid interview ID" });
  }

  if (method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${method} not allowed` });
  }

  try {
    return await handleShortlistUpdate(req, res, user!, interviewId);
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleShortlistUpdate(
  req: NextApiRequest,
  res: NextApiResponse,
  user: { id: number; type: string; companyId?: number },
  interviewId: string
) {
  const { shortlistStatus } = req.body;

  if (
    !shortlistStatus ||
    !["SHORTLISTED", "REJECTED", "NOT_SHORTLISTED"].includes(shortlistStatus)
  ) {
    return res.status(400).json({
      error:
        "Valid shortlistStatus is required: SHORTLISTED, REJECTED, or NOT_SHORTLISTED",
    });
  }

  // First, verify the interview exists and user has access
  const interview = await prisma.interview.findFirst({
    where: {
      id: interviewId,
      ...(user.type !== "ADMIN"
        ? {
            jobPost: {
              companyId: user.companyId,
            },
          }
        : {}),
    },
  });

  if (!interview) {
    return res
      .status(404)
      .json({ error: "Interview not found or access denied" });
  }

  // Only allow shortlisting if interview is PUBLISHED
  if (interview.status !== "PUBLISHED") {
    return res.status(400).json({
      error: "Can only update shortlist status for published interviews",
    });
  }

  // Update shortlist status - commented out as shortlistStatus doesn't exist in Interview model
  // const updatedInterview = await prisma.interview.update({
  //   where: { id: interviewId },
  //   data: { shortlistStatus },
  //   include: {
  //     jobPost: {
  //       select: {
  //         id: true,
  //         jobTitle: true,
  //         companyName: true,
  //         location: true,
  //         skillsRequired: true,
  //       },
  //     },
  //     resume: {
  //       select: {
  //         id: true,
  //         candidateName: true,
  //         candidateEmail: true,
  //         candidatePhone: true,
  //         matchScore: true,
  //         experienceYears: true,
  //       },
  //     },
  //     interviewer: {
  //       select: {
  //         id: true,
  //         name: true,
  //         email: true,
  //       },
  //     },
  //   },
  // });

  return res.status(200).json({
    message:
      "Shortlist status update not implemented - model doesn't support shortlistStatus field",
    interview: interview,
  });
}
