/**
 * E2E tests for user management CRUD operations.
 *
 * Tests run serially and share state intentionally — each test builds on the
 * previous one (create → edit → delete → show-deleted toggle).  Serial mode
 * also avoids hitting the Better Auth rate limiter when multiple workers send
 * login requests from the same IP.
 */

import { test, expect, type Page } from "@playwright/test";

// Run all tests in this file serially — state is shared across tests
test.describe.configure({ mode: "serial" });

// Admin credentials from backend/.env.test / global-setup.ts
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "password321!";

// The agent user created in the "Create user" test — reused in later tests
const AGENT_NAME = "Test Agent";
const AGENT_EMAIL = "agent@test.com";
const AGENT_PASSWORD = "testpassword123";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Log in as the seeded admin and wait until the dashboard loads. */
async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
  await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("/");
}

/** Sign the current user out and wait until the login page is shown. */
async function signOut(page: Page) {
  await page.getByRole("button", { name: /sign out/i }).click();
  await page.waitForURL("/login");
}

/** Navigate to the Users page from any authenticated page. */
async function goToUsers(page: Page) {
  await page.goto("/users");
  await page.waitForURL("/users");
  // Wait for the table data to finish loading — heading is always present
  await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("User Management", () => {
  // Log in as admin and navigate to /users before every test
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await goToUsers(page);
  });

  // -------------------------------------------------------------------------
  // 2. Create user
  // -------------------------------------------------------------------------

  test("can create a new agent user and sees them in the table", async ({
    page,
  }) => {
    // Open the Create User dialog
    await page.getByRole("button", { name: /create user/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: "Create User" }),
    ).toBeVisible();

    // Fill in the form
    await dialog.getByLabel("Name").fill(AGENT_NAME);
    await dialog.getByLabel("Email").fill(AGENT_EMAIL);
    await dialog.getByLabel("Password").fill(AGENT_PASSWORD);

    // Submit
    await dialog.getByRole("button", { name: /create user/i }).click();

    // Dialog should close after success
    await expect(dialog).not.toBeVisible();

    // Toast confirmation
    await expect(page.getByText("User created successfully")).toBeVisible();

    // New user should appear in the table
    const newRow = page.getByRole("row", { name: /agent@test\.com/i });
    await expect(newRow).toBeVisible();
    // Scope to individual cells to avoid strict-mode ambiguity (row accessible
    // name is built from all cell text, so plain getByText matches multiple cells)
    await expect(
      newRow.getByRole("cell", { name: AGENT_NAME, exact: true }),
    ).toBeVisible();
    await expect(newRow.getByRole("cell", { name: AGENT_EMAIL })).toBeVisible();
    await expect(newRow.getByText("AGENT", { exact: true })).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // 3. Edit user — change name
  // -------------------------------------------------------------------------

  test("can edit the agent user name and sees the updated name in the table", async ({
    page,
  }) => {
    // Click the edit button for "Test Agent"
    await page.getByRole("button", { name: `Edit ${AGENT_NAME}` }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: "Edit User" }),
    ).toBeVisible();

    // Clear name and type the new value
    const nameInput = dialog.getByLabel("Name");
    await nameInput.clear();
    await nameInput.fill("Updated Agent");

    // Submit
    await dialog.getByRole("button", { name: /save changes/i }).click();

    // Dialog closes, toast appears
    await expect(dialog).not.toBeVisible();
    await expect(page.getByText("User updated successfully")).toBeVisible();

    // Table should now show the updated name
    const updatedRow = page.getByRole("row", { name: /agent@test\.com/i });
    await expect(
      updatedRow.getByRole("cell", { name: "Updated Agent", exact: true }),
    ).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // 4. Edit user — change password, then verify login with new password
  // -------------------------------------------------------------------------

  test("can change the agent password and the agent can log in with the new password", async ({
    page,
  }) => {
    const newPassword = "newpassword123";

    // Open edit dialog for "Updated Agent"
    await page.getByRole("button", { name: "Edit Updated Agent" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Leave name/email as-is; only update the password
    await dialog.getByLabel("Password").fill(newPassword);
    await dialog.getByRole("button", { name: /save changes/i }).click();

    await expect(dialog).not.toBeVisible();
    await expect(page.getByText("User updated successfully")).toBeVisible();

    // Sign out as admin, then verify agent can sign in with the new password
    await signOut(page);

    await page.goto("/login");
    await page.getByLabel(/email/i).fill(AGENT_EMAIL);
    await page.getByLabel(/password/i).fill(newPassword);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL("/");

    // Agent is now on the dashboard — sign out and sign back in as admin
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();
    await signOut(page);

    // Return to /users as admin for subsequent tests
    await loginAsAdmin(page);
    await goToUsers(page);
  });

  // -------------------------------------------------------------------------
  // 5. Delete user
  // -------------------------------------------------------------------------

  test("can delete the agent user and they disappear from the table", async ({
    page,
  }) => {
    // Click the delete button for "Updated Agent"
    await page.getByRole("button", { name: "Delete Updated Agent" }).click();

    const alertDialog = page.getByRole("alertdialog");
    await expect(alertDialog).toBeVisible();
    await expect(
      alertDialog.getByRole("heading", { name: "Delete User" }),
    ).toBeVisible();

    // Confirm the deletion
    await alertDialog.getByRole("button", { name: /^delete$/i }).click();

    // Alert dialog closes, toast appears
    await expect(alertDialog).not.toBeVisible();
    await expect(page.getByText("User deleted successfully")).toBeVisible();

    // "Show deleted" is off by default — user row should be gone
    await expect(
      page.getByRole("row", { name: /agent@test\.com/i }),
    ).not.toBeVisible();
  });

  // -------------------------------------------------------------------------
  // 6. Show deleted toggle
  // -------------------------------------------------------------------------

  test("show-deleted checkbox reveals the deleted user greyed out with a Deleted badge", async ({
    page,
  }) => {
    // By default the deleted user is hidden
    await expect(
      page.getByRole("row", { name: /agent@test\.com/i }),
    ).not.toBeVisible();

    // Enable the "Show deleted" checkbox
    await page.getByLabel("Show deleted").click();

    // Deleted user should now appear
    const deletedRow = page.getByRole("row", { name: /agent@test\.com/i });
    await expect(deletedRow).toBeVisible();

    // Row must carry the opacity class that makes it appear greyed out
    await expect(deletedRow).toHaveClass(/opacity-50/);

    // "Deleted" badge must be visible inside that row
    await expect(deletedRow.getByText("Deleted")).toBeVisible();

    // Uncheck "Show deleted" — user disappears again
    await page.getByLabel("Show deleted").click();
    await expect(
      page.getByRole("row", { name: /agent@test\.com/i }),
    ).not.toBeVisible();
  });
});
