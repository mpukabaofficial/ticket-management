import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import { toast } from "sonner";
import type { Ticket } from "@/types/ticket";
import TicketReplyForm from "./TicketReplyForm";

vi.mock("axios");
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const mockedAxios = vi.mocked(axios, true);

const defaultTicket: Ticket = {
  id: 1,
  subject: "Test ticket",
  body: "Test body",
  status: "OPEN",
  category: null,
  senderEmail: "john@example.com",
  senderName: "John Doe",
  createdAt: "2026-01-01T00:00:00Z",
  assignedTo: null,
};

function renderForm(ticket: Partial<Ticket> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <TicketReplyForm ticket={{ ...defaultTicket, ...ticket }} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("TicketReplyForm", () => {
  it("renders the form with heading, textarea and submit button", () => {
    renderForm();

    expect(screen.getByText("Reply")).toBeInTheDocument();
    expect(screen.getByLabelText("Message")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Type your reply...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send Reply" })).toBeInTheDocument();
  });

  it("prevents submitting empty body by disabling the button", () => {
    renderForm();

    expect(screen.getByRole("button", { name: "Send Reply" })).toBeDisabled();
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it("submits reply with correct payload", async () => {
    mockedAxios.post.mockResolvedValue({ data: { message: { id: "msg-1" } } });
    renderForm({ id: 42 });

    await userEvent.type(screen.getByPlaceholderText("Type your reply..."), "Hello there!");
    await userEvent.click(screen.getByRole("button", { name: "Send Reply" }));

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining("/api/tickets/42/messages"),
        { body: "Hello there!" },
        { withCredentials: true },
      );
    });
  });

  it("resets form and shows success toast on successful submit", async () => {
    mockedAxios.post.mockResolvedValue({ data: { message: { id: "msg-1" } } });
    renderForm();

    const textarea = screen.getByPlaceholderText("Type your reply...");
    await userEvent.type(textarea, "Test reply");
    await userEvent.click(screen.getByRole("button", { name: "Send Reply" }));

    await waitFor(() => {
      expect(textarea).toHaveValue("");
    });
    expect(toast.success).toHaveBeenCalledWith("Reply sent");
  });

  it("shows error toast on failed submit", async () => {
    mockedAxios.post.mockRejectedValue(new Error("Network Error"));
    mockedAxios.isAxiosError.mockReturnValue(false);
    renderForm();

    await userEvent.type(screen.getByPlaceholderText("Type your reply..."), "Test reply");
    await userEvent.click(screen.getByRole("button", { name: "Send Reply" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to send reply");
    });
  });

  it("disables Polish and Send Reply buttons when textarea is empty", () => {
    renderForm();

    expect(screen.getByRole("button", { name: "Polish" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Send Reply" })).toBeDisabled();
  });

  it("enables Polish and Send Reply buttons when textarea has text", async () => {
    renderForm();

    await userEvent.type(screen.getByPlaceholderText("Type your reply..."), "Hello");

    expect(screen.getByRole("button", { name: "Polish" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Send Reply" })).toBeEnabled();
  });

  it("disables buttons again after clearing textarea", async () => {
    renderForm();

    const textarea = screen.getByPlaceholderText("Type your reply...");
    await userEvent.type(textarea, "Hello");
    await userEvent.clear(textarea);

    expect(screen.getByRole("button", { name: "Polish" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Send Reply" })).toBeDisabled();
  });

  it("shows server error message from axios error response", async () => {
    const axiosError = {
      response: { data: { error: "Ticket not found" } },
      message: "Request failed",
    };
    mockedAxios.post.mockRejectedValue(axiosError);
    mockedAxios.isAxiosError.mockReturnValue(true);
    renderForm();

    await userEvent.type(screen.getByPlaceholderText("Type your reply..."), "Test reply");
    await userEvent.click(screen.getByRole("button", { name: "Send Reply" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Ticket not found");
    });
  });
});
