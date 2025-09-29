import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const auth = getUserFromRequest(req);
  if (!auth) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "GET") {
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        email: true,
        name: true,
        type: true,
        companyId: true,
        company: {
          select: {
            id: true,
            name: true,
            address: true,
            country: true,
            logo: true,
            linkedinProfile: true,
            website: true,
          },
        },
      },
    });
    return res.json(user);
  }

  if (req.method === "PUT") {
    const { name, company } = req.body || {};

    // Update user name if provided
    const updatedUser = await prisma.user.update({
      where: { id: auth.userId },
      data: { ...(name !== undefined ? { name } : {}) },
      select: {
        id: true,
        email: true,
        name: true,
        type: true,
        companyId: true,
      },
    });

    // Optionally update company if payload provided and user has a company
    let updatedCompany = null as any;
    if (company && updatedUser.companyId) {
      const {
        name: companyName,
        address,
        country,
        logo,
        linkedinProfile,
        website,
      } = company;
      updatedCompany = await prisma.company.update({
        where: { id: updatedUser.companyId },
        data: {
          ...(companyName !== undefined ? { name: companyName } : {}),
          ...(address !== undefined ? { address } : {}),
          ...(country !== undefined ? { country } : {}),
          ...(logo !== undefined ? { logo } : {}),
          ...(linkedinProfile !== undefined ? { linkedinProfile } : {}),
          ...(website !== undefined ? { website } : {}),
        },
        select: {
          id: true,
          name: true,
          address: true,
          country: true,
          logo: true,
          linkedinProfile: true,
          website: true,
        },
      });
    }

    return res.json({ ...updatedUser, company: updatedCompany });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
