import React from 'react';
import { PREFERRED_SOURCE_URL, PREFERRED_SOURCE_LABEL } from '../data/preferredSource';

export interface FooterGuideSummary {
  slug: string;
  title: string;
}

interface StaticFooterLinksProps {
  guides: FooterGuideSummary[];
}

// A static, JS-free twin of the "Directory Links" block inside the real Footer.tsx -- deliberately
// NOT the whole footer (skips the logo and the "Research a Property" CTA button, which needs
// onNewSearch, a client-only handler with nothing meaningful to render as static markup) and
// deliberately NOT reused by Footer.tsx itself, so the live component's own fetch-and-render
// behavior is untouched.
//
// Why this exists. Footer.tsx's own comment used to read: "No SEO cost: these links have never
// existed in the static HTML... no prerender script renders Footer at all -- confirmed against the
// live homepage." That was a considered call, not an oversight, and it was wrong. Real Search
// Console Index Coverage data found 106 URLs sitting in "Discovered - currently not indexed" --
// Google knows the URL from the sitemap but has never crawled it -- heavily concentrated in the
// county section, which sat behind exactly the single link this component restores. A crawler
// follows the click-through nav to find low-authority pages it wouldn't otherwise prioritize; the
// branding and CTA button contribute nothing to that, which is why only this slice is worth a
// static twin.
//
// Rendered near the bottom of every prerendered page (guides, counties, both hubs, homepage, legal
// pages) via renderToStaticMarkup. Safe to duplicate visually with the real Footer.tsx that mounts
// on top of it: this app uses createRoot(), not hydrateRoot() (see src/main.tsx), so React
// discards everything inside #root -- this block included -- the instant it boots. There is no
// hydration mismatch to worry about and no risk of a stale duplicate footer surviving past first
// paint; this markup only has to do its job for a crawler, or for the brief window before the JS
// bundle takes over.
// 2026-11-23 (Apple-style pass 3): same small-type, four-column layout as Footer.tsx, so the page does not
// visibly change when the app replaces this markup. Same links as before, regrouped.
const L = 'text-slate-600 hover:text-slate-900 hover:underline underline-offset-2 block py-1';

export function StaticFooterLinks({ guides }: StaticFooterLinksProps) {
  return (
    <nav aria-label="Site sections" className="bg-home-mist text-[12px] leading-[1.4] text-slate-500 px-4 sm:px-6 lg:px-8 pt-8 pb-10">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-6 pb-6 border-b border-slate-300">
          <div className="col-span-2 sm:col-span-1">
            <p className="font-semibold text-slate-900 mb-1.5">Guides</p>
            <ul>
              {guides.map((g) => (
                <li key={g.slug}><a href={`/guides/${g.slug}/`} className={L}>{g.title}</a></li>
              ))}
              <li><a href="/guides/" className={L}>View all guides</a></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-slate-900 mb-1.5">Explore</p>
            <ul>
              <li><a href="/" className={L}>Check an address</a></li>
              {/* The studies and /sunlight/ are standalone static documents (prerender-research.tsx,
                  prerender-sunlight.tsx), not SPA routes, so these links are the only crawlable path to
                  them from the rest of the site. ONE HUB LINK for research, not a list: /research/ lists
                  every study and is in the sitemap. */}
              <li><a href="/research/" className={L}>Research &amp; Data</a></li>
              <li><a href="/sunlight/" className={L}>Sunlight by Room</a></li>
              <li><a href="/about/" className={L}>About &amp; Methodology</a></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-slate-900 mb-1.5">For Businesses</p>
            <ul>
              <li><a href="/advertise/" className={L}>Advertise With Us</a></li>
              <li><a href="/my-ads/" className={L}>Manage My Ads</a></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-slate-900 mb-1.5">Support</p>
            <ul>
              <li><a href="/support/" className={L}>Customer Support</a></li>
              {/* Mirrors Footer.tsx, reading the same constant so the two cannot drift apart. */}
              <li><a href={PREFERRED_SOURCE_URL} target="_blank" rel="noopener noreferrer" className={L}>{PREFERRED_SOURCE_LABEL}</a></li>
            </ul>
          </div>
        </div>
        <ul className="pt-4 flex flex-wrap items-center">
          {[
            ['/terms/', 'Terms of Service'],
            ['/privacy/', 'Privacy Policy'],
            ['/refunds/', 'Refund & Cancellation'],
            ['/disclaimer/', 'Disclaimer'],
            ['/accessibility/', 'Accessibility'],
          ].map(([href, label], i) => (
            <li key={href} className={i > 0 ? 'border-l border-slate-300 pl-2.5 ml-2.5' : ''}>
              <a href={href} className={L}>{label}</a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
