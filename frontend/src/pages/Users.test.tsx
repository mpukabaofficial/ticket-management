import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
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
    role: "ADMIN" as const,
    createdAt: "2025-01-15T10:00:00.000Z",
  },
  {
    id: "2",
    email: "agent@example.com",
    name: "Agent User",
    role: "AGENT" as const,
    createdAt: "2025-02-20T14:30:00.000Z",
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
    expect(skeletons.length).toBe(20); // 5 rows × 4 columns
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
            role: "AGENT",
            createdAt: "2025-06-15T00:00:00.000Z",
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
});
