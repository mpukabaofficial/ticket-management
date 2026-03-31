import type { Request, Response } from "express";
import { createUserSchema } from "shared";
import {
  getUsers,
  createUser as createUserService,
} from "../services/user.service";

export async function listUsers(_req: Request, res: Response) {
  const users = await getUsers();
  res.json({ users });
}

export async function createUser(req: Request, res: Response) {
  const result = createUserSchema.safeParse(req.body);

  if (!result.success) {
    const messages = result.error.issues.map((i) => i.message);
    res.status(400).json({ error: messages.join(", ") });
    return;
  }

  const { name, email, password } = result.data;
  const user = await createUserService(name.trim(), email.trim(), password);
  res.status(201).json({ user });
}
