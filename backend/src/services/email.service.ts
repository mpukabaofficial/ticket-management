import resend, { SUPPORT_FROM } from "../config/resend";

export async function sendReplyEmail(
  to: string,
  subject: string,
  body: string,
) {
  const { error } = await resend.emails.send({
    from: SUPPORT_FROM,
    to: [to],
    subject: `Re: ${subject}`,
    text: body,
  });

  if (error) {
    console.error("Failed to send reply email:", error);
  }
}
