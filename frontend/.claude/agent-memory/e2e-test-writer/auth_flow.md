---
name: Auth flow and admin credentials
description: Admin login steps for E2E tests, credential source, and why serial mode is needed for auth tests
type: project
---

Admin credentials (from backend/.env.test and global-setup.ts):
- Email: admin@example.com
- Password: password321!

Login helper pattern used across spec files:
```typescript
async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
  await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("/");
}
```

**Why:** Auth test files must use `test.describe.configure({ mode: "serial" })` at the top level because Better Auth's in-memory rate limiter rejects concurrent login requests from the same IP, causing spurious failures in parallel workers.

**How to apply:** Any describe block that performs multiple logins should be serial. Pure API tests (no browser login) can run in parallel safely.
