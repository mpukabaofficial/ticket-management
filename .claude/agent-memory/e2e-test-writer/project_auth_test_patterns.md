---
name: Auth test patterns and selectors
description: Selectors, login helper, and known constraints for auth E2E tests in this app
type: project
---

## Admin credentials
- Email: `admin@example.com`
- Password: `password321!`
- Source: `backend/.env.test` (ADMIN_EMAIL / ADMIN_PASSWORD)
- Seeded by global-setup.ts via `backend/prisma/seed.ts`

## Login helper
```ts
async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
  await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("/");
}
```

## Key selectors
- Email input: `page.getByLabel(/email/i)` — `id="email"` linked to `<FieldLabel htmlFor="email">`
- Password input: `page.getByLabel(/password/i)`
- Submit button: `page.getByRole("button", { name: /sign in/i })`
- Loading button: `page.getByRole("button", { name: /signing in/i })`
- Sign out button: `page.getByRole("button", { name: /sign out/i })`
- Card title (NOT a heading — it's a `<div data-slot="card-title">`):
  `page.locator('[data-slot="card-title"]', { hasText: "Sign in" })`
- Server error alert: `page.getByRole("alert")`
- Dashboard heading: `page.getByRole("heading", { name: "Dashboard" })` — real `<h1>`
- Users heading: `page.getByRole("heading", { name: "Users" })` — real `<h1>` (not nav link)
- Nav links: `page.getByRole("link", { name: "Dashboard" })`, `page.getByRole("link", { name: "Users" })`

## Serial mode requirement
ALL auth tests run with `test.describe.configure({ mode: "serial" })` at the file top level.
**Why:** Better Auth's in-memory rate limiter fires after 3 sign-in requests in 10 seconds for the
`/sign-in/*` path. Parallel workers exceed this limit immediately.

## Known constraint: type="email" cannot be bypassed via UI
Chromium's `type="email"` input blocks non-email strings at the browser level. React's `Controller`
re-renders the input from `type="text"` back to `type="email"` after any evaluate() type change, so
Zod's `.email()` validator cannot be triggered via Playwright's UI simulation. Use `page.request.post`
to send malformed emails directly to the backend API instead.

## Routes structure
```
/login       → public, Login page
/            → PrivateRoute → Dashboard
/users       → PrivateRoute → AdminRoute → Users (ADMIN only)
*            → PrivateRoute → NotFound
```

## Route guard behavior
- `PrivateRoute`: if no session → `<Navigate to="/login" replace />`
- `AdminRoute`: if `session.user.role !== "ADMIN"` → `<Navigate to="/" replace />`
- `Login.tsx`: `useEffect` → if session → `navigate("/", { replace: true })`
