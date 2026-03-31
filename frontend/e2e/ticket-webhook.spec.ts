/**
 * E2E tests for the ticket email webhook endpoint.
 *
 * POST /api/tickets/email is a public endpoint (no auth required) used by the
 * inbound-email provider to create tickets.  All tests hit the backend API
 * directly via Playwright's APIRequestContext — no browser UI involved.
 *
 * The backend runs on http://localhost:3001 during E2E tests (see
 * playwright.config.ts).  The test database is migrated and seeded by
 * global-setup.ts and truncated by global-teardown.ts.
 *
 * Tests run in parallel (default) because every test uses a unique
 * senderEmail/subject combination, so they cannot interfere with each other
 * through the duplicate-detection window.
 */

import { test, expect } from "@playwright/test";

const WEBHOOK_URL = "http://localhost:3001/api/tickets/email";

/** Minimal valid payload that satisfies inboundEmailSchema. */
const VALID_PAYLOAD = {
  from: "student@example.com",
  senderName: "Jane Doe",
  subject: "Cannot access course",
  body: "I need help accessing the course material.",
};

// ---------------------------------------------------------------------------
// 1. Happy path
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
    expect(ticket.status).toBe("OPEN");
    expect(ticket.category).toBeNull();
    expect(ticket.senderEmail).toBe("happypath@example.com");
    expect(ticket.senderName).toBe("Happy Student");
    expect(ticket.subject).toBe("Happy path test subject");
    expect(ticket.body).toBe("This is the message body.");
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
// 2. Email normalisation — uppercase input is stored lowercase
// ---------------------------------------------------------------------------

test.describe("POST /api/tickets/email — email normalisation", () => {
  test("stores the sender email in lowercase even when submitted in uppercase", async ({
    request,
  }) => {
    const res = await request.post(WEBHOOK_URL, {
      data: {
        from: "UPPER@EXAMPLE.COM",
        senderName: "Upper Case Student",
        subject: "Email case normalisation test",
        body: "Testing that the email is lowercased.",
      },
    });

    expect(res.status()).toBe(201);

    const { ticket } = await res.json();
    expect(ticket.senderEmail).toBe("upper@example.com");
  });

  test("mixed-case email is normalised to all-lowercase", async ({
    request,
  }) => {
    const res = await request.post(WEBHOOK_URL, {
      data: {
        from: "MixedCase@Example.Com",
        senderName: "Mixed Case Student",
        subject: "Mixed case email test",
        body: "Testing mixed case normalisation.",
      },
    });

    expect(res.status()).toBe(201);

    const { ticket } = await res.json();
    expect(ticket.senderEmail).toBe("mixedcase@example.com");
  });
});

// ---------------------------------------------------------------------------
// 3. Trimming — whitespace around fields is stripped
// ---------------------------------------------------------------------------

test.describe("POST /api/tickets/email — whitespace trimming", () => {
  test("leading and trailing whitespace is stripped from senderName", async ({
    request,
  }) => {
    const res = await request.post(WEBHOOK_URL, {
      data: {
        from: "trimtest@example.com",
        senderName: "  Jane Doe  ",
        subject: "Trim test for senderName",
        body: "Body content.",
      },
    });

    expect(res.status()).toBe(201);

    const { ticket } = await res.json();
    expect(ticket.senderName).toBe("Jane Doe");
  });

  test("leading and trailing whitespace is stripped from subject", async ({
    request,
  }) => {
    const res = await request.post(WEBHOOK_URL, {
      data: {
        from: "trimsubject@example.com",
        senderName: "Student",
        subject: "  My subject with spaces  ",
        body: "Body content.",
      },
    });

    expect(res.status()).toBe(201);

    const { ticket } = await res.json();
    expect(ticket.subject).toBe("My subject with spaces");
  });

  test("leading and trailing whitespace is stripped from body", async ({
    request,
  }) => {
    const res = await request.post(WEBHOOK_URL, {
      data: {
        from: "trimbody@example.com",
        senderName: "Student",
        subject: "Trim test for body",
        body: "  Body with surrounding whitespace  ",
      },
    });

    expect(res.status()).toBe(201);

    const { ticket } = await res.json();
    expect(ticket.body).toBe("Body with surrounding whitespace");
  });
});

// ---------------------------------------------------------------------------
// 4. Duplicate detection — same senderEmail + subject within 5 minutes → 409
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

    // First request — should succeed
    const first = await request.post(WEBHOOK_URL, { data: payload });
    expect(first.status()).toBe(201);

    // Second request with the same from + subject — should be rejected
    const second = await request.post(WEBHOOK_URL, {
      data: { ...payload, body: "Second submission with same subject." },
    });
    expect(second.status()).toBe(409);

    const json = await second.json();
    expect(json).toHaveProperty("error");
    expect(typeof json.error).toBe("string");
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

// ---------------------------------------------------------------------------
// 5. Validation errors — missing fields
// ---------------------------------------------------------------------------

