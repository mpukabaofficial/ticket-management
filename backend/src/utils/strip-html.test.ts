import { describe, it, expect } from "bun:test";
import { stripHtml } from "./strip-html";

describe("stripHtml", () => {
  it("returns plain text unchanged", () => {
    expect(stripHtml("Hello world")).toBe("Hello world");
  });

  it("returns empty string for empty input", () => {
    expect(stripHtml("")).toBe("");
  });

  it("decodes common HTML entities", () => {
    expect(stripHtml("a &amp; &lt; &gt; &quot; &#39; &nbsp; b")).toBe(
      'a & < > " \'   b',
    );
  });

  it("handles a full Gmail-style HTML email", () => {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <style>body { font-family: Arial; } .footer { color: #999; }</style>
      </head>
      <body>
        <div dir="ltr">
          <p>Hi Support Team,</p>
          <p>I've been trying to access <strong>Module 3: Advanced Topics</strong>
          since yesterday but keep getting a <em>403 Forbidden</em> error.</p>
          <p>Here's what I've tried:</p>
          <ul>
            <li>Clearing my browser cache</li>
            <li>Trying a different browser (Chrome &amp; Firefox)</li>
            <li>Logging out and back in</li>
          </ul>
          <p>My account email is <a href="mailto:jane@example.com">jane@example.com</a>
          and my student ID is <strong>STU-20345</strong>.</p>
          <p>Thanks,<br>Jane Doe</p>
          <div class="footer">
            <p>--<br>
            Jane Doe | Student<br>
            Phone: (555) 123-4567</p>
          </div>
        </div>
      </body>
      </html>
    `;
    const result = stripHtml(html);

    expect(result).toContain("Hi Support Team,");
    expect(result).toContain("Module 3: Advanced Topics");
    expect(result).toContain("403 Forbidden");
    expect(result).toContain("Clearing my browser cache");
    expect(result).toContain("Trying a different browser (Chrome & Firefox)");
    expect(result).toContain("jane@example.com");
    expect(result).toContain("STU-20345");
    expect(result).toContain("Thanks,\nJane Doe");
    expect(result).toContain("Phone: (555) 123-4567");
    // No HTML tags remain
    expect(result).not.toMatch(/<[a-z]/i);
    // No style block content leaks through
    expect(result).not.toContain("font-family");
    expect(result).not.toContain(".footer");
  });

  it("handles Outlook-style HTML with tables and conditional comments", () => {
    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office">
      <head>
        <!--[if mso]><style>table { border-collapse: collapse; }</style><![endif]-->
      </head>
      <body>
        <table width="600" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 20px; font-family: Calibri, sans-serif;">
              <p>Dear Admin,</p>
              <p>I would like to request a <b>full refund</b> for the course
              &quot;Data Science 101&quot; (Order #RF-8821).</p>
              <p>The reason is that the course content doesn&#39;t match
              what was described on the landing page.</p>
              <table border="1" style="border-collapse:collapse">
                <tr><td><b>Order ID</b></td><td>RF-8821</td></tr>
                <tr><td><b>Amount</b></td><td>$199.00</td></tr>
                <tr><td><b>Date</b></td><td>March 15, 2025</td></tr>
              </table>
              <p>Please process this at your earliest convenience.</p>
              <p>Regards,<br/>
              Bob Smith<br/>
              <a href="mailto:bob@corp.com">bob@corp.com</a></p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
    const result = stripHtml(html);

    expect(result).toContain("Dear Admin,");
    expect(result).toContain('full refund');
    expect(result).toContain('"Data Science 101"');
    expect(result).toContain("Order #RF-8821");
    expect(result).toContain("doesn't match");
    expect(result).toContain("Order ID");
    expect(result).toContain("$199.00");
    expect(result).toContain("March 15, 2025");
    expect(result).toContain("Regards,");
    expect(result).toContain("Bob Smith");
    expect(result).toContain("bob@corp.com");
    expect(result).not.toContain("cellpadding");
    expect(result).not.toContain("mso");
  });

  it("handles deeply nested formatting with links and images", () => {
    const html = `
      <div>
        <h1>Urgent: Cannot Submit Assignment</h1>
        <div class="content">
          <p>When I click the <a href="https://school.com/submit" target="_blank"
            style="color: blue; text-decoration: underline;">Submit</a> button,
            I see this error:</p>
          <blockquote style="border-left: 3px solid #ccc; padding-left: 10px;">
            <p><code>Error 500: Internal Server Error</code></p>
            <p>Request ID: <span class="mono">abc-123-def</span></p>
          </blockquote>
          <p>Screenshot attached: <img src="cid:screenshot001" alt="error screenshot" /></p>
          <p>This is blocking me from completing the course before the
          <strong>March 31st deadline</strong>.</p>
        </div>
      </div>
    `;
    const result = stripHtml(html);

    expect(result).toContain("Urgent: Cannot Submit Assignment");
    expect(result).toContain("Submit button");
    expect(result).toContain("Error 500: Internal Server Error");
    expect(result).toContain("Request ID: abc-123-def");
    expect(result).toContain("March 31st deadline");
    expect(result).not.toMatch(/<[a-z]/i);
    expect(result).not.toContain("cid:");
    expect(result).not.toContain("style=");
  });

  it("handles email with inline CSS, media queries, and script tags", () => {
    const html = `
      <html>
      <head>
        <style>
          @media only screen and (max-width: 600px) {
            .container { width: 100% !important; }
          }
          body { margin: 0; padding: 0; }
        </style>
        <script>alert('xss')</script>
      </head>
      <body>
        <p>Just a quick note &mdash; the payment of &pound;50 was processed.</p>
        <p>Invoice: INV-2025-0042</p>
      </body>
      </html>
    `;
    const result = stripHtml(html);

    expect(result).toContain("the payment of");
    expect(result).toContain("INV-2025-0042");
    expect(result).not.toContain("alert");
    expect(result).not.toContain("script");
    expect(result).not.toContain("@media");
    expect(result).not.toContain("!important");
  });

  it("handles email thread with quoted reply", () => {
    const html = `
      <div>
        <p>Thanks, that fixed it!</p>
        <br>
        <div class="gmail_quote">
          <div dir="ltr" class="gmail_attr">On Mon, Mar 24, 2025 at 2:30 PM
          Support &lt;support@school.com&gt; wrote:<br></div>
          <blockquote style="margin:0px 0px 0px 0.8ex;border-left:1px solid rgb(204,204,204);padding-left:1ex">
            <p>Hi Jane,</p>
            <p>Please try clearing your cache and logging in again.</p>
            <p>Best,<br>Support Team</p>
          </blockquote>
        </div>
      </div>
    `;
    const result = stripHtml(html);

    expect(result).toContain("Thanks, that fixed it!");
    expect(result).toContain("On Mon, Mar 24, 2025");
    expect(result).toContain("support@school.com");
    expect(result).toContain("Please try clearing your cache");
    expect(result).toContain("Best,\nSupport Team");
    // Decoded &lt; is fine — check no actual HTML tags remain
    expect(result).not.toContain("<div");
    expect(result).not.toContain("<blockquote");
    expect(result).not.toContain("gmail_quote");
    expect(result).not.toContain("rgb(");
  });

  it("preserves list items as separate lines", () => {
    const html = `
      <ol>
        <li>Go to Settings</li>
        <li>Click &quot;Reset Password&quot;</li>
        <li>Check your email for the link</li>
      </ol>
    `;
    const result = stripHtml(html);

    expect(result).toContain("Go to Settings");
    expect(result).toContain('"Reset Password"');
    expect(result).toContain("Check your email for the link");
    // Each li closing tag should produce a newline
    expect(result).toContain("Go to Settings\n");
  });

  it("handles malformed / unclosed HTML gracefully", () => {
    const html = `<p>Hello <b>world<p>Second paragraph<br>third line`;
    const result = stripHtml(html);

    expect(result).toContain("Hello");
    expect(result).toContain("world");
    expect(result).toContain("Second paragraph");
    expect(result).toContain("third line");
    expect(result).not.toMatch(/<[a-z]/i);
  });
});
