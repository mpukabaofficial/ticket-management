---
name: API-only test pattern with Playwright request fixture
description: How to write backend API tests using Playwright's built-in request fixture without a browser page
type: project
---

For endpoints that don't need a browser UI (webhooks, JSON APIs), use the `request` fixture directly:

```typescript
test("creates a ticket", async ({ request }) => {
  const res = await request.post("http://localhost:3001/api/tickets/email", {
    data: { from: "...", senderName: "...", subject: "...", body: "..." },
  });
  expect(res.status()).toBe(201);
  const json = await res.json();
  expect(json).toHaveProperty("ticket");
});
```

Key points:
- Use `request.post/get/put/delete` — no `page` needed.
- Must use the full absolute URL (not the baseURL shorthand) because baseURL is the frontend port (5174), not the backend.
- Validation error responses return `{ error: "message1, message2" }` (messages joined with ", ") from the shared `validate()` helper.
- Tests that each use unique senderEmail/subject can run in parallel with no isolation concerns.

**How to apply:** Prefer this pattern for all webhook/API E2E tests. Only add `page` when you need to verify browser UI behavior.
