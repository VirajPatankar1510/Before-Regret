import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Check, ChevronRight, ClipboardCopy, FileSearch, Home, Lightbulb, Loader2, Printer, ShieldCheck, Droplets, ScrollText,
} from 'lucide-react';
import type { PropertySearchResult } from '../../types';
import { AddressSearchBox } from '../AddressSearchBox';
import { ContentLink } from '../home/ContentLink';
import {
  QUESTIONS, WORK, collectFindings, itemLabel, costsNothingExtra, daysLeft, eraItems, formatShortDate, freshResearch, isSolved,
  loadResearch, saveResearch,
  type BuyingStage, type EraItem, type QuestionId, type ResearchState, type WorkKey,
} from './researchState';
import { PermitView } from './PermitView';
import { MissionView } from './MissionView';
import { MISSION_IDS, type MissionId } from './missions';
import { FinalReportView, buildFullReport } from './FinalReport';
import { ReportAssentNotice } from '../ReportAssentNotice';
import type { PropertyReport } from '../../types';
import { BackToPlan, SolvedBadge, btnGhost, btnPrimary, card, eyebrow, linkBtn, type Updater } from './ui';

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

  const update = (patch: Partial<ResearchState> | ((s: ResearchState) => Partial<ResearchState>)) =>
    setState((s) => (s ? { ...s, ...(typeof patch === 'function' ? patch(s) : patch) } : s));

  // Each screen starts at the top, like a new page would.
  const viewKey = state ? `${state.view}-${state.setupStep}-${state.era.solved}-${state.permits.stage}-${MISSION_IDS.map((m) => state.missions?.[m]?.stage || '').join('')}` : 'start';
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
          <PlanView state={state} update={update} onReset={reset} />
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


