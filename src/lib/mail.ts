import nodemailer from "nodemailer";
import path from "path";
import type { Transporter } from "nodemailer";

// Lazily built and cached on first use — most requests never send an email, so there's no
// reason to connect on every cold start. Reads straight from process.env, same convention as
// lib/auth.ts's JWT_SECRET, rather than going through lib/appSettings.ts (that file only holds
// the NEXT_PUBLIC_* vars exposed to the browser).
let transporter: Transporter | null | undefined;

function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  if (!host || !user) {
    transporter = null;
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: (process.env.SMTP_SECURE ?? "false").toLowerCase() === "true",
    auth: { user, pass: process.env.SMTP_PASSWORD },
  });
  return transporter;
}

export const MAIL_FROM_NAME = process.env.SMTP_FROM_NAME || "WebRealtor";
export const MAIL_FROM_EMAIL = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || "";

interface SendMailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Best-effort — see CLAUDE.md → "Registration": a failed/unconfigured send must never break
 * the flow it rides along with, same discipline as LogEntryService/PriceHistoryService. Returns
 * whether the email actually went out, so callers can log the distinction without throwing.
 */
export async function sendMail({ to, subject, html }: SendMailParams): Promise<boolean> {
  const client = getTransporter();
  if (!client) {
    console.warn(`[mail] SMTP not configured — skipping email to ${to}: "${subject}"`);
    return false;
  }

  try {
    await client.sendMail({
      from: `"${MAIL_FROM_NAME}" <${MAIL_FROM_EMAIL}>`,
      to,
      subject,
      html,
      attachments: [
        {
          filename: "webrealtor-logo.png",
          path: path.join(process.cwd(), "assets", "img", "webrealtor-logo.png"),
          cid: "webrealtor-logo",
        },
      ],
    });
    return true;
  } catch (error) {
    console.error(`[mail] Failed to send email to ${to}`, error);
    return false;
  }
}
