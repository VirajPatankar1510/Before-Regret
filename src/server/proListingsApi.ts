import type { Express, Request, Response } from 'express';
import zipcodes from 'zipcodes';
import { withDb, isDbConfigured } from './db.js';
import { requireVerifiedUser } from './clerkAuth.js';
import { TERMS_VERSION } from '../data/legalVersions.js';
import { checkVendorWebsite } from '../data/vendorWebsite.js';
import { submitUrlsToIndexNow } from '../utils/indexNowService.js';
import { TRADE_CATEGORIES, requiresLicenceNumber, requiresBrokerageName, brokerageNameError, composeAdvertiserName } from '../data/sponsoredVendors.js';

// Find a Pro -- free business listings (owner decisions, 2026-10-18).
//
// What it is: a directory at /pros/ where a business lists itself for free (name, trade, the ZIP codes
// it serves, phone, website, licence number, a short description) and buyers search by ZIP and trade.
// Built so vendors can find and join Before Regret on their own, without being pitched.
//
// What it must never do: put free listings in property reports. Reports carry paid Report Ads only --
// the owner's words: "free listing in reports would degrade paid vendors". Paid Report Ads vendors
// instead appear FIRST, as featured, in directory results for the ZIP they bought. Nothing in this file
// is read by report generation; keep it that way.
//
// Goes live as soon as it is saved. "Email confirmed" is the verified Clerk session that
// requireVerifiedUser enforces -- the same gate as paid checkout -- rather than a confirmation email of
// our own, which would go out from the GoDaddy mailbox and land in spam.

const MAX_ZIPS = 5;
const MAX_LISTINGS_PER_USER = 3;
const MAX_DESCRIPTION = 300;
const NEARBY_MILES = 20;
// A listing page opens to Google only once it is "complete" (owner decision, 2026-10-18): a description
// of at least this many characters. Thin name-and-phone pages stay noindex -- a directory of those is
// the pattern behind the 2026-09-02 prune. The join form tells the business the rule.
export const INDEXABLE_MIN_DESCRIPTION = 80;
const SITE = 'https://www.beforeregret.com';

function isValidZip(zip: unknown): zip is string {
  return typeof zip === 'string' && /^\d{5}$/.test(zip) && zipcodes.lookup(zip)?.country === 'US';
}

