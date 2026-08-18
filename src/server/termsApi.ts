import type { Express, Request, Response } from 'express';
import { withDb, isDbConfigured } from './db.js';
import { requireVerifiedUser } from './clerkAuth.js';
import { requireAdmin } from './adminAuth.js';
import { TERMS_VERSION } from '../data/legalVersions.js';

// Records a consumer's affirmative acceptance of the Terms of Service.
//
// Deliberately its own endpoint rather than a field bolted onto /api/property/generate-report:
// that route is the highest-traffic path on the site, takes no auth and no user identity at all
// (it is a pure address -> report function), and threading assent through it would mean adding an
// auth requirement to the one endpoint that most needs to stay simple and fast. Acceptance is
// also not one-per-report -- it is one-per-user-per-Terms-revision -- so it does not belong on a
// per-report call in the first place.
//
// The vendor checkouts do NOT use this: they record assent inline on their own order row, where a
// purchase record already exists to carry it. See src/server/db.ts's terms_acceptances comment.

const VALID_CONTEXTS = new Set(['free_report', 'paid_report']);

export function registerTermsRoutes(app: Express) {
  app.post('/api/terms/accept', requireVerifiedUser, async (req: Request, res: Response) => {
    if (!isDbConfigured()) {
      res.status(503).json({ success: false, error: 'Not configured.' });
      return;
    }
    const clerkUserId = req.verifiedUserId as string;
    const context = typeof req.body?.context === 'string' ? req.body.context.trim() : '';
    const userEmail = typeof req.body?.userEmail === 'string' ? req.body.userEmail.trim().slice(0, 320) : null;

    if (!VALID_CONTEXTS.has(context)) {
      res.status(400).json({ success: false, error: 'Invalid acceptance context.' });
      return;
    }

    // The accepted version is taken from the server's own constant, never from the request body.
    // A client-supplied version would let anyone claim they accepted a revision that never
    // existed, or an older, more favourable one -- which would make the whole record worthless as
    // evidence of what text they actually saw.
    try {
      // IP and user-agent are captured as corroborating detail for the acceptance record; the
      // Privacy Policy's "technical session metadata" disclosure names this purpose explicitly.
      // req.ip honours Express's trust-proxy setting, so behind Vercel this is the real client
      // address rather than the proxy's.
      const ip = (req.ip || '').slice(0, 64) || null;
      const userAgent = (req.headers['user-agent'] || '').toString().slice(0, 512) || null;

      // ON CONFLICT DO NOTHING, not an upsert: re-accepting a revision already on file must leave
      // the original accepted_at untouched, since the first acceptance is the date that matters.
      await withDb((sql) => sql`
        INSERT INTO terms_acceptances (clerk_user_id, user_email, terms_version, context, ip_address, user_agent)
        VALUES (${clerkUserId}, ${userEmail}, ${TERMS_VERSION}, ${context}, ${ip}, ${userAgent})
        ON CONFLICT (clerk_user_id, terms_version) DO NOTHING
      `);
      res.json({ success: true, termsVersion: TERMS_VERSION });
    } catch (err: any) {
      // Deliberately non-fatal to the caller's flow. This endpoint exists to create a record, not
      // to gate the product: if the write fails, the user has still been shown the terms and still
      // clicked through, and blocking a paid report over a failed audit-log insert would be a
      // worse outcome than a missing row. The error is logged loudly so the gap is visible.
      console.error('[terms] failed to record acceptance:', err);
      res.status(500).json({ success: false, error: 'Could not record acceptance.' });
    }
  });

  // --- Arbitration opt-out ledger (Terms 7.9) -------------------------------------------------
  //
  // Admin-only by design, and deliberately NOT a self-serve endpoint. Terms 7.9 specifies email as
  // the channel and requires the request be sent by the user personally; adding a button here
  // would create a second, undocumented channel that the contract does not describe, and the
  // mismatch between the two would be the next thing to go wrong. The email stays the channel.
  // What was missing was never a form -- it was a durable record of what arrives.
  //
  // If a self-serve path is ever wanted, 7.9 must change in the same commit, and both routes must
  // write to this same table so there is one ledger rather than two partial ones.

  const normalizeEmail = (v: unknown): string =>
    typeof v === 'string' ? v.trim().toLowerCase().slice(0, 320) : '';

  app.post('/api/admin/arbitration-opt-outs', requireAdmin, async (req: Request, res: Response) => {
    if (!isDbConfigured()) {
      res.status(503).json({ success: false, error: 'Not configured.' });
      return;
    }

    const userEmail = normalizeEmail(req.body?.userEmail);
    // The revision being rejected. Defaults to the current one, but is accepted from the body
    // because an opt-out can legitimately arrive against an OLDER revision -- someone who accepted
    // in July and writes in August is rejecting what they accepted, not whatever is live today.
    const termsVersion =
      typeof req.body?.termsVersion === 'string' && req.body.termsVersion.trim()
        ? req.body.termsVersion.trim().slice(0, 64)
        : TERMS_VERSION;
    const clerkUserId =
      typeof req.body?.clerkUserId === 'string' && req.body.clerkUserId.trim()
        ? req.body.clerkUserId.trim().slice(0, 128)
        : null;
    const rawMessage = typeof req.body?.rawMessage === 'string' ? req.body.rawMessage.slice(0, 8000) : null;
    const notes = typeof req.body?.notes === 'string' ? req.body.notes.slice(0, 2000) : null;
    const recordedBy = typeof req.body?.recordedBy === 'string' ? req.body.recordedBy.trim().slice(0, 128) : null;

    if (!userEmail || !userEmail.includes('@')) {
      res.status(400).json({ success: false, error: 'A valid user email is required.' });
      return;
    }

    // receivedAt is REQUIRED and never defaulted. See the table comment in db.ts: the 30-day
    // window in Terms 7.9 runs to when the user sent their email, so silently substituting the
    // time of transcription would convert our own delay into their untimeliness.
    const receivedAtRaw = req.body?.receivedAt;
    if (typeof receivedAtRaw !== 'string' || !receivedAtRaw.trim()) {
      res.status(400).json({ success: false, error: 'receivedAt is required -- use the date the user sent the email, not today.' });
      return;
    }
    const receivedAt = new Date(receivedAtRaw);
    if (Number.isNaN(receivedAt.getTime())) {
      res.status(400).json({ success: false, error: 'receivedAt is not a valid date.' });
      return;
    }
    if (receivedAt.getTime() > Date.now() + 60_000) {
      res.status(400).json({ success: false, error: 'receivedAt cannot be in the future.' });
      return;
    }

    try {
      const rows = await withDb((sql) => sql`
        INSERT INTO arbitration_opt_outs
          (user_email, clerk_user_id, terms_version, received_at, recorded_by, raw_message, notes)
        VALUES
          (${userEmail}, ${clerkUserId}, ${termsVersion}, ${receivedAt.toISOString()}, ${recordedBy}, ${rawMessage}, ${notes})
        ON CONFLICT (user_email, terms_version) DO NOTHING
        RETURNING id, received_at
      `);
      // No row back means this opt-out was already on file. That is a success, not an error --
      // the record exists and its original received_at is preserved, which is the whole point.
      res.json({
        success: true,
        recorded: rows.length > 0,
        alreadyOnFile: rows.length === 0,
        userEmail,
        termsVersion,
      });
    } catch (err: any) {
      console.error('[terms] failed to record arbitration opt-out:', err);
      res.status(500).json({ success: false, error: 'Could not record opt-out.' });
    }
  });

  // Lookup. Answers the only two questions that matter before anyone relies on the arbitration
  // clause against a specific person: did they opt out, and was it in time?
  //
  // Timeliness is COMPUTED here rather than stored, by joining to the acceptance that started the
  // clock. Storing a boolean at write time would freeze an answer that depends on two dates and a
  // rule, and would be wrong the moment either is corrected.
  app.get('/api/admin/arbitration-opt-outs', requireAdmin, async (req: Request, res: Response) => {
    if (!isDbConfigured()) {
      res.status(503).json({ success: false, error: 'Not configured.' });
      return;
    }
    const email = normalizeEmail(req.query.email);

    try {
      const rows = await withDb((sql) =>
        email
          ? sql`
              SELECT o.*, a.accepted_at
              FROM arbitration_opt_outs o
              LEFT JOIN terms_acceptances a
                ON lower(a.user_email) = o.user_email AND a.terms_version = o.terms_version
              WHERE o.user_email = ${email}
              ORDER BY o.received_at DESC
            `
          : sql`
              SELECT o.*, a.accepted_at
              FROM arbitration_opt_outs o
              LEFT JOIN terms_acceptances a
                ON lower(a.user_email) = o.user_email AND a.terms_version = o.terms_version
              ORDER BY o.received_at DESC
              LIMIT 500
            `
      );

      const DAY_MS = 86_400_000;
      const optOuts = rows.map((r: any) => {
        const accepted = r.accepted_at ? new Date(r.accepted_at).getTime() : null;
        const received = new Date(r.received_at).getTime();
        const daysAfterAcceptance = accepted === null ? null : Math.floor((received - accepted) / DAY_MS);
        return {
          ...r,
          daysAfterAcceptance,
          // null, not false, when no matching acceptance is on file. "We have no record of them
          // accepting this revision" is a different fact from "they opted out too late", and
          // collapsing the two into a boolean would resolve an unknown against the user.
          withinThirtyDays: daysAfterAcceptance === null ? null : daysAfterAcceptance <= 30,
        };
      });

      res.json({ success: true, count: optOuts.length, optOuts });
    } catch (err: any) {
      console.error('[terms] failed to read arbitration opt-outs:', err);
      res.status(500).json({ success: false, error: 'Could not read opt-outs.' });
    }
  });
}
