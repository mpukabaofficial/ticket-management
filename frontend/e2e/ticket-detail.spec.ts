/**
 * E2E tests for the TicketDetail page and its sub-components:
 *   - TicketMessages
 *   - TicketReplyForm
 *   - TicketDetailsSidebar (status, category, assign)
 *
 * Tests run serially and share state intentionally — each test group first
 * creates a ticket via the public webhook endpoint, then exercises the UI
 * against that real ticket.  Serial mode also avoids hitting the Better Auth
 * rate limiter when multiple workers send login requests from the same IP.
 *
 * Unit tests already cover:
 *   - Validation errors (empty reply body)
 *   - Loading/skeleton states
 *   - Error alerts on fetch failure
 *   - Badge rendering, date formatting, separator rendering
 *
 * These E2E tests focus on behaviour that requires a running backend and
 * database.
 */

import { test, expect, type Page, type APIRequestContext } from "@playwright/test";
import { BACKEND_URL } from "./constants";

// Run all tests in this file serially to avoid rate-limiter issues.
test.describe.configure({ mode: "serial" });

// Admin credentials from backend/.env.test / global-setup.ts
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "password321!";

const WEBHOOK_URL = `${BACKEND_URL}/api/tickets/email`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Log in as the seeded admin user and wait until the dashboard loads. */
async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
  await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("/");
}

/**
 * Create a ticket via the public webhook endpoint and return its id.
 * This is much faster than navigating the UI to create a ticket and avoids
 * coupling tests to the ticket-creation UI.
 */
async function createTicket(
  request: APIRequestContext,
  overrides: {
    from?: string;
    senderName?: string;
    subject?: string;
    body?: string;
  } = {},
): Promise<number> {
  const res = await request.post(WEBHOOK_URL, {
    data: {
      from: overrides.from ?? "student@example.com",
      senderName: overrides.senderName ?? "Test Student",
      subject: overrides.subject ?? "Help with my course",
      body: overrides.body ?? "I need help with my course material.",
    },
  });
  expect(res.status()).toBe(201);
  const { ticket } = await res.json();
  return ticket.id as number;
}

/** Navigate directly to a ticket detail page and wait for the card to appear. */
async function goToTicketDetail(page: Page, ticketId: number) {
  await page.goto(`/tickets/${ticketId}`);
  // Wait for the ticket subject heading to confirm the page loaded data
  await expect(page.getByRole("link", { name: /back to tickets/i })).toBeVisible();
}

// ---------------------------------------------------------------------------
// 1. Happy path — ticket info, messages, sidebar render with real data
// ---------------------------------------------------------------------------

test.describe("TicketDetail — happy path", () => {
  let ticketId: number;

  test.beforeEach(async ({ page, request }) => {
    ticketId = await createTicket(request, {
      from: "happystudent@example.com",
      senderName: "Happy Student",
      subject: "Course access problem",
      body: "I cannot access my enrolled course.",
    });
    await loginAsAdmin(page);
    await goToTicketDetail(page, ticketId);
  });

  test("shows ticket subject, sender name, and sender email", async ({ page }) => {
    // Ticket ID badge and subject in the card title
    await expect(page.getByText(`#${ticketId}`)).toBeVisible();
    await expect(page.getByText("Course access problem")).toBeVisible();

    // Sender details rendered in the dl grid
    await expect(page.getByText("Happy Student (happystudent@example.com)")).toBeVisible();
  });

  test("shows the initial customer message in the messages list", async ({ page }) => {
    // TicketMessages renders each message body as a paragraph
    await expect(page.getByText("I cannot access my enrolled course.")).toBeVisible();

    // The sender name appears as the message author
    await expect(page.getByText("Happy Student").first()).toBeVisible();

    // The customer senderType badge
    await expect(page.getByText("Customer")).toBeVisible();
  });

  test("shows the sidebar Details card with status, category, and assigned-to controls", async ({
    page,
  }) => {
    // The sidebar card heading
    await expect(page.getByRole("heading", { name: "Details" })).toBeVisible();

    // Status label and select
    await expect(page.getByText("Status")).toBeVisible();

    // Category label and select
    await expect(page.getByText("Category")).toBeVisible();

    // Assigned to label
    await expect(page.getByText("Assigned to")).toBeVisible();
  });

  test("shows the Back to tickets navigation link", async ({ page }) => {
    const backLink = page.getByRole("link", { name: /back to tickets/i });
    await expect(backLink).toBeVisible();

    await backLink.click();
    await page.waitForURL("/tickets");
    await expect(page).toHaveURL("/tickets");
  });
});

