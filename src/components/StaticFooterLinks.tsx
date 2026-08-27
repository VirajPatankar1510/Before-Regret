import React from 'react';
import { BookOpen, ShieldCheck } from 'lucide-react';
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
export function StaticFooterLinks({ guides }: StaticFooterLinksProps) {
  return (
    <nav aria-label="Site sections" className="bg-slate-950 text-white py-10 px-4 sm:px-6 lg:px-8 border-t border-slate-900">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-400">
        <div className="space-y-2">
          <div className="font-bold text-white flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>Editorial Guides</span>
          </div>
          <ul className="space-y-2">
            {guides.map((g) => (
              <li key={g.slug}>
                <a href={`/guides/${g.slug}/`} className="hover:text-white block py-1.5">{g.title}</a>
              </li>
            ))}
            <li><a href="/guides/" className="hover:text-white font-bold text-blue-300 block py-1.5">View all guides →</a></li>
          </ul>
        </div>
        <div className="space-y-2">
          <div className="font-bold text-white flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Legal &amp; Support</span>
          </div>
          <ul className="space-y-2">
            <li><a href="/about/" className="hover:text-white font-bold text-blue-300 block py-1.5">About &amp; Methodology</a></li>
            <li><a href="/advertise/" className="hover:text-white font-bold text-blue-300 block py-1.5">Advertise With Us</a></li>
            <li><a href="/support/" className="hover:text-white font-medium text-slate-300 block py-1.5">Customer Support</a></li>
            {/* Mirrors Footer.tsx, reading the same constant so the two renderings of this link
                cannot drift apart. See src/data/preferredSource.ts. */}
            <li><a href={PREFERRED_SOURCE_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white font-medium text-slate-300 block py-1.5">{PREFERRED_SOURCE_LABEL}</a></li>
            <li><a href="/terms/" className="hover:text-white text-slate-400 block py-1.5">Terms of Service</a></li>
            <li><a href="/privacy/" className="hover:text-white text-slate-400 block py-1.5">Privacy Policy</a></li>
            <li><a href="/refunds/" className="hover:text-white text-slate-400 block py-1.5">Refund &amp; Cancellation</a></li>
            <li><a href="/disclaimer/" className="hover:text-white text-slate-400 block py-1.5">Disclaimer</a></li>
            <li><a href="/accessibility/" className="hover:text-white text-slate-400 block py-1.5">Accessibility</a></li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
