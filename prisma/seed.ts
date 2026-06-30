import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const setupKey = process.env.ADMIN_SETUP_KEY || "admin-setup-key";

  const adminEmail = process.env.ADMIN_EMAIL || "admin@cliffcomortgage.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    const hashed = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashed,
        role: "ADMIN",
        isActive: true,
      },
    });
    console.log(`Created admin user: ${adminEmail}`);
  } else {
    console.log(`Admin user already exists: ${adminEmail}`);
  }

  const company = await prisma.company.findFirst();
  if (!company) {
    await prisma.company.create({
      data: {
        name: "Cliffco, Inc.",
        primaryColor: "#003366",
        secondaryColor: "#C9A84C",
      },
    });
    console.log("Created default company settings");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
