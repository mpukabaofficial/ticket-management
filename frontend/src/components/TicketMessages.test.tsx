import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import type { TicketWithMessages } from "@/types/ticket";
import TicketMessages from "./TicketMessages";

const mockMessages: TicketWithMessages["messages"] = [
  {
    id: "msg-1",
    body: "I need help with my account",
    sender: "Jane Student",
    senderType: "CUSTOMER",
    createdAt: "2025-03-20T10:00:00.000Z",
  },
  {
    id: "msg-2",
    body: "Sure, let me look into it",
    sender: "Agent Smith",
    senderType: "AGENT",
    createdAt: "2025-03-20T11:00:00.000Z",
  },
];

describe("TicketMessages", () => {
  it("renders the Messages heading", () => {
    render(<TicketMessages messages={[]} />);
    expect(screen.getByText("Messages")).toBeInTheDocument();
  });

  it("shows empty state when there are no messages", () => {
    render(<TicketMessages messages={[]} />);
    expect(screen.getByText("No messages yet.")).toBeInTheDocument();
  });

  it("renders all messages with sender name and body", () => {
    render(<TicketMessages messages={mockMessages} />);

    expect(screen.getByText("I need help with my account")).toBeInTheDocument();
    expect(screen.getByText("Jane Student")).toBeInTheDocument();

    expect(
      screen.getByText("Sure, let me look into it"),
    ).toBeInTheDocument();
    expect(screen.getByText("Agent Smith")).toBeInTheDocument();
  });

  it("displays sender type badges", () => {
    render(<TicketMessages messages={mockMessages} />);

    expect(screen.getByText("Customer")).toBeInTheDocument();
    expect(screen.getByText("Agent")).toBeInTheDocument();
  });

  it("formats and displays message dates", () => {
    render(<TicketMessages messages={[mockMessages[0]]} />);

    // The date should be rendered (format depends on locale)
    expect(screen.getByText(/Mar/)).toBeInTheDocument();
    expect(screen.getByText(/2025/)).toBeInTheDocument();
  });

  it("does not render separator before first message", () => {
    const { container } = render(
      <TicketMessages messages={[mockMessages[0]]} />,
    );

    const separators = container.querySelectorAll("[data-slot='separator']");
    expect(separators).toHaveLength(0);
  });

  it("renders separators between messages", () => {
    const { container } = render(
      <TicketMessages messages={mockMessages} />,
    );

    const separators = container.querySelectorAll("[data-slot='separator']");
    expect(separators).toHaveLength(1);
  });
});
