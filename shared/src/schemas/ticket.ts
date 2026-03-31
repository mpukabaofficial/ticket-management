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

export const ticketSortableColumns = [
  "id",
  "subject",
  "senderName",
  "category",
  "status",
  "createdAt",
] as const;

export type TicketSortableColumn = (typeof ticketSortableColumns)[number];

export const ticketStatuses = ["OPEN", "RESOLVED", "CLOSED"] as const;
export const ticketCategories = ["GENERAL", "TECHNICAL", "REFUND"] as const;

export const ticketListQuerySchema = z.object({
  sortBy: z.enum(ticketSortableColumns).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  status: z.enum(ticketStatuses).optional(),
  category: z.enum(ticketCategories).optional(),
  search: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export type TicketListQuery = z.infer<typeof ticketListQuerySchema>;

export const updateTicketSchema = z.object({
  status: z.enum(ticketStatuses).optional(),
  category: z.enum(ticketCategories).optional(),
});

export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;

export const createMessageSchema = z.object({
  body: z.string().trim().min(1, "Message body is required").max(50000, "Message too long"),
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;
