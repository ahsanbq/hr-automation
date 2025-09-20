export type Job = {
  id: string;
  title: string;
  department?: string | null;
  description?: string | null;
  location?: string | null;
  seniority?: string | null;
  status: string;
  companyId?: string | null;
  createdAt: string;
  updatedAt: string;
};
