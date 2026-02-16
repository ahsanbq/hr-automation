import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { getCached, invalidateCache } from "@/lib/job-cache";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  if (!user.companyId) {
    return res
      .status(403)
      .json({ error: "User must be associated with a company" });
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // GET — Fetch jobs (CACHED + optimized query)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (req.method === "GET") {
    const { include } = req.query;
    const cacheKey = `jobs:${user.companyId}:${include || "basic"}`;

    const result = await getCached(
      cacheKey,
      async () => {
        // Use select instead of include — single optimized query
        // avoids Prisma generating multiple sub-queries
        const jobs = await prisma.jobPost.findMany({
          where: {
            companyId: user.companyId!,
          },
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
            isActive: true,
            createdAt: true,
            updatedAt: true,
            companyId: true,
            createdById: true,
            // Only select what frontend needs from relations
            User: { select: { id: true, name: true, email: true } },
            _count: {
              select: {
                Resume: true,
                assessmentStages: true,
              },
            },
            // Include resume stats only when requested
            ...(include === "resumeStats" && {
              Resume: {
                select: {
                  matchScore: true,
                  recommendation: true,
                },
              },
            }),
          },
          orderBy: { createdAt: "desc" },
        });

        // Transform in one pass
        return jobs.map((job) => {
          const base: any = {
            ...job,
            createdBy: job.User,
            company: job.companyName,
          };

          // Calculate avg match score if resume stats included
          if (include === "resumeStats" && "Resume" in job) {
            const resumes = (job as any).Resume || [];
            const avgMatchScore =
              resumes.length > 0
                ? resumes.reduce(
                    (sum: number, r: any) => sum + (r.matchScore || 0),
                    0
                  ) / resumes.length
                : 0;
            base.avgMatchScore = Math.round(avgMatchScore * 10) / 10;
          }

          return base;
        });
      },
      30_000 // 30 second TTL
    );

    return res.json({ jobs: result });
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // POST — Create job (NO unnecessary re-fetch)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (req.method === "POST") {
    const { jobRequirement } = req.body || {};

    if (!jobRequirement) {
      return res
        .status(400)
        .json({ error: "Job requirement data is required" });
    }

    try {
      const jobId = crypto.randomUUID();

      // Just INSERT — don't include relations (saves 2 extra round trips)
      const created = await prisma.jobPost.create({
        data: {
          id: jobId,
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
          updatedAt: new Date(),
        },
        // Only select scalar fields — no joins needed
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
          isActive: true,
          createdAt: true,
          updatedAt: true,
          companyId: true,
          createdById: true,
        },
      });

      // Invalidate job list cache so next GET fetches fresh data
      invalidateCache(`jobs:${user.companyId}`);

      // Build response from the data we already have (no extra queries)
      const transformedJob = {
        ...created,
        company: created.companyName,
        createdBy: {
          id: user.userId,
          name: user.email.split("@")[0], // We already have this from JWT
          email: user.email,
        },
      };

      return res.status(201).json(transformedJob);
    } catch (error: any) {
      console.error("Error creating job post:", error);
      return res.status(500).json({ error: "Failed to create job post" });
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PUT — Update job (minimal query + invalidate cache)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (req.method === "PUT") {
    const { id, ...data } = req.body || {};
    const updated = await prisma.jobPost.update({
      where: { id },
      data,
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
        isActive: true,
        createdAt: true,
        updatedAt: true,
        companyId: true,
        createdById: true,
      },
    });

    // Invalidate cache
    invalidateCache(`jobs:${user.companyId}`);

    const transformedJob = {
      ...updated,
      company: updated.companyName,
    };

    return res.json(transformedJob);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DELETE — Delete job + invalidate cache
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (req.method === "DELETE") {
    const { id } = req.body || {};
    await prisma.jobPost.delete({ where: { id } });

    // Invalidate cache
    invalidateCache(`jobs:${user.companyId}`);

    return res.status(204).end();
  }

  return res.status(405).json({ error: "Method not allowed" });
}
