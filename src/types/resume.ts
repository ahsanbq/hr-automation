export type Resume = {
  id: string;
  candidate: string;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  score?: number | null;
  fileUrl?: string | null;
  jobId?: string | null;
  createdAt: string;
};
