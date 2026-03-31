import type { Response } from "express";
import type { z } from "zod/v4";

export function validate<T extends z.ZodType>(
  schema: T,
  data: unknown,
  res: Response,
) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const messages = result.error.issues.map((i) => i.message);
    res.status(400).json({ error: messages.join(", ") });
    return null;
  }
  return result.data as z.infer<T>;
}

export function parseIntParam(value: unknown, res: Response, name = "ID") {
  const num = Number(value);
  if (!Number.isInteger(num) || num < 1) {
    res.status(400).json({ error: `Invalid ${name}` });
    return null;
  }
  return num;
}
