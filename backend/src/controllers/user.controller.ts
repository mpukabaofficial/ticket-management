import type { Request, Response } from "express";
import type { z } from "zod/v4";
import { createUserSchema, editUserSchema } from "shared";
import {
  getUsers,
  createUser as createUserService,
  updateUser as updateUserService,
} from "../services/user.service";

function validate<T extends z.ZodType>(schema: T, data: unknown, res: Response) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const messages = result.error.issues.map((i) => i.message);
    res.status(400).json({ error: messages.join(", ") });
    return null;
  }
  return result.data as z.infer<T>;
}

export async function listUsers(_req: Request, res: Response) {
  const users = await getUsers();
  res.json({ users });
}

export async function createUser(req: Request, res: Response) {
  const data = validate(createUserSchema, req.body, res);
  if (!data) return;

  const user = await createUserService(data.name, data.email, data.password);
  res.status(201).json({ user });
}

export async function updateUser(req: Request, res: Response) {
  const data = validate(editUserSchema, req.body, res);
  if (!data) return;

  const id = req.params.id as string;
  const user = await updateUserService(id, data.name, data.email, data.password);
  res.json({ user });
}
