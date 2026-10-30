import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, ChevronDown, Search, ShieldAlert, SearchCheck, Link2, Printer, Check, ClipboardPaste, Wrench, ArrowRight, X } from 'lucide-react';
import { ContentLink } from './home/ContentLink';
import { reportDecoderEvent } from '../utils/ctaClickBeacon';
import { DECODER_TERMS, DECODER_CATEGORIES, findTermsInText, normaliseForMatch, type DecoderTerm } from '../data/inspectionDecoderTerms';

// Inspection Report Decoder -- PREVIEW (2026-10-30). See src/data/inspectionDecoderTerms.ts for what it knows and
// what it deliberately leaves out. Runs entirely in the browser: no AI, no outside API, no requests at all. A pasted
// report is matched here and never sent anywhere. Noindex while it's a preview (scripts/prerender-noindex-routes.tsx
// and the App.tsx head).
//
// LAYOUT (owner, 2026-10-30): an accordion. With 43 terms, a chip list that added cards BELOW the list hid the answer
// off-screen, so nobody could tell anything happened. Each term is now a row; tapping it opens the explanation right
// under that row. Paste-scan opens every match and scrolls to the first. Once anything is open, a bar pinned to the
// bottom of the screen offers Share and Print, which include only the open explanations.
//
// "SHARED BY" IS OPT-IN ONLY (owner, 2026-10-30). An earlier draft looked up ANY Find a Pro slug passed as ?via=,
// which let anyone make a link that appeared to be shared by a business that never shared it, and gave every free
// listing a feature meant to be paid. Until the opt-in/paid "Shared by" product exists (with its own flag in the
// database, checked on the server), the only accepted value is ?via=example: a clearly labelled demo. Any other
// value is ignored and dropped from the URL.

interface Props { onNavigate: (path: string) => void }

const readParams = () => {
  if (typeof window === 'undefined') return { ids: [] as string[], via: '' };
  const p = new URLSearchParams(window.location.search);
  const ids = (p.get('t') || '').split(',').map((s) => s.trim()).filter((s) => DECODER_TERMS.some((t) => t.id === s));
  return { ids, via: p.get('via') === 'example' ? 'example' : '' };
};

const SeriousnessBadge: React.FC<{ term: DecoderTerm }> = ({ term }) => (
  term.seriousness.level === 'safety' ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[11px] font-bold text-red-700 shrink-0"><ShieldAlert className="w-3 h-3" aria-hidden="true" />Safety item</span>
  ) : term.seriousness.level === 'investigate' ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-800 shrink-0"><SearchCheck className="w-3 h-3" aria-hidden="true" />Investigate</span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-800 shrink-0"><Check className="w-3 h-3" aria-hidden="true" />Usually minor</span>
  )
);

/** The explanation shown under a term's row when it is open. */
const TermBody: React.FC<{ term: DecoderTerm; onNavigate: (p: string) => void }> = ({ term, onNavigate }) => (
  <div id={`term-body-${term.id}`} className="px-4 sm:px-5 pb-5 pt-1 space-y-4 text-[15px] text-slate-700 leading-relaxed">
    <p>{term.meaning}</p>
    <div>
      <h3 className="text-sm font-bold text-home-ink">Why it matters</h3>
      <ul className="mt-1.5 space-y-1.5 list-disc pl-5">{term.whyItMatters.map((w) => <li key={w}>{w}</li>)}</ul>
    </div>
    <p className="text-sm"><strong className="text-home-ink">How serious:</strong> {term.seriousness.text}</p>
    <p className="text-sm inline-flex items-start gap-1.5"><Wrench className="w-4 h-4 text-home-oak mt-0.5 shrink-0" aria-hidden="true" /><span><strong className="text-home-ink">Who checks it:</strong> {term.whoChecksIt}</span></p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="rounded-2xl bg-home-stone/60 p-4">
        <h3 className="text-sm font-bold text-home-ink">Ask your inspector</h3>
        <ul className="mt-1.5 space-y-1.5 text-sm list-disc pl-5">{term.askYourInspector.map((q) => <li key={q}>{q}</li>)}</ul>
      </div>
      <div className="rounded-2xl bg-home-stone/60 p-4">
        <h3 className="text-sm font-bold text-home-ink">Ask the seller</h3>
        <ul className="mt-1.5 space-y-1.5 text-sm list-disc pl-5">{term.askTheSeller.map((q) => <li key={q}>{q}</li>)}</ul>
      </div>
    </div>
    <ContentLink href={term.guide.href} onNavigate={(p) => { reportDecoderEvent('decoder_guide_click'); onNavigate(p); }} className="print:hidden inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700">
      <span>Full guide: {term.guide.title}</span><ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
    </ContentLink>
  </div>
);

