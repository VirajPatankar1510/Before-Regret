import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Check, ChevronRight, ClipboardCopy, FileSearch, Home, Lightbulb, Loader2, Printer, ShieldCheck, Droplets, ScrollText,
} from 'lucide-react';
import type { PropertySearchResult } from '../../types';
import { AddressSearchBox } from '../AddressSearchBox';
import { ContentLink } from '../home/ContentLink';
import {
  QUESTIONS, WORK, advance, openPart, setupOrder, collectFindings, flowOrder, countedQuestions, forDeadline, waitsForInspection, itemLabel, daysLeft, eraItems, formatShortDate, freshResearch, isSolved,
  loadResearch, saveResearch,
  type BuyingStage, type EraItem, type QuestionId, type ResearchState, type WorkKey,
} from './researchState';
import { PermitView, preparePermitAnswer } from './PermitView';
import { MissionView } from './MissionView';
import { MISSION_IDS, type MissionId } from './missions';
import { FinalReportView, buildFullReport } from './FinalReport';
import { ReportAssentNotice } from '../ReportAssentNotice';
import type { PropertyReport } from '../../types';
import { reportCtaClick, type CtaId } from '../../utils/ctaClickBeacon';
import { BackToPlan, BoxLabel, FlowHeader, SkipPart, btnGhost, btnPrimary, card, eyebrow, linkBtn, type Updater } from './ui';

// Guided research tool -- UNPUBLISHED (owner, 2026-11-18: "don't publish until our entire tool is ready").
// Stage 1: setup questions, the plan, and the era question. Plan: docs/plans/guided-research-tool-2026-11.md.
// Voice: docs/brand/voice-guide.md, Level 1 (friendly, plain) with Level 3 for the "what this is" notes.

interface Props {
  onNavigate: (path: string) => void;
  /** The quick report, offered beside "research it step by step" whenever an address is entered here. */
  onQuickReport: (property: PropertySearchResult) => void;
}

const ICONS: Record<QuestionId, React.FC<{ className?: string }>> = {
  era: Home,
  permits: ScrollText,
  insure: ShieldCheck,
  water: Droplets,
  decode: FileSearch,
};

const STAGES: [BuyingStage, string, string][] = [
  ['looking', 'Just looking', 'Doing my homework before an offer'],
  ['offer', 'Made an offer', 'Waiting to hear back'],
  ['contract', 'Under contract', 'The clock’s running. We’ll keep it quick.'],
];
const STAGE_LABEL: Record<BuyingStage, string> = { looking: 'Just looking', offer: 'Offer made', contract: 'Under contract' };

