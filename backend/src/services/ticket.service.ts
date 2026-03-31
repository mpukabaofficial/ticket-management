import type { TicketSortableColumn } from "shared";
import prisma from "../config/db";

const DUPLICATE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

const ticketSelect = {
  id: true,
  subject: true,
  body: true,
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
    select: { id: true, body: true, sender: true, createdAt: true },
    orderBy: { createdAt: "asc" as const },
  },
};

export async function getTickets(
  sortBy: TicketSortableColumn = "createdAt",
  sortOrder: "asc" | "desc" = "desc",
) {
  return prisma.ticket.findMany({
    select: ticketSelect,
    orderBy: { [sortBy]: sortOrder },
  });
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

export async function createTicketFromEmail(
  from: string,
  senderName: string,
  subject: string,
  body: string,
) {
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

  return prisma.ticket.create({
    data: {
      subject,
      body,
      senderEmail: from,
      senderName,
      messages: {
        create: {
          body,
          sender: senderName,
        },
      },
    },
    select: ticketWithMessagesSelect,
  });
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

export class TicketError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = "TicketError";
  }
}
