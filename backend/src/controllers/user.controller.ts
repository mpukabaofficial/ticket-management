import type { Request, Response } from "express";
import { createUserSchema, editUserSchema } from "shared";
import {
  getUsers,
  getAgents,
  createUser as createUserService,
  updateUser as updateUserService,
  softDeleteUser,
} from "../services/user.service";
import { validate } from "../utils/validate";

export async function listUsers(_req: Request, res: Response) {
  const users = await getUsers();
  res.json({ users });
}

export async function listAgents(_req: Request, res: Response) {
  const agents = await getAgents();
  res.json({ agents });
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

export async function deleteUser(req: Request, res: Response) {
  const id = req.params.id as string;
  const currentUserId = req.user!.id;
  const user = await softDeleteUser(id, currentUserId);
  res.json({ user });
}