function slugify(s: string): string {
  return s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

export interface PublicProListing {
  slug: string;
  businessName: string;
  tradeCategory: string;
  zipCodes: string[];
  city: string | null;
  state: string | null;
  phone: string;
  website: string | null;
  licenceNumber: string | null;
  description: string | null;
  listedSince: string;
  /** Open to Google (complete listing) or noindex. */
  indexable: boolean;
}

type Row = {
  id: number; slug: string; clerk_user_id: string; business_name: string; trade_category: string; zip_codes_json: string;
  city: string | null; state: string | null; phone: string; website: string | null; licence_number: string | null;
  description: string | null; status: string; created_at: string;
};

function isIndexable(r: Pick<Row, 'description' | 'status'>): boolean {
  return r.status === 'active' && (r.description ?? '').trim().length >= INDEXABLE_MIN_DESCRIPTION;
}

/** Tells Bing and other IndexNow engines about a newly complete listing. Awaited with a short cap and
 *  never throws: on Vercel no work may run after the response, and a slow ping must not fail a save. */
async function pingIndexNow(slug: string): Promise<void> {
  try {
    await Promise.race([submitUrlsToIndexNow([`${SITE}/pros/${slug}/`]), new Promise((r) => setTimeout(r, 2500))]);
  } catch (err) {
    console.error('[pros] IndexNow ping failed (ignored):', err);
  }
}

function toPublic(r: Row): PublicProListing {
  return {
    slug: r.slug, businessName: r.business_name, tradeCategory: r.trade_category, zipCodes: JSON.parse(r.zip_codes_json || '[]'),
    city: r.city, state: r.state, phone: r.phone, website: r.website, licenceNumber: r.licence_number,
    description: r.description, listedSince: new Date(r.created_at).toISOString(),
    indexable: isIndexable(r),
  };
}

/** Validates the editable fields shared by create and update. Returns cleaned values or a list of errors. */
function validateFields(body: any, tradeCategory: string) {
  const errors: string[] = [];
  const zipList: string[] = Array.isArray(body.zipCodes) ? body.zipCodes.filter((z: unknown) => typeof z === 'string').map((z: string) => z.trim()) : [];
  const zips = Array.from(new Set(zipList));
  if (zips.length < 1 || zips.length > MAX_ZIPS || !zips.every(isValidZip)) {
    errors.push(`Add between 1 and ${MAX_ZIPS} real U.S. ZIP codes you serve.`);
  }
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  if (phone.length < 7 || phone.length > 30) errors.push('A valid phone number is required.');
  const site = checkVendorWebsite(body.website);
  if (!site.ok) errors.push(site.error || 'That website address is not accepted.');
  const licence = typeof body.licenceNumber === 'string' ? body.licenceNumber.trim() : '';
  if (requiresLicenceNumber(tradeCategory)) {
    if (licence.length < 3) errors.push('A licence, registration, or certification number is required for this trade.');
    else if (licence.length > 60) errors.push('That licence number looks too long -- please enter just the number.');
  }
  const description = typeof body.description === 'string' ? body.description.trim().replace(/\s+/g, ' ') : '';
  if (description.length > MAX_DESCRIPTION) errors.push(`Keep the description under ${MAX_DESCRIPTION} characters.`);
  if (/https?:\/\/|www\./i.test(description)) errors.push('Please leave links out of the description -- add your website in the website field.');
  const first = zips.find(isValidZip);
  const place = first ? zipcodes.lookup(first) : null;
  return {
    errors,
    clean: {
      zips, phone, website: site.ok ? site.url : null, licence: licence || null,
      description: description || null, city: place?.city ?? null, state: place?.state ?? null,
    },
  };
}

export function registerProListingsRoutes(app: Express) {
  const unavailable = (res: Response) => res.status(503).json({ success: false, error: 'Find a Pro is not available right now.' });

  // --- Public search: featured paid Report Ads for the exact ZIP first, then free listings nearby ---
  app.get('/api/pros', async (req: Request, res: Response) => {
    if (!isDbConfigured()) return unavailable(res);
    const zip = typeof req.query.zip === 'string' ? req.query.zip.trim() : '';
    const trade = typeof req.query.trade === 'string' ? req.query.trade.trim() : '';
    if (!isValidZip(zip)) return res.status(400).json({ success: false, error: 'Enter a valid 5-digit U.S. ZIP code.' });
    if (trade && !(TRADE_CATEGORIES as readonly string[]).includes(trade)) {
      return res.status(400).json({ success: false, error: 'Choose a trade from the list.' });
    }
    const nearby: string[] = Array.from(new Set([zip, ...((zipcodes.radius(zip, NEARBY_MILES) as string[]) || [])])).slice(0, 400);
    const place = zipcodes.lookup(zip);
    try {
      const [featuredRows, freeRows] = await withDb(async (sql) => [
        await sql`
          SELECT id, zip_code, trade_category, business_name, phone, website, licence_number
          FROM zip_ad_purchases
          WHERE zip_code = ${zip} AND active = true AND paid_through > now()
            AND (${trade} = '' OR trade_category = ${trade})
          ORDER BY created_at ASC`,
        await sql`
          SELECT * FROM pro_listings
          WHERE status = 'active' AND (${trade} = '' OR trade_category = ${trade})
            AND zip_codes_json::jsonb ?| ${nearby}::text[]
          ORDER BY (zip_codes_json::jsonb ? ${zip}) DESC, created_at ASC
          LIMIT 60`,
      ]);
      const featured = (featuredRows as unknown as Array<any>).map((r) => ({
        id: String(r.id), zipCode: r.zip_code, tradeCategory: r.trade_category, businessName: r.business_name,
        phone: r.phone, website: r.website || undefined, licenceNumber: r.licence_number || undefined, active: true,
      }));
      res.json({
        success: true,
        area: place ? { city: place.city, state: place.state } : null,
        featured,
        listings: (freeRows as unknown as Row[]).map(toPublic),
      });
    } catch (err) {
      console.error('[pros] search failed:', err);
      res.status(500).json({ success: false, error: 'Could not search right now. Please try again.' });
    }
  });

  // --- Public: one listing's page ---
  app.get('/api/pros/listing/:slug', async (req: Request, res: Response) => {
    if (!isDbConfigured()) return unavailable(res);
    try {
      const rows = await withDb((sql) => sql`SELECT * FROM pro_listings WHERE slug = ${req.params.slug} AND status = 'active' LIMIT 1`);
      const row = (rows as unknown as Row[])[0];
      if (!row) return res.status(404).json({ success: false, error: 'This listing is not available.' });
      res.json({ success: true, listing: toPublic(row) });
    } catch (err) {
      console.error('[pros] listing fetch failed:', err);
      res.status(500).json({ success: false, error: 'Could not load this listing.' });
    }
  });

  // --- Signed in: the business's own listings ---
  app.get('/api/pros/mine', requireVerifiedUser, async (req: Request, res: Response) => {
    if (!isDbConfigured()) return unavailable(res);
    try {
      const rows = await withDb((sql) => sql`
        SELECT * FROM pro_listings WHERE clerk_user_id = ${req.verifiedUserId as string} AND status = 'active' ORDER BY created_at ASC`);
      res.json({ success: true, listings: (rows as unknown as Row[]).map((r) => ({ id: r.id, ...toPublic(r) })) });
    } catch (err) {
      console.error('[pros] mine failed:', err);
      res.status(500).json({ success: false, error: 'Could not load your listings.' });
    }
  });

  // --- Signed in: create a listing. Live immediately. ---
  app.post('/api/pros', requireVerifiedUser, async (req: Request, res: Response) => {
    if (!isDbConfigured()) return unavailable(res);
    const body = req.body || {};
    const errors: string[] = [];
    const tradeCategory = typeof body.tradeCategory === 'string' ? body.tradeCategory : '';
    if (!(TRADE_CATEGORIES as readonly string[]).includes(tradeCategory)) errors.push('Choose your business type.');
    let businessName = typeof body.businessName === 'string' ? body.businessName.trim().replace(/\s+/g, ' ') : '';
    if (businessName.length < 2 || businessName.length > 80) errors.push('Enter your business name (2 to 80 characters).');
    const contactEmail = typeof body.contactEmail === 'string' ? body.contactEmail.trim() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) errors.push('A valid contact email is required.');
    if (body.attestedAccurate !== true) errors.push('Confirm your details and accept the Terms of Service to list your business.');
    if (requiresBrokerageName(tradeCategory)) {
      const brokerageErr = brokerageNameError(body.brokerageName);
      if (brokerageErr) errors.push(brokerageErr);
      else businessName = composeAdvertiserName(businessName, body.brokerageName);
    }
    const { errors: fieldErrors, clean } = validateFields(body, tradeCategory);
    errors.push(...fieldErrors);
    if (errors.length) return res.status(400).json({ success: false, errors });

    try {
      const userId = req.verifiedUserId as string;
      const existing = await withDb((sql) => sql`
        SELECT count(*)::int AS n FROM pro_listings WHERE clerk_user_id = ${userId} AND status = 'active'`);
      if (((existing as unknown as Array<{ n: number }>)[0]?.n ?? 0) >= MAX_LISTINGS_PER_USER) {
        return res.status(400).json({ success: false, errors: [`An account can hold up to ${MAX_LISTINGS_PER_USER} free listings. Remove one to add another.`] });
      }
      const base = slugify(`${businessName.split(' · ')[0]} ${clean.city || ''} ${clean.state || ''}`) || 'pro';
      let slug = base;
      for (let n = 2; n < 50; n++) {
        const taken = await withDb((sql) => sql`SELECT 1 FROM pro_listings WHERE slug = ${slug} LIMIT 1`);
        if ((taken as unknown[]).length === 0) break;
        slug = `${base}-${n}`;
      }
      const rows = await withDb((sql) => sql`
        INSERT INTO pro_listings (slug, clerk_user_id, contact_email, business_name, trade_category, zip_codes_json, city, state,
                                  phone, website, licence_number, description, terms_version)
        VALUES (${slug}, ${userId}, ${contactEmail}, ${businessName}, ${tradeCategory}, ${JSON.stringify(clean.zips)},
                ${clean.city}, ${clean.state}, ${clean.phone}, ${clean.website}, ${clean.licence}, ${clean.description}, ${TERMS_VERSION})
        RETURNING *`);
      const listing = toPublic((rows as unknown as Row[])[0]);
      if (listing.indexable) await pingIndexNow(listing.slug);
      res.json({ success: true, listing });
    } catch (err) {
      console.error('[pros] create failed:', err);
      res.status(500).json({ success: false, errors: ['Could not save your listing. Please try again.'] });
    }
  });

  // --- Signed in: edit your own listing (name and trade stay fixed) ---
  app.patch('/api/pros/:id', requireVerifiedUser, async (req: Request, res: Response) => {
    if (!isDbConfigured()) return unavailable(res);
    try {
      const rows = await withDb((sql) => sql`
        SELECT * FROM pro_listings WHERE id = ${Number(req.params.id)} AND clerk_user_id = ${req.verifiedUserId as string} AND status = 'active'`);
      const row = (rows as unknown as Row[])[0];
      if (!row) return res.status(404).json({ success: false, errors: ['Listing not found.'] });
      const { errors, clean } = validateFields(req.body || {}, row.trade_category);
      if (errors.length) return res.status(400).json({ success: false, errors });
      const updated = await withDb((sql) => sql`
        UPDATE pro_listings SET zip_codes_json = ${JSON.stringify(clean.zips)}, city = ${clean.city}, state = ${clean.state},
          phone = ${clean.phone}, website = ${clean.website}, licence_number = ${clean.licence}, description = ${clean.description},
          updated_at = now()
        WHERE id = ${row.id} RETURNING *`);
      const listing = toPublic((updated as unknown as Row[])[0]);
      if (listing.indexable && !isIndexable(row)) await pingIndexNow(listing.slug);
      res.json({ success: true, listing });
    } catch (err) {
      console.error('[pros] update failed:', err);
      res.status(500).json({ success: false, errors: ['Could not save your changes.'] });
    }
  });

  // --- Signed in: remove your own listing ---
  app.delete('/api/pros/:id', requireVerifiedUser, async (req: Request, res: Response) => {
    if (!isDbConfigured()) return unavailable(res);
    try {
      const rows = await withDb((sql) => sql`
        UPDATE pro_listings SET status = 'removed', updated_at = now()
        WHERE id = ${Number(req.params.id)} AND clerk_user_id = ${req.verifiedUserId as string} AND status = 'active'
        RETURNING id`);
      if ((rows as unknown[]).length === 0) return res.status(404).json({ success: false, error: 'Listing not found.' });
      res.json({ success: true });
    } catch (err) {
      console.error('[pros] remove failed:', err);
      res.status(500).json({ success: false, error: 'Could not remove the listing.' });
    }
  });
}