// ---------------------------------------------------------------------------
// 2. Reply to ticket — submit a reply and verify it appears in the messages list
// ---------------------------------------------------------------------------

test.describe("TicketDetail — reply to ticket", () => {
  let ticketId: number;

  test.beforeEach(async ({ page, request }) => {
    ticketId = await createTicket(request, {
      from: "replystudent@example.com",
      senderName: "Reply Student",
      subject: "Need a reply from support",
      body: "Please respond to my question.",
    });
    await loginAsAdmin(page);
    await goToTicketDetail(page, ticketId);
  });

  test("submitting a reply adds it to the messages list and shows a success toast", async ({
    page,
  }) => {
    const replyText = "Thank you for reaching out. We are looking into this.";

    // The Reply card heading
    await expect(page.getByRole("heading", { name: "Reply" })).toBeVisible();

    // Fill in the textarea — label is "Message"
    await page.getByLabel("Message").fill(replyText);

    // Submit the reply
    await page.getByRole("button", { name: /send reply/i }).click();

    // Success toast
    await expect(page.getByText("Reply sent")).toBeVisible();

    // The reply body should now appear in the messages list
    await expect(page.getByText(replyText)).toBeVisible();

    // The Agent badge should be visible (the admin replied as an agent)
    await expect(page.getByText("Agent")).toBeVisible();

    // The textarea should be cleared after a successful submit
    await expect(page.getByLabel("Message")).toHaveValue("");
  });

  test("the Send Reply button is disabled while the request is in flight", async ({
    page,
  }) => {
    // Intercept the reply API call and hold it briefly to observe loading state
    let resumeRequest!: () => void;
    const requestPaused = new Promise<void>((resolve) => {
      resumeRequest = resolve;
    });

    await page.route(`**/api/tickets/${ticketId}/messages`, async (route) => {
      resumeRequest();
      await new Promise<void>((r) => setTimeout(r, 2000));
      await route.continue();
    });

    await page.getByLabel("Message").fill("Testing loading state.");

    const clickPromise = page.getByRole("button", { name: /send reply/i }).click();

    await requestPaused;

    await expect(page.getByRole("button", { name: /sending/i })).toBeDisabled();

    await clickPromise;
  });
});

// ---------------------------------------------------------------------------
// 3. Update ticket status — change via sidebar and verify it persists
// ---------------------------------------------------------------------------

test.describe("TicketDetail — update ticket status", () => {
  let ticketId: number;

  test.beforeEach(async ({ page, request }) => {
    ticketId = await createTicket(request, {
      from: "statusstudent@example.com",
      senderName: "Status Student",
      subject: "Status update test ticket",
      body: "Testing status updates.",
    });
    await loginAsAdmin(page);
    await goToTicketDetail(page, ticketId);
  });

  test("changing status to Resolved shows a Save button and persists after save", async ({
    page,
  }) => {
    // Initially no Save button should be visible
    await expect(page.getByRole("button", { name: /^save$/i })).not.toBeVisible();

    // Click the Status select trigger — it is inside the "Details" sidebar card
    const sidebar = page.getByRole("heading", { name: "Details" }).locator("../..");
    const statusSelect = sidebar.locator("select, [role='combobox']").first();
    await statusSelect.click();

    // Pick "Resolved" from the dropdown
    await page.getByRole("option", { name: "Resolved" }).click();

    // Save button should appear when the selection differs from the current status
    const saveButton = page.getByRole("button", { name: /^save$/i });
    await expect(saveButton).toBeVisible();
    await saveButton.click();

    // Toast confirmation
    await expect(page.getByText("Ticket updated")).toBeVisible();

    // Save button should disappear after saving
    await expect(page.getByRole("button", { name: /^save$/i })).not.toBeVisible();

    // Reload and verify the change persisted
    await page.reload();
    await goToTicketDetail(page, ticketId);

    // The status select should now show "Resolved"
    await expect(page.getByRole("combobox").first()).toHaveText(/resolved/i);
  });

  test("changing status to Closed persists after save and page reload", async ({
    page,
  }) => {
    const sidebar = page.getByRole("heading", { name: "Details" }).locator("../..");
    const statusSelect = sidebar.locator("[role='combobox']").first();
    await statusSelect.click();

    await page.getByRole("option", { name: "Closed" }).click();

    const saveButton = page.getByRole("button", { name: /^save$/i });
    await expect(saveButton).toBeVisible();
    await saveButton.click();

    await expect(page.getByText("Ticket updated")).toBeVisible();

    await page.reload();
    await goToTicketDetail(page, ticketId);

    await expect(page.getByRole("combobox").first()).toHaveText(/closed/i);
  });
});

