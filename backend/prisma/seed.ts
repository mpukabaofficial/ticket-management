import "dotenv/config";
import { PrismaClient, Role } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { auth } from "../src/lib/auth";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL!;
  const adminPassword = process.env.ADMIN_PASSWORD!;

  const existingAdmin = await prisma.user.findFirst({
    where: { role: Role.ADMIN },
  });

  if (existingAdmin) {
    console.log("Admin user already exists, skipping seed.");
    return;
  }

  const result = await auth.api.signUpEmail({
    body: {
      email: adminEmail,
      name: "Admin",
      password: adminPassword,
    },
  });

  if (!result?.user?.id) {
    throw new Error("Failed to create admin user via Better Auth");
  }

  await prisma.user.update({
    where: { id: result.user.id },
    data: { role: Role.ADMIN },
  });

  console.log(`Seed complete: admin user created (${adminEmail}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