test.describe("POST /api/tickets/email — missing required fields", () => {
  test("returns 400 when 'from' is missing", async ({ request }) => {
    const { from: _omitted, ...rest } = VALID_PAYLOAD;
    const res = await request.post(WEBHOOK_URL, { data: rest });

    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json).toHaveProperty("error");
  });

  test("returns 400 when 'senderName' is missing", async ({ request }) => {
    const { senderName: _omitted, ...rest } = VALID_PAYLOAD;
    const res = await request.post(WEBHOOK_URL, { data: rest });

    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json).toHaveProperty("error");
  });

  test("returns 400 when 'subject' is missing", async ({ request }) => {
    const { subject: _omitted, ...rest } = VALID_PAYLOAD;
    const res = await request.post(WEBHOOK_URL, { data: rest });

    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json).toHaveProperty("error");
  });

  test("returns 400 when 'body' is missing", async ({ request }) => {
    const { body: _omitted, ...rest } = VALID_PAYLOAD;
    const res = await request.post(WEBHOOK_URL, { data: rest });

    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json).toHaveProperty("error");
  });

  test("returns 400 when the entire request body is empty", async ({
    request,
  }) => {
    const res = await request.post(WEBHOOK_URL, { data: {} });

    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json).toHaveProperty("error");
  });
});

// ---------------------------------------------------------------------------
// 6. Validation errors — invalid email
// ---------------------------------------------------------------------------

test.describe("POST /api/tickets/email — invalid email", () => {
  test("returns 400 for a plainly invalid email address", async ({
    request,
  }) => {
    const res = await request.post(WEBHOOK_URL, {
      data: { ...VALID_PAYLOAD, from: "not-an-email" },
    });

    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json).toHaveProperty("error");
  });

  test("returns 400 for an email missing the domain part", async ({
    request,
  }) => {
    const res = await request.post(WEBHOOK_URL, {
      data: { ...VALID_PAYLOAD, from: "student@" },
    });

    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json).toHaveProperty("error");
  });

  test("returns 400 for an email missing the @ symbol", async ({
    request,
  }) => {
    const res = await request.post(WEBHOOK_URL, {
      data: { ...VALID_PAYLOAD, from: "studentexample.com" },
    });

    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json).toHaveProperty("error");
  });
});

// ---------------------------------------------------------------------------
// 7. Validation errors — empty strings (whitespace-only after trimming)
// ---------------------------------------------------------------------------

test.describe("POST /api/tickets/email — empty strings after trimming", () => {
  test("returns 400 when senderName is only whitespace", async ({
    request,
  }) => {
    const res = await request.post(WEBHOOK_URL, {
      data: { ...VALID_PAYLOAD, senderName: "   " },
    });

    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json).toHaveProperty("error");
  });

  test("returns 400 when subject is only whitespace", async ({ request }) => {
    const res = await request.post(WEBHOOK_URL, {
      data: { ...VALID_PAYLOAD, subject: "   " },
    });

    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json).toHaveProperty("error");
  });

  test("returns 400 when body is only whitespace", async ({ request }) => {
    const res = await request.post(WEBHOOK_URL, {
      data: { ...VALID_PAYLOAD, body: "   " },
    });

    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json).toHaveProperty("error");
  });
});

// ---------------------------------------------------------------------------
// 8. Validation errors — fields exceeding maximum length
// ---------------------------------------------------------------------------

test.describe("POST /api/tickets/email — maximum field length", () => {
  test("returns 400 when subject exceeds 500 characters", async ({
    request,
  }) => {
    const res = await request.post(WEBHOOK_URL, {
      data: { ...VALID_PAYLOAD, subject: "A".repeat(501) },
    });

    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json).toHaveProperty("error");
    expect(json.error).toMatch(/subject too long/i);
  });

  test("returns 400 when body exceeds 50,000 characters", async ({
    request,
  }) => {
    const res = await request.post(WEBHOOK_URL, {
      data: { ...VALID_PAYLOAD, body: "B".repeat(50001) },
    });

    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json).toHaveProperty("error");
    expect(json.error).toMatch(/body too long/i);
  });

  test("returns 400 when senderName exceeds 200 characters", async ({
    request,
  }) => {
    const res = await request.post(WEBHOOK_URL, {
      data: { ...VALID_PAYLOAD, senderName: "N".repeat(201) },
    });

    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json).toHaveProperty("error");
    expect(json.error).toMatch(/sender name too long/i);
  });

  test("accepts a subject of exactly 500 characters (boundary)", async ({
    request,
  }) => {
    const res = await request.post(WEBHOOK_URL, {
      data: {
        from: "boundary500@example.com",
        senderName: "Boundary Student",
        subject: "S".repeat(500),
        body: "Body content.",
      },
    });

    expect(res.status()).toBe(201);
  });

  test("accepts a body of exactly 50,000 characters (boundary)", async ({
    request,
  }) => {
    const res = await request.post(WEBHOOK_URL, {
      data: {
        from: "boundary50000@example.com",
        senderName: "Boundary Student",
        subject: "Boundary body test",
        body: "B".repeat(50000),
      },
    });

    expect(res.status()).toBe(201);
  });

  test("accepts a senderName of exactly 200 characters (boundary)", async ({
    request,
  }) => {
    const res = await request.post(WEBHOOK_URL, {
      data: {
        from: "boundaryname@example.com",
        senderName: "N".repeat(200),
        subject: "Boundary senderName test",
        body: "Body content.",
      },
    });

    expect(res.status()).toBe(201);
  });
});
