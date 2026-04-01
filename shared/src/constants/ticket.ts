export const TicketStatus = {
  NEW: "NEW",
  PROCESSING: "PROCESSING",
  OPEN: "OPEN",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
} as const;

export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

export const AgentVisibleStatuses = [
  TicketStatus.OPEN,
  TicketStatus.RESOLVED,
  TicketStatus.CLOSED,
] as const;

export const TicketCategory = {
  GENERAL: "GENERAL",
  TECHNICAL: "TECHNICAL",
  REFUND: "REFUND",
} as const;

export type TicketCategory =
  (typeof TicketCategory)[keyof typeof TicketCategory];

export const SenderType = {
  CUSTOMER: "CUSTOMER",
  AGENT: "AGENT",
} as const;

export type SenderType = (typeof SenderType)[keyof typeof SenderType];
