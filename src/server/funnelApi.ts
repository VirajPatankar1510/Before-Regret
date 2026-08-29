import type { Express, Request, Response } from 'express';
import { withDb, isDbConfigured } from './db.js';
import { hasValidSession } from './adminAuth.js';
import { verifyReportEmailTransport, sendTestEmail } from './reportEmailService.js';

// Read-only funnel measurement, admin-gated. Exists because every revenue projection for this site
// was being built on invented conversion rates: the schema recorded plenty about WHAT was generated
// and nothing about whether anyone ever paid for a second one.
//
// Deliberate scope boundary: this measures the steps the SERVER can prove, and refuses to guess at
// the one it cannot. Sessions and pageviews are not here, because the pages that matter (homepage
// and guides) are prerendered static HTML served by Vercel's CDN -- the Express process never sees
// those requests, so any "sessions" number computed here would be wrong in a way that looks
// authoritative. Vercel Web Analytics is the honest source for the top of the funnel; this endpoint
// owns everything from account creation down, and says so in its output.
//
// That top-of-funnel source was Google Analytics until 2026-08-26, when GA4 was removed for weight
// (147.5 KiB transferred, larger than React plus this app's shell, for pageviews and nothing else --
// no custom gtag() event was ever fired). The division of labour described above is unchanged; only
// the tool measuring the top half changed.
//
// Every figure below is a COUNT of real rows, never an extrapolation.
export function registerFunnelRoutes(app: Express) {
  // Admin-gated SMTP diagnostic. Answers the one question that cannot be checked from outside:
  // is the running deployment actually able to authenticate as hello@beforeregret.com?
  //
  // Admin-gated rather than public because it discloses the mail host, port and sending account.
  // It never returns the password, and verify() sends no mail -- it opens the connection,
  // completes AUTH, and disconnects.
  app.get('/api/admin/email-status', async (req: Request, res: Response) => {
    if (!hasValidSession(req)) {
      res.status(401).json({ success: false, error: 'Not authorized.' });
      return;
    }
    const result = await verifyReportEmailTransport();
    res.json({
      success: true,
      ...result,
      note: result.connectionOk
        ? 'SMTP authenticated. Signed-in requesters will be emailed their report link.'
        : 'Report emails are NOT sending. A Vercel env var only applies after a redeploy -- if SMTP_PASSWORD was just added, redeploy before reading this as a credential problem.',
    });
  });

  // Sends one real message on demand. verifyReportEmailTransport() above proves AUTH works, which
  // is a different question from whether a message is accepted and delivered -- both failures have
  // now happened here, and only the first shows up in verify(). This reproduces the second
  // deliberately instead of waiting for someone to generate a report and report back.
  //
  // Reports elapsed ms and the server's own response line, because the first successful report
  // email landed five minutes after its row was created and that number is the thing worth seeing.
  app.post('/api/admin/email-test', async (req: Request, res: Response) => {
    if (!hasValidSession(req)) {
      res.status(401).json({ success: false, error: 'Not authorized.' });
      return;
    }
    const to = String((req.body || {}).to || '').trim();
    // Deliberately requires an explicit recipient rather than defaulting to the mailbox itself:
    // a message from hello@ to hello@ can be accepted and filed locally without ever proving the
    // path to an outside inbox, which is the path that is actually in question.
    if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
      res.status(400).json({ success: false, error: 'Provide a recipient address as {"to":"you@example.com"}.' });
      return;
    }
    const result = await sendTestEmail(to);
    res.json({ success: true, to, ...result });
  });

  app.get('/api/admin/funnel', async (req: Request, res: Response) => {
    if (!hasValidSession(req)) {
      res.status(401).json({ success: false, error: 'Not authorized.' });
      return;
    }
    if (!isDbConfigured()) {
      res.status(503).json({ success: false, error: 'The database is not configured yet.' });
      return;
    }

    // Window is a plain integer day count, clamped -- this feeds a SQL interval, and an unclamped
    // caller-controlled value there is both an injection surface and a way to ask for a scan of the
    // whole table by accident.
    const requestedDays = parseInt(String(req.query.days ?? ''), 10);
    const days = Number.isFinite(requestedDays) && requestedDays > 0 ? Math.min(requestedDays, 365) : 30;

    try {
      const [reports, byUser, ads, adRevenue, pendingReports, dailyTrend] = await Promise.all([
        // Stage 2-4: reports generated, split free vs paid. distinct_users is the closest thing to
        // "accounts that reached the product" the server can prove -- clerk_user_id is nullable
        // (see optionalVerifiedUserId in server.ts: identity capture is best-effort and never a
        // gate), so it undercounts rather than overcounts. Stated as such in the response.
        withDb((sql) => sql`
          SELECT
            count(*)::int                                              AS reports_total,
            count(*) FILTER (WHERE is_paid = false)::int               AS reports_free,
            count(*) FILTER (WHERE is_paid = true)::int                AS reports_paid,
            count(DISTINCT clerk_user_id)::int                         AS distinct_users,
            count(DISTINCT clerk_user_id) FILTER (WHERE is_paid)::int  AS distinct_paying_users,
            coalesce(sum(price_usd) FILTER (WHERE is_paid), 0)::text   AS report_revenue_usd
          FROM generated_reports
          WHERE created_at > now() - (${days} * interval '1 day')
        `),
        // Reports per paying user -- the multiplier that decides whether a given number of buyers
        // reaches a revenue target. A homebuyer researches many addresses, so this is expected to
        // be well above 1, and guessing it wrong is what makes projections swing by years.
        withDb((sql) => sql`
          SELECT clerk_user_id, count(*)::int AS paid_reports
          FROM generated_reports
          WHERE is_paid = true AND clerk_user_id IS NOT NULL
            AND created_at > now() - (${days} * interval '1 day')
          GROUP BY clerk_user_id ORDER BY paid_reports DESC
        `),
        // Vendor side. Counted from purchases (inventory actually granted) joined to completed
        // orders, not from orders alone -- an order can complete with zero slots granted if it lost
        // the availability race at capture time (see guideAdsApi's capture route).
        withDb((sql) => sql`
          SELECT
            (SELECT count(*)::int FROM zip_ad_purchases p JOIN zip_ad_orders o ON o.id = p.order_id
              WHERE o.status = 'completed' AND p.created_at > now() - (${days} * interval '1 day')) AS zip_placements,
            (SELECT count(*)::int FROM guide_ad_purchases p JOIN guide_ad_orders o ON o.id = p.order_id
              WHERE o.status = 'completed' AND p.created_at > now() - (${days} * interval '1 day')) AS guide_placements
        `),
        withDb((sql) => sql`
          SELECT
            (SELECT coalesce(sum(o.amount_usd), 0)::text FROM zip_ad_orders o
              WHERE o.status = 'completed' AND o.created_at > now() - (${days} * interval '1 day')) AS zip_revenue_usd,
            (SELECT coalesce(sum(o.amount_usd), 0)::text FROM guide_ad_orders o
              WHERE o.status = 'completed' AND o.created_at > now() - (${days} * interval '1 day')) AS guide_revenue_usd
        `),
        // Abandoned checkouts. Surfaced on purpose: 5 pending report transactions with zero
        // completions is itself a finding (either PayPal capture is failing or people are bailing at
        // the payment step), and it would be invisible in a dashboard that only counted successes.
        withDb((sql) => sql`
          SELECT status, count(*)::int AS n, coalesce(sum(amount::numeric), 0)::text AS amount_usd
          FROM transactions
          WHERE type = 'report' AND created_at > now() - (${days} * interval '1 day')
          GROUP BY status ORDER BY status
        `),
        withDb((sql) => sql`
          SELECT created_at::date::text AS day,
                 count(*)::int AS reports,
                 count(*) FILTER (WHERE is_paid)::int AS paid
          FROM generated_reports
          WHERE created_at > now() - (${days} * interval '1 day')
          GROUP BY 1 ORDER BY 1 DESC
        `),
      ]);

      const r = (reports as unknown as any[])[0];
      const a = (ads as unknown as any[])[0];
      const rev = (adRevenue as unknown as any[])[0];
      const payers = byUser as unknown as Array<{ clerk_user_id: string; paid_reports: number }>;

      const reportsFree = r.reports_free as number;
      const reportsPaid = r.reports_paid as number;
      const reportRevenue = Number(r.report_revenue_usd);
      const zipRevenue = Number(rev.zip_revenue_usd);
      const guideRevenue = Number(rev.guide_revenue_usd);
      const totalRevenue = reportRevenue + zipRevenue + guideRevenue;

      // Rates are returned as null, not 0, when the denominator is empty. A displayed "0%"
      // conversion reads as "we measured it and nobody converts"; null reads as "not enough data
      // yet", which is the truth at this stage and a materially different business conclusion.
      const rate = (num: number, den: number) => (den > 0 ? Number(((num / den) * 100).toFixed(2)) : null);

      res.json({
        success: true,
        windowDays: days,
        // Named explicitly so nobody reads this as whole-funnel truth. See the file header.
        coverage: 'Server-verifiable stages only (account -> free report -> paid report -> vendor placement). Sessions/pageviews are not measurable here because prerendered pages are served by the CDN without touching this server -- use GA4 (G-Z61ENG55YD) for those.',
        reports: {
          total: r.reports_total,
          free: reportsFree,
          paid: reportsPaid,
          revenueUsd: reportRevenue,
        },
        users: {
          // Undercounts by design -- see the query comment. Flagged rather than silently reported.
          distinctIdentified: r.distinct_users,
          distinctPaying: r.distinct_paying_users,
          note: 'Counts only reports where a verified Clerk token was present; identity capture is best-effort, so treat as a floor.',
        },
        conversion: {
          freeToPaidReportPct: rate(reportsPaid, reportsFree),
          payingUserSharePct: rate(r.distinct_paying_users, r.distinct_users),
          paidReportsPerPayingUser:
            r.distinct_paying_users > 0 ? Number((reportsPaid / r.distinct_paying_users).toFixed(2)) : null,
        },
        vendors: {
          zipPlacements: a.zip_placements,
          guidePlacements: a.guide_placements,
          zipRevenueUsd: zipRevenue,
          guideRevenueUsd: guideRevenue,
        },
        revenue: {
          totalUsd: Number(totalRevenue.toFixed(2)),
          // The actual question being asked of this data, answered arithmetically rather than
          // by projection: how far is the current window from the target.
          monthlyTarget: 2000,
          pctOfTarget: Number(((totalRevenue / 2000) * 100).toFixed(2)),
        },
        reportCheckouts: pendingReports,
        topPayingUsers: payers.slice(0, 10),
        dailyTrend,
      });
    } catch (err: any) {
      console.error('[funnel] query failed:', err);
      res.status(500).json({ success: false, error: 'Could not compute the funnel.' });
    }
  });
}
