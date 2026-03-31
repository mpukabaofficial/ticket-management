import prisma from "../config/db";
import { auth } from "../lib/auth";

export async function getUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createUser(
  name: string,
  email: string,
  password: string,
) {
  const result = await auth.api.signUpEmail({
    body: { email, name, password },
  });

  if (!result?.user?.id) {
    throw new Error("Failed to create user");
  }

  return prisma.user.findUniqueOrThrow({
    where: { id: result.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });
}
