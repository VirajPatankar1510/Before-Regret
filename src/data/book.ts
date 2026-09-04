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

// rel for every outbound link to the listing.
//
// `sponsored` because this is promotional inventory, sitewide, pointing at a commercial
// destination the site itself profits from. It is not a paid placement in the usual sense -- the
// site owns the book -- but Google's guidance is to mark advertising and promotional links, and a
// self-promotion repeated across 37 guide pages plus a sitewide footer is exactly the pattern
// that guidance exists for. Marking it costs nothing: the link's job is to send readers, not to
// pass ranking signal to Amazon.
//
// `noopener noreferrer` because the link opens a new tab.
export const BOOK_LINK_REL = 'sponsored noopener noreferrer';
