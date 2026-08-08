// Branded HTML email templates. Table-based layout with inline styles throughout — email
// clients don't reliably support external/`<style>`-block CSS, so every rule has to travel
// with the element it applies to. The logo is referenced via `cid:webrealtor-logo`, matched to
// the inline attachment lib/mail.ts's sendMail() always includes.

const BRAND_COLOR = "#004261";
const BRAND_BG = "#f1f6fa";
const TEXT_COLOR = "#0f172a";
const MUTED_COLOR = "#64748b";
const FAINT_COLOR = "#94a3b8";

function emailShell(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body style="margin:0; padding:0; background-color:${BRAND_BG}; font-family: Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND_BG}; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <tr>
              <td style="background-color:${BRAND_COLOR}; padding:24px; text-align:center;">
                <img src="cid:webrealtor-logo" alt="WebRealtor" height="32" style="height:32px; width:auto;" />
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px; background-color:${BRAND_BG}; text-align:center;">
                <p style="margin:0; font-size:12px; color:${MUTED_COLOR};">&copy; ${new Date().getFullYear()} WebRealtor. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function registrationConfirmationEmail(confirmUrl: string): { subject: string; html: string } {
  const subject = "Welcome to WebRealtor — confirm your registration";
  const body = `
    <h1 style="margin:0 0 16px; font-size:20px; color:${TEXT_COLOR};">Welcome to WebRealtor</h1>
    <p style="margin:0 0 24px; font-size:14px; line-height:1.6; color:${MUTED_COLOR};">
      Thanks for signing up. Confirm your email to finish setting up your realtor profile and start
      managing your properties, land listings and clients.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
      <tr>
        <td style="background-color:${BRAND_COLOR}; border-radius:8px;">
          <a href="${confirmUrl}" style="display:inline-block; padding:12px 28px; font-size:14px; font-weight:bold; color:#ffffff; text-decoration:none;">
            Confirm Registration
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0; font-size:12px; line-height:1.6; color:${FAINT_COLOR};">
      If the button doesn't work, copy and paste this link into your browser:<br />
      <a href="${confirmUrl}" style="color:${BRAND_COLOR};">${confirmUrl}</a>
    </p>
    <p style="margin:24px 0 0; font-size:12px; color:${FAINT_COLOR};">
      This link expires in 48 hours. If you didn't sign up for WebRealtor, you can safely ignore this email.
    </p>
  `;
  return { subject, html: emailShell(subject, body) };
}
