import nodemailer from 'nodemailer';
import { withDb, isDbConfigured } from './db.js';

// Emails a signed-in requester the permalink to the report they just generated, from
// hello@beforeregret.com via GoDaddy's SMTP relay.
//
// FIRE-AND-FORGET, and never throws. Same convention as submitUrlsToIndexNow, triggerRedeploy and
// logAiCrawlerVisit: the report has already been generated and returned to the browser by the time
// this runs, and the web permalink is the real delivery mechanism. A mail failure must never turn a
// successful report into an error the reader sees.
//
// WHY GODADDY SMTP AND WHAT IT COSTS. The domain's DNS already authorises exactly one sender:
//
//     SPF    v=spf1 include:secureserver.net -all
//     DMARC  v=DMARC1; p=quarantine
//
// The `-all` is a hard fail and DMARC quarantines what fails, so mail sent as
// hello@beforeregret.com from anywhere other than GoDaddy lands in spam until SPF is widened and
// DKIM is added. Sending through GoDaddy's own relay needs no DNS change at all, which is why it
// was chosen. The trade is real and worth remembering: GoDaddy Professional Email is a human
// mailbox, so expect a daily send cap in the low hundreds, no bounce webhooks, no delivery
// dashboard, and no per-message status beyond "the SMTP server accepted it". If report volume ever
// grows past a few dozen a day, this is the piece to replace with a transactional provider.
//
// The mailbox password lives in SMTP_PASSWORD and is never logged, never returned in a response,
// and never sent to the client.

const SMTP_HOST = process.env.SMTP_HOST || 'smtpout.secureserver.net';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);
const SMTP_USER = process.env.SMTP_USER || 'hello@beforeregret.com';
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const FROM_NAME = process.env.SMTP_FROM_NAME || 'Before Regret';
const SITE = 'https://www.beforeregret.com';

/**
 * True only when a password is actually present. Everything below no-ops without it, so the
 * feature can ship, deploy and be code-reviewed before the mailbox credential exists -- and so a
 * local dev run never tries to send real mail.
 */
export function isReportEmailConfigured(): boolean {
  return Boolean(SMTP_PASSWORD);
}

let transporter: nodemailer.Transporter | null = null;
function getTransport(): nodemailer.Transporter | null {
  if (!isReportEmailConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      // 465 is implicit TLS; 587 upgrades via STARTTLS. GoDaddy serves both.
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    });
  }
  return transporter;
}

/**
 * Resolve a Clerk user's primary email address. Returns null rather than throwing for every
 * failure mode -- no Clerk key configured, user deleted, network error -- because a missing
 * address just means this report doesn't get emailed, which is a degraded outcome and not an error.
 */
export async function lookupClerkEmail(clerkUserId: string | null): Promise<string | null> {
  if (!clerkUserId || !process.env.CLERK_SECRET_KEY) return null;
  try {
    const { createClerkClient } = await import('@clerk/backend');
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
    const user = await clerk.users.getUser(clerkUserId);
    const primaryId = user.primaryEmailAddressId;
    const match = user.emailAddresses.find((e: any) => e.id === primaryId) || user.emailAddresses[0];
    return match?.emailAddress || null;
  } catch (err: any) {
    console.warn('[report-email] Could not resolve Clerk email:', err?.message || err);
    return null;
  }
}

/**
 * Proves the SMTP credential actually works, without sending anything.
 *
 * nodemailer's verify() opens the connection and completes the AUTH handshake, then stops. That
 * distinguishes the three states this feature can be in, which are otherwise indistinguishable
 * from outside: not configured at all, configured with a credential the server rejects, and
 * genuinely working. A Vercel env var also only takes effect on a REDEPLOY, so "I added the
 * password" and "the running code can see the password" are separate facts -- this reports the
 * second one.
 *
 * Never throws, and never returns the password or any part of it.
 */
export async function verifyReportEmailTransport(): Promise<{
  configured: boolean;
  host: string;
  port: number;
  user: string;
  connectionOk: boolean;
  error?: string;
}> {
  const base = { configured: isReportEmailConfigured(), host: SMTP_HOST, port: SMTP_PORT, user: SMTP_USER };
  const transport = getTransport();
  if (!transport) return { ...base, connectionOk: false, error: 'SMTP_PASSWORD is not set in this environment.' };
  try {
    await transport.verify();
    return { ...base, connectionOk: true };
  } catch (err: any) {
    return { ...base, connectionOk: false, error: String(err?.message || err).slice(0, 300) };
  }
}

