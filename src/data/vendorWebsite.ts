// The one rule for the website an advertiser may list (owner, 2026-10-04): their business's OWN,
// official address -- no link shorteners, no redirects, no tracking links. Shared by both checkout
// forms, My Placements, every server route that writes the field, and the /out/ click redirect, so
// a check the browser skips can never be skipped on the server.
//
// Why it matters here specifically: a reader on this site clicks through to an advertiser trusting
// the page. A shortener or redirect hides where that click actually lands, and the destination can
// be changed after we accepted it, so the only thing we can stand behind is a plain link to the
// business's own domain.
//
// Deliberately a blocklist of KNOWN shortener and link-in-bio hosts plus structural tests (URL-shaped
// query values, tracking parameters, raw IPs, credentials in the URL), not an attempt to verify
// that a domain belongs to the business -- nothing on this site verifies advertiser details, and the
// page says so.

const SHORTENER_HOSTS = new Set([
  'bit.ly', 'bitly.com', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly', 'rebrand.ly',
  'cutt.ly', 'shorturl.at', 'tiny.cc', 'rb.gy', 'bl.ink', 'lnkd.in', 's.id', 't.ly', 'short.io',
  'shorte.st', 'adf.ly', 'v.gd', 'qr.ae', 'trib.al', 'soo.gd', 'clck.ru', 'tr.im', 'x.co', 'po.st',
  'urlz.fr', 'snip.ly', 'han.gl', 'dub.sh', 'amzn.to', 'g.co', 'fb.me', 'youtu.be', 'wa.me',
  // Link-in-bio pages: a list of links, not the business's own site.
  'linktr.ee', 'beacons.ai', 'bio.link', 'lnk.bio', 'campsite.bio', 'linkin.bio', 'tap.bio', 'msha.ke',
]);

const TRACKING_PARAMS = new Set([
  'gclid', 'gbraid', 'wbraid', 'fbclid', 'msclkid', 'dclid', 'ttclid', 'twclid', 'li_fat_id', 'mc_eid',
  'mc_cid', 'igshid', 'yclid', '_hsenc', '_hsmi', 'hsctatracking', 'irclickid', 'clickid', 'click_id',
  'aff', 'aff_id', 'affiliate', 'affiliate_id', 'ref', 'referrer', 'ref_id', 'campaign', 'trk',
]);

export const VENDOR_WEBSITE_RULE =
  "Your business's own website only -- no link shorteners, redirects or tracking links.";

/** ok=false always carries an error; ok=true carries the normalised url (null when left blank). A flat
 *  shape, not a union, because this project compiles without strictNullChecks and a union does not narrow. */
export interface VendorWebsiteCheck { ok: boolean; url: string | null; error?: string }

/**
 * Validates and normalises an advertiser's website. Empty means "no website" (the field is
 * optional). A bare domain gets https:// added; anything else must already be http(s).
 */
export function checkVendorWebsite(raw: unknown): VendorWebsiteCheck {
  if (raw === undefined || raw === null) return { ok: true, url: null };
  if (typeof raw !== 'string') return { ok: false, url: null, error: 'Enter your website as a web address.' };
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, url: null };
  if (trimmed.length > 300) return { ok: false, url: null, error: 'That web address is too long. Use your business’s main website address.' };

  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let u: URL;
  try {
    u = new URL(withScheme);
  } catch {
    return { ok: false, url: null, error: 'That doesn’t look like a web address. Enter something like https://yourbusiness.com.' };
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') {
    return { ok: false, url: null, error: 'Enter a web address that starts with https://.' };
  }
  if (u.username || u.password) return { ok: false, url: null, error: 'Enter a plain web address, without a username or password in it.' };

  const host = u.hostname.toLowerCase().replace(/^www\./, '');
  if (!host.includes('.') || /^[\d.]+$/.test(host) || host.startsWith('[')) {
    return { ok: false, url: null, error: 'Enter your business’s domain name, not a server address.' };
  }
  if (u.port) return { ok: false, url: null, error: 'Enter your website without a port number.' };
  if (host === 'beforeregret.com' || host.endsWith('.beforeregret.com')) {
    return { ok: false, url: null, error: 'Enter your own business’s website.' };
  }
  if (SHORTENER_HOSTS.has(host)) {
    return { ok: false, url: null, error: `Link shorteners and link-in-bio pages aren’t accepted. ${VENDOR_WEBSITE_RULE}` };
  }

  for (const [key, value] of u.searchParams) {
    const k = key.toLowerCase();
    if (k.startsWith('utm_') || TRACKING_PARAMS.has(k)) {
      return { ok: false, url: null, error: `Tracking links aren’t accepted -- remove the "${key}" part. ${VENDOR_WEBSITE_RULE}` };
    }
    // A query value that is itself a web address is how redirects are built (?url=, ?next=, ?r=).
    const v = value.toLowerCase();
    if (/^(https?:|www\.)/.test(v) || v.includes('://') || /^\/\//.test(v)) {
      return { ok: false, url: null, error: `Redirect links aren’t accepted. ${VENDOR_WEBSITE_RULE}` };
    }
  }
  if (/%3a%2f%2f|https?:\/\/|\/\/www\./i.test(u.pathname + u.hash)) {
    return { ok: false, url: null, error: `Redirect links aren’t accepted. ${VENDOR_WEBSITE_RULE}` };
  }

  return { ok: true, url: u.toString() };
}