/** One term: a row you tap to open its explanation directly underneath. */
const TermRow: React.FC<{ term: DecoderTerm; open: boolean; onToggle: () => void; onNavigate: (p: string) => void }> = ({ term, open, onToggle, onNavigate }) => (
  <div id={`term-${term.id}`} className={`rounded-2xl border bg-white scroll-mt-24 ${open ? 'border-home-oak shadow-sm' : 'border-slate-200'} ${open ? '' : 'print:hidden'}`}>
    <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={`term-body-${term.id}`}
      className="w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 text-left">
      <span className="flex-1 min-w-0">
        <span className="block text-[15px] font-semibold text-home-ink">{term.name}</span>
        <span className="mt-1 inline-flex"><SeriousnessBadge term={term} /></span>
      </span>
      <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform print:hidden ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
    </button>
    {open && <TermBody term={term} onNavigate={onNavigate} />}
  </div>
);

export const InspectionDecoder: React.FC<Props> = ({ onNavigate }) => {
  const initial = useMemo(readParams, []);
  const [openIds, setOpenIds] = useState<string[]>(initial.ids);
  const [query, setQuery] = useState('');
  const [pasted, setPasted] = useState('');
  const [scanNote, setScanNote] = useState('');
  const [copied, setCopied] = useState(false);
  const showExample = initial.via === 'example';

  // Private usage counts (never shown on the site): one view per visitor per day, and whether they came from a shared link.
  useEffect(() => { reportDecoderEvent(initial.ids.length ? 'decoder_view_shared' : 'decoder_view'); }, [initial.ids.length]);

  // Arriving from a shared link: start at the first opened term so the answer is in view.
  useEffect(() => {
    if (initial.ids.length) {
      setTimeout(() => document.getElementById(`term-${initial.ids[0]}`)?.scrollIntoView({ block: 'start' }), 50);
    } else {
      window.scrollTo(0, 0);
    }
  }, [initial.ids]);

  // Keep the URL shareable: the open terms (and the demo via) only -- never pasted text.
  useEffect(() => {
    const p = new URLSearchParams();
    if (openIds.length) p.set('t', openIds.join(','));
    if (initial.via) p.set('via', initial.via);
    const qs = p.toString();
    window.history.replaceState({}, '', `/tools/inspection-decoder/${qs ? `?${qs}` : ''}`);
  }, [openIds, initial.via]);

  const toggle = (id: string) => {
    if (!openIds.includes(id)) reportDecoderEvent(`decoder_open:${id}`);
    setOpenIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };
  const q = normaliseForMatch(query).trim();
  const visible = q ? DECODER_TERMS.filter((t) => [t.name, ...t.aliases].some((a) => normaliseForMatch(a).includes(q))) : DECODER_TERMS;

  const scan = () => {
    const found = findTermsInText(pasted);
    if (!found.length) { reportDecoderEvent('decoder_scan_none'); setScanNote('We didn’t find any of the terms we cover yet. Try the search box or the list below.'); return; }
    reportDecoderEvent('decoder_scan_found');
    setQuery('');
    setOpenIds((s) => Array.from(new Set([...found.map((t) => t.id), ...s])));
    setScanNote(`Found ${found.length}, opened below. A term can appear because the report says it’s fine, so check each one against your report. Your text stayed on your device.`);
    setTimeout(() => document.getElementById(`term-${found[0].id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };

  const share = async () => {
    reportDecoderEvent('decoder_share');
    const url = window.location.href;
    try {
      if (navigator.share) { await navigator.share({ title: 'Inspection report terms explained', url }); return; }
      await navigator.clipboard.writeText(url);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    } catch { /* user cancelled */ }
  };

  return (
    <div className="min-h-screen bg-home-stone font-sans text-home-ink pb-28">
      <div className="border-b border-home-linen bg-white/70 print:hidden">
        <nav aria-label="Breadcrumb" className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <ContentLink href="/" onNavigate={onNavigate} className="hover:text-home-ink">Before Regret</ContentLink>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
          <span className="text-home-ink font-semibold">Inspection Report Decoder</span>
        </nav>
      </div>

      {showExample && (
        <div className="bg-white border-b border-home-linen">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 text-sm text-slate-700">
            <p><span className="font-bold text-home-ink">Shared by Your Name</span> · Your Brokerage · Licence #00000 · (555) 555-0100 <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-800">Example: how your details would appear</span></p>
          </div>
        </div>
      )}

      <header className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-home-brass">Free tool · Preview</p>
        <h1 className="mt-3 font-serif text-[2.1rem] leading-[1.1] sm:text-5xl font-semibold tracking-[-0.01em] [text-wrap:balance]">Inspection Report Decoder</h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
          Tap a term from your home inspection report to open a plain-English explanation right under it: what it means, how serious it
          usually is, who checks it, and what to ask your inspector and the seller.
        </p>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 space-y-5">
        <section className="rounded-3xl bg-white border border-home-linen shadow-sm p-5 sm:p-6 space-y-4 print:hidden">
          <div>
            <label htmlFor="decoder-search" className="text-sm font-bold">Search for a term</label>
            <div className="mt-2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input id="decoder-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. open ground, GFCI, radon"
                className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
              {query && (
                <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
              )}
            </div>
          </div>
          <details className="group rounded-xl border border-slate-200">
            <summary className="flex items-center justify-between gap-2 cursor-pointer list-none px-4 py-3 text-sm font-bold [&::-webkit-details-marker]:hidden">
              <span className="inline-flex items-center gap-2"><ClipboardPaste className="w-4 h-4 text-home-oak" aria-hidden="true" />Have the report text? Paste it and we’ll find the terms</span>
              <ChevronDown className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="px-4 pb-4">
              <textarea id="decoder-paste" value={pasted} onChange={(e) => { setPasted(e.target.value); setScanNote(''); }} rows={4}
                placeholder="Paste a paragraph or two. It’s scanned here in your browser and never sent anywhere."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button type="button" onClick={scan} disabled={!pasted.trim()} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl disabled:opacity-50">
                  Find terms
                </button>
                {scanNote && <p className="text-sm text-slate-600" role="status">{scanNote}</p>}
              </div>
            </div>
          </details>
        </section>

        <div className="space-y-6">
          {DECODER_CATEGORIES.map((cat) => {
            const inCat = visible.filter((t) => t.category === cat);
            if (!inCat.length) return null;
            const anyOpen = inCat.some((t) => openIds.includes(t.id));
            return (
              <section key={cat} className={anyOpen ? '' : 'print:hidden'}>
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-home-brass mb-2 px-1">{cat}</h2>
                <div className="space-y-2">
                  {inCat.map((t) => <TermRow key={t.id} term={t} open={openIds.includes(t.id)} onToggle={() => toggle(t.id)} onNavigate={onNavigate} />)}
                </div>
              </section>
            );
          })}
          {!visible.length && <p className="text-sm text-slate-500 px-1">We don’t have that term yet. Try a different word, or clear the search to see all {DECODER_TERMS.length}.</p>}
        </div>

        <section className="rounded-3xl bg-white/70 border border-home-linen p-6 text-sm text-slate-600 leading-relaxed space-y-2">
          <h2 className="text-sm font-bold text-home-ink">About this tool</h2>
          <p>
            This explains what a term <em>usually</em> means. Your inspector’s report and a licensed professional decide what it means for your house.
            The explanations are fixed text drawn from our published guides: the tool doesn’t use AI to produce answers, and nothing you paste leaves your browser.
          </p>
          <p>This preview covers {DECODER_TERMS.length} common terms, each linked to our full guide on it. More are being added.</p>
        </section>
      </main>

      {openIds.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur print:hidden">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2">
            <span className="text-sm font-semibold text-home-ink mr-auto">{openIds.length} open</span>
            <button type="button" onClick={() => setOpenIds([])} className="px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900">Close all</button>
            <button type="button" onClick={() => { reportDecoderEvent('decoder_print'); window.print(); }} className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-bold rounded-xl">
              <Printer className="w-4 h-4" aria-hidden="true" />Print
            </button>
            <button type="button" onClick={share} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl">
              {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Link2 className="w-4 h-4" aria-hidden="true" />}{copied ? 'Copied' : 'Share'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
