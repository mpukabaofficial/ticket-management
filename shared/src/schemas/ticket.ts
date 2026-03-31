import { z } from "zod/v4";

export const inboundEmailSchema = z.object({
  from: z
    .email("Invalid sender email")
    .transform((e) => e.toLowerCase()),
  senderName: z.string().trim().min(1, "Sender name is required").max(200, "Sender name too long"),
  subject: z.string().trim().min(1, "Subject is required").max(500, "Subject too long"),
  body: z.string().trim().min(1, "Body is required").max(50000, "Body too long"),
});

export type InboundEmailInput = z.infer<typeof inboundEmailSchema>;
