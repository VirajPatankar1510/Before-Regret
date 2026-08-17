import type { Express, Request, Response } from 'express';
import { withDb, isDbConfigured } from './db.js';
import { requireVerifiedUser } from './clerkAuth.js';
import { requiresLicenceNumber } from '../data/sponsoredVendors.js';
import { PRICE_PER_SLOT_USD as GUIDE_PRICE_USD, SLOT_DURATION_DAYS as RENEWAL_DAYS } from './guideAdsApi.js';
import { PRICE_PER_BUNDLE_USD as ZIP_PRICE_USD, ZIPS_PER_BUNDLE } from './zipAdsApi.js';

// The vendor-facing placement manager (/my-ads) -- deliberately not called a "dashboard" anywhere
// in its copy, since it carries zero traffic/impression stats by design (this app doesn't
// guarantee or measure visibility). Its actual job: proof of purchase, expiry, edit, renew. Keyed
// by clerk_user_id, the column added to guide_ad_orders/zip_ad_orders alongside checkout -- see
// db.ts for why contact_email alone can't be trusted as a stable identity (it's a client-
// synthesized `user.email || uid@beforeregret.com` fallback, not guaranteed consistent across
// orders from the same vendor).
//
// Every route here is gated by requireVerifiedUser (clerkAuth.ts), which checks a real Clerk
// session token rather than trusting a clerkUserId the client just hands over -- this used to
// take that id as a URL param / request body field with no verification, which meant anyone could
// list or edit another vendor's placements just by knowing (or guessing) their Clerk user id.
// req.verifiedUserId below always comes from a cryptographically verified token, never the client.

function dbUnavailable(res: Response) {
  res.status(503).json({ success: false, error: 'The ad system is not configured yet.' });
}

