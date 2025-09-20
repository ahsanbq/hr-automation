import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// Force TypeScript to reload Prisma types

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "GET") {
    const { include } = req.query;
    
    // Get jobs for the user's company
    const jobs = await prisma.jobPost.findMany({
      where: user.companyId ? { companyId: user.companyId } : {},
      include: {
        company: true,
        createdBy: { select: { id: true, name: true, email: true } },
        _count: {
          select: { resumes: true },
        },
        // Include resume statistics if requested
        ...(include === 'resumeStats' && {
          resumes: {
            select: {
              matchScore: true,
              recommendation: true,
            },
          },
        }),
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate average match score for each job if resume stats are included
    if (include === 'resumeStats') {
      const jobsWithStats = jobs.map(job => {
        const resumes = job.resumes || [];
        const avgMatchScore = resumes.length > 0 
          ? resumes.reduce((sum, resume) => sum + (resume.matchScore || 0), 0) / resumes.length 
          : 0;
        
        return {
          ...job,
          avgMatchScore: Math.round(avgMatchScore * 10) / 10, // Round to 1 decimal place
        };
      });

      return res.json({ jobs: jobsWithStats });
    }

    return res.json({ jobs });
  }

  if (req.method === "POST") {
    const { jobRequirement } = req.body || {};

    if (!jobRequirement) {
      return res
        .status(400)
        .json({ error: "Job requirement data is required" });
    }

    if (!user.companyId) {
      return res
        .status(400)
        .json({ error: "User must be associated with a company" });
    }

    try {
      const created = await prisma.jobPost.create({
        data: {
          jobTitle: jobRequirement.title || "Untitled Job",
          companyName: jobRequirement.company || "",
          location: jobRequirement.location || "",
          jobType: jobRequirement.job_type || "Full-time",
          experienceLevel: jobRequirement.experience_level || "Entry-level",
          salaryRange: jobRequirement.salary_range || "",
          skillsRequired: JSON.stringify(jobRequirement.skills_required || []),
          jobDescription: jobRequirement.description || "",
          keyResponsibilities: JSON.stringify(
            jobRequirement.responsibilities || []
          ),
          qualifications: JSON.stringify(jobRequirement.qualifications || []),
          benefits: JSON.stringify(jobRequirement.benefits || []),
          companyId: user.companyId,
          createdById: user.userId,
        },
        include: {
          company: true,
          createdBy: { select: { id: true, name: true, email: true } },
        },
      });
      return res.status(201).json(created);
    } catch (error: any) {
      console.error("Error creating job post:", error);
      return res.status(500).json({ error: "Failed to create job post" });
    }
  }

  if (req.method === "PUT") {
    const { id, ...data } = req.body || {};
    const updated = await prisma.jobPost.update({
      where: { id },
      data,
      include: {
        company: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
    return res.json(updated);
  }

  if (req.method === "DELETE") {
    const { id } = req.body || {};
    await prisma.jobPost.delete({ where: { id } });
    return res.status(204).end();
  }

  return res.status(405).json({ error: "Method not allowed" });
}
