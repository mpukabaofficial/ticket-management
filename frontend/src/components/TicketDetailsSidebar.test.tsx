import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import TicketDetailsSidebar from "./TicketDetailsSidebar";

vi.mock("axios");
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const mockedAxios = vi.mocked(axios, true);

const mockAgents = [
  { id: "agent-1", name: "Alice Agent" },
  { id: "agent-2", name: "Bob Agent" },
];

function renderSidebar(
  props: Partial<{
    ticketId: string;
    status: "OPEN" | "RESOLVED" | "CLOSED";
    category: "GENERAL" | "TECHNICAL" | "REFUND" | null;
    assignedTo: { id: string; name: string } | null;
  }> = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const defaultProps = {
    ticketId: "1",
    status: "OPEN" as const,
    category: "TECHNICAL" as const,
    assignedTo: null,
    ...props,
  };

  return render(
    <QueryClientProvider client={queryClient}>
      <TicketDetailsSidebar {...defaultProps} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  mockedAxios.get.mockResolvedValue({ data: { agents: mockAgents } });
});

describe("TicketDetailsSidebar", () => {
  it("renders the Details heading", () => {
    renderSidebar();
    expect(screen.getByText("Details")).toBeInTheDocument();
  });

  it("renders Status, Category, and Assigned to labels", () => {
    renderSidebar();

    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByText("Assigned to")).toBeInTheDocument();
  });

  it("displays current status value", () => {
    renderSidebar({ status: "OPEN" });
    expect(screen.getByText("Open")).toBeInTheDocument();
  });

  it("displays current category value", () => {
    renderSidebar({ category: "TECHNICAL" });
    expect(screen.getByText("Technical")).toBeInTheDocument();
  });

  it("displays Unassigned when no agent assigned", () => {
    renderSidebar({ assignedTo: null });
    expect(screen.getByText("Unassigned")).toBeInTheDocument();
  });

  it("fetches agents list on mount", async () => {
    renderSidebar();

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining("/api/users/agents"),
        { withCredentials: true },
      );
    });
  });

  it("renders three select triggers", () => {
    renderSidebar();

    const triggers = screen.getAllByRole("combobox");
    expect(triggers).toHaveLength(3);
  });

  it("does not show Save button when status is unchanged", () => {
    renderSidebar({ status: "OPEN" });
    expect(
      screen.queryByRole("button", { name: "Save" }),
    ).not.toBeInTheDocument();
  });

  it("does not show Assign button when no agent selected", () => {
    renderSidebar({ assignedTo: null });
    expect(
      screen.queryByRole("button", { name: "Assign" }),
    ).not.toBeInTheDocument();
  });
});
