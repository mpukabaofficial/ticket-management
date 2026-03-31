import type { TicketStatusType, TicketCategoryType, SenderTypeValue } from "shared";

export interface Ticket {
  id: number;
  subject: string;
  body: string;
  status: TicketStatusType;
  category: TicketCategoryType | null;
  senderEmail: string;
  senderName: string;
  createdAt: string;
  assignedTo: { id: string; name: string } | null;
  messages: {
    id: string;
    body: string;
    sender: string;
    senderType: SenderTypeValue;
    createdAt: string;
  }[];
}
