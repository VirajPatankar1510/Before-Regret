import type { Express, Request, Response } from 'express';
import { withDb, isDbConfigured } from './db.js';

// The vendor-facing placement manager (/my-ads) -- deliberately not called a "dashboard" anywhere
// in its copy, since it carries zero traffic/impression stats by design (this app doesn't
// guarantee or measure visibility). Its actual job: proof of purchase, expiry, edit, renew. Keyed
// by clerk_user_id, the column added to guide_ad_orders/zip_ad_orders alongside checkout -- see
// db.ts for why contact_email alone can't be trusted as a stable identity (it's a client-
// synthesized `user.email || uid@beforeregret.com` fallback, not guaranteed consistent across
// orders from the same vendor).
//
// No server-side Clerk token verification exists anywhere in this codebase yet (only
// @clerk/clerk-react is installed, no @clerk/backend) -- every existing user-scoped route
// (PaymentProcessor.tsx's userId, this one's clerkUserId) trusts whatever id the client sends,
// same as the rest of the app. Not introducing a heavier auth model here that the rest of the
// codebase doesn't have; noting the gap rather than silently building past it.

function dbUnavailable(res: Response) {
  res.status(503).json({ success: false, error: 'The ad system is not configured yet.' });
}

function requireClerkUserId(req: Request, res: Response): string | null {
  const id = req.params.clerkUserId;
  if (!id || typeof id !== 'string') {
    res.status(400).json({ success: false, error: 'Missing account id.' });
    return null;
  }
  return id;
}

