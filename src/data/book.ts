// The book BeforeRegret publishes, and the single source of truth for every promo unit that
// points at it. Verified against the live Amazon listing on 2026-09-04.
//
// WHY A DATA FILE FOR ONE BOOK. The promo renders in six places -- the guide page and its
// prerendered static twin, the homepage and its static twin, and the footer and its static twin
// -- because this codebase deliberately keeps client components and prerender output as separate
// files (see StaticFooterLinks.tsx for the reasoning). Six copies of an ASIN is six chances for
// five of them to go stale when an edition changes.
//
// EVERY FIELD BELOW IS A VERIFIED FACT FROM THE LISTING. No price is stored: Amazon shows a
// different currency and figure per marketplace and changes both without notice, so any number
// printed on the site would be wrong for most readers and eventually wrong for all of them.
// The promo says "paperback and Kindle" and lets Amazon quote the price.

export const BOOK = {
  title: 'The Signs of a Fruitful Home',
  subtitle: 'How to Read a House Before You Buy It',
  author: 'Morgan Ellis',
  isbn: '9798171758424',
  url: 'https://www.amazon.com/dp/B0HHQSBR16',
  formats: 'Paperback and Kindle',
} as const;

/**
 * What the promo's links actually point at: an internal route that counts the click and then
 * forwards to BOOK.url. See src/server/adClicksApi.ts.
 *
 * WHY THE INDIRECTION. Until 2026-09-23 every one of these was a bare <a href> straight to Amazon,
 * so after months on seventy pages there was no way to tell whether one person had ever clicked it.
 * That is the reason no judgement about this card -- the cover, the pitch, the button wording --
 * could be settled with anything but opinion. Amazon reports sales, not referrers, so the count has
 * to be taken on the way out.
 *
 * The href stays a plain string, which is the point: BookPromo.tsx is shared by the React tree and
 * by renderToStaticMarkup in the prerender scripts precisely because it needs no handler, and an
 * onClick here would have forced it to become a pair of twins like Footer/StaticFooterLinks. A
 * server redirect keeps that property.
 *
 * robots.txt already disallows /out/, so the seventy links do not ask a crawler to follow them.
 */
export const BOOK_CLICK_PATH = '/out/book';

// rel for every outbound link to the listing.
//
// `sponsored` because this is promotional inventory, sitewide, pointing at a commercial
// destination the site itself profits from. It is not a paid placement in the usual sense -- the
// site owns the book -- but Google's guidance is to mark advertising and promotional links, and a
// self-promotion repeated across every guide page plus a sitewide footer is exactly the pattern
// that guidance exists for. Marking it costs nothing: the link's job is to send readers, not to
// pass ranking signal to Amazon.
//
// `noopener noreferrer` because the link opens a new tab.
export const BOOK_LINK_REL = 'sponsored noopener noreferrer';
