import { hashPassword } from "better-auth/crypto";
import prisma from "../config/db";
import { auth } from "../lib/auth";

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
  deletedAt: true,
} as const;

export async function getUsers() {
  return prisma.user.findMany({
    select: userSelect,
    orderBy: { createdAt: "desc" },
  });
}

export async function getAgents() {
  return prisma.user.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function createUser(
  name: string,
  email: string,
  password: string,
) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new UserError("A user with this email already exists");
  }

  const result = await auth.api.signUpEmail({
    body: { email, name, password },
  });

  if (!result?.user?.id) {
    throw new Error("Failed to create user");
  }

  return prisma.user.findUniqueOrThrow({
    where: { id: result.user.id },
    select: userSelect,
  });
}

export async function updateUser(
  id: string,
  name: string,
  email: string,
  password?: string,
) {
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing && existing.id !== id) {
    throw new UserError("A user with this email already exists");
  }

  const user = await prisma.user.update({
    where: { id },
    data: { name, email },
    select: userSelect,
  });

  if (password) {
    const hash = await hashPassword(password);
    await prisma.account.updateMany({
      where: { userId: id, providerId: "credential" },
      data: { password: hash },
    });
  }

  return user;
}

export async function softDeleteUser(id: string, currentUserId: string) {
  if (id === currentUserId) {
    throw new UserError("Cannot delete yourself");
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, deletedAt: true },
  });

  if (!user) {
    throw new UserError("User not found");
  }

  if (user.role === "ADMIN") {
    throw new UserError("Cannot delete an admin user");
  }

  if (user.deletedAt) {
    throw new UserError("User is already deleted");
  }

  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: userSelect,
    }),
    prisma.session.deleteMany({ where: { userId: id } }),
  ]);

  return updatedUser;
}

export class UserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserError";
  }
}
