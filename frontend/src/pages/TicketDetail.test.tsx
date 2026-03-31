import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import TicketDetail from "./TicketDetail";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

const mockTicket = {
  id: 1,
  subject: "Cannot access course",
  body: "I'm having trouble accessing my course materials",
  status: "OPEN" as const,
  category: "TECHNICAL" as const,
  senderEmail: "student@test.com",
  senderName: "John Student",
  createdAt: "2025-03-20T10:00:00.000Z",
  assignedTo: null,
  messages: [
    {
      id: "msg-1",
      body: "I'm having trouble accessing my course materials",
      sender: "John Student",
      senderType: "CUSTOMER" as const,
      createdAt: "2025-03-20T10:00:00.000Z",
    },
    {
      id: "msg-2",
      body: "Let me look into this for you",
      sender: "Agent Smith",
      senderType: "AGENT" as const,
      createdAt: "2025-03-20T11:00:00.000Z",
    },
  ],
};

function renderWithProviders() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/tickets/1"]}>
        <Routes>
          <Route path="/tickets/:id" element={<TicketDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("TicketDetail page", () => {
  it("shows skeleton while loading", () => {
    mockedAxios.get.mockReturnValue(new Promise(() => {}));
    renderWithProviders();

    const skeletons = document.querySelectorAll("[data-slot='skeleton']");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders ticket details and messages", async () => {
    mockedAxios.get.mockResolvedValue({ data: { ticket: mockTicket } });
    renderWithProviders();

    expect(await screen.findByText("Cannot access course")).toBeInTheDocument();
    expect(screen.getAllByText(/John Student/).length).toBeGreaterThan(0);

    // Messages
    expect(screen.getByText("I'm having trouble accessing my course materials")).toBeInTheDocument();
    expect(screen.getByText("Let me look into this for you")).toBeInTheDocument();
  });

  it("shows sender type badges on messages", async () => {
    mockedAxios.get.mockResolvedValue({ data: { ticket: mockTicket } });
    renderWithProviders();

    expect(await screen.findByText("Customer")).toBeInTheDocument();
    expect(screen.getByText("Agent")).toBeInTheDocument();
  });

  it("renders the reply form", async () => {
    mockedAxios.get.mockResolvedValue({ data: { ticket: mockTicket } });
    renderWithProviders();

    expect(await screen.findByText("Reply")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Type your reply...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send Reply" })).toBeInTheDocument();
  });

  it("shows validation error when submitting empty reply", async () => {
    mockedAxios.get.mockResolvedValue({ data: { ticket: mockTicket } });
    renderWithProviders();

    const submitButton = await screen.findByRole("button", { name: "Send Reply" });
    await userEvent.click(submitButton);

    expect(await screen.findByText("Message body is required")).toBeInTheDocument();
  });

  it("submits reply and resets form on success", async () => {
    mockedAxios.get.mockResolvedValue({ data: { ticket: mockTicket } });
    mockedAxios.post.mockResolvedValue({ data: { message: { id: "msg-3" } } });
    renderWithProviders();

    const textarea = await screen.findByPlaceholderText("Type your reply...");
    await userEvent.type(textarea, "Thanks for reaching out!");

    const submitButton = screen.getByRole("button", { name: "Send Reply" });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining("/api/tickets/1/messages"),
        { body: "Thanks for reaching out!" },
        { withCredentials: true },
      );
    });

    await waitFor(() => {
      expect(textarea).toHaveValue("");
    });
  });

  it("shows error alert when ticket fetch fails", async () => {
    mockedAxios.get.mockRejectedValue(new Error("Network Error"));
    mockedAxios.isAxiosError.mockReturnValue(false);
    renderWithProviders();

    expect(await screen.findByText("Error")).toBeInTheDocument();
    expect(screen.getByText("Failed to fetch ticket")).toBeInTheDocument();
  });

  it("shows empty messages state", async () => {
    mockedAxios.get.mockResolvedValue({
      data: { ticket: { ...mockTicket, messages: [] } },
    });
    renderWithProviders();

    expect(await screen.findByText("No messages yet.")).toBeInTheDocument();
  });
});
