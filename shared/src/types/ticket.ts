import type { TicketStatus, TicketCategory, SenderType } from "../constants/ticket";

export interface Message {
  id: string;
  body: string;
  sender: string;
  senderType: SenderType;
  isAiGenerated: boolean;
  createdAt: string;
}

export interface Ticket {
  id: number;
  subject: string;
  status: TicketStatus;
  category: TicketCategory | null;
  senderEmail: string;
  senderName: string;
  createdAt: string;
  assignedTo: { id: string; name: string } | null;
}

export interface TicketWithMessages extends Ticket {
  messages: Message[];
}

export interface DailyResolution {
  date: string;
  ai: number;
  agent: number;
  unresolved: number;
}

export interface TicketStats {
  totalTickets: number;
  openTickets: number;
  aiResolvedTickets: number;
  aiResolvedPercentage: number;
  avgResolutionTimeMs: number;
  dailyResolutions: DailyResolution[];
}
