import { readFileSync } from "fs";
import { join } from "path";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { SenderType } from "shared";
import type { Job } from "pg-boss";
import prisma from "../config/db";
import { sendReplyEmail } from "../services/email.service";

export const RESOLVE_TICKET_QUEUE = "resolve-ticket";

const knowledgeBase = readFileSync(
  join(process.cwd(), "knowledge-base.md"),
  "utf-8",
);

export interface ResolveTicketData {
  ticketId: number;
  subject: string;
  body: string;
  senderName: string;
  senderEmail: string;
}

export async function resolveTicketHandler([job]: Job<ResolveTicketData>[]) {
  const { ticketId, subject, body, senderName, senderEmail } = job!.data;
  const firstName = senderName.split(" ")[0];

  await prisma.ticket.update({
    where: { id: ticketId },
    data: { status: "PROCESSING" },
  });

  let answer: string;

  try {
    const { text } = await generateText({
      model: openai("gpt-5-nano"),
      system:
        "You are a support agent for Code with Mosh (https://codewithmosh.com), an online school. " +
        "Using ONLY the knowledge base below, try to answer the customer's question. " +
        "If the knowledge base contains a clear answer, provide a helpful, professional response.\n\n" +
        "Formatting rules:\n" +
        `- Address the customer by their first name: ${firstName}.\n` +
        "- Start with a warm greeting (e.g. 'Hi [Name],').\n" +
        "- Write in a professional, customer-friendly tone using well-structured paragraphs.\n" +
        "- Avoid bullet points unless listing steps or multiple items where bullets genuinely improve clarity.\n" +
        "- End with a sign-off: 'Best regards,\\nCode with Mosh Support'.\n\n" +
        "If the question requires escalation (legal threats, security concerns, out-of-policy refunds, chargebacks) " +
        "or the knowledge base does not contain enough information, respond with exactly: ESCALATE\n\n" +
        "Knowledge Base:\n" +
        knowledgeBase,
      prompt: `Subject: ${subject}\n\n${body}`,
    });
    answer = text.trim();
  } catch {
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: "OPEN" },
    });
    return;
  }

  if (answer.includes("ESCALATE")) {
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: "OPEN" },
    });
  } else {
    await prisma.$transaction([
      prisma.message.create({
        data: {
          body: answer,
          sender: "Code with Mosh Support",
          senderType: SenderType.AGENT,
          isAiGenerated: true,
          ticketId,
        },
      }),
      prisma.ticket.update({
        where: { id: ticketId },
        data: { status: "RESOLVED" },
      }),
    ]);

    sendReplyEmail(senderEmail, subject, answer);
  }
}
