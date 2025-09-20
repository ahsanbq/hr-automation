import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { AIResumeService, ResumeAnalysisRequest } from '@/lib/ai-resume-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { jobId } = req.query;
  if (!jobId || typeof jobId !== 'string') {
    return res.status(400).json({ error: 'Job ID required' });
  }

  // Verify job exists and user has access
  const jobPost = await prisma.jobPost.findFirst({
    where: {
      id: jobId,
      companyId: user.companyId,
    },
    include: {
      company: true,
    },
  });

  if (!jobPost) {
    return res.status(404).json({ error: 'Job not found' });
  }

  switch (req.method) {
    case 'GET':
      return handleGetResumes(req, res, jobId);
    case 'POST':
      return handleAnalyzeResumes(req, res, jobPost, user.userId);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGetResumes(req: NextApiRequest, res: NextApiResponse, jobId: string) {
  const { sortBy = 'matchScore', order = 'desc' } = req.query;
  
  const resumes = await prisma.resume.findMany({
    where: { jobPostId: jobId },
    orderBy: {
      [sortBy as string]: order as 'asc' | 'desc',
    },
    include: {
      uploadedBy: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: { meetings: true },
      },
    },
  });

  return res.status(200).json({ resumes });
}

async function handleAnalyzeResumes(
  req: NextApiRequest,
  res: NextApiResponse,
  jobPost: any,
  userId: number
) {
  const { resume_paths } = req.body;
  
  if (!resume_paths || !Array.isArray(resume_paths) || resume_paths.length === 0) {
    return res.status(400).json({ error: 'resume_paths array is required' });
  }

  try {
    // Convert JobPost to EXACT format expected by external AI API
    const jobReq = AIResumeService.mapJobPostToJobReq(jobPost);
    
    // Call external AI API with EXACT format
    const analysisResponse = await AIResumeService.analyzeResumes({
      resume_paths,
      job_req: jobReq,
    });

    // Process the EXACT response format from AI API
    const savedResumes = [];
    for (const analysis of analysisResponse.analyses) {
      if (analysis.success) {
        const resume = await prisma.resume.create({
          data: {
            // Map EXACT field names from AI response
            resumeUrl: analysis.resume_path,
            candidateName: analysis.candidate.name,
            candidateEmail: analysis.candidate.email,
            candidatePhone: analysis.candidate.phone,
            matchScore: analysis.candidate.match_score,
            recommendation: analysis.analysis.recommendation,
            skills: analysis.candidate.skills,
            experienceYears: analysis.candidate.experience_years,
            education: analysis.candidate.education,
            summary: analysis.candidate.summary,
            location: analysis.candidate.location,
            linkedinUrl: analysis.candidate.linkedin_url,
            githubUrl: analysis.candidate.github_url,
            currentJobTitle: analysis.candidate.current_job_title,
            processingMethod: analysis.candidate.processing_method,
            analysisTimestamp: new Date(analysis.candidate.analysis_timestamp),
            fileName: analysis.analysis.file_name,
            fileSizeMb: analysis.analysis.file_size_mb,
            processingTime: analysis.analysis.processing_time,
            matchedSkills: analysis.analysis.matched_skills,
            jobPostId: jobPost.id,
            uploadedById: userId,
          },
        });
        savedResumes.push(resume);
      }
    }

    return res.status(200).json({
      success: true,
      message: `${savedResumes.length} resumes analyzed and saved`,
      resumes: savedResumes,
      // Include original AI response for debugging
      aiResponse: analysisResponse,
    });
  } catch (error: any) {
    console.error('Resume analysis error:', error);
    return res.status(500).json({ 
      error: 'Failed to analyze resumes',
      details: error.message,
    });
  }
}
