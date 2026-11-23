import React from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { advance, backFrom, flowOrder, flowStep, type FlowPart, type QuestionId, type ResearchState } from './researchState';

// Shared look for the guided research tool's screens.

export type Updater = (patch: Partial<ResearchState> | ((s: ResearchState) => Partial<ResearchState>)) => void;

export const btnPrimary = 'w-full inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 text-white font-semibold text-base px-5 py-4 hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
export const btnGhost = 'w-full inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white text-home-ink font-semibold text-base px-5 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer';
export const linkBtn = 'text-sm font-medium text-blue-600 hover:underline underline-offset-4 cursor-pointer';
export const card = 'rounded-3xl bg-white p-5 sm:p-6';
export const eyebrow = 'text-sm sm:text-base font-semibold text-slate-500';


export const BackToPlan: React.FC<{ update: Updater; right?: string }> = ({ update, right }) => (
  <div className="flex items-center justify-between">
    <button type="button" onClick={() => update({ view: 'plan' })} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-home-ink cursor-pointer">
      <ArrowLeft className="w-4 h-4" /> All questions
    </button>
    {right && <span className="text-sm text-slate-500">{right}</span>}
  </div>
);

/** Top of every screen in the flow: Back, one progress bar and "Step n of N" counted across the questions (owner,
 *  2026-11-19). Opened from the summary, it leads back there and shows no count. */
export const FlowHeader: React.FC<{
  state: ResearchState; part: FlowPart; inner: number; update: Updater; onBack?: () => void; left?: React.ReactNode;
}> = ({ state, part, inner, update, onBack, left }) => {
  const step = state.reachedEnd ? null : flowStep(state, part, inner);
  const back = onBack ?? (part !== 'setup' && step ? () => update((s) => backFrom(s, part)) : undefined);
  const backBtn = back ? (
    <button type="button" onClick={back} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-home-ink cursor-pointer">
      <ArrowLeft className="w-4 h-4" /> Back
    </button>
  ) : left ?? <span />;
  // The few setup questions come before the count starts (see flowStep).
  if (part === 'setup') return <div className="flex items-center justify-between gap-3">{backBtn}</div>;
  if (!step) {
    // Opened from the summary: no count, and the summary is always one tap away.
    return onBack ? (
      <div className="flex items-center justify-between gap-3">
        {backBtn}
        <button type="button" onClick={() => update({ view: 'plan' })} className={linkBtn}>All questions</button>
      </div>
    ) : <BackToPlan update={update} />;
  }
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        {backBtn}
        <span className="text-sm text-slate-500 shrink-0">Step {step.n} of {step.total}</span>
      </div>
      <div className="h-1.5 rounded-full bg-home-linen overflow-hidden" role="progressbar" aria-valuemin={1} aria-valuemax={step.total} aria-valuenow={step.n} aria-label="Progress">
        <div className="h-full bg-home-moss transition-all" style={{ width: `${(step.n / step.total) * 100}%` }} />
      </div>
    </div>
  );
};

/** Under the main button: leave this part of the flow for later. Hidden when the visitor came from the summary. */
export const SkipPart: React.FC<{ state: ResearchState; part: QuestionId; update: Updater }> = ({ state, part, update }) =>
  state.reachedEnd || !flowOrder(state).includes(part) ? null : (
    <div className="text-center">
      <button type="button" onClick={() => update((s) => advance(s, part))} className={linkBtn}>Skip this part for now</button>
    </div>
  );

/** The heading on a "Why", "What to do" or "What this means" box (owner, 2026-11-19: the small grey labels were easy
 *  to miss). */
export const BoxLabel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = 'text-home-ink' }) => (
  <span className={`block text-base font-bold mb-1 ${className}`}>{children}</span>
);

export const SolvedBadge: React.FC = () => (
  <div className="flex flex-col items-center text-center gap-3 pt-2">
    <div className="w-16 h-16 rounded-full bg-home-moss text-white flex items-center justify-center shadow-sm">
      <Check className="w-9 h-9" strokeWidth={2.6} />
    </div>
    <h2 className="font-serif text-3xl font-semibold">Solved</h2>
  </div>
);

/** A large answer button: a round mark for one-answer questions, a square one where several can be picked. */
export const Choice: React.FC<{ on: boolean; onClick: () => void; multi?: boolean; children: React.ReactNode }> = ({ on, onClick, multi, children }) => (
  <button type="button" aria-pressed={on} onClick={onClick}
    className={`w-full flex items-center gap-3 text-left rounded-2xl border px-4 py-3.5 font-semibold transition-colors cursor-pointer ${on ? 'border-home-moss bg-home-sage' : 'border-home-linen bg-white hover:border-home-oak'}`}>
    <span className={`w-5 h-5 shrink-0 border-2 flex items-center justify-center ${multi ? 'rounded-md' : 'rounded-full'} ${on ? 'border-home-moss bg-home-moss' : 'border-slate-300'}`}>
      {on && (multi ? <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} /> : <span className="w-2 h-2 rounded-full bg-white" />)}
    </span>
    {children}
  </button>
);
