import { describe, it, expect } from "vitest";
import { inboundEmailSchema } from "shared";

describe("inboundEmailSchema", () => {
  const validInput = {
    from: "student@example.com",
    senderName: "Jane Doe",
    subject: "Cannot access course",
    body: "I need help accessing my course materials.",
  };

  it("accepts valid input", () => {
    const result = inboundEmailSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("normalizes email to lowercase", () => {
    const result = inboundEmailSchema.safeParse({
      ...validInput,
      from: "Student@Example.COM",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.from).toBe("student@example.com");
    }
  });

  it("trims whitespace from string fields", () => {
    const result = inboundEmailSchema.safeParse({
      ...validInput,
      senderName: "  Jane Doe  ",
      subject: "  Help  ",
      body: "  I need help  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.senderName).toBe("Jane Doe");
      expect(result.data.subject).toBe("Help");
      expect(result.data.body).toBe("I need help");
    }
  });

  it("rejects whitespace-only strings after trimming", () => {
    const result = inboundEmailSchema.safeParse({
      ...validInput,
      subject: "   ",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = inboundEmailSchema.safeParse({
      ...validInput,
      from: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty sender name", () => {
    const result = inboundEmailSchema.safeParse({
      ...validInput,
      senderName: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty subject", () => {
    const result = inboundEmailSchema.safeParse({
      ...validInput,
      subject: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty body", () => {
    const result = inboundEmailSchema.safeParse({
      ...validInput,
      body: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects sender name exceeding max length", () => {
    const result = inboundEmailSchema.safeParse({
      ...validInput,
      senderName: "a".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("rejects subject exceeding max length", () => {
    const result = inboundEmailSchema.safeParse({
      ...validInput,
      subject: "a".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("rejects body exceeding max length", () => {
    const result = inboundEmailSchema.safeParse({
      ...validInput,
      body: "a".repeat(50001),
    });
    expect(result.success).toBe(false);
  });

  it("accepts fields at exact max length", () => {
    const result = inboundEmailSchema.safeParse({
      ...validInput,
      senderName: "a".repeat(200),
      subject: "a".repeat(500),
      body: "a".repeat(50000),
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing fields", () => {
    const result = inboundEmailSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