/** For the /pros/:slug page handler in server.ts: the live listing, or null for a slug that isn't live. */
export async function fetchListingForPage(slug: string): Promise<PublicProListing | null> {
  const rows = await withDb((sql) => sql`SELECT * FROM pro_listings WHERE slug = ${slug} AND status = 'active' LIMIT 1`);
  const row = (rows as unknown as Row[])[0];
  return row ? toPublic(row) : null;
}

/** For sitemap-pros.xml: every complete, live listing. */
export async function fetchIndexableListings(): Promise<Array<{ slug: string; lastmod: string }>> {
  const rows = await withDb((sql) => sql`
    SELECT slug, updated_at FROM pro_listings
    WHERE status = 'active' AND char_length(trim(coalesce(description, ''))) >= ${INDEXABLE_MIN_DESCRIPTION}
    ORDER BY created_at ASC`);
  return (rows as unknown as Array<{ slug: string; updated_at: string }>).map((r) => ({
    slug: r.slug, lastmod: new Date(r.updated_at).toISOString().slice(0, 10),
  }));
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Turns the noindex /pros/ shell into this listing's page: real title, description, canonical and robots
 * in <head>, the listing's content as static HTML inside #root for crawlers, and the listing as JSON so the
 * client renders it at once instead of fetching (src/components/FindAPro.tsx reads window.__PRO_LISTING__).
 */
export function renderListingShell(shell: string, l: PublicProListing): string {
  const where = [l.city, l.state].filter(Boolean).join(', ');
  const title = `${l.businessName} -- ${l.tradeCategory}${where ? ` in ${where}` : ''} | Find a Pro`;
  const desc = (l.description || `${l.businessName}, ${l.tradeCategory.toLowerCase()}${where ? ` serving ${where}` : ''}. Listed in Find a Pro on Before Regret.`).slice(0, 155);
  const url = `${SITE}/pros/${l.slug}/`;
  const robots = l.indexable ? 'index, follow, max-image-preview:large' : 'noindex, nofollow';
  let html = shell
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${esc(desc)}"`)
    .replace(/<meta name="robots" content="[^"]*"/, `<meta name="robots" content="${robots}"`)
    .replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${url}"`)
    .replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${url}"`)
    .replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${esc(title)}"`)
    .replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${esc(desc)}"`)
    .replace(/<meta name="twitter:title" content="[^"]*"/, `<meta name="twitter:title" content="${esc(title)}"`)
    .replace(/<meta name="twitter:description" content="[^"]*"/, `<meta name="twitter:description" content="${esc(desc)}"`);
  const body = [
    `<main><p>${esc(l.tradeCategory)}</p><h1>${esc(l.businessName)}</h1>`,
    where ? `<p>Serves ${esc(where)} (ZIP ${esc(l.zipCodes.join(', '))})</p>` : '',
    l.description ? `<p>${esc(l.description)}</p>` : '',
    l.licenceNumber ? `<p>Licence #${esc(l.licenceNumber)}</p>` : '',
    `<p><a href="tel:${esc(l.phone)}">${esc(l.phone)}</a></p>`,
    l.website ? `<p><a href="${esc(l.website)}" rel="nofollow ugc noopener">Website</a></p>` : '',
    `<p>Listed by the business in <a href="/pros/">Find a Pro</a>. Details supplied by the business and not verified by Before Regret.</p></main>`,
  ].join('');
  const data = `<script>window.__PRO_LISTING__=${JSON.stringify(l).replace(/</g, '\\u003c')}</script>`;
  html = html.replace('<div id="root"></div>', `<div id="root">${body}</div>${data}`);
  return html;
}