const Dots: React.FC<{ at: number; of: number }> = ({ at, of }) => (
  <div className="flex gap-1.5" aria-hidden="true">
    {Array.from({ length: of }, (_, i) => (
      <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= at ? 'bg-home-moss' : 'bg-home-linen'}`} />
    ))}
  </div>
);

const SetupView: React.FC<{ state: ResearchState; update: Updater }> = ({ state, update }) => {
  const n = state.setupStep;
  const next = () => (n < 2 ? update({ setupStep: (n + 1) as 0 | 1 | 2 }) : update({ view: 'plan' }));
  const back = () => (n > 0 ? update({ setupStep: (n - 1) as 0 | 1 | 2 }) : undefined);
  const toggleClaim = (k: WorkKey) =>
    update((s) => ({ claims: s.claims.includes(k) ? s.claims.filter((c) => c !== k) : [...s.claims, k] }));

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        {n > 0 ? (
          <button type="button" onClick={back} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-home-ink cursor-pointer">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        ) : <span className="text-sm text-slate-500 truncate max-w-[70%]">{state.property.displayName}</span>}
        <span className="text-sm text-slate-500">{n + 1} of 3</span>
      </div>
      <Dots at={n} of={3} />

      {n === 0 && (
        <div className="space-y-4">
          <h2 className="font-serif text-3xl font-semibold">Where are you with this house?</h2>
          <p className="text-slate-600">So we know what to show you first.</p>
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
          <p className="text-slate-600">Like the end of your inspection or option period. We’ll keep the countdown on your plan and your report.</p>
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
          <h2 className="font-serif text-3xl font-semibold">What does the seller say they updated?</h2>
          <p className="text-slate-600">Check the listing or the disclosure. Pick any that apply. We’ll help you check them against the records.</p>
          <div className="flex flex-wrap gap-2">
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
          <button type="button" className={linkBtn} onClick={() => update({ claims: [], view: 'plan' })}>Nothing mentioned</button>
        </div>
      )}

      <button type="button" className={btnPrimary} onClick={next} disabled={n === 0 && !state.stage}>
        {n < 2 ? 'Continue' : 'Show me what to check'} <ArrowRight className="w-4 h-4" />
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
  if (id === 'era') return `${(state.era.picked || []).length} things on your list`;
  if (id === 'permits') {
    const { permitRows } = collectFindings(state);
    const ask = permitRows.filter((r) => r.meaning.seller).length;
    return `${permitRows.length} checked · ${ask ? `${ask} to ask the seller about` : 'nothing to chase'}`;
  }
  const m = collectFindings(state).missionRows.find((r) => r.id === id);
  return m ? m.rows.map((r) => r.meaning.found).join(' · ') : '';
}

const PlanView: React.FC<{ state: ResearchState; update: Updater; onReset: () => void }> = ({ state, update, onReset }) => {
  const p = state.property;
  const dl = daysLeft(state.deadline);
  const live = QUESTIONS.filter((q) => q.live);
  const done = live.filter((q) => isSolved(state, q.id)).length;
  const era = eraItems(p);
  const eraCount = era ? era.items.filter((i) => i.group === 'era').length : 0;
  const place = [p.city, p.county, p.state].filter(Boolean).join(', ');

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

      <div className={`${card} space-y-4`}>
        <p className={eyebrow}>Here’s what we already know</p>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-slate-500">Address</dt>
            <dd className="font-semibold">{p.formattedAddress || p.displayName}{p.unitNumber ? `, Unit ${p.unitNumber}` : ''}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Built <span className="text-slate-400">(your answer)</span></dt>
            <dd className="font-semibold">{p.yearBuilt}{era ? ` · ${era.eraLabel}` : ''}</dd>
            {eraCount > 0 && <dd className="text-slate-600 mt-0.5">{eraCount} things were common in homes of that age. That’s your first question below.</dd>}
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
            <p className="text-sm text-slate-600">{done} of {live.length} answered. Start anywhere.</p>
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
                  {!q.live && <span className="inline-block rounded-full bg-home-stone px-2.5 py-0.5 text-[11px] font-bold text-slate-500">Coming soon</span>}
                </span>
                {q.live && <ChevronRight className="w-5 h-5 text-slate-400 shrink-0 self-center" />}
              </>
            );
            return q.live ? (
              <button key={q.id} type="button" onClick={() => update({ view: q.id })}
                className="w-full text-left flex gap-3 rounded-2xl border border-home-linen bg-white p-4 hover:border-home-oak transition-colors cursor-pointer">
                {inner}
              </button>
            ) : (
              <div key={q.id} className="flex gap-3 rounded-2xl border border-dashed border-home-linen bg-white/60 p-4 opacity-80">{inner}</div>
            );
          })}
        </div>
      </div>

      {state.finalReportId && (
        <button type="button" className={btnPrimary} onClick={() => update({ view: 'final' })}>Open your full report <ArrowRight className="w-4 h-4" /></button>
      )}
      {done > 0 && (
        <button type="button" className={btnGhost} onClick={() => update({ view: 'report' })}>See your report so far</button>
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

const EraCard: React.FC<{ item: EraItem; picked: boolean; onToggle: () => void }> = ({ item, picked, onToggle }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="py-5 first:pt-0 last:pb-0 border-b last:border-b-0 border-home-linen space-y-3">
      <h3 className="font-bold text-lg leading-snug">{item.title}</h3>
      <p className={`text-sm text-slate-600 leading-relaxed ${open ? '' : 'line-clamp-3'}`}>{item.eraBasis}</p>
      <button type="button" className="text-sm font-semibold text-home-brass cursor-pointer" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {open ? 'Show less' : 'Read more'}
      </button>
      <div className="rounded-xl border border-home-sage bg-home-sage/40 p-3 text-sm">
        <span className="block text-[11px] font-bold uppercase tracking-wider text-home-moss">What to do</span>{item.howToCheck}
      </div>
      <div className="grid sm:grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-home-stone p-3"><span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">To check</span>{item.costToCheck}</div>
        <div className="rounded-xl bg-home-stone p-3"><span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">If it needs work</span>{item.typicalRepairCost || 'Not applicable'}</div>
      </div>
      <button type="button" aria-pressed={picked} onClick={onToggle}
        className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-bold transition-colors cursor-pointer ${picked ? 'border-home-moss bg-home-sage' : 'border-home-linen bg-white hover:border-home-oak'}`}>
        <span className={`w-5 h-5 rounded-md border flex items-center justify-center ${picked ? 'bg-home-moss border-home-moss text-white' : 'border-slate-300'}`}>
          {picked && <Check className="w-3.5 h-3.5" />}
        </span>
        {picked ? 'On my list' : 'Add to my list'}
      </button>
    </div>
  );
};



