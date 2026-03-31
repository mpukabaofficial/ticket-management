import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import { TicketStatus } from "shared";
import Tickets from "./Tickets";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

const mockTickets = [
  {
    id: 1,
    subject: "Cannot access course",
    body: "I'm having trouble accessing my course materials",
    status: TicketStatus.OPEN,
    category: "TECHNICAL" as const,
    senderEmail: "student@test.com",
    senderName: "John Student",
    createdAt: "2025-03-20T10:00:00.000Z",
    assignedTo: null,
  },
  {
    id: 2,
    subject: "Refund request",
    body: "I would like a refund",
    status: TicketStatus.RESOLVED,
    category: null,
    senderEmail: "jane@test.com",
    senderName: "Jane Doe",
    createdAt: "2025-03-21T14:30:00.000Z",
    assignedTo: { id: "1", name: "Admin" },
  },
];

beforeEach(() => {
  vi.resetAllMocks();
});

describe("Tickets page", () => {
  it("renders the page heading", () => {
    mockedAxios.get.mockReturnValue(new Promise(() => {}));
    renderWithQuery(<Tickets />);
    expect(
      screen.getByRole("heading", { name: /tickets/i })
    ).toBeInTheDocument();
  });

  it("shows skeleton rows while loading", () => {
    mockedAxios.get.mockReturnValue(new Promise(() => {}));
    renderWithQuery(<Tickets />);

    expect(screen.getByText("Subject")).toBeInTheDocument();
    expect(screen.getByText("Sender")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();

    const skeletons = document.querySelectorAll("[data-slot='skeleton']");
    expect(skeletons.length).toBe(30); // 5 rows × 6 columns
  });

  it("renders ticket data in the table", async () => {
    mockedAxios.get.mockResolvedValue({ data: { tickets: mockTickets, total: 2, page: 1, pageSize: 20 } });
    renderWithQuery(<Tickets />);

    expect(
      await screen.findByText("Cannot access course")
    ).toBeInTheDocument();
    expect(screen.getByText("John Student")).toBeInTheDocument();
    expect(screen.getByText("TECHNICAL")).toBeInTheDocument();
    expect(screen.getByText("OPEN")).toBeInTheDocument();

    expect(screen.getByText("Refund request")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("RESOLVED")).toBeInTheDocument();
  });

  it("shows dash for tickets without category", async () => {
    mockedAxios.get.mockResolvedValue({ data: { tickets: mockTickets, total: 2, page: 1, pageSize: 20 } });
    renderWithQuery(<Tickets />);

    await screen.findByText("Refund request");
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("shows empty state when no tickets are returned", async () => {
    mockedAxios.get.mockResolvedValue({ data: { tickets: [], total: 0, page: 1, pageSize: 20 } });
    renderWithQuery(<Tickets />);

    expect(await screen.findByText("No tickets found.")).toBeInTheDocument();
  });

  it("shows error alert when the request fails", async () => {
    mockedAxios.get.mockRejectedValue(new Error("Network Error"));
    mockedAxios.isAxiosError.mockReturnValue(false);
    renderWithQuery(<Tickets />);

    expect(await screen.findByText("Error")).toBeInTheDocument();
    expect(screen.getByText("Failed to fetch tickets")).toBeInTheDocument();
  });

  it("calls the correct API endpoint with credentials and default params", () => {
    mockedAxios.get.mockReturnValue(new Promise(() => {}));
    renderWithQuery(<Tickets />);

    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining("/api/tickets"),
      expect.objectContaining({
        withCredentials: true,
        params: {
          sortBy: "createdAt",
          sortOrder: "desc",
          status: undefined,
          category: undefined,
          search: undefined,
          page: 1,
          pageSize: 20,
        },
      })
    );
  });
});
