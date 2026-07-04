import { Resend } from "resend";
import { config } from "../config.js";

let client = null;

function getClient() {
  if (!config.resendApiKey) return null;
  if (!client) client = new Resend(config.resendApiKey);
  return client;
}

/**
 * Sends a 6-digit OTP via Resend (https://resend.com).
 *
 * Setup (free, 2 minutes):
 *   1. Sign up at resend.com
 *   2. API Keys → Create API Key
 *   3. Add to .env:  RESEND_API_KEY=re_xxxxxxxxxxxx
 *
 * No SMTP, no App Password, no 2FA required.
 * Free tier: 3,000 emails/month, 100/day.
 *
 * If RESEND_API_KEY is missing or the send fails, the OTP is printed
 * to the server console so the feature keeps working during development.
 */
export async function sendOTPEmail(to, otp) {
  const resend = getClient();

  if (!resend) {
    consoleFallback(to, otp, "RESEND_API_KEY not set in .env");
    return;
  }

  try {
    const { error } = await resend.emails.send({
      from: "Adaptive Tutor <onboarding@resend.dev>",
      to,
      subject: `${otp} — your Adaptive Tutor verification code`,
      html: `
        <div style="font-family:'Segoe UI',system-ui,sans-serif;max-width:480px;
          margin:0 auto;padding:40px 32px;background:#0A0E1A;
          border-radius:16px;border:1px solid #1E2D40;">
          <p style="margin:0 0 4px;font-size:11px;color:#6366F1;
            letter-spacing:3px;text-transform:uppercase;">Adaptive Tutor</p>
          <h2 style="margin:0 0 20px;font-size:22px;color:#F1F5F9;">
            Verify your email
          </h2>
          <p style="color:#94A3B8;font-size:14px;margin:0 0 24px;line-height:1.6;">
            Enter this code on the registration page.
            It expires in <strong style="color:#E2E8F0;">10 minutes</strong>.
          </p>
          <div style="background:#131929;border:1px solid #1E2D40;border-radius:12px;
            padding:28px;text-align:center;margin:0 0 24px;">
            <span style="font-size:40px;font-family:monospace;letter-spacing:14px;
              color:#6366F1;font-weight:700;">${otp}</span>
          </div>
          <p style="color:#475569;font-size:12px;margin:0;">
            If you didn't request this code, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    if (error) {
      consoleFallback(to, otp, error.message ?? JSON.stringify(error));
    } else {
      console.log(`📬  OTP sent to ${to}`);
    }
  } catch (err) {
    consoleFallback(to, otp, err.message);
  }
}

function consoleFallback(to, otp, reason) {
  console.log(`
┌─────────────────────────────────────────────────┐
│  📬  OTP VERIFICATION CODE  (console fallback)  │
│                                                 │
│  To   : ${to.padEnd(39)}│
│  Code : ${otp.padEnd(39)}│
│                                                 │
│  Reason email skipped:                          │
│  ${reason.slice(0, 47).padEnd(47)}│
└─────────────────────────────────────────────────┘`);
}
