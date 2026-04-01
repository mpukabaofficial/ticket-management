import type { Request, Response } from "express";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { inboundEmailSchema, ticketListQuerySchema, updateTicketSchema, createMessageSchema, polishReplySchema, SenderType } from "shared";
import {
  getTickets,
  getTicketById,
  updateTicket,
  handleInboundEmail,
  assignTicket,
  addMessage,
} from "../services/ticket.service";
import { validate, parseIntParam } from "../utils/validate";

export async function listTickets(req: Request, res: Response) {
  const query = validate(ticketListQuerySchema, req.query, res);
  if (!query) return;

  const result = await getTickets(query);
  res.json(result);
}

export async function showTicket(req: Request, res: Response) {
  const id = parseIntParam(req.params.id, res, "ticket ID");
  if (!id) return;

  const ticket = await getTicketById(id);
  res.json({ ticket });
}

export async function update(req: Request, res: Response) {
  const id = parseIntParam(req.params.id, res, "ticket ID");
  if (!id) return;

  const data = validate(updateTicketSchema, req.body, res);
  if (!data) return;

  const ticket = await updateTicket(id, data);
  res.json({ ticket });
}

export async function createFromEmail(req: Request, res: Response) {
  const data = validate(inboundEmailSchema, req.body, res);
  if (!data) return;

  const ticket = await handleInboundEmail(
    data.from,
    data.senderName,
    data.subject,
    data.body,
  );
  res.status(201).json({ ticket });
}

export async function assign(req: Request, res: Response) {
  const id = parseIntParam(req.params.id, res, "ticket ID");
  if (!id) return;

  const { userId } = req.body;
  if (!userId || typeof userId !== "string") {
    res.status(400).json({ error: "userId is required" });
    return;
  }

  const ticket = await assignTicket(id, userId);
  res.json({ ticket });
}

export async function createMessage(req: Request, res: Response) {
  const id = parseIntParam(req.params.id, res, "ticket ID");
  if (!id) return;

  const data = validate(createMessageSchema, req.body, res);
  if (!data) return;

  const user = req.user!;
  const message = await addMessage(id, data.body, user.name, user.id, SenderType.AGENT);
  res.status(201).json({ message });
}

export async function polishReply(req: Request, res: Response) {
  const data = validate(polishReplySchema, req.body, res);
  if (!data) return;

  const { text } = await generateText({
    model: openai("gpt-5-nano"),
    system:
      "You are a helpful support agent for Code with Mosh (https://codewithmosh.com), an online school. " +
      "Polish the following reply to make it more professional, clear, and friendly. " +
      "Keep the same meaning and intent. " +
      `Address the customer by their name: ${data.customerName}. ` +
      "Always include a greeting at the start (e.g. 'Hi [Name],') and a professional sign-off at the end. " +
      "Include the link https://codewithmosh.com where relevant for directing the customer to resources. " +
      "Return only the polished text, nothing else.",
    prompt: data.body,
  });

  res.json({ polished: text });
}
