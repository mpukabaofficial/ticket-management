import type { Request, Response } from "express";
import { inboundEmailSchema, ticketListQuerySchema } from "shared";
import {
  getTickets,
  getTicketById,
  createTicketFromEmail,
  assignTicket,
} from "../services/ticket.service";
import { validate } from "../utils/validate";

export async function listTickets(req: Request, res: Response) {
  const query = validate(ticketListQuerySchema, req.query, res);
  if (!query) return;

  const tickets = await getTickets(query.sortBy, query.sortOrder);
  res.json({ tickets });
}

export async function showTicket(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid ticket ID" });
    return;
  }

  const ticket = await getTicketById(id);
  res.json({ ticket });
}

export async function createFromEmail(req: Request, res: Response) {
  const data = validate(inboundEmailSchema, req.body, res);
  if (!data) return;

  const ticket = await createTicketFromEmail(
    data.from,
    data.senderName,
    data.subject,
    data.body,
  );
  res.status(201).json({ ticket });
}

export async function assign(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid ticket ID" });
    return;
  }

  const { userId } = req.body;
  if (!userId || typeof userId !== "string") {
    res.status(400).json({ error: "userId is required" });
    return;
  }

  const ticket = await assignTicket(id, userId);
  res.json({ ticket });
}
