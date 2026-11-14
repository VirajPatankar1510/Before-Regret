// The book BeforeRegret promotes, and the single source of truth for every promo unit that
// points at it.
//
// 2026-11-15: swapped from The Signs of a Fruitful Home (B0HHQSBR16) to the owner's Shri Yantra
// book, B0DFKB6FG2, on the owner's request. Amazon refuses automated readers, so every field below
// comes from the listing text the owner pasted in on 2026-11-15 (title, author, format). No ISBN
// was in it, so none is stored.
//
// WHY A DATA FILE FOR ONE BOOK. The promo renders in six places -- the guide page and its
// prerendered static twin, the homepage and its static twin, and the footer and its static twin
// -- because this codebase deliberately keeps client components and prerender output as separate
// files (see StaticFooterLinks.tsx for the reasoning). Six copies of an ASIN is six chances for
// five of them to go stale when an edition changes.
//
// No price is stored: Amazon shows a different currency and figure per marketplace and changes
// both without notice, so any number printed on the site would be wrong for most readers and
// eventually wrong for all of them.

export const BOOK = {
  // The owner's exact wording, casing included (2026-11-15). It matches the listing's title.
  title: 'Manifestation using the most powerful Yantra in this universe',
  author: 'Tathas Tu',
  format: 'Paperback',
  url: 'https://www.amazon.com/dp/B0DFKB6FG2',
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
