import React from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import type { ResearchState } from './researchState';

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
      <ArrowLeft className="w-4 h-4" /> Your questions
    </button>
    {right && <span className="text-sm text-slate-500">{right}</span>}
  </div>
);

export const SolvedBadge: React.FC = () => (
  <div className="flex flex-col items-center text-center gap-3 pt-2">
    <div className="w-16 h-16 rounded-full bg-home-moss text-white flex items-center justify-center shadow-sm">
      <Check className="w-9 h-9" strokeWidth={2.6} />
    </div>
    <h2 className="font-serif text-3xl font-semibold">Solved</h2>
  </div>
);
