import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { resumeId } = req.query;
  if (!resumeId || typeof resumeId !== "string") {
    return res.status(400).json({ error: "Resume ID required" });
  }

  switch (req.method) {
    case "GET":
      return handleGetResume(req, res, resumeId, user);
    case "PUT":
      return handleUpdateResume(req, res, resumeId, user);
    case "DELETE":
      return handleDeleteResume(req, res, resumeId, user);
    default:
      return res.status(405).json({ error: "Method not allowed" });
  }
}

async function handleGetResume(
  req: NextApiRequest,
  res: NextApiResponse,
  resumeId: string,
  user: any
) {
  const resume = await prisma.resume.findFirst({
    where: {
      id: resumeId,
    },
    include: {
      JobPost: {
        select: {
          id: true,
          jobTitle: true,
          companyName: true,
        },
      },
      User: {
        select: { id: true, name: true, email: true },
      },
      meetings: true,
    },
  });

  if (!resume) {
    return res.status(404).json({ error: "Resume not found" });
  }

  return res.status(200).json(resume);
}

async function handleUpdateResume(
  req: NextApiRequest,
  res: NextApiResponse,
  resumeId: string,
  user: any
) {
  const { candidateName, candidateEmail, candidatePhone, notes } = req.body;

  const resume = await prisma.resume.updateMany({
    where: {
      id: resumeId,
    },
    data: {
      candidateName,
      candidateEmail,
      candidatePhone,
    },
  });

  if (resume.count === 0) {
    return res.status(404).json({ error: "Resume not found" });
  }

  return res.status(200).json({ success: true });
}

async function handleDeleteResume(
  req: NextApiRequest,
  res: NextApiResponse,
  resumeId: string,
  user: any
) {
  const resume = await prisma.resume.deleteMany({
    where: {
      id: resumeId,
    },
  });

  if (resume.count === 0) {
    return res.status(404).json({ error: "Resume not found" });
  }

  return res.status(200).json({ success: true });
}
