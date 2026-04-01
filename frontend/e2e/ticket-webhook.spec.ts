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
// 2. Reply threading — same senderEmail + subject on open ticket → threads reply
// ---------------------------------------------------------------------------

test.describe("POST /api/tickets/email — reply threading", () => {
  test("threads a reply onto the existing open ticket when same sender and subject are submitted again", async ({
    request,
  }) => {
    const payload = {
      from: "threading@example.com",
      senderName: "Threading Student",
      subject: "Threading test subject",
      body: "First submission.",
    };

    const first = await request.post(WEBHOOK_URL, { data: payload });
    expect(first.status()).toBe(201);
    const { ticket: originalTicket } = await first.json();
    expect(originalTicket.messages).toHaveLength(1);

    const second = await request.post(WEBHOOK_URL, {
      data: { ...payload, body: "Follow-up message." },
    });
    expect(second.status()).toBe(201);

    const { ticket: updatedTicket } = await second.json();
    expect(updatedTicket.id).toBe(originalTicket.id);
    expect(updatedTicket.messages).toHaveLength(2);
    expect(updatedTicket.messages[1].body).toBe("Follow-up message.");
  });

  test("a different subject from the same sender creates a separate ticket", async ({
    request,
  }) => {
    const sender = "newsubject@example.com";

    const first = await request.post(WEBHOOK_URL, {
      data: {
        from: sender,
        senderName: "New Subject Student",
        subject: "First unique subject",
        body: "First ticket body.",
      },
    });
    expect(first.status()).toBe(201);
    const { ticket: firstTicket } = await first.json();

    const second = await request.post(WEBHOOK_URL, {
      data: {
        from: sender,
        senderName: "New Subject Student",
        subject: "Second unique subject",
        body: "Second ticket body.",
      },
    });
    expect(second.status()).toBe(201);
    const { ticket: secondTicket } = await second.json();

    expect(secondTicket.id).not.toBe(firstTicket.id);
  });

  test("reply threading strips Re:/Fwd: prefixes to match the original subject", async ({
    request,
  }) => {
    const payload = {
      from: "reprefix@example.com",
      senderName: "Re Prefix Student",
      subject: "Original support question",
      body: "Initial question.",
    };

    const first = await request.post(WEBHOOK_URL, { data: payload });
    expect(first.status()).toBe(201);
    const { ticket: originalTicket } = await first.json();

    const reply = await request.post(WEBHOOK_URL, {
      data: {
        from: "reprefix@example.com",
        senderName: "Re Prefix Student",
        subject: "Re: Original support question",
        body: "Thanks for the help!",
      },
    });
    expect(reply.status()).toBe(201);

    const { ticket: updatedTicket } = await reply.json();
    expect(updatedTicket.id).toBe(originalTicket.id);
    expect(updatedTicket.messages).toHaveLength(2);
  });
});
