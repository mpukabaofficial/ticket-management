import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import { toast } from "sonner";
import TicketReplyForm from "./TicketReplyForm";

vi.mock("axios");
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const mockedAxios = vi.mocked(axios, true);

function renderForm(ticketId = "1") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <TicketReplyForm ticketId={ticketId} />
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

  it("shows validation error when submitting empty body", async () => {
    renderForm();

    await userEvent.click(screen.getByRole("button", { name: "Send Reply" }));

    expect(await screen.findByText("Message body is required")).toBeInTheDocument();
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it("submits reply with correct payload", async () => {
    mockedAxios.post.mockResolvedValue({ data: { message: { id: "msg-1" } } });
    renderForm("42");

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
