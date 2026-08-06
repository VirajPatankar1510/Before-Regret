// Calls Resend's plain REST API directly rather than pulling in their SDK. This repo has a
// package-lock.json and no local npm/node available to regenerate it correctly -- adding a new
// dependency by hand-editing package.json without a matching lockfile update risks Vercel's
// `npm ci` failing on the *entire* deploy over a lockfile mismatch, not just this feature. Resend's
// send-email endpoint is a single POST with a JSON body, so a dependency isn't worth that risk.
// Verified against https://resend.com/docs/api-reference/emails/send-email.

export interface SendEmailInput {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

export async function sendEmailViaResend(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'RESEND_API_KEY is not set.' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: input.from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        reply_to: input.replyTo,
      }),
    });

    const body = await res.json().catch(() => null);

    if (!res.ok) {
      const message = (body && (body.message || body.error)) || `HTTP ${res.status}`;
      return { success: false, error: String(message) };
    }

    return { success: true, id: body?.id };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error calling Resend.' };
  }
}
