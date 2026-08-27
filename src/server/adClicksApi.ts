import type { Express, Request, Response } from 'express';
import crypto from 'crypto';
import { withDb, isDbConfigured } from './db.js';
import { detectAiCrawler } from '../utils/detectAiCrawler.js';

// Vendor ad click measurement. This exists to answer the one question a paying advertiser asks at
// the end of their 30 days -- "did anything come of it?" -- which /my-ads previously could not
// answer at all, by design (see myAdsApi.ts's header: "carries zero traffic/impression stats").
// That was a defensible stance for a one-time sale and an impossible one for a renewing product:
// a vendor with no evidence has no basis to renew except faith, so the honest default outcome of
// every placement was churn.
//
// WHAT IS AND IS NOT COUNTED, and why the distinction is kept sharp:
//
//   Impressions are NOT counted, and this file offers no way to. Guide pages are prerendered and
//   served by Vercel's CDN -- the Express process never sees those requests, exactly as
//   funnelApi.ts documents for sessions. Any "times shown" figure computed here would be wrong in
//   a way that looks authoritative, and it would be wrong in our favour, which is the worst
//   direction for a number shown to someone deciding whether to pay us again.
//
//   Clicks ARE counted, because a click is a request that genuinely reaches this server.
//
// Counted as UNIQUE (placement, target, visitor, day), enforced by a unique index with ON CONFLICT
// DO NOTHING rather than by filtering at read time. One reader tapping a phone number four times
// while writing it down is one person interested, not four; reporting it as four would inflate the
// only number the vendor uses to judge us. The same index makes the endpoint uninteresting to spam:
// repeat submissions collapse into the row that already exists.
//
// The visitor is stored as a salted hash of the IP, never the IP. It exists only to deduplicate
// within a day and is never read back out or reversed.

const CLICK_TARGETS = new Set(['phone', 'website']);
const AD_KINDS = new Set(['guide', 'zip']);

// Salted so the stored digest can't be checked against a guessed IP by anyone who obtains the
// table -- the IPv4 space is small enough to enumerate against an unsalted hash in seconds.
// ADMIN_SESSION_SECRET is reused rather than adding another required env var; if it's absent (a
// local dev box with no secrets configured) a per-process random salt keeps dedupe working for the
// lifetime of the process without ever falling back to storing something reversible.
const IP_SALT = process.env.ADMIN_SESSION_SECRET || crypto.randomBytes(32).toString('hex');

function hashVisitor(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip =
    (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '') ||
    req.socket.remoteAddress ||
    'unknown';
  return crypto.createHmac('sha256', IP_SALT).update(ip).digest('hex').slice(0, 32);
}

/**
 * Record one click, deduplicated per visitor per day. Never throws and never blocks the caller's
 * response -- a measurement failure must not break a vendor's phone number or send a reader
 * somewhere unexpected. A lost click is an undercount; a thrown error is a broken ad.
 */
async function recordClick(
  req: Request,
  adKind: string,
  purchaseId: number,
  target: string
): Promise<void> {
  // Bots find these links by crawling the page like any other href. Counting them would fill a
  // vendor's report with clicks from Amazon's crawler -- 243 visits in the first week this site
  // was crawled at all -- and the first time a vendor called one of those "leads" back, the number
  // would be exposed as fiction.
  if (detectAiCrawler(String(req.headers['user-agent'] || ''))) return;
  try {
    await withDb((sql) => sql`
      INSERT INTO vendor_ad_clicks (ad_kind, purchase_id, target, click_day, visitor_hash)
      VALUES (${adKind}, ${purchaseId}, ${target}, current_date, ${hashVisitor(req)})
      ON CONFLICT DO NOTHING
    `);
  } catch (err) {
    console.error('[ad-clicks] could not record click:', err);
  }
}

