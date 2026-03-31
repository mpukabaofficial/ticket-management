import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import CreateUserForm from "./CreateUserForm";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

async function openDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /create user/i }));
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("CreateUserForm", () => {
  it("renders the trigger button", () => {
    renderWithQuery(<CreateUserForm />);
    expect(
      screen.getByRole("button", { name: /create user/i })
    ).toBeInTheDocument();
  });

  it("shows form fields when dialog is open", async () => {
    const user = userEvent.setup();
    renderWithQuery(<CreateUserForm />);
    await openDialog(user);

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  describe("validation", () => {
    it("shows error when name is too short", async () => {
      const user = userEvent.setup();
      renderWithQuery(<CreateUserForm />);
      await openDialog(user);

      await user.type(screen.getByLabelText("Name"), "AB");
      await user.type(screen.getByLabelText("Email"), "test@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.click(screen.getByRole("button", { name: /^create user$/i }));

      expect(
        await screen.findByText("Name must be at least 3 characters")
      ).toBeInTheDocument();
    });

    it("shows error for empty email", async () => {
      const user = userEvent.setup();
      renderWithQuery(<CreateUserForm />);
      await openDialog(user);

      await user.type(screen.getByLabelText("Name"), "John Doe");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.click(screen.getByRole("button", { name: /^create user$/i }));

      expect(
        await screen.findByText("Invalid email address")
      ).toBeInTheDocument();
    });

    it("shows error when password is too short", async () => {
      const user = userEvent.setup();
      renderWithQuery(<CreateUserForm />);
      await openDialog(user);

      await user.type(screen.getByLabelText("Name"), "John Doe");
      await user.type(screen.getByLabelText("Email"), "test@example.com");
      await user.type(screen.getByLabelText("Password"), "short");
      await user.click(screen.getByRole("button", { name: /^create user$/i }));

      expect(
        await screen.findByText("Password must be at least 8 characters")
      ).toBeInTheDocument();
    });

    it("does not submit when all fields are empty", async () => {
      const user = userEvent.setup();
      renderWithQuery(<CreateUserForm />);
      await openDialog(user);

      await user.click(screen.getByRole("button", { name: /^create user$/i }));

      await waitFor(() => {
        expect(mockedAxios.post).not.toHaveBeenCalled();
      });
    });
  });

  describe("submission", () => {
    it("calls the API with form data on valid submission", async () => {
      const user = userEvent.setup();
      mockedAxios.post.mockResolvedValue({ data: { user: { id: "1" } } });
      renderWithQuery(<CreateUserForm />);
      await openDialog(user);

      await user.type(screen.getByLabelText("Name"), "John Doe");
      await user.type(screen.getByLabelText("Email"), "john@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.click(screen.getByRole("button", { name: /^create user$/i }));

      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith(
          expect.stringContaining("/api/users"),
          { name: "John Doe", email: "john@example.com", password: "password123" },
          expect.objectContaining({ withCredentials: true })
        );
      });
    });

    it("closes the dialog on successful submission", async () => {
      const user = userEvent.setup();
      mockedAxios.post.mockResolvedValue({ data: { user: { id: "1" } } });
      renderWithQuery(<CreateUserForm />);
      await openDialog(user);

      await user.type(screen.getByLabelText("Name"), "John Doe");
      await user.type(screen.getByLabelText("Email"), "john@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.click(screen.getByRole("button", { name: /^create user$/i }));

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("shows server error on duplicate email", async () => {
      const user = userEvent.setup();
      const axiosError = {
        response: { data: { error: "A user with this email already exists" } },
        isAxiosError: true,
      };
      mockedAxios.post.mockRejectedValue(axiosError);
      mockedAxios.isAxiosError.mockReturnValue(true);
      renderWithQuery(<CreateUserForm />);
      await openDialog(user);

      await user.type(screen.getByLabelText("Name"), "John Doe");
      await user.type(screen.getByLabelText("Email"), "existing@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.click(screen.getByRole("button", { name: /^create user$/i }));

      expect(
        await screen.findByText("A user with this email already exists")
      ).toBeInTheDocument();
    });

    it("shows generic error for non-axios errors", async () => {
      const user = userEvent.setup();
      mockedAxios.post.mockRejectedValue(new Error("Network failure"));
      mockedAxios.isAxiosError.mockReturnValue(false);
      renderWithQuery(<CreateUserForm />);
      await openDialog(user);

      await user.type(screen.getByLabelText("Name"), "John Doe");
      await user.type(screen.getByLabelText("Email"), "john@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.click(screen.getByRole("button", { name: /^create user$/i }));

      expect(
        await screen.findByText("Failed to create user")
      ).toBeInTheDocument();
    });

    it("clears server error when dialog is reopened", async () => {
      const user = userEvent.setup();
      mockedAxios.post.mockRejectedValue(new Error("fail"));
      mockedAxios.isAxiosError.mockReturnValue(false);
      renderWithQuery(<CreateUserForm />);
      await openDialog(user);

      await user.type(screen.getByLabelText("Name"), "John Doe");
      await user.type(screen.getByLabelText("Email"), "john@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.click(screen.getByRole("button", { name: /^create user$/i }));

      await screen.findByText("Failed to create user");

      await user.keyboard("{Escape}");
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });

      await openDialog(user);

      expect(
        screen.queryByText("Failed to create user")
      ).not.toBeInTheDocument();
    });
  });
});