function buildEmail(reportId: string, address: string) {
  const url = `${SITE}/insights/${reportId}`;
  const subject = `Your property research for ${address}`;
  // Plain text is written first and sent as a real alternative, not an afterthought -- a
  // text-only client should get the link, not an empty message.
  const text = [
    `Here's the research checklist you generated for:`,
    address,
    ``,
    url,
    ``,
    `What's in it: the checks that actually matter for a home of this age and county, the`,
    `questions worth asking the seller, and where the public records live so you can verify`,
    `them yourself.`,
    ``,
    `Two things we want to be straight about. The seismic hazard check and the address`,
    `validation are live lookups run for this specific address. Everything else is a curated`,
    `link to the official government source, clearly labelled as not independently verified`,
    `until you open it and check. And this is research, not a home inspection -- confirm`,
    `anything that matters with a licensed professional before you rely on it.`,
    ``,
    `Questions or something looks wrong? Reply to this email.`,
    ``,
    `Before Regret`,
    SITE,
  ].join('\n');

  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f4f6f8;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #d9e0e7;border-radius:6px;">
<tr><td style="padding:28px 28px 8px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
<div style="font-size:13px;font-weight:700;color:#2563eb;letter-spacing:.04em;">BEFORE REGRET</div>
<h1 style="margin:14px 0 6px;font-size:21px;line-height:1.25;color:#10161d;">Your property research is ready</h1>
<p style="margin:0 0 20px;font-size:15px;color:#47555f;">${escapeHtml(address)}</p>
<a href="${url}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 22px;border-radius:6px;">Open your report</a>
<p style="margin:18px 0 0;font-size:13px;color:#6d7b86;word-break:break-all;">${url}</p>
</td></tr>
<tr><td style="padding:20px 28px 28px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:13px;line-height:1.6;color:#47555f;border-top:1px solid #e8edf1;">
<p style="margin:16px 0 0;">The seismic hazard check and address validation are live lookups run for this specific address. Everything else is a curated link to the official government source, clearly labelled as not independently verified until you open it and check.</p>
<p style="margin:12px 0 0;">This is research, not a home inspection. Confirm anything that matters with a licensed professional before you rely on it.</p>
<p style="margin:16px 0 0;color:#6d7b86;">Something look wrong? Reply to this email and a person will read it.</p>
</td></tr>
</table>
</td></tr></table></body></html>`;

  return { subject, text, html, url };
}

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string
  ));
}

/**
 * Send the report permalink, and record on the report row that it went (or that we had no address).
 * Never throws. Returns nothing the caller is expected to act on.
 */
export async function sendReportEmail(opts: {
  reportId: string;
  clerkUserId: string | null;
  formattedAddress: string;
}): Promise<void> {
  const { reportId, clerkUserId, formattedAddress } = opts;
  try {
    const to = await lookupClerkEmail(clerkUserId);
    if (!to) return; // Signed-out or unresolvable: the web permalink is still the delivery.

    // Stored regardless of whether the send succeeds, so a later "re-send my report" support
    // request has an address to work from -- the single most likely follow-up, and one that
    // fetching from Clerk at that point cannot answer if the account has since changed.
    if (isDbConfigured()) {
      await withDb((sql) => sql`
        UPDATE generated_reports SET recipient_email = ${to} WHERE report_id = ${reportId}
      `).catch(() => { /* audit only; never block the send on it */ });
    }

    const transport = getTransport();
    if (!transport) {
      // Said out loud rather than returning silently. The lesson is deployHookService.ts's: a
      // silent no-op here cost a 15-minute controlled experiment to diagnose, because there was no
      // way to tell "not configured" from "sent and lost" from outside.
      console.log(`[report-email] SMTP_PASSWORD not set -- skipping email for ${reportId}`);
      return;
    }

    const { subject, text, html } = buildEmail(reportId, formattedAddress);
    await transport.sendMail({
      from: `"${FROM_NAME}" <${SMTP_USER}>`,
      to,
      subject,
      text,
      html,
      replyTo: SMTP_USER,
    });
    await withDb((sql) => sql`
      UPDATE generated_reports SET report_emailed_at = now() WHERE report_id = ${reportId}
    `).catch(() => {});
    console.log(`[report-email] Sent report ${reportId}`);
  } catch (err: any) {
    // Never rethrow. The report exists and its permalink works; a mail failure is a degraded
    // outcome, not a failed request.
    console.error(`[report-email] Failed to send report ${reportId}:`, err?.message || err);
  }
}