export const HouseResearchTool: React.FC<Props> = ({ onNavigate, onQuickReport }) => {
  const [state, setState] = useState<ResearchState | null>(() => loadResearch());
  const topRef = useRef<HTMLDivElement>(null);
  const [finalReport, setFinalReport] = useState<PropertyReport | null>(null);
  const [building, setBuilding] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);

  const finish = async () => {
    if (!state || building) return;
    setBuilding(true);
    setBuildError(null);
    const result = await buildFullReport(state.property);
    setBuilding(false);
    if ('report' in result) {
      setFinalReport(result.report);
      update({ finalReportId: result.report.id, view: 'final' });
    } else {
      setBuildError(result.error);
    }
  };
  const reset = () => { setFinalReport(null); setState(null); };

  useEffect(() => { saveResearch(state); }, [state]);

  // Look up who keeps the permits as soon as the house is known, so the permit question opens without a wait
  // (walk-through 2026-11-19: "Finding who keeps the permits…" took 2-4 seconds).
  useEffect(() => {
    if (!state || isSolved(state, 'permits')) return;
    preparePermitAnswer(state.property, state.permits.authority, (authority) => update((s) => ({ permits: { ...s.permits, authority } })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.property.lat, state?.property.lon]);

  // Funnel (Stage 4): where visitors stop. Each step is sent once per house; only the event name and page path go.
  useEffect(() => {
    if (!state) return;
    const sent = state.funnel || [];
    const due: CtaId[] = [];
    if (state.view !== 'setup' && !sent.includes('research_details_done')) due.push('research_details_done');
    if (QUESTIONS.some((q) => isSolved(state, q.id)) && !sent.includes('research_first_solved')) due.push('research_first_solved');
    if (state.finalReportId && !sent.includes('research_report_done')) due.push('research_report_done');
    if (!due.length) return;
    due.forEach(reportCtaClick);
    update((s) => ({ funnel: [...(s.funnel || []), ...due] }));
  }, [state]);

  const update = (patch: Partial<ResearchState> | ((s: ResearchState) => Partial<ResearchState>)) =>
    setState((s) => (s ? { ...s, ...(typeof patch === 'function' ? patch(s) : patch) } : s));

  // Each screen starts at the top, like a new page would.
  const viewKey = state ? `${state.view}-${state.setupStep}-${state.era.solved}-${state.era.step}-${state.permits.stage}-${state.permits.step}-${MISSION_IDS.map((m) => `${state.missions?.[m]?.stage || ''}${state.missions?.[m]?.step ?? ''}`).join('')}` : 'start';
  useEffect(() => { window.scrollTo(0, 0); }, [viewKey]);

  if (state?.view === 'final') {
    return (
      <FinalReportView state={state} update={update} report={finalReport} setReport={setFinalReport} onReset={reset}
        findings={<ResearchFindings state={state} compact />} />
    );
  }

  return (
    <div ref={topRef} className="min-h-screen bg-home-stone font-sans text-home-ink pb-24">
      {building && (
        <div className="fixed inset-0 z-50 bg-home-ink/70 backdrop-blur-sm flex items-center justify-center p-6" role="status">
          <div className="rounded-3xl bg-white p-8 max-w-sm text-center space-y-3 shadow-2xl">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-home-moss" />
            <p className="font-bold text-lg">Building your report</p>
            <p className="text-sm text-slate-600">Adding the neighborhood profile and the rest of the free report to what you found.</p>
          </div>
        </div>
      )}
      <div className="border-b border-home-linen bg-white/70 print:hidden">
        <nav aria-label="Breadcrumb" className="max-w-2xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <ContentLink href="/" onNavigate={onNavigate} className="hover:text-home-ink">Before Regret</ContentLink>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
          <span className="text-home-ink font-semibold">Research a house</span>
        </nav>
      </div>
      <main key={viewKey} className="max-w-2xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 animate-fade-in">
        {!state ? (
          <StartView onStart={(p) => setState(freshResearch(p))} onQuickReport={onQuickReport} />
        ) : state.view === 'setup' ? (
          <SetupView state={state} update={update} />
        ) : state.view === 'era' ? (
          <EraView state={state} update={update} onNavigate={onNavigate} />
        ) : state.view === 'permits' ? (
          <PermitView state={state} update={update} onNavigate={onNavigate} />
        ) : (MISSION_IDS as string[]).includes(state.view) ? (
          <MissionView id={state.view as MissionId} state={state} update={update} />
        ) : state.view === 'report' ? (
          <ReportView state={state} update={update} onFinish={finish} error={buildError} hasFinal={!!state.finalReportId} />
        ) : (
          <PlanView state={state} update={update} onReset={reset} onFinish={finish} error={buildError} />
        )}
      </main>
    </div>
  );
};

// ---------------------------------------------------------------------------------------------------------------

const StartView: React.FC<{ onStart: (p: PropertySearchResult) => void; onQuickReport: (p: PropertySearchResult) => void }> = ({ onStart, onQuickReport }) => (
  <section className="space-y-6">
    <div className="space-y-3">
      <p className={eyebrow}>Free. No sign-up required.</p>
      <h1 className="font-serif text-[2.1rem] leading-[1.1] sm:text-5xl font-semibold tracking-[-0.01em] [text-wrap:balance]">Let’s check this house, one question at a time.</h1>
      <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
        We’ll show you what to check, where to find it and what to do with the answer. You finish with your own report.
      </p>
    </div>
    <div className="rounded-3xl bg-home-navy p-4 sm:p-5">
      <AddressSearchBox onSelectProperty={onQuickReport} onStartResearch={onStart} />
    </div>
    <p className="text-sm text-slate-500 text-center">Your answers stay on this device. We don’t ask for your email.</p>
  </section>
);

// ---------------------------------------------------------------------------------------------------------------


const SetupView: React.FC<{ state: ResearchState; update: Updater }> = ({ state, update }) => {
  const n = state.setupStep;
  // Only "Under contract" gets the deadline screen (walk-throughs 2026-11-18 and 11-19).
  const order = setupOrder(state);
  const at = Math.max(0, order.indexOf(n));
  const next = () => (at < order.length - 1
    ? update({ setupStep: order[at + 1], ...(state.stage !== 'contract' ? { deadline: '' } : {}) })
    : update((s) => advance(s)));
  const back = () => (at > 0 ? update({ setupStep: order[at - 1] }) : undefined);
  const toggleClaim = (k: WorkKey) =>
    update((s) => ({ claims: s.claims.includes(k) ? s.claims.filter((c) => c !== k) : [...s.claims, k] }));

  return (
    <section className="space-y-6">
      <FlowHeader state={state} part="setup" inner={at} update={update} onBack={at > 0 ? back : undefined}
        left={<span className="text-sm text-slate-500 truncate max-w-[60%]">{state.property.displayName}</span>} />

      {n === 0 && (
        <div className="space-y-4">
          <h2 className="font-serif text-3xl font-semibold">Where are you with this house?</h2>
          <p className="text-slate-600">So we only show what applies to you right now.</p>
          <div className="space-y-2.5" role="radiogroup" aria-label="Where are you with this house?">
            {STAGES.map(([v, label, sub]) => (
              <button key={v} type="button" role="radio" aria-checked={state.stage === v}
                onClick={() => update({ stage: v })}
                className={`w-full text-left rounded-2xl border px-4 py-3.5 transition-colors cursor-pointer ${state.stage === v ? 'border-home-moss bg-home-sage' : 'border-home-linen bg-white hover:border-home-oak'}`}>
                <span className="block font-bold">{label}</span>
                <span className="block text-sm text-slate-600">{sub}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {n === 1 && (
        <div className="space-y-4">
          <h2 className="font-serif text-3xl font-semibold">Got a deadline?</h2>
          <p className="text-slate-600">{forDeadline('Like the end of your inspection or option period.', state)} We’ll show what to get done before then, and put the date on your report.</p>
          <label className="block">
            <span className="block text-sm font-bold mb-1.5">Deadline</span>
            <input type="date" value={state.deadline} onChange={(e) => update({ deadline: e.target.value })}
              className="w-full rounded-xl border border-home-linen bg-white px-4 py-3 text-base focus:outline-none focus:border-home-oak" />
          </label>
          <button type="button" className={linkBtn} onClick={() => { update({ deadline: '', setupStep: 2 }); }}>No deadline yet</button>
        </div>
      )}

      {n === 2 && (
        <div className="space-y-4">
          <h2 id="claims-q" className="font-serif text-3xl font-semibold">What does the seller say they updated?</h2>
          <p className="text-slate-600">Check the listing or the disclosure. Pick any that apply. We’ll help you check them against the records.</p>
          <div className="flex flex-wrap gap-2" role="group" aria-labelledby="claims-q">
            {(Object.keys(WORK) as WorkKey[]).map((k) => {
              const on = state.claims.includes(k);
              return (
                <button key={k} type="button" aria-pressed={on} onClick={() => toggleClaim(k)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${on ? 'border-home-moss bg-home-sage' : 'border-home-linen bg-white hover:border-home-oak'}`}>
                  {on && <Check className="w-3.5 h-3.5" />}{WORK[k]}
                </button>
              );
            })}
          </div>
          <button type="button" className={linkBtn} onClick={() => update((s) => ({ claims: [], ...advance({ ...s, claims: [] }) }))}>Nothing mentioned</button>
        </div>
      )}

      <button type="button" className={btnPrimary} onClick={next} disabled={n === 0 && !state.stage}>
        {at < order.length - 1 ? 'Next' : 'Show me what to check'} <ArrowRight className="w-4 h-4" />
      </button>
    </section>
  );
};

// ---------------------------------------------------------------------------------------------------------------

const Ring: React.FC<{ done: number; total: number }> = ({ done, total }) => {
  const r = 24, c = 2 * Math.PI * r, f = c * (total ? done / total : 0);
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true" className="shrink-0">
      <circle cx="28" cy="28" r={r} fill="none" stroke="var(--color-home-linen)" strokeWidth="6" />
      <circle cx="28" cy="28" r={r} fill="none" stroke="var(--color-home-moss)" strokeWidth="6" strokeLinecap="round"
        strokeDasharray={`${f} ${c}`} transform="rotate(-90 28 28)" style={{ transition: 'stroke-dasharray .6s ease' }} />
      <text x="28" y="33" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--color-home-ink)">{done}</text>
    </svg>
  );
};

function solvedLine(state: ResearchState, id: QuestionId): string {
  if (id === 'era') { const n = (state.era.picked || []).length; return n ? `${n} on your checklist` : 'nothing added to your checklist'; }
  if (id === 'permits') {
    const { permitRows } = collectFindings(state);
    // Each item with what was found, e.g. "Roof: permit on record, signed off" (walk-through 2026-11-18).
    return permitRows.map((r) => (r.key === 'any' ? r.meaning.found : `${itemLabel(r.key)}: ${r.meaning.found.charAt(0).toLowerCase()}${r.meaning.found.slice(1)}`)).join(' · ');
  }
  const m = collectFindings(state).missionRows.find((r) => r.id === id);
  return m ? m.rows.map((r) => r.meaning.found).join(' · ') : '';
}

const PlanView: React.FC<{ state: ResearchState; update: Updater; onReset: () => void; onFinish: () => void; error: string | null }> = ({ state, update, onReset, onFinish, error }) => {
  const p = state.property;
  const dl = daysLeft(state.deadline);
  const live = countedQuestions(state);
  const done = live.filter((q) => isSolved(state, q.id)).length;
  const allDone = done === live.length;
  const firstOpen = flowOrder(state).find((id) => !isSolved(state, id));
  const era = eraItems(p);
  const eraCount = era ? era.items.length : 0;
  const place = [p.city, p.county, p.state].filter(Boolean).join(', ');
  // What's still open after the questions (walk-through 2026-11-19: "All answered" read as hollow when most answers
  // were "couldn't check" or "not yet").
  const toCheck = collectFindings(state).verify.length;
  const toCheckLine = toCheck > 0
    ? `${toCheck === 1 ? 'One thing' : `${toCheck} things`} still to check. Your report lists ${toCheck === 1 ? 'it' : 'them'}, with the questions for the seller ready to send.`
    : null;

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className={eyebrow}>{place}</p>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight [text-wrap:balance]">{p.displayName || p.formattedAddress}</h1>
        <div className="flex flex-wrap gap-2 pt-1">
          {state.stage && <span className="rounded-full bg-white border border-home-linen px-3 py-1 text-xs font-semibold">{STAGE_LABEL[state.stage]}</span>}
          {dl !== null && (
            <span className="rounded-full bg-white border border-home-linen px-3 py-1 text-xs font-semibold">
              Deadline {formatShortDate(state.deadline)} · {dl >= 0 ? `${dl} day${dl === 1 ? '' : 's'} left` : 'passed'}
            </span>
          )}
        </div>
      </div>

      {!allDone && !state.finalReportId && (
        // The summary is the end of the flow (owner, 2026-11-19). Questions left over were skipped, or the visitor
        // came back later: one button carries on from the first unanswered one.
        <div className={`${card} space-y-3`}>
          <p className={eyebrow}>{done} of {live.length} answered</p>
          <h2 className="font-serif text-2xl font-semibold leading-tight">{state.reachedEnd ? 'Your report is ready' : done === 0 ? 'Start with the first question' : 'Pick up where you left off'}</h2>
          {state.reachedEnd && <p className="text-sm text-slate-600">You skipped {live.length - done === 1 ? 'one question' : `${live.length - done} questions`}. Your report fills in if you answer {live.length - done === 1 ? 'it' : 'them'} later.</p>}
          {state.reachedEnd && toCheckLine && <p className="text-sm text-slate-600">{toCheckLine}</p>}
          {state.reachedEnd ? (
            <>
              <GetReport onFinish={onFinish} error={error} update={update} label="Get my report" />
              <button type="button" className={btnGhost} onClick={() => update((s) => ({ ...openPart(s, firstOpen!), reachedEnd: false }))}>Answer the skipped {live.length - done === 1 ? 'question' : 'questions'}</button>
            </>
          ) : (
            <button type="button" className={btnPrimary} onClick={() => update((s) => ({ ...openPart(s, firstOpen!), reachedEnd: false }))}>Continue <ArrowRight className="w-4 h-4" /></button>
          )}
        </div>
      )}

      {allDone && (
        state.finalReportId ? (
          <button type="button" className={btnPrimary} onClick={() => update({ view: 'final' })}>Open your report <ArrowRight className="w-4 h-4" /></button>
        ) : (
          <div className={`${card} space-y-3 border-home-moss`}>
            <p className={eyebrow}>All {live.length} questions answered</p>
            <h2 className="font-serif text-2xl font-semibold leading-tight">Your report is ready</h2>
            {toCheckLine && <p className="font-semibold">{toCheckLine}</p>}
            <p className="text-sm text-slate-600">What you found, the questions for the seller and your checklist, plus the free area report for this address. One page you can print or share.</p>
            <GetReport onFinish={onFinish} error={error} update={update} label="Get my report" />
          </div>
        )
      )}

      <div className={`${card} space-y-4`}>
        <p className={eyebrow}>About this house</p>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-slate-500">Address</dt>
            <dd className="font-semibold">{p.formattedAddress || p.displayName}{p.unitNumber ? `, Unit ${p.unitNumber}` : ''}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Built <span className="text-slate-400">(your answer)</span></dt>
            <dd className="font-semibold">{p.yearBuilt}{era ? ` · ${era.eraLabel}` : ''}</dd>
            {eraCount > 0 && <dd className="text-slate-600 mt-0.5">{eraCount} things worth checking on a house of that age.</dd>}
          </div>
          {state.claims.length > 0 && (
            <div>
              <dt className="text-slate-500">The seller says they updated <span className="text-slate-400">(your answer)</span></dt>
              <dd className="font-semibold">{state.claims.map((k) => WORK[k]).join(', ')}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <Ring done={done} total={live.length} />
          <div>
            <h2 className="text-lg font-bold">Questions about this house</h2>
            <p className="text-sm text-slate-600">{done > 0 ? 'Tap one to change your answer.' : 'We’ll go through them one at a time.'}</p>
          </div>
        </div>
        <div className="space-y-2.5">
          {QUESTIONS.map((q) => {
            const Icon = ICONS[q.id];
            const solved = isSolved(state, q.id);
            const inner = (
              <>
                <span className={`mt-0.5 w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${solved ? 'bg-home-moss text-white' : 'bg-home-stone text-home-brass'}`}>
                  {solved ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </span>
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="block font-bold leading-snug">{q.title(state)}</span>
                  {solved
                    ? <span className="block text-sm text-home-moss font-semibold">Answered: {solvedLine(state, q.id)}</span>
                    : <span className="block text-sm text-slate-600">{q.teaser}</span>}
                  {waitsForInspection(state, q.id) && <span className="inline-block rounded-full bg-home-stone px-2.5 py-0.5 text-[11px] font-bold text-slate-500">For after your inspection</span>}
                  {!q.live && <span className="inline-block rounded-full bg-home-stone px-2.5 py-0.5 text-[11px] font-bold text-slate-500">Coming soon</span>}
                </span>
                {q.live && <ChevronRight className="w-5 h-5 text-slate-400 shrink-0 self-center" />}
              </>
            );
            return q.live ? (
              <button key={q.id} type="button" onClick={() => update((s) => openPart(s, q.id))}
                className="w-full text-left flex gap-3 rounded-2xl border border-home-linen bg-white p-4 hover:border-home-oak transition-colors cursor-pointer">
                {inner}
              </button>
            ) : (
              <div key={q.id} className="flex gap-3 rounded-2xl border border-dashed border-home-linen bg-white/60 p-4 opacity-80">{inner}</div>
            );
          })}
        </div>
      </div>

      {!allDone && state.finalReportId && (
        <button type="button" className={btnPrimary} onClick={() => update({ view: 'final' })}>Open your report <ArrowRight className="w-4 h-4" /></button>
      )}
      <div className="text-center">
        <button type="button" className={linkBtn} onClick={() => { if (window.confirm('Start over with a different house? Your answers for this one will be cleared.')) onReset(); }}>
          Start over with a different house
        </button>
      </div>
    </section>
  );
};

// ---------------------------------------------------------------------------------------------------------------

// The era question. History: all at once as a checkbox list ("feels very overwhelming", owner 2026-11-18), then one
// item per screen with yes/no. Walk-through 2026-11-19: twelve yes/no screens asked a first-time buyer to judge things
// they can't judge, so everyone tapped yes. Now: one screen, every item ticked, titles only; "Why, and what to do"
// opens under each item. Unticking is optional.

const EraRow: React.FC<{ item: EraItem; on: boolean; toggle: () => void; t: (x: string) => string }> = ({ item, on, toggle, t }) => {
  const [open, setOpen] = useState(false);
  return (
    <li className={`rounded-2xl border bg-white transition-colors ${on ? 'border-home-moss' : 'border-home-linen'}`}>
      <button type="button" aria-pressed={on} onClick={toggle} className="w-full flex items-start gap-3 text-left px-4 pt-3.5 pb-1.5 cursor-pointer">
        <span className={`mt-0.5 w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center ${on ? 'border-home-moss bg-home-moss' : 'border-slate-300'}`}>
          {on && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
        </span>
        <span className="font-bold leading-snug">{item.title}</span>
      </button>
      <div className="pl-12 pr-4 pb-3">
        <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className={`${linkBtn} text-xs`}>{open ? 'Hide' : 'Why, and what to do'}</button>
        {open && (
          <div className="mt-2.5 space-y-3 text-sm">
            <div>
              <BoxLabel>Why</BoxLabel>
              <p className="leading-relaxed">{item.eraBasis}</p>
            </div>
            <div className="rounded-xl bg-home-sage/50 border border-home-sage p-3">
              <BoxLabel className="text-home-moss">What to do</BoxLabel>
              <p className="leading-relaxed">{t(item.howToCheck)}</p>
            </div>
          </div>
        )}
      </div>
    </li>
  );
};

const EraView: React.FC<{ state: ResearchState; update: Updater; onNavigate: (path: string) => void }> = ({ state, update }) => {
  const year = state.property.yearBuilt as number;
  const era = useMemo(() => eraItems(state.property), [state.property]);
  const items = era?.items || [];
  const t = (x: string) => forDeadline(x, state);

  if (!era || !items.length) {
    return (
      <section className="space-y-5">
        <BackToPlan update={update} />
        <p className="text-slate-600">We couldn’t match the year built to our inspection guide. Go back and check the year you entered.</p>
      </section>
    );
  }

  // Everything starts ticked; a saved pick (from an earlier visit) is kept.
  const picked = state.era.picked ?? items.map((i) => i.id);
  const toggle = (id: string) => update((s) => {
    const cur = s.era.picked ?? items.map((i) => i.id);
    return { era: { ...s.era, picked: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] } };
  });
  const finish = () => update((s) => {
    const e = { ...s.era, picked: s.era.picked ?? items.map((i) => i.id), solved: true, step: 0 };
    return { era: e, ...advance({ ...s, era: e }, 'era') };
  });
  // Age and area first; "worth doing for any home" (radon, chimney) last.
  const groups: [string, EraItem[]][] = ([
    [`Common in homes built around ${year}`, items.filter((i) => i.group === 'era')],
    [`Applies in ${state.property.state}`, items.filter((i) => i.group === 'area')],
    ['Worth doing for any home', items.filter((i) => i.group === 'any')],
  ] as [string, EraItem[]][]).filter(([, xs]) => xs.length > 0);
  const n = picked.filter((id) => items.some((i) => i.id === id)).length;

  return (
    <section className="space-y-5">
      <FlowHeader state={state} part="era" inner={0} update={update} />
      <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight [text-wrap:balance]">What to check on a house built in {year}</h1>
      <p className="text-slate-600 !mt-2">They’re all ticked. Untick any you don’t want on the checklist in your report.</p>
      {groups.map(([label, xs]) => (
        <div key={label} className="space-y-2.5">
          <p className={eyebrow}>{label}</p>
          <ul className="space-y-2.5">
            {xs.map((i) => <EraRow key={i.id} item={i} on={picked.includes(i.id)} toggle={() => toggle(i.id)} t={t} />)}
          </ul>
        </div>
      ))}
      {/* Pinned to the bottom so the button is always on a phone's screen, however long the list. */}
      <div className="sticky bottom-0 z-10 -mx-4 sm:mx-0 px-4 sm:px-0 pt-2.5 pb-3 bg-home-stone/95 backdrop-blur">
        <button type="button" className={btnPrimary} onClick={finish}>
          {n > 0 ? <>Add {n === 1 ? 'it' : `these ${n}`} to my checklist <ArrowRight className="w-4 h-4" /></> : <>Next <ArrowRight className="w-4 h-4" /></>}
        </button>
      </div>
      <SkipPart state={state} part="era" update={update} />
      <p className="text-xs text-slate-500">From Before Regret’s inspection guide, the same one behind our free report. It describes homes of this age and area, not this particular house.</p>
    </section>
  );
};

// ---------------------------------------------------------------------------------------------------------------

const CopyList: React.FC<{ title: string; lines: string[] }> = ({ title, lines }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(lines.map((l) => `- ${l}`).join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {}
  };
  return (
    <div className={`${card} space-y-3`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-bold">{title} ({lines.length})</h3>
        {lines.length > 0 && (
          <button type="button" onClick={copy} className="inline-flex items-center gap-1.5 rounded-xl border border-home-linen px-3 py-1.5 text-sm font-semibold hover:border-home-oak cursor-pointer print:hidden">
            {copied ? <Check className="w-4 h-4" /> : <ClipboardCopy className="w-4 h-4" />}{copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>
      {lines.length ? (
        <ol className="list-decimal pl-5 space-y-1.5 text-sm">{lines.map((l) => <li key={l}>{l}</li>)}</ol>
      ) : <p className="text-sm text-slate-500">None yet.</p>}
    </div>
  );
};

/** The visitor's own findings. Used on the "Your answers" fallback page and, compact, at the top of the full report. */
export const ResearchFindings: React.FC<{ state: ResearchState; compact?: boolean }> = ({ state, compact }) => {
  const p = state.property;
  const { checklist, permitRows, missionRows, seller, verify } = collectFindings(state);
  const open = countedQuestions(state).filter((q) => !isSolved(state, q.id));
  const dl = daysLeft(state.deadline);
  return (
    <div className="space-y-7">
      {/* The setup screen promises "put the date on your report" (audit 2026-11-19, F14). The answers page already
          shows it in its header; the full report's research section had no date unless something needed confirming. */}
      {compact && dl !== null && dl >= 0 && (
        <p className="text-sm font-semibold text-home-ink">Your deadline: {formatShortDate(state.deadline)} · {dl} day{dl === 1 ? '' : 's'} left</p>
      )}
      {open.length > 0 && (
        <p className="rounded-2xl bg-home-stone/70 border border-home-linen p-4 text-sm">
          <b>Not answered yet:</b> {open.map((q) => q.title(state)).join(' · ')}
        </p>
      )}

      {(permitRows.length > 0 || missionRows.length > 0) && <h2 className="text-xl font-bold !mb-[-0.5rem]">What you found</h2>}

      {permitRows.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-slate-600 pt-2">Permits</h3>
          <div className="space-y-2.5">
            {permitRows.map(({ key, meaning }) => (
              <div key={key} className="rounded-2xl border border-home-linen bg-white p-4 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-sm break-inside-avoid">
                <b>{itemLabel(key)}</b>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold self-start ${meaning.tone === 'good' ? 'bg-home-sage text-home-moss' : 'bg-amber-50 text-amber-800'}`}>{meaning.next}</span>
                <span className="text-slate-600 col-span-2">You found: {meaning.found.toLowerCase()}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            Searched by you{state.permits.office?.portalName ? ` in ${state.permits.office.portalName}` : ''}{state.permits.office?.label ? `, most likely ${state.permits.office.label} (from U.S. Census boundaries)` : ''}.
            {state.permits.office?.onlineFrom ? ` Online records start: ${state.permits.office.onlineFrom}.` : ''} A missing permit online isn’t proof the work was unpermitted.
          </p>
        </div>
      )}

      {missionRows.map((m) => (
        <div key={m.id} className="space-y-2">
          <h3 className="font-semibold text-slate-600 pt-2">{m.title}</h3>
          <div className="space-y-2.5">
            {m.rows.map(({ key, meaning }) => (
              <div key={key} className="rounded-2xl border border-home-linen bg-white p-4 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-sm break-inside-avoid">
                <b>{meaning.found}</b>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold self-start ${meaning.tone === 'good' ? 'bg-home-sage text-home-moss' : meaning.tone === 'ask' ? 'bg-amber-50 text-amber-800' : 'bg-home-stone text-slate-600'}`}>{meaning.next}</span>
                <span className="text-slate-600 col-span-2">{forDeadline(meaning.text, state)}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500">{m.id === 'decode' && m.rows.every((r) => r.key === 'items-notyet')
            ? 'Your inspection hasn’t happened yet.'
            : `Checked by you${m.id === 'water' ? ' in the water utility’s records or at the house' : m.id === 'insure' ? ' on FEMA’s flood map and with the seller' : ' with the inspection report'}.`}</p>
        </div>
      ))}

      {checklist.length > 0 && !compact && (
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Your checklist for a house built in {p.yearBuilt}</h2>
          <div className="space-y-2.5">
            {checklist.map((i) => (
              <div key={i.id} className="rounded-2xl border border-home-linen bg-white p-4 space-y-2 break-inside-avoid">
                <h3 className="font-bold leading-snug">{i.title}</h3>
                <p className="text-sm"><span className="font-semibold">What to do: </span>{forDeadline(i.howToCheck, state)}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500">From Before Regret’s inspection guide. Typical for homes of this age and area, not a finding about this house.</p>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-xl font-bold">Questions, ready to send</h2>
        <CopyList title="For the seller" lines={seller} />
        <CopyList title="Your checklist, to share with your agent or inspector" lines={checklist.map((i) => `${i.title}: ${forDeadline(i.howToCheck, state)}`)} />
        {compact && checklist.length > 0 && <p className="text-xs text-slate-500">More on each one is in “Inspection priorities” below.</p>}
      </div>

      {verify.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xl font-bold">To confirm before {state.deadline ? formatShortDate(state.deadline) : 'closing'}</h2>
          <ul className="space-y-1.5">{verify.map((v) => <li key={v} className="flex gap-2 text-sm"><span className="w-4 h-4 mt-0.5 rounded border border-slate-400 shrink-0" />{v}</li>)}</ul>
        </div>
      )}

      <div className="rounded-2xl bg-white/70 border border-home-linen p-5 text-sm text-slate-600 leading-relaxed">
        <b className="text-home-ink">What this part is.</b> It records what you found in official records and what you chose to follow up, plus what was
        typical for homes of this age and area. It isn’t an inspection and doesn’t judge this particular house. The year built is your answer; check it against the listing
        or the county’s records. Your answers are saved only on this device.
      </div>
    </div>
  );
};

const ReportView: React.FC<{ state: ResearchState; update: Updater; onFinish: () => void; error: string | null; hasFinal: boolean }> = ({ state, update, onFinish, error, hasFinal }) => {
  const p = state.property;
  const dl = daysLeft(state.deadline);
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <section className="space-y-7">
      <div className="print:hidden"><BackToPlan update={update} /></div>
      <div className="space-y-2">
        <p className={eyebrow}>Your answers</p>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight [text-wrap:balance]">What you found out about {p.displayName || p.formattedAddress}</h1>
        <p className="text-sm text-slate-500">
          {[p.county, p.state].filter(Boolean).join(', ')} · {today} · Built {p.yearBuilt} (your answer)
          {dl !== null && dl >= 0 ? ` · ${dl} day${dl === 1 ? '' : 's'} to your deadline` : ''}
        </p>
      </div>

      <ResearchFindings state={state} />


      {error && <p role="alert" className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">{error}</p>}
      {hasFinal ? (
        // The full report reads these findings live from the device, so it is never rebuilt (each build counts
        // toward the daily report limit).
        <button type="button" className={btnPrimary} onClick={() => update({ view: 'final' })}>Open your report <ArrowRight className="w-4 h-4" /></button>
      ) : <FinishCard onFinish={onFinish} />}

      <button type="button" className={`${btnGhost} print:hidden`} onClick={() => window.print()}>
        <Printer className="w-4 h-4" /> Print or save as PDF
      </button>
    </section>
  );
};

/** "Get my report" on the questions screen: builds the full report straight away (owner walk-through 2026-11-18: a
 *  "so far" page followed by a second "full report" read as two different reports). The assent notice sits directly
 *  under the button. If the build fails, the visitor can still see and print their answers. */
const GetReport: React.FC<{ onFinish: () => void; error: string | null; update: Updater; label: string; ghost?: boolean }> = ({ onFinish, error, update, label, ghost }) => (
  <div className="space-y-2">
    {error && (
      <div role="alert" className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900 space-y-2">
        <p>{error}</p>
        <button type="button" className="font-semibold underline cursor-pointer" onClick={() => update({ view: 'report' })}>See and print your answers</button>
      </div>
    )}
    <button type="button" className={ghost ? btnGhost : btnPrimary} onClick={onFinish}>{label} <ArrowRight className="w-4 h-4" /></button>
    <ReportAssentNotice />
  </div>
);

/** The button that builds the full free report. The assent notice sits directly under it (see ReportAssentNotice). */
const FinishCard: React.FC<{ onFinish: () => void }> = ({ onFinish }) => (
  <div className={`${card} space-y-3 print:hidden`}>
    <h2 className="font-bold text-lg">Get your report</h2>
    <p className="text-sm text-slate-600">Your answers, plus the free area report for this address: the neighborhood’s Census profile, inspection priorities and the records to pull.</p>
    <button type="button" className={btnPrimary} onClick={onFinish}>Get my report <ArrowRight className="w-4 h-4" /></button>
    <ReportAssentNotice />
  </div>
);
