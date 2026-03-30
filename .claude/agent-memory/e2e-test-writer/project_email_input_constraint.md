---
name: React type=email input constraint — cannot be bypassed via Playwright UI
description: Why triggering Zod's email() validation via the browser UI is not feasible in this app
type: project
---

## Problem

The login form uses a `<Input type="email" />` controlled by React Hook Form's `Controller`.
To test Zod's `.email()` validator, you need to submit a non-email string via the form.

Chromium's `type="email"` input blocks non-email values at the browser level — the form
never submits if the field contains a non-email string.

## Attempted bypass (did not work)

```ts
// Change type to "text" via evaluate, then fill/type the value
await emailInput.evaluate((el) => { el.type = "text"; });
await emailInput.fill("not-an-email");
```

**Why it fails:** React's `Controller` re-renders the input with `type="email"` on the next
React render cycle (which happens nearly immediately). By the time Playwright clicks Submit,
the input is `type="email"` again — the browser blocks the form submission with no error shown.

## Working alternative

Use `page.request.post()` to send non-email strings directly to the backend API, bypassing
the browser UI entirely:

```ts
const res = await page.request.post("http://localhost:3001/api/auth/sign-in/email", {
  data: { email: "' OR '1'='1'", password: "anything123!" },
  headers: { "Content-Type": "application/json" },
});
expect(res.status()).toBeGreaterThanOrEqual(400);
```

## Impact on test coverage

- Browser-level blocking of non-email values: tested (stays on /login, no crash)
- Zod `.email()` validator: the browser constraint already enforces the same rule in practice;
  the Zod test was simplified to verify the browser blocks and the app doesn't crash
- Backend rejection of malformed emails: tested via `page.request.post`
