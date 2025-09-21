import type { NextApiRequest } from "next";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change";

export type JwtPayload = {
  userId: number;
  email: string;
  type: string;
  companyId?: number | null;
};

export async function registerCompanyWithAdmin(params: {
  companyName: string;
  companyAddress: string;
  companyCountry: string;
  companyWebsite?: string | null;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}) {
  const {
    companyName,
    companyAddress,
    companyCountry,
    companyWebsite,
    adminName,
    adminEmail,
    adminPassword,
  } = params;

  const existing = await prisma.user.findUnique({
    where: { email: adminEmail },
  });
  if (existing) throw new Error("Email already in use");

  const hashed = await bcrypt.hash(adminPassword, 10);

  const result = await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      const company = await tx.company.create({
        data: {
          name: companyName,
          address: companyAddress,
          country: companyCountry,
          website: companyWebsite ?? null,
        },
      });

      const user = await tx.user.create({
        data: {
          email: adminEmail,
          password: hashed,
          name: adminName,
          type: "ADMIN",
          companyId: company.id,
        },
      });

      return { company, user };
    }
  );

  const token = jwt.sign(
    {
      userId: result.user.id,
      email: result.user.email,
      type: result.user.type,
      companyId: result.user.companyId,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  return { user: result.user, company: result.company, token };
}

export async function registerUser(
  email: string,
  password: string,
  name?: string
) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("Email already in use");
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      name: name || email.split("@")[0],
      type: "COMPANY_USER",
    },
  });
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      type: user.type,
      companyId: user.companyId,
    },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
  return { user, token };
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Invalid credentials");
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw new Error("Invalid credentials");
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      type: user.type,
      companyId: user.companyId,
    },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
  return { user, token };
}

export function verifyToken(token?: string): JwtPayload | null {
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function getUserFromRequest(req: NextApiRequest): JwtPayload | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer") return null;
  return verifyToken(token);
}
