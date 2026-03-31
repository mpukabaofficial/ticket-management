import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import { Role } from "shared";
import Users from "./Users";

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

const mockUsers = [
  {
    id: "1",
    email: "admin@example.com",
    name: "Admin User",
    role: Role.ADMIN,
    createdAt: "2025-01-15T10:00:00.000Z",
    deletedAt: null,
  },
  {
    id: "2",
    email: "agent@example.com",
    name: "Agent User",
    role: Role.AGENT,
    createdAt: "2025-02-20T14:30:00.000Z",
    deletedAt: null,
  },
];

const mockUsersWithDeleted = [
  ...mockUsers,
  {
    id: "3",
    email: "deleted@example.com",
    name: "Deleted User",
    role: Role.AGENT,
    createdAt: "2025-03-01T10:00:00.000Z",
    deletedAt: "2025-03-15T10:00:00.000Z",
  },
];

beforeEach(() => {
  vi.resetAllMocks();
});

describe("Users page", () => {
  it("renders the page heading", () => {
    mockedAxios.get.mockReturnValue(new Promise(() => {})); // never resolves
    renderWithQuery(<Users />);
    expect(screen.getByRole("heading", { name: /users/i })).toBeInTheDocument();
  });

  it("shows skeleton rows while loading", () => {
    mockedAxios.get.mockReturnValue(new Promise(() => {}));
    renderWithQuery(<Users />);

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Role")).toBeInTheDocument();
    expect(screen.getByText("Joined")).toBeInTheDocument();

    const skeletons = document.querySelectorAll("[data-slot='skeleton']");
    expect(skeletons.length).toBe(25); // 5 rows × 5 columns
  });

  it("renders user data in the table", async () => {
    mockedAxios.get.mockResolvedValue({ data: { users: mockUsers } });
    renderWithQuery(<Users />);

    expect(await screen.findByText("Admin User")).toBeInTheDocument();
    expect(screen.getByText("admin@example.com")).toBeInTheDocument();
    expect(screen.getByText("ADMIN")).toBeInTheDocument();

    expect(screen.getByText("Agent User")).toBeInTheDocument();
    expect(screen.getByText("agent@example.com")).toBeInTheDocument();
    expect(screen.getByText("AGENT")).toBeInTheDocument();
  });

  it("renders role badges with correct variants", async () => {
    mockedAxios.get.mockResolvedValue({ data: { users: mockUsers } });
    renderWithQuery(<Users />);

    const adminBadge = await screen.findByText("ADMIN");
    const agentBadge = screen.getByText("AGENT");

    expect(adminBadge).toHaveAttribute("data-slot", "badge");
    expect(agentBadge).toHaveAttribute("data-slot", "badge");
  });

  it("formats the joined date", async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        users: [
          {
            id: "1",
            email: "test@example.com",
            name: "Test",
            role: Role.AGENT,
            createdAt: "2025-06-15T00:00:00.000Z",
            deletedAt: null,
          },
        ],
      },
    });
    renderWithQuery(<Users />);

    const dateCell = await screen.findByText(/jun.*2025/i);
    expect(dateCell).toBeInTheDocument();
  });

  it("shows empty state when no users are returned", async () => {
    mockedAxios.get.mockResolvedValue({ data: { users: [] } });
    renderWithQuery(<Users />);

    expect(await screen.findByText("No users found.")).toBeInTheDocument();
  });

  it("shows error alert when the request fails", async () => {
    mockedAxios.get.mockRejectedValue(new Error("Network Error"));
    mockedAxios.isAxiosError.mockReturnValue(false);
    renderWithQuery(<Users />);

    expect(await screen.findByText("Error")).toBeInTheDocument();
    expect(screen.getByText("Failed to fetch users")).toBeInTheDocument();
  });

  it("shows server error message from axios error response", async () => {
    const axiosError = {
      response: { data: { error: "Forbidden" } },
      message: "Request failed with status code 403",
      isAxiosError: true,
    };
    mockedAxios.get.mockRejectedValue(axiosError);
    mockedAxios.isAxiosError.mockReturnValue(true);
    renderWithQuery(<Users />);

    expect(await screen.findByText("Forbidden")).toBeInTheDocument();
  });

  it("calls the correct API endpoint with credentials", () => {
    mockedAxios.get.mockReturnValue(new Promise(() => {}));
    renderWithQuery(<Users />);

    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining("/api/users"),
      expect.objectContaining({ withCredentials: true })
    );
  });

  it("renders edit buttons for each user row", async () => {
    mockedAxios.get.mockResolvedValue({ data: { users: mockUsers } });
    renderWithQuery(<Users />);

    await screen.findByText("Admin User");

    expect(screen.getByRole("button", { name: /edit admin user/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /edit agent user/i })).toBeInTheDocument();
  });

  describe("Edit User dialog", () => {
    it("opens with user data pre-filled when edit button is clicked", async () => {
      const user = userEvent.setup();
      mockedAxios.get.mockResolvedValue({ data: { users: mockUsers } });
      renderWithQuery(<Users />);

      await screen.findByText("Admin User");
      await user.click(screen.getByRole("button", { name: /edit admin user/i }));

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByLabelText("Name")).toHaveValue("Admin User");
      expect(screen.getByLabelText("Email")).toHaveValue("admin@example.com");
      expect(screen.getByLabelText("Password")).toHaveValue("");
    });

    it("closes the edit dialog when pressing Escape", async () => {
      const user = userEvent.setup();
      mockedAxios.get.mockResolvedValue({ data: { users: mockUsers } });
      renderWithQuery(<Users />);

      await screen.findByText("Admin User");
      await user.click(screen.getByRole("button", { name: /edit admin user/i }));
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });
  });

  describe("Delete User", () => {
    it("shows delete button for agent users but not admin users", async () => {
      mockedAxios.get.mockResolvedValue({ data: { users: mockUsers } });
      renderWithQuery(<Users />);

      await screen.findByText("Admin User");

      expect(screen.queryByRole("button", { name: /delete admin user/i })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /delete agent user/i })).toBeInTheDocument();
    });

    it("hides delete button for deleted users", async () => {
      const user = userEvent.setup();
      mockedAxios.get.mockResolvedValue({ data: { users: mockUsersWithDeleted } });
      renderWithQuery(<Users />);

      await screen.findByText("Admin User");

      // Enable show deleted toggle
      await user.click(screen.getByLabelText(/show deleted/i));

      expect(screen.getByText("Deleted User")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /delete deleted user/i })).not.toBeInTheDocument();
    });

    it("opens confirmation dialog when delete is clicked", async () => {
      const user = userEvent.setup();
      mockedAxios.get.mockResolvedValue({ data: { users: mockUsers } });
      renderWithQuery(<Users />);

      await screen.findByText("Agent User");
      await user.click(screen.getByRole("button", { name: /delete agent user/i }));

      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
    });

    it("calls DELETE API on confirm", async () => {
      const user = userEvent.setup();
      mockedAxios.get.mockResolvedValue({ data: { users: mockUsers } });
      mockedAxios.delete.mockResolvedValue({ data: { user: mockUsers[1] } });
      renderWithQuery(<Users />);

      await screen.findByText("Agent User");
      await user.click(screen.getByRole("button", { name: /delete agent user/i }));
      await user.click(screen.getByRole("button", { name: /^delete$/i }));

      await waitFor(() => {
        expect(mockedAxios.delete).toHaveBeenCalledWith(
          expect.stringContaining("/api/users/2"),
          expect.objectContaining({ withCredentials: true })
        );
      });
    });
  });

  describe("Show deleted toggle", () => {
    it("hides deleted users by default", async () => {
      mockedAxios.get.mockResolvedValue({ data: { users: mockUsersWithDeleted } });
      renderWithQuery(<Users />);

      await screen.findByText("Admin User");

      expect(screen.queryByText("Deleted User")).not.toBeInTheDocument();
    });

    it("shows deleted users when toggle is checked", async () => {
      const user = userEvent.setup();
      mockedAxios.get.mockResolvedValue({ data: { users: mockUsersWithDeleted } });
      renderWithQuery(<Users />);

      await screen.findByText("Admin User");
      await user.click(screen.getByLabelText(/show deleted/i));

      expect(screen.getByText("Deleted User")).toBeInTheDocument();
    });

    it("shows Deleted badge for soft-deleted users", async () => {
      const user = userEvent.setup();
      mockedAxios.get.mockResolvedValue({ data: { users: mockUsersWithDeleted } });
      renderWithQuery(<Users />);

      await screen.findByText("Admin User");
      await user.click(screen.getByLabelText(/show deleted/i));

      expect(screen.getByText("Deleted")).toBeInTheDocument();
    });
  });

  describe("Create User dialog", () => {
    it("opens the dialog when 'Create User' button is clicked", async () => {
      const user = userEvent.setup();
      mockedAxios.get.mockReturnValue(new Promise(() => {}));
      renderWithQuery(<Users />);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /create user/i }));

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Add a new user to the system.")).toBeInTheDocument();
    });

    it("closes the dialog when pressing Escape", async () => {
      const user = userEvent.setup();
      mockedAxios.get.mockReturnValue(new Promise(() => {}));
      renderWithQuery(<Users />);

      await user.click(screen.getByRole("button", { name: /create user/i }));
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("closes the dialog when clicking the overlay", async () => {
      const user = userEvent.setup();
      mockedAxios.get.mockReturnValue(new Promise(() => {}));
      renderWithQuery(<Users />);

      await user.click(screen.getByRole("button", { name: /create user/i }));
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      const overlay = document.querySelector("[data-slot='dialog-overlay']")!;
      await user.click(overlay);

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });
  });
});