const EraView: React.FC<{ state: ResearchState; update: Updater; onNavigate: (path: string) => void }> = ({ state, update }) => {
  const year = state.property.yearBuilt as number;
  const era = useMemo(() => eraItems(state.property), [state.property]);
  const items = era?.items || [];
  const byGroup = (g: EraItem['group']) => items.filter((i) => i.group === g);
  const eraSpecific = byGroup('era'), area = byGroup('area'), any = byGroup('any');
  // Default picks: everything tied to this house's age or area. "Any home" items start unticked.
  const picked = state.era.picked ?? [...eraSpecific, ...area].map((i) => i.id);
  const setPicked = (ids: string[]) => update((s) => ({ era: { ...s.era, picked: ids } }));
  const toggle = (id: string) => setPicked(picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]);
  const nothingExtra = [...eraSpecific, ...area].filter(costsNothingExtra).length;

  if (!era) {
    return (
      <section className="space-y-5">
        <BackToPlan update={update} />
        <p className="text-slate-600">We couldn’t match the year built to our inspection guide. Go back and check the year you entered.</p>
      </section>
    );
  }

  if (state.era.solved) {
    const chosen = items.filter((i) => picked.includes(i.id));
    return (
      <section className="space-y-6">
        <SolvedBadge />
        <p className="text-center text-slate-600 text-lg">You know what to check on a house from {year}, what to do next, and roughly what each answer could cost.</p>
        <div className={`${card} space-y-4`}>
          {[
            ['What you checked', `What was common in homes built around ${year} (${era.eraLabel})${area.length ? `, plus what applies in ${state.property.state}` : ''}.`],
            ['Where it comes from', 'Before Regret’s inspection guide, the same one behind our free report. It describes homes of this age and area, not this particular house.'],
            ['What to do with it', `Work through your list of ${chosen.length}. Each one says what to do next.`],
          ].map(([label, text]) => (
            <div key={label} className="flex gap-3">
              <Check className="w-5 h-5 text-home-moss shrink-0 mt-0.5" />
              <div><span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</span><p>{text}</p></div>
            </div>
          ))}
        </div>
        {chosen.length > 0 && (
          <div className="space-y-2">
            <p className={eyebrow}>Added to your report</p>
            <ul className="space-y-1.5">
              {chosen.map((i) => <li key={i.id} className="flex gap-2 text-sm"><Check className="w-4 h-4 text-home-moss shrink-0 mt-0.5" />{i.title}</li>)}
            </ul>
          </div>
        )}
        <button type="button" className={btnPrimary} onClick={() => update({ view: 'plan' })}>On to the next one <ArrowRight className="w-4 h-4" /></button>
        <div className="text-center">
          <button type="button" className={linkBtn} onClick={() => update((s) => ({ era: { ...s.era, solved: false } }))}>Change my picks</button>
        </div>
      </section>
    );
  }

  const group = (title: string, list: EraItem[]) => list.length > 0 && (
    <div className={card}>
      <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-home-brass mb-4">{title}</h3>
      <div>{list.map((i) => <EraCard key={i.id} item={i} picked={picked.includes(i.id)} onToggle={() => toggle(i.id)} />)}</div>
    </div>
  );

  return (
    <section className="space-y-5">
      <BackToPlan update={update} right="About 3 minutes" />
      <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight [text-wrap:balance]">What should I ask about a house built in {year}?</h1>
      <div className="rounded-2xl bg-home-sage/60 border border-home-sage p-4 space-y-1.5">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-home-moss"><Lightbulb className="w-3.5 h-3.5" /> Worth knowing</p>
        <p>
          {eraSpecific.length + area.length} things are worth raising for a house like this.{' '}
          {nothingExtra > 0 && <>{nothingExtra} of them are free or usually part of a standard inspection, so all it costs is remembering to ask.</>}
        </p>
        <p className="text-xs text-slate-500">From Before Regret’s inspection guide. These describe homes of this age and area, not this particular house.</p>
      </div>
      {group(`Common in homes built around ${year}`, eraSpecific)}
      {group(`Applies in ${state.property.state}`, area)}
      {any.length > 0 && (
        <details className={card}>
          <summary className="cursor-pointer font-bold">Worth asking about any home ({any.length})</summary>
          <div className="mt-4">{any.map((i) => <EraCard key={i.id} item={i} picked={picked.includes(i.id)} onToggle={() => toggle(i.id)} />)}</div>
        </details>
      )}
      <div className="sticky bottom-4 pt-2">
        <button type="button" className={`${btnPrimary} shadow-lg`} disabled={picked.length === 0}
          onClick={() => update((s) => ({ era: { picked, solved: true } }))}>
          Add {picked.length} to my report <ArrowRight className="w-4 h-4" />
        </button>
      </div>
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

/** The visitor's own findings. Used on "your report so far" and, compact, at the top of the full report. */
export const ResearchFindings: React.FC<{ state: ResearchState; compact?: boolean }> = ({ state, compact }) => {
  const p = state.property;
  const { checklist, permitRows, missionRows, seller, verify } = collectFindings(state);
  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <h2 className="text-lg font-bold">At a glance</h2>
        <div className={`${card} divide-y divide-home-linen !py-2`}>
          {QUESTIONS.map((q) => {
            const solved = isSolved(state, q.id);
            return (
              <div key={q.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span>{q.title(state)}</span>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${solved ? 'bg-home-sage text-home-moss' : 'bg-home-stone text-slate-500'}`}>
                  {solved ? 'Answered' : q.live ? 'Still open' : 'Coming soon'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {permitRows.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-bold"><span className={`${eyebrow} block`}>Check</span>What the permit records show</h2>
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
          <h2 className="text-lg font-bold"><span className={`${eyebrow} block`}>Check</span>{m.title}</h2>
          <div className="space-y-2.5">
            {m.rows.map(({ key, meaning }) => (
              <div key={key} className="rounded-2xl border border-home-linen bg-white p-4 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-sm break-inside-avoid">
                <b>{meaning.found}</b>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold self-start ${meaning.tone === 'good' ? 'bg-home-sage text-home-moss' : meaning.tone === 'ask' ? 'bg-amber-50 text-amber-800' : 'bg-home-stone text-slate-600'}`}>{meaning.next}</span>
                <span className="text-slate-600 col-span-2">{meaning.text}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500">Checked by you{m.id === 'water' ? ' in the water utility’s records or at the house' : m.id === 'insure' ? ' on FEMA’s flood map and with the seller' : ' with the inspection report'}.</p>
        </div>
      ))}

      {checklist.length > 0 && !compact && (
        <div className="space-y-2">
          <h2 className="text-lg font-bold"><span className={`${eyebrow} block`}>Check</span>Your list for a house built in {p.yearBuilt}</h2>
          <div className="space-y-2.5">
            {checklist.map((i) => (
              <div key={i.id} className="rounded-2xl border border-home-linen bg-white p-4 space-y-2 break-inside-avoid">
                <h3 className="font-bold leading-snug">{i.title}</h3>
                <p className="text-sm"><span className="font-semibold">What to do: </span>{i.howToCheck}</p>
                <div className="grid sm:grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl bg-home-stone p-2.5"><span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">To check</span>{i.costToCheck}</div>
                  <div className="rounded-xl bg-home-stone p-2.5"><span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">If it needs work</span>{i.typicalRepairCost || 'Not applicable'}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500">From Before Regret’s inspection guide. Typical for homes of this age and area, not a finding about this house.</p>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-bold"><span className={`${eyebrow} block`}>Ask</span>Questions, ready to send</h2>
        <CopyList title="For the seller" lines={seller} />
        <CopyList title="Your checklist, to share with your agent or inspector" lines={checklist.map((i) => `${i.title}: ${i.howToCheck}`)} />
        {compact && checklist.length > 0 && <p className="text-xs text-slate-500">Costs and details for each one are in “Inspection priorities” below.</p>}
      </div>

      {verify.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-bold"><span className={`${eyebrow} block`}>Verify</span>Before {state.deadline ? formatShortDate(state.deadline) : 'closing'}</h2>
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
  const live = QUESTIONS.filter((q) => q.live);
  const open = live.filter((q) => !isSolved(state, q.id));
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <section className="space-y-7">
      <div className="print:hidden"><BackToPlan update={update} /></div>
      <div className="space-y-2">
        <p className={eyebrow}>Your research so far</p>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight [text-wrap:balance]">What you found out about {p.displayName || p.formattedAddress}</h1>
        <p className="text-sm text-slate-500">
          {[p.county, p.state].filter(Boolean).join(', ')} · {today} · Built {p.yearBuilt} (your answer)
          {dl !== null && dl >= 0 ? ` · ${dl} day${dl === 1 ? '' : 's'} to your deadline` : ''}
        </p>
      </div>

      <ResearchFindings state={state} />

      {open.length > 0 && <p className="text-sm text-slate-600">{open.length} question{open.length === 1 ? '' : 's'} still open. You can answer {open.length === 1 ? 'it' : 'them'} first, or finish now.</p>}

      {error && <p role="alert" className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">{error}</p>}
      {hasFinal ? (
        // The full report reads these findings live from the device, so it is never rebuilt (each build counts
        // toward the daily report limit).
        <button type="button" className={btnPrimary} onClick={() => update({ view: 'final' })}>Open your full report <ArrowRight className="w-4 h-4" /></button>
      ) : <FinishCard onFinish={onFinish} />}

      <button type="button" className={`${btnGhost} print:hidden`} onClick={() => window.print()}>
        <Printer className="w-4 h-4" /> Print or save as PDF
      </button>
    </section>
  );
};

/** The button that builds the full free report. The assent notice sits directly under it (see ReportAssentNotice). */
const FinishCard: React.FC<{ onFinish: () => void }> = ({ onFinish }) => (
  <div className={`${card} space-y-3 print:hidden`}>
    <h2 className="font-bold text-lg">Ready for your full report?</h2>
    <p className="text-sm text-slate-600">We’ll add what the free report covers: the neighborhood’s Census profile, inspection priorities and seller questions for a house like this, and the records to pull. Your findings go at the top.</p>
    <button type="button" className={btnPrimary} onClick={onFinish}>Build my full report <ArrowRight className="w-4 h-4" /></button>
    <ReportAssentNotice />
  </div>
);
