import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { TicketCategory } from "shared";
import type { TicketCategoryType } from "shared";
import type { Job } from "pg-boss";
import prisma from "../config/db";

export const CLASSIFY_TICKET_QUEUE = "classify-ticket";

const CATEGORY_VALUES = Object.values(TicketCategory);

function isCategory(value: string): value is TicketCategoryType {
  return CATEGORY_VALUES.includes(value as TicketCategoryType);
}

export interface ClassifyTicketData {
  ticketId: number;
  subject: string;
  body: string;
}

export async function classifyTicketHandler([job]: Job<ClassifyTicketData>[]) {
  const { ticketId, subject, body } = job!.data;

  const { text } = await generateText({
    model: openai("gpt-5-nano"),
    system:
      "You are a support ticket classifier for Code with Mosh, an online school. " +
      "Classify the ticket into exactly one category: GENERAL, TECHNICAL, or REFUND. " +
      "TECHNICAL: issues with accessing courses, videos, code, downloads, or technical problems. " +
      "REFUND: requests for refunds, billing disputes, or payment issues. " +
      "GENERAL: everything else (questions, feedback, account inquiries). " +
      "Return only the category name, nothing else.",
    prompt: `Subject: ${subject}\n\n${body}`,
  });

  const category = text.trim().toUpperCase();
  if (isCategory(category)) {
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { category },
    });
  }
}
