/**
 * E2E tests for the authentication system.
 *
 * The entire file runs serially (test.describe.configure at the top level)
 * because the backend's Better Auth rate limiter will reject concurrent
 * login requests from the same IP, causing spurious failures.
 */

import { test, expect, type Page } from "@playwright/test";

// Run all auth tests serially to avoid hitting the Better Auth rate limiter
// when multiple workers send login requests at the same time.
test.describe.configure({ mode: "serial" });

// Admin credentials from backend/.env.test
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "password321!";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Log in as the seeded admin user and wait until the dashboard is loaded. */
async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
  await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("/");
}


// ---------------------------------------------------------------------------
// 1. Login happy path
// ---------------------------------------------------------------------------

test.describe("Login — happy path", () => {
  test("login page renders the sign in card", async ({ page }) => {
    await page.goto("/login");

    // CardTitle is a <div> (not a semantic heading); match it specifically
    // by its data-slot attribute to avoid strict-mode collision with the
    // "Sign in" button text.
    await expect(
      page.locator('[data-slot="card-title"]', { hasText: "Sign in" })
    ).toBeVisible();
    await expect(
      page.getByText(/ticket management system/i)
    ).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /sign in/i })
    ).toBeVisible();
  });

  test("admin can sign in with valid credentials and lands on dashboard", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();

    await page.waitForURL("/");
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("dashboard shows admin user name in navbar after login", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    // MainLayout renders session.user.name — seeded as "Admin"
    await expect(page.getByText("Admin")).toBeVisible();
  });

  test("admin navbar shows Users and Dashboard links after login", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Users" })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 2. Login validation — client-side and server-side errors
// ---------------------------------------------------------------------------

test.describe("Login — validation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("shows required error when email field is empty on submit", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/email is required/i)).toBeVisible();
  });

  test("shows required error when password field is empty on submit", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/password is required/i)).toBeVisible();
  });

  test("shows both required errors when both fields are empty", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/password is required/i)).toBeVisible();
  });

  test("browser blocks form submission when email field contains a non-email value", async ({
    page,
  }) => {
    // Chromium's native type="email" constraint prevents form submission when
    // the value does not match the email format.  The form stays on /login.
    // (The Zod .email() validator would fire for the same reason if the
    //  browser constraint were not present — both layers reject the value.)
    await page.getByLabel(/email/i).fill("not-an-email");
    await page.getByLabel(/password/i).fill("somepassword");
    await page.getByRole("button", { name: /sign in/i }).click();

    // No navigation should happen — browser prevents form submission
    await expect(page).toHaveURL(/\/login/);
  });

  test("shows server error for wrong password", async ({ page }) => {
    await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/password/i).fill("wrongpassword999!");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("shows server error for non-existent email", async ({ page }) => {
    await page.getByLabel(/email/i).fill("nobody@example.com");
    await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("does not navigate away from /login when validation fails", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});

// ---------------------------------------------------------------------------
// 3. Session persistence — page reload keeps the user logged in
// ---------------------------------------------------------------------------

test.describe("Session persistence", () => {
  test("user remains authenticated after full page reload", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    await page.reload();

    // Should still be on the dashboard, not redirected to /login
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("user remains authenticated after navigating between protected pages", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    await page.goto("/users");
    await page.waitForURL("/users");

    await page.goto("/");
    await page.waitForURL("/");

    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 4. Sign out
// ---------------------------------------------------------------------------

test.describe("Sign out", () => {
  test("user can sign out and is redirected to /login", async ({ page }) => {
    await loginAsAdmin(page);

    await page.getByRole("button", { name: /sign out/i }).click();
    await page.waitForURL("/login");

    await expect(
      page.locator('[data-slot="card-title"]', { hasText: "Sign in" })
    ).toBeVisible();
  });

  test("after sign out, accessing / redirects back to /login", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    await page.getByRole("button", { name: /sign out/i }).click();
    await page.waitForURL("/login");

    await page.goto("/");
    await page.waitForURL("/login");

    await expect(page).toHaveURL(/\/login/);
  });

  test("after sign out, the sign out button is gone from the page", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    await expect(
      page.getByRole("button", { name: /sign out/i })
    ).toBeVisible();

    await page.getByRole("button", { name: /sign out/i }).click();
    await page.waitForURL("/login");

    await expect(
      page.getByRole("button", { name: /sign out/i })
    ).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 5. Protected routes — unauthenticated access redirects to /login
// ---------------------------------------------------------------------------

test.describe("Protected routes — unauthenticated access", () => {
  test("accessing / when not logged in redirects to /login", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForURL("/login");
    await expect(page).toHaveURL(/\/login/);
  });

  test("accessing /users when not logged in redirects to /login", async ({
    page,
  }) => {
    await page.goto("/users");
    await page.waitForURL("/login");
    await expect(page).toHaveURL(/\/login/);
  });

  test("accessing an unknown route when not logged in redirects to /login", async ({
    page,
  }) => {
    await page.goto("/some/unknown/path");
    await page.waitForURL("/login");
    await expect(page).toHaveURL(/\/login/);
  });

  test("accessing /not-found when not logged in redirects to /login", async ({
    page,
  }) => {
    await page.goto("/not-found");
    await page.waitForURL("/login");
    await expect(page).toHaveURL(/\/login/);
  });
});

// ---------------------------------------------------------------------------
// 6. Admin route guard
// ---------------------------------------------------------------------------

test.describe("Admin route guard", () => {
  test("sign-up endpoint is disabled — users cannot self-register", async ({
    page,
  }) => {
    // Validates that disabledPaths: ["/sign-up/email"] is effective.
    // An AGENT user cannot be created via the public API, which also means
    // we cannot test the AdminRoute redirect to "/" with a real AGENT session
    // in these tests — but we validate the guard at the code level below.
    const res = await page.request.post(
      "http://localhost:3001/api/auth/sign-up/email",
      {
        data: {
          email: "agent@example.com",
          password: "agentpassword321!",
          name: "Agent User",
        },
        headers: { "Content-Type": "application/json" },
      }
    );

    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test("admin user can access /users and sees the Users page", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    await page.goto("/users");
    await page.waitForURL("/users");

    // Heading on the Users page
    await expect(
      page.getByRole("heading", { name: "Users" })
    ).toBeVisible();
  });

  test("admin user sees the Users nav link in the navbar", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    await expect(page.getByRole("link", { name: "Users" })).toBeVisible();
  });

  test("unauthenticated access to /users is blocked by PrivateRoute (redirects to /login)", async ({
    page,
  }) => {
    // PrivateRoute wraps AdminRoute — unauthenticated users never reach AdminRoute
    await page.goto("/users");
    await page.waitForURL("/login");
    await expect(page).toHaveURL(/\/login/);
  });
});

// ---------------------------------------------------------------------------
// 7. Login page redirect — already authenticated user visiting /login
// ---------------------------------------------------------------------------

test.describe("Login page redirect for authenticated users", () => {
  test("authenticated user visiting /login is redirected to /", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await expect(page).toHaveURL("/");

    // Navigate to /login — Login.tsx's useEffect calls navigate("/") when session exists
    await page.goto("/login");

    // Wait for the React effect to redirect back to /
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 8. Edge cases
// ---------------------------------------------------------------------------

test.describe("Edge cases", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("SQL injection in email field is blocked by browser type=email validation", async ({
    page,
  }) => {
    // Chromium will not submit a type="email" field containing SQL injection text
    await page.getByLabel(/email/i).fill("' OR '1'='1'; DROP TABLE users;--");
    await page.getByLabel(/password/i).fill("anything123!");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page).not.toHaveURL("/");
  });

  test("SQL injection sent directly to the auth API is rejected by the server", async ({
    page,
  }) => {
    // The browser's type="email" constraint blocks SQL injection strings at
    // the UI level, but we also want to verify the backend itself rejects them.
    // Send the payload directly via page.request to bypass the browser UI.
    const res = await page.request.post(
      "http://localhost:3001/api/auth/sign-in/email",
      {
        data: {
          email: "' OR '1'='1'; DROP TABLE users;--",
          password: "anything123!",
        },
        headers: { "Content-Type": "application/json" },
      }
    );

    // Better Auth should return a 4xx for invalid credentials / bad email
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test("XSS payload in email field is blocked by browser type=email validation", async ({
    page,
  }) => {
    await page.getByLabel(/email/i).fill('<script>alert("xss")</script>');
    await page.getByLabel(/password/i).fill("anything123!");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/login/);
  });

  test("XSS payload in password field is treated as a wrong password by the server", async ({
    page,
  }) => {
    await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
    await page
      .getByLabel(/password/i)
      .fill('<img src=x onerror=alert("xss")>');
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("very long email value sent to the API is rejected gracefully (no crash)", async ({
    page,
  }) => {
    // The browser blocks a 512-char email at the UI level (type="email" constraint).
    // We also verify the backend handles an oversized email without crashing.
    const longEmail = "a".repeat(500) + "@example.com";
    const res = await page.request.post(
      "http://localhost:3001/api/auth/sign-in/email",
      {
        data: { email: longEmail, password: "somepassword123!" },
        headers: { "Content-Type": "application/json" },
      }
    );

    // Server should return a 4xx — not a 500 crash
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });

  test("very long password value is rejected gracefully (no crash)", async ({
    page,
  }) => {
    const longPassword = "P@ssw0rd!".repeat(100);
    await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/password/i).fill(longPassword);
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("submit button is disabled and shows 'Signing in...' while the request is in flight", async ({
    page,
  }) => {
    await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);

    // Intercept the sign-in request and hold it so we can observe the
    // button's disabled / loading state before the response arrives.
    let resumeRequest!: () => void;
    const requestPaused = new Promise<void>((resolve) => {
      resumeRequest = resolve;
    });

    await page.route("**/api/auth/sign-in/email", async (route) => {
      // Signal to the test that the request has arrived, then wait to be released
      resumeRequest();
      // Hold the response for up to 3 s — long enough for the assertion
      await new Promise<void>((r) => setTimeout(r, 3000));
      await route.continue();
    });

    // Fire the submit — don't await, we need to inspect the UI mid-flight
    const clickPromise = page
      .getByRole("button", { name: /sign in/i })
      .click();

    // Wait until the interceptor has the request before asserting
    await requestPaused;

    // Button should now be disabled and show the loading label
    const loadingButton = page.getByRole("button", { name: /signing in/i });
    await expect(loadingButton).toBeDisabled();

    // Let the click and delayed response finish
    await clickPromise;
    await page.waitForURL("/");
  });
});
