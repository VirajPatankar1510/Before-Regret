// The book BeforeRegret promotes on guide pages, and the single source of truth for the promo.
//
// 2026-11-25: brought back on the owner's request as The Signs of a Fruitful Home by Morgan Ellis
// (the owner's pen name), ASIN B0HHPYJ4SX, after the earlier Shri Yantra promo was removed on
// 2026-11-19. Title, subtitle and author are read off the cover the owner supplied; the URL is the
// one the owner pasted (minus the ?th=1 variant parameter, which only pre-selects a format).
//
// No price and no star rating are stored: Amazon changes both without notice and shows a different
// price per marketplace, so any figure printed here would go stale.

export const BOOK = {
  title: 'The Signs of a Fruitful Home',
  subtitle: 'How to Read a House Before You Buy It',
  author: 'Morgan Ellis',
  url: 'https://www.amazon.com/dp/B0HHPYJ4SX',
} as const;

/**
 * What every promo link points at: an internal route that counts the click and then forwards to
 * BOOK.url (src/server/adClicksApi.ts). Amazon reports sales, not referrers, so the only way to know
 * whether anyone clicks is to count on the way out. robots.txt already disallows /out/.
 */
export const BOOK_CLICK_PATH = '/out/book';

// `sponsored` because this is the site's own promotional link to a commercial listing; it is not
// meant to pass ranking signal. `noopener noreferrer` because it opens a new tab.
export const BOOK_LINK_REL = 'sponsored noopener noreferrer';
