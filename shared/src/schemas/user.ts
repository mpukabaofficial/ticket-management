import { z } from "zod/v4";

export const createUserSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters"),
  email: z.email("Invalid email address"),
  password: z.string().trim().min(8, "Password must be at least 8 characters"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const editUserSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters"),
  email: z.email("Invalid email address"),
  password: z
    .string()
    .trim()
    .transform((val) => (val === "" ? undefined : val))
    .pipe(
      z
        .string()
        .min(8, "Password must be at least 8 characters")
        .optional()
    ),
});

export type EditUserInput = z.infer<typeof editUserSchema>;
