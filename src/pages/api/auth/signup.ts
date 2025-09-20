import type { NextApiRequest, NextApiResponse } from "next";
import { registerCompanyWithAdmin } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const {
    companyName,
    companyAddress,
    companyCountry,
    companyWebsite,
    adminName,
    adminEmail,
    adminPassword,
  } = req.body || {};

  if (
    !companyName ||
    !companyAddress ||
    !companyCountry ||
    !adminName ||
    !adminEmail ||
    !adminPassword
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const { user, company, token } = await registerCompanyWithAdmin({
      companyName,
      companyAddress,
      companyCountry,
      companyWebsite,
      adminName,
      adminEmail,
      adminPassword,
    });
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        type: user.type,
        companyId: user.companyId,
      },
      company: {
        id: company.id,
        name: company.name,
        companyUuid: company.companyUuid,
      },
      token,
    });
  } catch (e: any) {
    return res.status(400).json({ error: e.message || "Signup failed" });
  }
}