export function registerAdClickRoutes(app: Express) {
  // --- Outbound website click: log, then redirect to the advertiser's own site ------------------
  //
  // The destination is read from the purchase row and NEVER from the request. A `?url=` parameter
  // here would be an open redirect: anyone could hand out a beforeregret.com link that forwards to
  // a site of their choosing, borrowing this domain's reputation to do it. The only thing the
  // caller controls is which placement id to look up.
  app.get('/out/:adKind/:purchaseId', async (req: Request, res: Response) => {
    const { adKind } = req.params;
    const purchaseId = parseInt(req.params.purchaseId, 10);
    // Any malformed or unknown link lands on the homepage rather than an error page -- this URL is
    // only ever reached by a real reader who clicked a vendor's link, and a 404 would strand them.
    if (!AD_KINDS.has(adKind) || !Number.isFinite(purchaseId) || !isDbConfigured()) {
      res.redirect(302, '/');
      return;
    }
    try {
      const rows = await withDb((sql) =>
        adKind === 'guide'
          ? sql`SELECT website FROM guide_ad_purchases WHERE id = ${purchaseId} AND active = true AND paid_through > now() LIMIT 1`
          : sql`SELECT website FROM zip_ad_purchases WHERE id = ${purchaseId} AND active = true AND paid_through > now() LIMIT 1`
      );
      const website = (rows as unknown as Array<{ website: string | null }>)[0]?.website;
      // An expired or pulled placement stops forwarding traffic the moment it stops being paid for.
      // Its links live on in whatever page caches and bookmarks already exist, and continuing to
      // honour them would be delivering unpaid clicks to a former advertiser.
      //
      // Deliberately NOT also gated on the article being published, unlike
      // /api/guide-ads/active/:articleId. The rules look like they should match and shouldn't: that
      // endpoint answers "is an ad running here", where an unpublished page means the honest answer
      // is no. This one forwards a click a real person just made on a link they already have. If we
      // unpublish a guide mid-window, the vendor has already lost the placement they paid for --
      // refusing to forward the few clicks still trickling in from caches and bookmarks would take
      // away the remainder too, to no one's benefit. Expiry is the vendor's own bargain ending;
      // unpublishing is our decision, and the cost of it shouldn't land on them twice.
      if (!website) {
        res.redirect(302, '/');
        return;
      }
      // Only http(s) is ever emitted. Stored values are advertiser-supplied, and a javascript: or
      // data: URL reaching a Location header would be a redirect into script execution. Validated
      // at read time rather than trusting that write-time validation was always present -- rows
      // predate this check.
      let parsed: URL;
      try {
        parsed = new URL(website);
      } catch {
        res.redirect(302, '/');
        return;
      }
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        res.redirect(302, '/');
        return;
      }
      await recordClick(req, adKind, purchaseId, 'website');
      // 302, not 301: a permanent redirect would be cached by the browser, so the next click would
      // never reach this server and would never be counted -- and it would keep forwarding to the
      // advertiser long after the placement expired.
      res.redirect(302, parsed.toString());
    } catch (err) {
      console.error('[ad-clicks] outbound redirect failed:', err);
      res.redirect(302, '/');
    }
  });

  // --- Phone click beacon ----------------------------------------------------------------------
  //
  // Phone numbers keep their plain `tel:` href and report the click separately via sendBeacon,
  // rather than routing through the redirect above. Redirecting to a `tel:` URI works unevenly
  // across browsers, and the cost of getting it wrong is a paying vendor's phone number not
  // dialling -- far worse than the cost of this approach, which is undercounting clicks from
  // readers with JavaScript disabled.
  app.post('/api/ad-click', async (req: Request, res: Response) => {
    // 204 unconditionally, before any validation outcome can change the response. This is a
    // beacon: the browser has already navigated away and nothing reads the result. Returning
    // errors here would only tell a prober which placement ids exist.
    res.status(204).end();
    if (!isDbConfigured()) return;
    const { adKind, purchaseId, target } = req.body || {};
    const id = parseInt(String(purchaseId), 10);
    if (!AD_KINDS.has(adKind) || !CLICK_TARGETS.has(target) || !Number.isFinite(id)) return;
    // Confirm the placement is real, live, and paid before recording anything against it, so a
    // fabricated id can't create rows for a placement that doesn't exist.
    try {
      const rows = await withDb((sql) =>
        adKind === 'guide'
          ? sql`SELECT 1 AS ok FROM guide_ad_purchases WHERE id = ${id} AND active = true AND paid_through > now() LIMIT 1`
          : sql`SELECT 1 AS ok FROM zip_ad_purchases WHERE id = ${id} AND active = true AND paid_through > now() LIMIT 1`
      );
      if ((rows as unknown[]).length === 0) return;
      await recordClick(req, adKind, id, target);
    } catch (err) {
      console.error('[ad-clicks] beacon failed:', err);
    }
  });
}

export interface AdClickSummary {
  totalClicks: number;
  phoneClicks: number;
  websiteClicks: number;
  last7Days: number;
}

/**
 * Click counts for a set of placements, keyed by purchase id. Used by /my-ads to show a vendor
 * what their placement actually did. Returns zeros rather than nulls for placements with no
 * clicks: unlike the conversion rates in funnelApi.ts (null there means "no denominator yet, and a
 * displayed 0% would read as a measured failure"), a placement that has been live and received no
 * clicks HAS been measured, and zero is the true answer.
 */
export async function getClickSummaries(
  adKind: 'guide' | 'zip',
  purchaseIds: number[]
): Promise<Map<number, AdClickSummary>> {
  const out = new Map<number, AdClickSummary>();
  for (const id of purchaseIds) {
    out.set(id, { totalClicks: 0, phoneClicks: 0, websiteClicks: 0, last7Days: 0 });
  }
  if (purchaseIds.length === 0 || !isDbConfigured()) return out;
  try {
    const rows = await withDb((sql) => sql`
      SELECT purchase_id,
             count(*)::int                                                        AS total,
             count(*) FILTER (WHERE target = 'phone')::int                        AS phone,
             count(*) FILTER (WHERE target = 'website')::int                      AS website,
             count(*) FILTER (WHERE click_day > current_date - 7)::int            AS last7
      FROM vendor_ad_clicks
      WHERE ad_kind = ${adKind} AND purchase_id = ANY(${purchaseIds})
      GROUP BY purchase_id
    `);
    for (const r of rows as unknown as Array<{
      purchase_id: number; total: number; phone: number; website: number; last7: number;
    }>) {
      out.set(r.purchase_id, {
        totalClicks: r.total,
        phoneClicks: r.phone,
        websiteClicks: r.website,
        last7Days: r.last7,
      });
    }
  } catch (err) {
    console.error('[ad-clicks] summary query failed:', err);
  }
  return out;
}
