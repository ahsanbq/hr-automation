import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = getUserFromRequest(req);

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    switch (req.method) {
      case "GET":
        return await getResumes(req, res, user.userId);
      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Resumes API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function getResumes(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: number
) {
  const { jobId, includeOffers } = req.query;

  if (!jobId) {
    return res.status(400).json({ error: "jobId is required" });
  }

  // Verify job exists and belongs to user
  const job = await prisma.jobPost.findFirst({
    where: {
      id: jobId as string,
      createdById: userId,
    },
  });

  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  const includeOptions: any = {
    JobPost: {
      select: {
        id: true,
        jobTitle: true,
        companyName: true,
        location: true,
      },
    },
  };

  if (includeOffers === "true") {
    includeOptions.offerLetters = {
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    };
  }

  const resumes = await prisma.resume.findMany({
    where: {
      jobPostId: jobId as string,
    },
    include: includeOptions,
    orderBy: {
      matchScore: "desc",
    },
  });

  // Transform the data to include offer information
  const transformedResumes = resumes.map((resume) => {
    const resumeData: any = {
      id: resume.id,
      candidateName: resume.candidateName,
      candidateEmail: resume.candidateEmail,
      candidatePhone: resume.candidatePhone,
      matchScore: resume.matchScore,
      experienceYears: resume.experienceYears,
      currentJobTitle: resume.currentJobTitle,
      education: resume.education,
      skills: resume.skills,
      summary: resume.summary,
      linkedinUrl: resume.linkedinUrl,
      githubUrl: resume.githubUrl,
      createdAt: resume.createdAt.toISOString(),
    };

    if (includeOffers === "true" && resume.offerLetters) {
      const latestOffer = resume.offerLetters[0]; // Assuming we want the latest offer
      resumeData.hasOffer = resume.offerLetters.length > 0;
      resumeData.offerStatus = latestOffer?.status;
      resumeData.offerId = latestOffer?.id;
    }

    return resumeData;
  });

  return res.status(200).json({ resumes: transformedResumes });
}
