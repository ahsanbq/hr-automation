import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { jobId } = req.query;
  if (!jobId || typeof jobId !== 'string') {
    return res.status(400).json({ error: 'Job ID required' });
  }

  switch (req.method) {
    case 'GET':
      return handleGetJob(req, res, jobId, user);
    case 'PUT':
      return handleUpdateJob(req, res, jobId, user);
    case 'DELETE':
      return handleDeleteJob(req, res, jobId, user);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGetJob(req: NextApiRequest, res: NextApiResponse, jobId: string, user: any) {
  try {
    const job = await prisma.jobPost.findFirst({
      where: {
        id: jobId,
        companyId: user.companyId,
      },
      include: {
        company: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    return res.status(200).json({ job });
  } catch (error: any) {
    console.error('Error fetching job:', error);
    return res.status(500).json({ error: 'Failed to fetch job' });
  }
}

async function handleUpdateJob(req: NextApiRequest, res: NextApiResponse, jobId: string, user: any) {
  try {
    const updateData = req.body;
    
    const job = await prisma.jobPost.updateMany({
      where: {
        id: jobId,
        companyId: user.companyId,
      },
      data: updateData,
    });

    if (job.count === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error updating job:', error);
    return res.status(500).json({ error: 'Failed to update job' });
  }
}

async function handleDeleteJob(req: NextApiRequest, res: NextApiResponse, jobId: string, user: any) {
  try {
    const job = await prisma.jobPost.deleteMany({
      where: {
        id: jobId,
        companyId: user.companyId,
      },
    });

    if (job.count === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error deleting job:', error);
    return res.status(500).json({ error: 'Failed to delete job' });
  }
}
