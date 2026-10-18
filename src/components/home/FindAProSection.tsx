import React from 'react';
import { Search } from 'lucide-react';
import { TRADE_CATEGORIES } from '../../data/sponsoredVendors';

/**
 * Homepage door to Find a Pro (owner decision, 2026-10-18). Below the guide library on purpose: the
 * homepage's job is the address search and the free report, and this must not compete with it.
 *
 * A plain GET form to /pros/ -- no React state -- so the static prerender and the client render are the
 * same markup, and it works before JavaScript loads. /pros/ reads ?zip= and ?trade= on load.
 *
 * A DELIBERATE TWIN: rendered by both src/components/Hero.tsx and scripts/prerender-homepage.tsx, at the
 * same position in both.
 */
export const FindAProSection: React.FC = () => (
  <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-white border-t border-home-linen">
    <div className="max-w-4xl mx-auto">
      <div className="inline-flex items-center gap-2 rounded-full bg-home-sage text-home-moss px-3 py-1 mb-4">
        <span className="text-[11px] font-bold uppercase tracking-wider">Find a Pro</span>
      </div>
      <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-home-ink tracking-tight">
        Find a local pro before you close
      </h2>
      <p className="mt-3 text-base text-slate-600 max-w-2xl leading-relaxed">
        Inspectors, contractors and specialists who serve the area you&apos;re buying in.
      </p>
      <form action="/pros/" method="get" className="mt-6 grid grid-cols-1 sm:grid-cols-[160px_1fr_auto] gap-3">
        <input
          name="zip" type="text" inputMode="numeric" pattern="[0-9]{5}" maxLength={5} placeholder="ZIP code" aria-label="ZIP code" required
          className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
        />
        <select name="trade" aria-label="Type of pro" defaultValue="" className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500">
          <option value="">Any type of pro</option>
          {TRADE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button type="submit" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-home-navy hover:opacity-90 text-white text-sm font-bold rounded-xl">
          <Search className="w-4 h-4" aria-hidden="true" /><span>Find a Pro</span>
        </button>
      </form>
      <p className="mt-3 text-xs text-slate-500">
        Are you a pro? <a href="/pros/join/" className="font-semibold text-blue-700 hover:underline">Get your business listed free</a>.
      </p>
    </div>
  </section>
);