export function registerMyAdsRoutes(app: Express) {
  // --- Everything one signed-in vendor has ever bought, across both products -----------------
  app.get('/api/my-ads/:clerkUserId', async (req: Request, res: Response) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    const clerkUserId = requireClerkUserId(req, res);
    if (!clerkUserId) return;

    try {
      const guideRows = await withDb((sql) => sql`
        SELECT p.id AS purchase_id, p.article_id, a.slug, a.title, p.business_name, p.trade_category,
               p.phone, p.website, p.tagline, p.paid_through, p.created_at, o.id AS order_id,
               o.amount_usd, o.paypal_order_id, o.paypal_capture_id, o.created_at AS order_created_at
        FROM guide_ad_purchases p
        JOIN guide_ad_orders o ON o.id = p.order_id
        JOIN articles a ON a.id = p.article_id
        WHERE o.clerk_user_id = ${clerkUserId} AND p.active = true
        ORDER BY p.paid_through DESC
      `);

      const zipRows = await withDb((sql) => sql`
        SELECT p.id AS purchase_id, p.zip_code, p.trade_category, p.business_name, p.phone, p.website,
               p.tagline, p.paid_through, p.created_at, o.id AS order_id, o.amount_usd,
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
      const guideOrderRows = await withDb((sql) => sql`
        SELECT id, paypal_order_id, paypal_capture_id, amount_usd, status, slots_json, created_at
        FROM guide_ad_orders WHERE clerk_user_id = ${clerkUserId} AND status = 'completed'
        ORDER BY created_at DESC
      `);
      const zipOrderRows = await withDb((sql) => sql`
        SELECT id, paypal_order_id, paypal_capture_id, amount_usd, status, zip_code, trade_category, created_at
        FROM zip_ad_orders WHERE clerk_user_id = ${clerkUserId} AND status = 'completed'
        ORDER BY created_at DESC
      `);

      type GuidePurchaseRow = {
        purchase_id: number; article_id: number; slug: string; title: string; business_name: string;
        trade_category: string; phone: string; website: string | null; tagline: string | null;
        paid_through: string; created_at: string; order_id: number; amount_usd: string;
        paypal_order_id: string; paypal_capture_id: string | null; order_created_at: string;
      };
      type ZipPurchaseRow = {
        purchase_id: number; zip_code: string; trade_category: string; business_name: string;
        phone: string; website: string | null; tagline: string | null; paid_through: string;
        created_at: string; order_id: number; amount_usd: string; paypal_order_id: string;
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
        tagline: r.tagline,
        paidThrough: r.paid_through,
        active: new Date(r.paid_through).getTime() > now,
      }));
      const zipPlacements = (zipRows as unknown as ZipPurchaseRow[]).map((r) => ({
        purchaseId: r.purchase_id,
        zipCode: r.zip_code,
        tradeCategory: r.trade_category,
        businessName: r.business_name,
        phone: r.phone,
        website: r.website,
        tagline: r.tagline,
        paidThrough: r.paid_through,
        active: new Date(r.paid_through).getTime() > now,
      }));

      const orders = [
        ...(guideOrderRows as unknown as Array<{
          id: number; paypal_order_id: string; paypal_capture_id: string | null; amount_usd: string;
          status: string; slots_json: string; created_at: string;
        }>).map((o) => ({
          type: 'guide' as const,
          orderId: o.id,
          paypalOrderId: o.paypal_order_id,
          paypalCaptureId: o.paypal_capture_id,
          amountUsd: o.amount_usd,
          createdAt: o.created_at,
          description: `${(JSON.parse(o.slots_json) as unknown[]).length} guide placement(s)`,
        })),
        ...(zipOrderRows as unknown as Array<{
          id: number; paypal_order_id: string; paypal_capture_id: string | null; amount_usd: string;
          status: string; zip_code: string; trade_category: string; created_at: string;
        }>).map((o) => ({
          type: 'zip' as const,
          orderId: o.id,
          paypalOrderId: o.paypal_order_id,
          paypalCaptureId: o.paypal_capture_id,
          amountUsd: o.amount_usd,
          createdAt: o.created_at,
          description: `${o.trade_category} in ZIP ${o.zip_code}`,
        })),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json({ success: true, guidePlacements, zipPlacements, orders });
    } catch (err: any) {
      console.error('[my-ads] load failed:', err);
      res.status(500).json({ success: false, error: 'Could not load your placements.' });
    }
  });

  // --- Edit the reader-facing contact details on one guide placement -------------------------
  // Business name and trade category are locked -- they define what was sold and reviewed at
  // purchase time (see the adversarial-content-tripwire pattern this app already uses elsewhere:
  // letting the sold identity of a slot change post-purchase without review is the same class of
  // gap). Phone/website/tagline are the only fields a vendor can update themselves.
  app.post('/api/my-ads/guide/:purchaseId', async (req: Request, res: Response) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    const purchaseId = parseInt(req.params.purchaseId, 10);
    const { clerkUserId, phone, website, tagline } = req.body || {};
    if (!Number.isFinite(purchaseId) || !clerkUserId || typeof clerkUserId !== 'string') {
      res.status(400).json({ success: false, error: 'Invalid request.' });
      return;
    }
    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      res.status(400).json({ success: false, error: 'Phone number is required.' });
      return;
    }
    try {
      const owned = await withDb((sql) => sql`
        SELECT p.id FROM guide_ad_purchases p JOIN guide_ad_orders o ON o.id = p.order_id
        WHERE p.id = ${purchaseId} AND o.clerk_user_id = ${clerkUserId} LIMIT 1
      `);
      if ((owned as unknown[]).length === 0) {
        res.status(404).json({ success: false, error: 'Placement not found.' });
        return;
      }
      await withDb((sql) => sql`
        UPDATE guide_ad_purchases SET phone = ${phone.trim()}, website = ${website?.trim() || null}, tagline = ${tagline?.trim() || null}
        WHERE id = ${purchaseId}
      `);
      res.json({ success: true });
    } catch (err: any) {
      console.error('[my-ads] guide edit failed:', err);
      res.status(500).json({ success: false, error: 'Could not save your changes.' });
    }
  });

  // --- Edit the reader-facing contact details on one ZIP placement ---------------------------
  app.post('/api/my-ads/zip/:purchaseId', async (req: Request, res: Response) => {
    if (!isDbConfigured()) return dbUnavailable(res);
    const purchaseId = parseInt(req.params.purchaseId, 10);
    const { clerkUserId, phone, website, tagline } = req.body || {};
    if (!Number.isFinite(purchaseId) || !clerkUserId || typeof clerkUserId !== 'string') {
      res.status(400).json({ success: false, error: 'Invalid request.' });
      return;
    }
    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      res.status(400).json({ success: false, error: 'Phone number is required.' });
      return;
    }
    try {
      const owned = await withDb((sql) => sql`
        SELECT p.id FROM zip_ad_purchases p JOIN zip_ad_orders o ON o.id = p.order_id
        WHERE p.id = ${purchaseId} AND o.clerk_user_id = ${clerkUserId} LIMIT 1
      `);
      if ((owned as unknown[]).length === 0) {
        res.status(404).json({ success: false, error: 'Placement not found.' });
        return;
      }
      await withDb((sql) => sql`
        UPDATE zip_ad_purchases SET phone = ${phone.trim()}, website = ${website?.trim() || null}, tagline = ${tagline?.trim() || null}
        WHERE id = ${purchaseId}
      `);
      res.json({ success: true });
    } catch (err: any) {
      console.error('[my-ads] zip edit failed:', err);
      res.status(500).json({ success: false, error: 'Could not save your changes.' });
    }
  });
}
