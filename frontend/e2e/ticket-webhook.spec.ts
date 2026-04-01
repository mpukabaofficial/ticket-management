/**
 * E2E tests for the ticket email webhook endpoint.
 *
 * POST /api/tickets/email is a public endpoint (no auth required) used by the
 * inbound-email provider to create tickets.  All tests hit the backend API
 * directly via Playwright's APIRequestContext — no browser UI involved.
 *
 * The backend URL is read from BACKEND_URL (see e2e/constants.ts).
 * The test database is migrated and seeded by
 * global-setup.ts and truncated by global-teardown.ts.
 *
 * Schema-level validation (trimming, max length, missing fields, invalid email)
 * is covered by unit tests in Tickets.schema.test.ts.  These E2E tests focus
 * on behaviour that requires a running backend and database.
 */

import { test, expect } from "@playwright/test";
import { BACKEND_URL } from "./constants";

const WEBHOOK_URL = `${BACKEND_URL}/api/tickets/email`;

// ---------------------------------------------------------------------------
// 1. Happy path — full request → DB → response
// ---------------------------------------------------------------------------

test.describe("POST /api/tickets/email — happy path", () => {
  test("creates a ticket and returns 201 with the expected shape", async ({
    request,
  }) => {
    const res = await request.post(WEBHOOK_URL, {
      data: {
        from: "happypath@example.com",
        senderName: "Happy Student",
        subject: "Happy path test subject",
        body: "This is the message body.",
      },
    });

    expect(res.status()).toBe(201);

    const json = await res.json();
    expect(json).toHaveProperty("ticket");

    const { ticket } = json;
    expect(ticket.status).toBe("NEW");
    expect(ticket.category).toBeNull();
    expect(ticket.senderEmail).toBe("happypath@example.com");
    expect(ticket.senderName).toBe("Happy Student");
    expect(ticket.subject).toBe("Happy path test subject");
    expect(ticket.assignedTo).toBeNull();
    expect(ticket.id).toBeGreaterThan(0);
    expect(typeof ticket.createdAt).toBe("string");
  });

  test("creates a ticket with a first message matching the body and senderName", async ({
    request,
  }) => {
    const res = await request.post(WEBHOOK_URL, {
      data: {
        from: "firstmessage@example.com",
        senderName: "Message Student",
        subject: "First message test",
        body: "Please help me with my course.",
      },
    });

    expect(res.status()).toBe(201);

    const { ticket } = await res.json();
    expect(Array.isArray(ticket.messages)).toBe(true);
    expect(ticket.messages).toHaveLength(1);

    const firstMessage = ticket.messages[0];
    expect(firstMessage.body).toBe("Please help me with my course.");
    expect(firstMessage.sender).toBe("Message Student");
    expect(typeof firstMessage.id).toBe("string");
    expect(typeof firstMessage.createdAt).toBe("string");
  });
});

// ---------------------------------------------------------------------------
// 2. Duplicate detection — same senderEmail + subject within 5 minutes → 409
// ---------------------------------------------------------------------------

test.describe("POST /api/tickets/email — duplicate detection", () => {
  test("returns 409 when the same senderEmail and subject are submitted twice within 5 minutes", async ({
    request,
  }) => {
    const payload = {
      from: "duplicate@example.com",
      senderName: "Duplicate Student",
      subject: "Duplicate detection test subject",
      body: "First submission.",
    };

    const first = await request.post(WEBHOOK_URL, { data: payload });
    expect(first.status()).toBe(201);

    const second = await request.post(WEBHOOK_URL, {
      data: { ...payload, body: "Second submission with same subject." },
    });
    expect(second.status()).toBe(409);

    const json = await second.json();
    expect(json).toHaveProperty("error");
    expect(json.error.toLowerCase()).toMatch(/duplicate/i);
  });

  test("a different subject from the same sender is accepted (not a duplicate)", async ({
    request,
  }) => {
    const sender = "notduplicate@example.com";

    const first = await request.post(WEBHOOK_URL, {
      data: {
        from: sender,
        senderName: "Non Duplicate Student",
        subject: "First unique subject",
        body: "First ticket body.",
      },
    });
    expect(first.status()).toBe(201);

    const second = await request.post(WEBHOOK_URL, {
      data: {
        from: sender,
        senderName: "Non Duplicate Student",
        subject: "Second unique subject",
        body: "Second ticket body.",
      },
    });
    expect(second.status()).toBe(201);
  });

  test("the 409 response body contains the duplicate ticket id", async ({
    request,
  }) => {
    const payload = {
      from: "dupid@example.com",
      senderName: "Dup ID Student",
      subject: "Duplicate id subject",
      body: "Original body.",
    };

    const first = await request.post(WEBHOOK_URL, { data: payload });
    expect(first.status()).toBe(201);
    const { ticket: originalTicket } = await first.json();

    const second = await request.post(WEBHOOK_URL, { data: payload });
    expect(second.status()).toBe(409);

    const json = await second.json();
    expect(json.error).toContain(String(originalTicket.id));
  });
});
