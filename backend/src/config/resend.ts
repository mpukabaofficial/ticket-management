import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export const SUPPORT_EMAIL = "support@verzibiz.com";
export const SUPPORT_FROM = `Code with Mosh <${SUPPORT_EMAIL}>`;

export default resend;
