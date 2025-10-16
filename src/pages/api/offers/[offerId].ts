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

  const { offerId } = req.query;

  if (!offerId || typeof offerId !== "string") {
    return res.status(400).json({ error: "Invalid offer ID" });
  }

  try {
    switch (req.method) {
      case "GET":
        return await getOffer(req, res, offerId, user.userId);
      case "PUT":
        return await updateOffer(req, res, offerId, user.userId);
      case "DELETE":
        return await deleteOffer(req, res, offerId, user.userId);
      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Offer API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function getOffer(
  req: NextApiRequest,
  res: NextApiResponse,
  offerId: string,
  userId: number
) {
  // Check if OfferLetter table exists
  try {
    const offer = await prisma.offerLetter.findFirst({
      where: {
        id: offerId,
        createdById: userId,
      },
      include: {
        jobPost: {
          select: {
            id: true,
            jobTitle: true,
            companyName: true,
            location: true,
            jobType: true,
            experienceLevel: true,
            salaryRange: true,
            skillsRequired: true,
            jobDescription: true,
            keyResponsibilities: true,
            qualifications: true,
            benefits: true,
          },
        },
        resume: {
          select: {
            id: true,
            candidateName: true,
            candidateEmail: true,
            candidatePhone: true,
            currentJobTitle: true,
            education: true,
            experienceYears: true,
            skills: true,
            summary: true,
            linkedinUrl: true,
            githubUrl: true,
            matchScore: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!offer) {
      return res.status(404).json({ error: "Offer not found" });
    }

    // Get assessment data
    const [mcqResults, meetingNotes] = await Promise.all([
      // Get MCQ results
      prisma.assessmentStage.findFirst({
        where: {
          jobPostId: offer.jobPostId,
          resumeId: offer.resumeId,
          type: "MCQ",
          status: "COMPLETED",
        },
        include: {
          mcqAssessment: {
            include: {
              candidateAnswers: {
                include: {
                  question: true,
                },
              },
            },
          },
        },
      }),
      // Get meeting notes
      prisma.assessmentStage.findFirst({
        where: {
          jobPostId: offer.jobPostId,
          resumeId: offer.resumeId,
          type: "MANUAL",
          status: "COMPLETED",
        },
        include: {
          manualMeeting: true,
        },
      }),
    ]);

    const offerWithDetails = {
      ...offer,
      mcqResults: mcqResults
        ? {
            score: mcqResults.resultScore || 0,
            totalQuestions: mcqResults.mcqAssessment?.totalQuestions || 0,
            completedAt: mcqResults.completedAt?.toISOString(),
          }
        : null,
      meetingNotes: meetingNotes
        ? {
            summary: meetingNotes.manualMeeting?.meetingSummary || "",
            rating: meetingNotes.manualMeeting?.meetingRating || "",
            notes: meetingNotes.notes || "",
            completedAt: meetingNotes.completedAt?.toISOString(),
          }
        : null,
    };

    return res.status(200).json({ offer: offerWithDetails });
  } catch (error: any) {
    // If OfferLetter table doesn't exist, return error
    if (
      error.message?.includes("offerLetter") ||
      error.message?.includes("Unknown model")
    ) {
      return res.status(503).json({
        error:
          "Offer letter feature not available yet. Database migration required.",
      });
    }
    throw error;
  }
}

async function updateOffer(
  req: NextApiRequest,
  res: NextApiResponse,
  offerId: string,
  userId: number
) {
  const { offeredPosition, salary, joiningDate, notes, status, responseNotes } =
    req.body;

  const updateData: any = {};

  if (offeredPosition !== undefined)
    updateData.offeredPosition = offeredPosition;
  if (salary !== undefined) updateData.salary = salary;
  if (joiningDate !== undefined)
    updateData.joiningDate = joiningDate ? new Date(joiningDate) : null;
  if (notes !== undefined) updateData.notes = notes;
  if (status !== undefined) {
    updateData.status = status;
    if (status === "SENT" && !req.body.sentAt) {
      updateData.sentAt = new Date();
    }
    if (
      (status === "ACCEPTED" || status === "REJECTED") &&
      !req.body.respondedAt
    ) {
      updateData.respondedAt = new Date();
    }
  }
  if (responseNotes !== undefined) updateData.responseNotes = responseNotes;

  // Check if OfferLetter table exists
  try {
    const offer = await prisma.offerLetter.updateMany({
      where: {
        id: offerId,
        createdById: userId,
      },
      data: updateData,
    });

    if (offer.count === 0) {
      return res.status(404).json({ error: "Offer not found" });
    }

    // Return updated offer
    const updatedOffer = await prisma.offerLetter.findUnique({
      where: { id: offerId },
      include: {
        jobPost: {
          select: {
            id: true,
            jobTitle: true,
            companyName: true,
            location: true,
          },
        },
        resume: {
          select: {
            id: true,
            candidateName: true,
            candidateEmail: true,
            candidatePhone: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return res.status(200).json({ offer: updatedOffer });
  } catch (error: any) {
    // If OfferLetter table doesn't exist, return error
    if (
      error.message?.includes("offerLetter") ||
      error.message?.includes("Unknown model")
    ) {
      return res.status(503).json({
        error:
          "Offer letter feature not available yet. Database migration required.",
      });
    }
    throw error;
  }
}

async function deleteOffer(
  req: NextApiRequest,
  res: NextApiResponse,
  offerId: string,
  userId: number
) {
  // Check if OfferLetter table exists
  try {
    const offer = await prisma.offerLetter.deleteMany({
      where: {
        id: offerId,
        createdById: userId,
      },
    });

    if (offer.count === 0) {
      return res.status(404).json({ error: "Offer not found" });
    }

    return res.status(200).json({ message: "Offer deleted successfully" });
  } catch (error: any) {
    // If OfferLetter table doesn't exist, return error
    if (
      error.message?.includes("offerLetter") ||
      error.message?.includes("Unknown model")
    ) {
      return res.status(503).json({
        error:
          "Offer letter feature not available yet. Database migration required.",
      });
    }
    throw error;
  }
}
