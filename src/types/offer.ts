export type Offer = {
  id: string;
  candidate: string;
  email?: string | null;
  status: string;
  content?: string | null;
  jobId?: string | null;
  createdAt: string;
  updatedAt: string;
};
