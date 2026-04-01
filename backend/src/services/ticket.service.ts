import type { TicketSortableColumn, TicketListQuery, UpdateTicketInput, SenderTypeValue } from "shared";
import { SenderType } from "shared";
import type { Prisma } from "../generated/prisma/client";
import prisma from "../config/db";
import boss from "../config/queue";
import { CLASSIFY_TICKET_QUEUE } from "../jobs/classify-ticket";
import { RESOLVE_TICKET_QUEUE } from "../jobs/resolve-ticket";
import { stripHtml } from "../utils/strip-html";

const DUPLICATE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

const ticketSelect = {
  id: true,
  subject: true,
  status: true,
  category: true,
  senderEmail: true,
  senderName: true,
  createdAt: true,
  assignedTo: { select: { id: true, name: true } },
} as const;

const ticketWithMessagesSelect = {
  ...ticketSelect,
  messages: {
    select: { id: true, body: true, sender: true, senderType: true, isAiGenerated: true, createdAt: true },
    orderBy: { createdAt: "asc" as const },
  },
};

export async function getTickets(query: TicketListQuery) {
  const where: Prisma.TicketWhereInput = {};

  if (query.status) {
    where.status = query.status;
  } else {
    where.status = { notIn: ["NEW", "PROCESSING"] };
  }
  if (query.category) {
    where.category = query.category;
  }
  if (query.search) {
    where.OR = [
      { subject: { contains: query.search, mode: "insensitive" } },
      { senderName: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const skip = (query.page - 1) * query.pageSize;

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      select: ticketSelect,
      orderBy: { [query.sortBy]: query.sortOrder },
      skip,
      take: query.pageSize,
    }),
    prisma.ticket.count({ where }),
  ]);

  return { tickets, total, page: query.page, pageSize: query.pageSize };
}

export async function getTicketById(id: number) {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    select: ticketWithMessagesSelect,
  });

  if (!ticket) {
    throw new TicketError("Ticket not found", 404);
  }

  return ticket;
}

export async function updateTicket(id: number, data: UpdateTicketInput) {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!ticket) {
    throw new TicketError("Ticket not found", 404);
  }

  return prisma.ticket.update({
    where: { id },
    data,
    select: ticketWithMessagesSelect,
  });
}

function stripReplyPrefixes(subject: string): string {
  return subject.replace(/^(Re|Fwd|Fw)\s*:\s*/gi, "").trim();
}

export async function handleInboundEmail(
  from: string,
  senderName: string,
  subject: string,
  body: string,
) {
  const cleanBody = stripHtml(body);

  // Check if this is a reply to an existing open ticket from the same sender
  const normalizedSubject = stripReplyPrefixes(subject);

  const existingTicket = await prisma.ticket.findFirst({
    where: {
      senderEmail: from,
      subject: normalizedSubject,
      status: { not: "CLOSED" },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  if (existingTicket) {
    await prisma.message.create({
      data: {
        body: cleanBody,
        sender: senderName,
        senderType: SenderType.CUSTOMER,
        ticketId: existingTicket.id,
      },
    });

    return (await prisma.ticket.findUnique({
      where: { id: existingTicket.id },
      select: ticketWithMessagesSelect,
    }))!;
  }

  // Otherwise create a new ticket
  const duplicateSince = new Date(Date.now() - DUPLICATE_WINDOW_MS);
  const existing = await prisma.ticket.findFirst({
    where: {
      senderEmail: from,
      subject,
      createdAt: { gte: duplicateSince },
    },
    select: { id: true },
  });

  if (existing) {
    throw new TicketError(
      `Duplicate ticket — a ticket with this subject from this sender was created recently (ticket #${existing.id})`,
      409,
    );
  }

  const ticket = await prisma.ticket.create({
    data: {
      subject,
      senderEmail: from,
      senderName,
      messages: {
        create: {
          body: cleanBody,
          sender: senderName,
          senderType: SenderType.CUSTOMER,
        },
      },
    },
    select: ticketWithMessagesSelect,
  });

  const jobData = {
    ticketId: ticket.id,
    subject: ticket.subject,
    body: ticket.messages[0]?.body ?? "",
    senderName: ticket.senderName,
    senderEmail: ticket.senderEmail,
  };

  // Enqueue background jobs
  boss.send(CLASSIFY_TICKET_QUEUE, jobData);
  boss.send(RESOLVE_TICKET_QUEUE, jobData);

  return ticket;
}

export async function assignTicket(ticketId: number, userId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { id: true },
  });

  if (!ticket) {
    throw new TicketError("Ticket not found", 404);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, deletedAt: true },
  });

  if (!user) {
    throw new TicketError("User not found", 404);
  }

  if (user.deletedAt) {
    throw new TicketError("Cannot assign ticket to a deleted user", 400);
  }

  return prisma.ticket.update({
    where: { id: ticketId },
    data: { assignedToId: userId },
    select: ticketSelect,
  });
}

export async function addMessage(
  ticketId: number,
  body: string,
  sender: string,
  userId: string,
  senderType: SenderTypeValue,
) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { id: true },
  });

  if (!ticket) {
    throw new TicketError("Ticket not found", 404);
  }

  return prisma.message.create({
    data: { body, sender, senderType, userId, ticketId },
    select: { id: true, body: true, sender: true, senderType: true, isAiGenerated: true, createdAt: true },
  });
}

interface StatsRow {
  totalTickets: bigint;
  openTickets: bigint;
  resolvedTickets: bigint;
  aiResolvedTickets: bigint;
  aiResolvedPercentage: number;
  avgResolutionTimeMs: bigint;
  dailyDate: Date;
  dailyAi: bigint;
  dailyAgent: bigint;
  dailyUnresolved: bigint;
}

export async function getTicketStats() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const rows = await prisma.$queryRaw<StatsRow[]>`
    SELECT * FROM get_ticket_stats(${monthStart})
  `;

  if (rows.length === 0) {
    return {
      totalTickets: 0,
      openTickets: 0,
      aiResolvedTickets: 0,
      aiResolvedPercentage: 0,
      avgResolutionTimeMs: 0,
      dailyResolutions: [],
    };
  }

  const first = rows[0]!;

  return {
    totalTickets: Number(first.totalTickets),
    openTickets: Number(first.openTickets),
    aiResolvedTickets: Number(first.aiResolvedTickets),
    aiResolvedPercentage: first.aiResolvedPercentage,
    avgResolutionTimeMs: Number(first.avgResolutionTimeMs),
    dailyResolutions: rows.map((row) => ({
      date: row.dailyDate.toISOString().split("T")[0],
      ai: Number(row.dailyAi),
      agent: Number(row.dailyAgent),
      unresolved: Number(row.dailyUnresolved),
    })),
  };
}

export class TicketError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = "TicketError";
  }
}
