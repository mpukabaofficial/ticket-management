import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import UserFormDialog from "./UserFormDialog";
import type { User } from "./UsersTable";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

const mockUser: User = {
  id: "1",
  email: "admin@example.com",
  name: "Admin User",
  role: "ADMIN",
  createdAt: "2025-01-15T10:00:00.000Z",
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe("UserFormDialog — create mode", () => {
  async function openCreateDialog(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole("button", { name: /create user/i }));
  }

  it("renders the trigger button", () => {
    renderWithQuery(<UserFormDialog mode="create" />);
    expect(
      screen.getByRole("button", { name: /create user/i })
    ).toBeInTheDocument();
  });

  it("shows form fields when dialog is open", async () => {
    const user = userEvent.setup();
    renderWithQuery(<UserFormDialog mode="create" />);
    await openCreateDialog(user);

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("shows error when name is too short", async () => {
    const user = userEvent.setup();
    renderWithQuery(<UserFormDialog mode="create" />);
    await openCreateDialog(user);

    await user.type(screen.getByLabelText("Name"), "AB");
    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: /^create user$/i }));

    expect(
      await screen.findByText("Name must be at least 3 characters")
    ).toBeInTheDocument();
  });

  it("shows error when password is too short", async () => {
    const user = userEvent.setup();
    renderWithQuery(<UserFormDialog mode="create" />);
    await openCreateDialog(user);

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
    renderWithQuery(<UserFormDialog mode="create" />);
    await openCreateDialog(user);

    await user.click(screen.getByRole("button", { name: /^create user$/i }));

    await waitFor(() => {
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });
  });

  it("calls POST on valid submission", async () => {
    const user = userEvent.setup();
    mockedAxios.post.mockResolvedValue({ data: { user: { id: "1" } } });
    renderWithQuery(<UserFormDialog mode="create" />);
    await openCreateDialog(user);

    await user.type(screen.getByLabelText("Name"), "John Doe");
    await user.type(screen.getByLabelText("Email"), "john@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: /^create user$/i }));

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining("/api/users"),
        {
          name: "John Doe",
          email: "john@example.com",
          password: "password123",
        },
        expect.objectContaining({ withCredentials: true })
      );
    });
  });

  it("closes the dialog on successful submission", async () => {
    const user = userEvent.setup();
    mockedAxios.post.mockResolvedValue({ data: { user: { id: "1" } } });
    renderWithQuery(<UserFormDialog mode="create" />);
    await openCreateDialog(user);

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
    renderWithQuery(<UserFormDialog mode="create" />);
    await openCreateDialog(user);

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
    renderWithQuery(<UserFormDialog mode="create" />);
    await openCreateDialog(user);

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
    renderWithQuery(<UserFormDialog mode="create" />);
    await openCreateDialog(user);

    await user.type(screen.getByLabelText("Name"), "John Doe");
    await user.type(screen.getByLabelText("Email"), "john@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: /^create user$/i }));

    await screen.findByText("Failed to create user");

    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    await openCreateDialog(user);

    expect(
      screen.queryByText("Failed to create user")
    ).not.toBeInTheDocument();
  });
});

describe("UserFormDialog — edit mode", () => {
  function renderEditDialog(open = true) {
    const onOpenChange = vi.fn();
    renderWithQuery(
      <UserFormDialog
        mode="edit"
        user={mockUser}
        open={open}
        onOpenChange={onOpenChange}
      />
    );
    return { onOpenChange };
  }

  it("shows the dialog with pre-filled user data", () => {
    renderEditDialog();

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveValue("Admin User");
    expect(screen.getByLabelText("Email")).toHaveValue("admin@example.com");
    expect(screen.getByLabelText("Password")).toHaveValue("");
  });

  it("shows edit-specific title and description", () => {
    renderEditDialog();

    expect(
      screen.getByRole("heading", { name: /edit user/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/leave password empty to keep it unchanged/i)
    ).toBeInTheDocument();
  });

  it("shows 'Save Changes' button", () => {
    renderEditDialog();

    expect(
      screen.getByRole("button", { name: /save changes/i })
    ).toBeInTheDocument();
  });

  it("calls PUT with user data on submission", async () => {
    const user = userEvent.setup();
    mockedAxios.put.mockResolvedValue({ data: { user: mockUser } });
    renderEditDialog();

    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "Updated Name");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.stringContaining("/api/users/1"),
        expect.objectContaining({ name: "Updated Name", email: "admin@example.com" }),
        expect.objectContaining({ withCredentials: true })
      );
    });
  });

  it("submits without password when left empty", async () => {
    const user = userEvent.setup();
    mockedAxios.put.mockResolvedValue({ data: { user: mockUser } });
    renderEditDialog();

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.stringContaining("/api/users/1"),
        expect.objectContaining({ name: "Admin User", email: "admin@example.com" }),
        expect.objectContaining({ withCredentials: true })
      );
    });

    // Password should be undefined (transformed from empty string by Zod)
    const callData = mockedAxios.put.mock.calls[0]![1] as Record<string, unknown>;
    expect(callData.password).toBeUndefined();
  });

  it("shows validation error for short password when provided", async () => {
    const user = userEvent.setup();
    renderEditDialog();

    await user.type(screen.getByLabelText("Password"), "short");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(
      await screen.findByText("Password must be at least 8 characters")
    ).toBeInTheDocument();
  });

  it("shows server error on duplicate email", async () => {
    const user = userEvent.setup();
    const axiosError = {
      response: { data: { error: "A user with this email already exists" } },
      isAxiosError: true,
    };
    mockedAxios.put.mockRejectedValue(axiosError);
    mockedAxios.isAxiosError.mockReturnValue(true);
    renderEditDialog();

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(
      await screen.findByText("A user with this email already exists")
    ).toBeInTheDocument();
  });

  it("does not render when open is false", () => {
    renderEditDialog(false);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
