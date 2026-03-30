import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { auth } from "../src/lib/auth";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const existingAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (existingAdmin) {
    console.log("Admin user already exists, skipping seed.");
    return;
  }

  const result = await auth.api.signUpEmail({
    body: {
      email: "admin@ticketmanagement.com",
      name: "Admin",
      password: "admin123",
    },
  });

  if (!result?.user?.id) {
    throw new Error("Failed to create admin user via Better Auth");
  }

  await prisma.user.update({
    where: { id: result.user.id },
    data: { role: "ADMIN" },
  });

  console.log("Seed complete: admin user created.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