export function registerMyAdsRoutes(app: Express) {
  // --- Everything one signed-in vendor has ever bought, across both products -----------------
  app.get('/api/my-ads', requireVerifiedUser, async (req: Request, res: Response) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    const clerkUserId = req.verifiedUserId as string;

    try {
      const guideRows = await withDb((sql) => sql`
        SELECT p.id AS purchase_id, p.article_id, a.slug, a.title, p.business_name, p.trade_category,
               p.phone, p.website, p.licence_number, p.paid_through, p.created_at, p.contact_edited, o.id AS order_id,
               o.amount_usd, o.paypal_order_id, o.paypal_capture_id, o.created_at AS order_created_at
        FROM guide_ad_purchases p
        JOIN guide_ad_orders o ON o.id = p.order_id
        JOIN articles a ON a.id = p.article_id
        WHERE o.clerk_user_id = ${clerkUserId} AND p.active = true
        ORDER BY p.paid_through DESC
      `);

      const zipRows = await withDb((sql) => sql`
        SELECT p.id AS purchase_id, p.zip_code, p.trade_category, p.business_name, p.phone, p.website,
               p.licence_number, p.paid_through, p.created_at, p.contact_edited, o.id AS order_id, o.amount_usd,
               o.paypal_order_id, o.paypal_capture_id, o.created_at AS order_created_at
        FROM zip_ad_purchases p
        JOIN zip_ad_orders o ON o.id = p.order_id
        WHERE o.clerk_user_id = ${clerkUserId} AND p.active = true
        ORDER BY p.paid_through DESC
      `);

      // Order history covers every completed order regardless of whether any of its slots ended
      // up granted (a fully-skipped order -- every slot lost the availability race at capture
      // time -- still charged the vendor and belongs in their history) -- see guideAdsApi.ts's
      // capture route for why an order can complete with zero purchases attached.
      // renews_purchase_id + the joined guide title are what let a renewal describe itself. Without
      // them a renewal read as "0 guide placement(s)" -- its slots_json is '[]' because it claims
      // no new inventory -- which is a nonsense line item against a real charge on the only
      // proof-of-purchase record this app gives a vendor.
      const guideOrderRows = await withDb((sql) => sql`
        SELECT o.id, o.paypal_order_id, o.paypal_capture_id, o.amount_usd, o.status, o.slots_json,
               o.created_at, o.renews_purchase_id, a.title AS renewed_title
        FROM guide_ad_orders o
        LEFT JOIN guide_ad_purchases rp ON rp.id = o.renews_purchase_id
        LEFT JOIN articles a ON a.id = rp.article_id
        WHERE o.clerk_user_id = ${clerkUserId} AND o.status = 'completed'
        ORDER BY o.created_at DESC
      `);
      // COALESCE(renews_order_id, id): a renewal order never inserts its own purchase rows -- it
      // extends the ORIGINAL bundle order's rows in place (see zipAdsApi.ts's renew capture
      // route), so joining on the renewal order's own id here always found nothing and every
      // renewal read as "no ZIPs granted" against a real $29 charge. Falling back to the original
      // order's id for a renewal (renews_order_id is NULL for a first-time purchase, so this is a
      // no-op there) is the same fix guide ads already has via renews_purchase_id + renewed_title
      // above, adapted for a bundle pointing at an order instead of a single purchase.
      const zipOrderRows = await withDb((sql) => sql`
        SELECT id, paypal_order_id, paypal_capture_id, amount_usd, status, trade_category,
               created_at, renews_order_id,
               (SELECT array_agg(p.zip_code ORDER BY p.zip_code) FROM zip_ad_purchases p
                WHERE p.order_id = COALESCE(zip_ad_orders.renews_order_id, zip_ad_orders.id)) AS granted_zips
        FROM zip_ad_orders WHERE clerk_user_id = ${clerkUserId} AND status = 'completed'
        ORDER BY created_at DESC
      `);

      type GuidePurchaseRow = {
        purchase_id: number; article_id: number; slug: string; title: string; business_name: string;
        trade_category: string; phone: string; website: string | null; licence_number: string | null;
        paid_through: string; created_at: string; contact_edited: boolean; order_id: number; amount_usd: string;
        paypal_order_id: string; paypal_capture_id: string | null; order_created_at: string;
      };
      type ZipPurchaseRow = {
        purchase_id: number; zip_code: string; trade_category: string; business_name: string;
        phone: string; website: string | null; licence_number: string | null; paid_through: string;
        created_at: string; contact_edited: boolean; order_id: number; amount_usd: string; paypal_order_id: string;
        paypal_capture_id: string | null; order_created_at: string;
      };

      const now = Date.now();
      const guidePlacements = (guideRows as unknown as GuidePurchaseRow[]).map((r) => ({
        purchaseId: r.purchase_id,
        articleId: r.article_id,
        slug: r.slug,
        title: r.title,
        businessName: r.business_name,
        tradeCategory: r.trade_category,
        phone: r.phone,
        website: r.website,
        // Surfaced so a vendor can see the licence number being published in their name. It was
        // collected and printed in the ad but never shown back to them, which made the "keep it
        // current" warranty in Terms 4.4 impossible to actually honour -- you cannot correct a
        // value you cannot see.
        licenceNumber: r.licence_number || null,
        paidThrough: r.paid_through,
        active: new Date(r.paid_through).getTime() > now,
        contactEdited: r.contact_edited,
      }));
      const zipPlacements = (zipRows as unknown as ZipPurchaseRow[]).map((r) => ({
        purchaseId: r.purchase_id,
        orderId: r.order_id,
        zipCode: r.zip_code,
        tradeCategory: r.trade_category,
        businessName: r.business_name,
        phone: r.phone,
        website: r.website,
        // Surfaced so a vendor can see the licence number being published in their name. It was
        // collected and printed in the ad but never shown back to them, which made the "keep it
        // current" warranty in Terms 4.4 impossible to actually honour -- you cannot correct a
        // value you cannot see.
        licenceNumber: r.licence_number || null,
        paidThrough: r.paid_through,
        active: new Date(r.paid_through).getTime() > now,
        contactEdited: r.contact_edited,
      }));

      const orders = [
        ...(guideOrderRows as unknown as Array<{
          id: number; paypal_order_id: string; paypal_capture_id: string | null; amount_usd: string;
          status: string; slots_json: string; created_at: string;
          renews_purchase_id: number | null; renewed_title: string | null;
        }>).map((o) => ({
          type: 'guide' as const,
          orderId: o.id,
          paypalOrderId: o.paypal_order_id,
          paypalCaptureId: o.paypal_capture_id,
          amountUsd: o.amount_usd,
          createdAt: o.created_at,
          description: o.renews_purchase_id
            ? `Renewal -- ${o.renewed_title ?? 'guide placement'}`
            : `${(JSON.parse(o.slots_json) as unknown[]).length} guide placement(s)`,
        })),
        ...(zipOrderRows as unknown as Array<{
          id: number; paypal_order_id: string; paypal_capture_id: string | null; amount_usd: string;
          status: string; trade_category: string; created_at: string;
          renews_order_id: number | null; granted_zips: string[] | null;
        }>).map((o) => {
          // granted_zips (from zip_ad_purchases) is what was actually granted, not what was
          // requested -- an order that lost every ZIP to the availability race still charged the
          // vendor and belongs in history (same reasoning as guideAdsApi.ts's capture route), so
          // this falls back to a plain description rather than an empty ZIP list when nothing
          // ended up granted.
          const zips = o.granted_zips ?? [];
          const zipsLabel = zips.length > 0 ? `ZIP ${zips.join(', ')}` : 'no ZIPs granted';
          return {
            type: 'zip' as const,
            orderId: o.id,
            paypalOrderId: o.paypal_order_id,
            paypalCaptureId: o.paypal_capture_id,
            amountUsd: o.amount_usd,
            createdAt: o.created_at,
            // Prefixed so a renewal is distinguishable from the original purchase -- otherwise the
            // two render as identical rows, same text and same amount, impossible to reconcile.
            description: `${o.renews_order_id ? 'Renewal -- ' : ''}${o.trade_category} in ${zipsLabel}`,
          };
        }),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Renewal pricing travels with the placements so the dashboard can state the amount before
      // sending anyone to PayPal -- the Renew button used to be a one-click path to a live payment
      // page with the price never appearing anywhere in our own UI.
      res.json({
        success: true,
        guidePlacements,
        zipPlacements,
        orders,
        renewal: { guidePriceUsd: GUIDE_PRICE_USD, zipPriceUsd: ZIP_PRICE_USD, days: RENEWAL_DAYS, zipsPerBundle: ZIPS_PER_BUNDLE },
      });
    } catch (err: any) {
      console.error('[my-ads] load failed:', err);
      res.status(500).json({ success: false, error: 'Could not load your placements.' });
    }
  });

  // --- Edit the reader-facing contact details on one guide placement -------------------------
  // Business name and trade category are locked -- they define what was sold and reviewed at
  // purchase time (see the adversarial-content-tripwire pattern this app already uses elsewhere:
  // letting the sold identity of a slot change post-purchase without review is the same class of
  // gap). Phone and website are the only fields a vendor can update themselves, and only once
  // (contact_edited, enforced here server-side, not just hidden client-side once used).
  app.post('/api/my-ads/guide/:purchaseId', requireVerifiedUser, async (req: Request, res: Response) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    const purchaseId = parseInt(req.params.purchaseId, 10);
    const clerkUserId = req.verifiedUserId as string;
    const { phone, website, licenceNumber } = req.body || {};
    if (!Number.isFinite(purchaseId)) {
      res.status(400).json({ success: false, error: 'Invalid request.' });
      return;
    }
    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      res.status(400).json({ success: false, error: 'Phone number is required.' });
      return;
    }
    try {
      const owned = await withDb((sql) => sql`
        SELECT p.id, p.contact_edited, p.trade_category, p.licence_number
        FROM guide_ad_purchases p JOIN guide_ad_orders o ON o.id = p.order_id
        WHERE p.id = ${purchaseId} AND o.clerk_user_id = ${clerkUserId} LIMIT 1
      `);
      const ownedRow = (owned as unknown as Array<{
        id: number; contact_edited: boolean; trade_category: string; licence_number: string | null;
      }>)[0];
      if (!ownedRow) {
        res.status(404).json({ success: false, error: 'Placement not found.' });
        return;
      }
      if (ownedRow.contact_edited) {
        res.status(409).json({ success: false, error: 'You\'ve already used your one edit for this placement. Contact support if you need another change.' });
        return;
      }
      // contact_edited = false in the WHERE, not just the earlier SELECT above, closes the same
      // kind of race the capture-time slot allocation guard does (see guideAdsApi.ts) -- two
      // near-simultaneous save clicks can't both land as "the" one allowed edit.

      // Licence number is editable, but only inside the SAME one-time edit that governs phone and
      // website -- deliberately not a freely-mutable field. The comment on this route already
      // explains why the sold identity of a placement must not drift post-purchase without review,
      // and a licence number is much closer to identity than to contact details: freely mutable, it
      // would let a vendor buy a slot with a valid number and then swap in anything. Bounded to one
      // change keeps the legitimate case (a licence renewed under a new number, or a typo at
      // checkout) fixable, which it previously was not -- Terms 4.4 has the vendor warrant the
      // number is current while the product gave them no way to make it so.
      //
      // An ABSENT licenceNumber field means "leave it alone", not "clear it". That distinction
      // matters: a client that predates this field would otherwise silently wipe the licence off a
      // live ad on an unrelated phone edit.
      const licenceProvided = typeof licenceNumber === 'string';
      const trimmedLicence = licenceProvided ? licenceNumber.trim() : '';
      if (licenceProvided && requiresLicenceNumber(ownedRow.trade_category)) {
        if (trimmedLicence.length < 3) {
          res.status(400).json({ success: false, error: 'A licence, registration, or certification number is required for this trade category.' });
          return;
        }
        if (trimmedLicence.length > 60) {
          res.status(400).json({ success: false, error: 'That licence number looks too long -- please enter just the number.' });
          return;
        }
      }
      const nextLicence = licenceProvided ? (trimmedLicence || null) : ownedRow.licence_number;

      const updated = await withDb((sql) => sql`
        UPDATE guide_ad_purchases SET phone = ${phone.trim()}, website = ${website?.trim() || null},
                           licence_number = ${nextLicence}, contact_edited = true
        WHERE id = ${purchaseId} AND contact_edited = false
        RETURNING id
      `);
      if ((updated as unknown[]).length === 0) {
        res.status(409).json({ success: false, error: 'You\'ve already used your one edit for this placement. Contact support if you need another change.' });
        return;
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error('[my-ads] guide edit failed:', err);
      res.status(500).json({ success: false, error: 'Could not save your changes.' });
    }
  });

  // --- Edit the reader-facing contact details on one ZIP placement ---------------------------
  app.post('/api/my-ads/zip/:purchaseId', requireVerifiedUser, async (req: Request, res: Response) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    const purchaseId = parseInt(req.params.purchaseId, 10);
    const clerkUserId = req.verifiedUserId as string;
    const { phone, website, licenceNumber } = req.body || {};
    if (!Number.isFinite(purchaseId)) {
      res.status(400).json({ success: false, error: 'Invalid request.' });
      return;
    }
    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      res.status(400).json({ success: false, error: 'Phone number is required.' });
      return;
    }
    try {
      const owned = await withDb((sql) => sql`
        SELECT p.id, p.contact_edited, p.trade_category, p.licence_number
        FROM zip_ad_purchases p JOIN zip_ad_orders o ON o.id = p.order_id
        WHERE p.id = ${purchaseId} AND o.clerk_user_id = ${clerkUserId} LIMIT 1
      `);
      const ownedRow = (owned as unknown as Array<{
        id: number; contact_edited: boolean; trade_category: string; licence_number: string | null;
      }>)[0];
      if (!ownedRow) {
        res.status(404).json({ success: false, error: 'Placement not found.' });
        return;
      }
      if (ownedRow.contact_edited) {
        res.status(409).json({ success: false, error: 'You\'ve already used your one edit for this placement. Contact support if you need another change.' });
        return;
      }

      // Licence number is editable, but only inside the SAME one-time edit that governs phone and
      // website -- deliberately not a freely-mutable field. The comment on this route already
      // explains why the sold identity of a placement must not drift post-purchase without review,
      // and a licence number is much closer to identity than to contact details: freely mutable, it
      // would let a vendor buy a slot with a valid number and then swap in anything. Bounded to one
      // change keeps the legitimate case (a licence renewed under a new number, or a typo at
      // checkout) fixable, which it previously was not -- Terms 4.4 has the vendor warrant the
      // number is current while the product gave them no way to make it so.
      //
      // An ABSENT licenceNumber field means "leave it alone", not "clear it". That distinction
      // matters: a client that predates this field would otherwise silently wipe the licence off a
      // live ad on an unrelated phone edit.
      const licenceProvided = typeof licenceNumber === 'string';
      const trimmedLicence = licenceProvided ? licenceNumber.trim() : '';
      if (licenceProvided && requiresLicenceNumber(ownedRow.trade_category)) {
        if (trimmedLicence.length < 3) {
          res.status(400).json({ success: false, error: 'A licence, registration, or certification number is required for this trade category.' });
          return;
        }
        if (trimmedLicence.length > 60) {
          res.status(400).json({ success: false, error: 'That licence number looks too long -- please enter just the number.' });
          return;
        }
      }
      const nextLicence = licenceProvided ? (trimmedLicence || null) : ownedRow.licence_number;

      const updated = await withDb((sql) => sql`
        UPDATE zip_ad_purchases SET phone = ${phone.trim()}, website = ${website?.trim() || null},
                           licence_number = ${nextLicence}, contact_edited = true
        WHERE id = ${purchaseId} AND contact_edited = false
        RETURNING id
      `);
      if ((updated as unknown[]).length === 0) {
        res.status(409).json({ success: false, error: 'You\'ve already used your one edit for this placement. Contact support if you need another change.' });
        return;
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error('[my-ads] zip edit failed:', err);
      res.status(500).json({ success: false, error: 'Could not save your changes.' });
    }
  });

  // --- Backfill a MISSING required licence number -------------------------------------------
  //
  // Deliberately separate from the one-time contact edit above, and deliberately NOT gated on
  // contact_edited. The reason is the renewal guard in zipAdsApi.ts / guideAdsApi.ts: a placement
  // sold before licence numbers existed cannot renew until it has one, and if supplying that number
  // consumed (or required) the one-time edit allowance, any vendor who had already used their edit
  // would be permanently unable to renew without a human intervening. That is a support ticket
  // manufactured by our own schema change, for a vendor who did nothing wrong.
  //
  // What keeps this safe despite being unbounded: it can only ever move a placement from NO licence
  // number to HAVING one. The WHERE clause requires the stored value to be null or blank, so it
  // physically cannot overwrite an existing number, and it touches no other column. The identity-
  // drift concern that justifies the one-time gate on phone/website/licence-changes therefore does
  // not apply -- there is no prior value to drift away from. Changing an existing number still goes
  // through the one-time edit.
  const backfillLicence = async (
    kind: 'guide' | 'zip',
    req: Request,
    res: Response
  ) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    const purchaseId = parseInt(req.params.purchaseId, 10);
    const clerkUserId = req.verifiedUserId as string;
    const { licenceNumber } = req.body || {};
    if (!Number.isFinite(purchaseId)) {
      res.status(400).json({ success: false, error: 'Invalid request.' });
      return;
    }
    const trimmed = typeof licenceNumber === 'string' ? licenceNumber.trim() : '';
    if (trimmed.length < 3) {
      res.status(400).json({ success: false, error: 'Enter your licence, registration, or certification number.' });
      return;
    }
    if (trimmed.length > 60) {
      res.status(400).json({ success: false, error: 'That licence number looks too long -- please enter just the number.' });
      return;
    }
    try {
      // Two spelled-out queries per statement rather than one with an interpolated table name.
      // Dynamic SQL identifiers have no precedent anywhere else in this codebase, and this is not
      // the code to introduce the pattern in -- the duplication is three lines and buys certainty.
      type OwnedRow = { id: number; trade_category: string; licence_number: string | null };
      const owned = kind === 'guide'
        ? await withDb((sql) => sql`
            SELECT p.id, p.trade_category, p.licence_number
            FROM guide_ad_purchases p JOIN guide_ad_orders o ON o.id = p.order_id
            WHERE p.id = ${purchaseId} AND o.clerk_user_id = ${clerkUserId} LIMIT 1
          `)
        : await withDb((sql) => sql`
            SELECT p.id, p.trade_category, p.licence_number
            FROM zip_ad_purchases p JOIN zip_ad_orders o ON o.id = p.order_id
            WHERE p.id = ${purchaseId} AND o.clerk_user_id = ${clerkUserId} LIMIT 1
          `);
      const row = (owned as unknown as OwnedRow[])[0];
      if (!row) {
        res.status(404).json({ success: false, error: 'Placement not found.' });
        return;
      }
      if ((row.licence_number || '').trim()) {
        // Already has one -- this route is only for filling a gap. Pointed at the right path rather
        // than silently succeeding, so the one-time-edit rule stays the single way to CHANGE a number.
        res.status(409).json({
          success: false,
          error: 'This placement already has a licence number. Use Edit to change it.',
        });
        return;
      }
      if (!requiresLicenceNumber(row.trade_category)) {
        res.status(400).json({
          success: false,
          error: `A licence number is not required for ${row.trade_category}.`,
        });
        return;
      }
      // The null/blank test is repeated in the WHERE, not just the SELECT above, for the same
      // reason the one-time edit repeats contact_edited = false: two concurrent submits must not
      // both land, and only the first should win.
      const updated = kind === 'guide'
        ? await withDb((sql) => sql`
            UPDATE guide_ad_purchases SET licence_number = ${trimmed}
            WHERE id = ${purchaseId} AND coalesce(btrim(licence_number), '') = ''
            RETURNING id
          `)
        : await withDb((sql) => sql`
            UPDATE zip_ad_purchases SET licence_number = ${trimmed}
            WHERE id = ${purchaseId} AND coalesce(btrim(licence_number), '') = ''
            RETURNING id
          `);
      if ((updated as unknown[]).length === 0) {
        res.status(409).json({ success: false, error: 'This placement already has a licence number. Use Edit to change it.' });
        return;
      }
      res.json({ success: true, licenceNumber: trimmed });
    } catch (err: any) {
      console.error(`[my-ads] ${kind} licence backfill failed:`, err);
      res.status(500).json({ success: false, error: 'Could not save your licence number.' });
    }
  };

  app.post('/api/my-ads/guide/:purchaseId/licence', requireVerifiedUser, (req, res) => backfillLicence('guide', req, res));
  app.post('/api/my-ads/zip/:purchaseId/licence', requireVerifiedUser, (req, res) => backfillLicence('zip', req, res));

}
