import type { Request, Response } from "express";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { Webhook } from "svix";
import { inboundEmailSchema, ticketListQuerySchema, updateTicketSchema, createMessageSchema, polishReplySchema, SenderType } from "shared";
import resend from "../config/resend";
import { stripHtml } from "../utils/strip-html";
import { sendReplyEmail } from "../services/email.service";
import {
  getTickets,
  getTicketById,
  getTicketStats,
  updateTicket,
  handleInboundEmail,
  assignTicket,
  addMessage,
} from "../services/ticket.service";
import { validate, parseIntParam } from "../utils/validate";

export async function stats(_req: Request, res: Response) {
  const data = await getTicketStats();
  res.json(data);
}

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

export async function createFromResend(req: Request, res: Response) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    res.status(500).json({ error: "Webhook secret not configured" });
    return;
  }

  const wh = new Webhook(secret);
  const rawBody = (req as Request & { rawBody: Buffer }).rawBody;
  const headers = {
    "svix-id": req.headers["svix-id"] as string,
    "svix-timestamp": req.headers["svix-timestamp"] as string,
    "svix-signature": req.headers["svix-signature"] as string,
  };

  try {
    wh.verify(rawBody.toString(), headers);
  } catch {
    res.status(401).json({ error: "Invalid webhook signature" });
    return;
  }

  const event = req.body;

  if (event.type !== "email.received") {
    res.json({ ignored: true });
    return;
  }

  const { email_id, from: rawFrom, subject } = event.data;

  // Fetch full email content (webhook doesn't include body)
  const { data: email, error } = await resend.emails.receiving.get(email_id);
  if (error || !email) {
    res.status(502).json({ error: "Failed to fetch email content" });
    return;
  }

  // Parse sender: "Name <email>" or just "email"
  const fromMatch = rawFrom.match(/^(.+?)\s*<(.+?)>$/);
  const senderEmail = fromMatch ? fromMatch[2] : rawFrom;
  const senderName = fromMatch ? fromMatch[1].trim() : senderEmail.split("@")[0];
  const body = email.text || stripHtml(email.html || "");

  const ticket = await handleInboundEmail(senderEmail, senderName, subject, body);
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

  // Send reply email to customer
  const ticket = await getTicketById(id);
  sendReplyEmail(ticket.senderEmail, ticket.subject, data.body);

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

export async function summarizeTicket(req: Request, res: Response) {
  const id = parseIntParam(req.params.id, res, "ticket ID");
  if (!id) return;

  const ticket = await getTicketById(id);

  const conversation = ticket.messages
    .map((m) => `[${m.senderType}] ${m.sender}: ${m.body}`)
    .join("\n\n");

  const { text } = await generateText({
    model: openai("gpt-5-nano"),
    system:
      "You are a support agent for Code with Mosh (https://codewithmosh.com), an online school. " +
      "Summarize the following support ticket in 2-4 sentences. " +
      "Cover the core issue and current resolution state. Be brief and direct. " +
      "Return only the summary, nothing else.",
    prompt:
      `Ticket #${ticket.id}: ${ticket.subject}\n` +
      `Customer: ${ticket.senderName} (${ticket.senderEmail})\n` +
      `Status: ${ticket.status}\n` +
      `Category: ${ticket.category ?? "None"}\n\n` +
      `Conversation:\n${conversation}`,
  });

  res.json({ summary: text });
}
