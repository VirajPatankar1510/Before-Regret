import React from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { advance, flowOrder, type QuestionId, type ResearchState } from './researchState';

// Shared look for the guided research tool's screens.

export type Updater = (patch: Partial<ResearchState> | ((s: ResearchState) => Partial<ResearchState>)) => void;

export const btnPrimary = 'w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-home-ink text-white font-bold text-base px-5 py-4 hover:bg-home-navy transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
export const btnGhost = 'w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-home-linen bg-white text-home-ink font-bold text-base px-5 py-3.5 hover:border-home-oak transition-colors cursor-pointer';
export const linkBtn = 'text-sm font-semibold text-home-brass underline underline-offset-4 hover:text-home-ink cursor-pointer';
export const card = 'rounded-3xl bg-white border border-home-linen shadow-sm p-5 sm:p-6';
export const eyebrow = 'text-[11px] font-bold uppercase tracking-[0.18em] text-home-brass';


export const BackToPlan: React.FC<{ update: Updater; right?: string }> = ({ update, right }) => (
  <div className="flex items-center justify-between">
    <button type="button" onClick={() => update({ view: 'plan' })} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-home-ink cursor-pointer">
      <ArrowLeft className="w-4 h-4" /> All questions
    </button>
    {right && <span className="text-sm text-slate-500">{right}</span>}
  </div>
);

/** Top of every question screen in the flow: Back, where you are, and Skip. Opened from the summary, it just
 *  leads back there. */
export const FlowHeader: React.FC<{ state: ResearchState; id: QuestionId; update: Updater; onBack?: () => void }> = ({ state, id, update, onBack }) => {
  const order = flowOrder(state);
  const n = order.indexOf(id);
  if (state.reachedEnd || n < 0) {
    return onBack ? (
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-home-ink cursor-pointer">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
    ) : <BackToPlan update={update} />;
  }
  const back = onBack ?? (() => update(n > 0 ? { view: order[n - 1] } : { view: 'setup', setupStep: 2 }));
  return (
    <div className="flex items-center justify-between gap-3">
      <button type="button" onClick={back} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-home-ink cursor-pointer">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-500">Question {n + 1} of {order.length}</span>
        <button type="button" onClick={() => update((s) => advance(s, id))} className={linkBtn}>Skip</button>
      </div>
    </div>
  );
};

export const SolvedBadge: React.FC = () => (
  <div className="flex flex-col items-center text-center gap-3 pt-2">
    <div className="w-16 h-16 rounded-full bg-home-moss text-white flex items-center justify-center shadow-sm">
      <Check className="w-9 h-9" strokeWidth={2.6} />
    </div>
    <h2 className="font-serif text-3xl font-semibold">Solved</h2>
  </div>
);

/** Segmented progress bar with a small label, used by the step-by-step questions. */
export const Progress: React.FC<{ n: number; total: number; label: string }> = ({ n, total, label }) => (
  <div className="space-y-2">
    <div className="flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={n} aria-label="Progress">
      {Array.from({ length: total }, (_, i) => <div key={i} className={`h-1.5 flex-1 rounded-full ${i < n ? 'bg-home-moss' : 'bg-home-linen'}`} />)}
    </div>
    {label && <p className={eyebrow}>{label}</p>}
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