// ---------------------------------------------------------------------------
// 4. Update ticket category — change via sidebar and verify it persists
// ---------------------------------------------------------------------------

test.describe("TicketDetail — update ticket category", () => {
  let ticketId: number;

  test.beforeEach(async ({ page, request }) => {
    ticketId = await createTicket(request, {
      from: "categorystudent@example.com",
      senderName: "Category Student",
      subject: "Category update test ticket",
      body: "Testing category updates.",
    });
    await loginAsAdmin(page);
    await goToTicketDetail(page, ticketId);
  });

  test("setting category to Technical shows a Save button and persists after save", async ({
    page,
  }) => {
    // No Save button initially
    await expect(page.getByRole("button", { name: /^save$/i })).not.toBeVisible();

    // The category combobox is the second combobox in the sidebar (after status)
    const sidebar = page.getByRole("heading", { name: "Details" }).locator("../..");
    const categorySelect = sidebar.locator("[role='combobox']").nth(1);
    await categorySelect.click();

    await page.getByRole("option", { name: "Technical" }).click();

    const saveButton = page.getByRole("button", { name: /^save$/i });
    await expect(saveButton).toBeVisible();
    await saveButton.click();

    await expect(page.getByText("Ticket updated")).toBeVisible();
    await expect(page.getByRole("button", { name: /^save$/i })).not.toBeVisible();

    // Reload and verify persistence
    await page.reload();
    await goToTicketDetail(page, ticketId);

    const sidebar2 = page.getByRole("heading", { name: "Details" }).locator("../..");
    await expect(sidebar2.locator("[role='combobox']").nth(1)).toHaveText(/technical/i);
  });

  test("setting category to Refund persists after save and page reload", async ({
    page,
  }) => {
    const sidebar = page.getByRole("heading", { name: "Details" }).locator("../..");
    const categorySelect = sidebar.locator("[role='combobox']").nth(1);
    await categorySelect.click();

    await page.getByRole("option", { name: "Refund" }).click();

    await page.getByRole("button", { name: /^save$/i }).click();
    await expect(page.getByText("Ticket updated")).toBeVisible();

    await page.reload();
    await goToTicketDetail(page, ticketId);

    const sidebar2 = page.getByRole("heading", { name: "Details" }).locator("../..");
    await expect(sidebar2.locator("[role='combobox']").nth(1)).toHaveText(/refund/i);
  });
});

// ---------------------------------------------------------------------------
// 5. Assign ticket to agent — assign via sidebar and verify it persists
// ---------------------------------------------------------------------------

test.describe("TicketDetail — assign ticket to agent", () => {
  let ticketId: number;

  test.beforeEach(async ({ page, request }) => {
    ticketId = await createTicket(request, {
      from: "assignstudent@example.com",
      senderName: "Assign Student",
      subject: "Assign ticket test",
      body: "Testing ticket assignment.",
    });
    await loginAsAdmin(page);
    await goToTicketDetail(page, ticketId);
  });

  test("assigning the ticket to a user (Admin) shows an Assign button and persists", async ({
    page,
  }) => {
    // No Assign button should be visible initially (no agent selected yet)
    await expect(page.getByRole("button", { name: /^assign$/i })).not.toBeVisible();

    // The "Assigned to" combobox is the third combobox in the sidebar
    const sidebar = page.getByRole("heading", { name: "Details" }).locator("../..");
    const assignSelect = sidebar.locator("[role='combobox']").nth(2);
    await assignSelect.click();

    // The seeded admin user ("Admin") should appear as an assignable agent
    await page.getByRole("option", { name: "Admin" }).click();

    // Assign button should appear
    const assignButton = page.getByRole("button", { name: /^assign$/i });
    await expect(assignButton).toBeVisible();
    await assignButton.click();

    // Toast confirmation
    await expect(page.getByText("Ticket assigned")).toBeVisible();

    // Assign button should disappear after saving
    await expect(page.getByRole("button", { name: /^assign$/i })).not.toBeVisible();

    // Reload and verify the assignment persisted
    await page.reload();
    await goToTicketDetail(page, ticketId);

    const sidebar2 = page.getByRole("heading", { name: "Details" }).locator("../..");
    await expect(sidebar2.locator("[role='combobox']").nth(2)).toHaveText(/admin/i);
  });
});
