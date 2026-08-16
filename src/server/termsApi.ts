import type { Express, Request, Response } from 'express';
import { withDb, isDbConfigured } from './db.js';
import { requireVerifiedUser } from './clerkAuth.js';
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
}
