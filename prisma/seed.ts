import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "superadmin@example.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "password123";

  const existing = await prisma.user.findUnique({
    where: { email: adminEmail },
  });
  if (existing) {
    console.log("Seed: admin already exists");
    return;
  }

  const company = await prisma.company.create({
    data: {
      name: "Super Admin Company",
      address: "HQ",
      country: "N/A",
      website: "https://example.com",
    },
  });

  const hashed = await bcrypt.hash(adminPassword, 10);
  const user = await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashed,
      name: "Super Admin",
      type: "ADMIN",
      companyId: company.id,
    },
  });

  console.log("Seed: created company", company.id, "and admin", user.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
