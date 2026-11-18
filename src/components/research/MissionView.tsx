import React from 'react';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { MISSIONS, type Choice, type MissionId, type Source } from './missions';
import type { MissionState, ResearchState } from './researchState';
import { BackToPlan, SolvedBadge, btnGhost, btnPrimary, card, eyebrow, type Updater } from './ui';

// One screen for the Stage 3 questions (insurance, water line, inspection report). Same three steps as the permit
// question: where to look, what you found, solved. All text comes from missions.ts.

function fmt(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const SourceLine: React.FC<{ source: Source }> = ({ source }) => (
  <span className="block mt-1.5 text-[11px] text-slate-500">
    Source:{' '}
    <a href={source.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-home-ink">{source.label}</a>
    , checked by Before Regret {fmt(source.checkedOn)}
  </span>
);

const ChoiceButton: React.FC<{ on: boolean; onClick: () => void; children: React.ReactNode }> = ({ on, onClick, children }) => (
  <button type="button" aria-pressed={on} onClick={onClick}
    className={`text-left rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${on ? 'border-home-moss bg-home-sage' : 'border-home-linen bg-white hover:border-home-oak'}`}>
    {children}
  </button>
);

const MeaningBox: React.FC<{ choice: Choice }> = ({ choice }) => (
  <div className={`rounded-2xl p-3.5 text-sm ${choice.meaning.tone === 'good' ? 'bg-home-sage' : choice.meaning.tone === 'ask' ? 'bg-amber-50' : 'bg-home-stone'}`}>
    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">What this means</p>
    <p>{choice.meaning.text}</p>
  </div>
);

export const MissionView: React.FC<{ id: MissionId; state: ResearchState; update: Updater }> = ({ id, state, update }) => {
  const def = MISSIONS[id];
  const ms: MissionState = state.missions?.[id] || { stage: 'how', ans: {} };
  const set = (patch: Partial<MissionState>) => update((s) => ({ missions: { ...s.missions, [id]: { ...(s.missions?.[id] || { stage: 'how', ans: {} }), ...patch } } }));

  if (ms.stage === 'solved') {
    return (
      <section className="space-y-6">
        <BackToPlan update={update} />
        <SolvedBadge />
        <p className="text-center text-slate-600">It’s in your report, with the questions to send.</p>
        <button type="button" className={btnPrimary} onClick={() => update({ view: 'plan' })}>Back to your questions <ArrowRight className="w-4 h-4" /></button>
        <button type="button" className={btnGhost} onClick={() => set({ stage: 'record' })}>Change my answer</button>
      </section>
    );
  }

  if (ms.stage === 'record') {
    const complete = def.record.every((q) => (ms.ans[q.id] || []).length > 0);
    const pick = (qid: string, cid: string, multi?: boolean) => {
      const cur = ms.ans[qid] || [];
      const q = def.record.find((x) => x.id === qid);
      const exclusive = new Set(q?.choices.filter((c) => c.exclusive).map((c) => c.id));
      const next = !multi
        ? [cid]
        : cur.includes(cid)
          ? cur.filter((x) => x !== cid)
          : exclusive.has(cid) ? [cid] : [...cur.filter((x) => !exclusive.has(x)), cid];
      set({ ans: { ...ms.ans, [qid]: next } });
    };
    return (
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => set({ stage: 'how' })} className="text-sm font-semibold text-slate-600 hover:text-home-ink cursor-pointer">← Where to look</button>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight">What did you find?</h1>
        {def.record.map((q) => {
          const picked = ms.ans[q.id] || [];
          return (
            <div key={q.id} className={`${card} space-y-3`}>
              <p className="font-bold">{q.label}</p>
              <div className="flex flex-wrap gap-2">
                {q.choices.map((c) => <ChoiceButton key={c.id} on={picked.includes(c.id)} onClick={() => pick(q.id, c.id, q.multi)}>{c.label}</ChoiceButton>)}
              </div>
              {q.choices.filter((c) => picked.includes(c.id)).map((c) => <MeaningBox key={c.id} choice={c} />)}
            </div>
          );
        })}
        <button type="button" className={btnPrimary} disabled={!complete} onClick={() => set({ stage: 'solved' })}>
          Add to my report <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <BackToPlan update={update} right={def.minutes} />
      <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight [text-wrap:balance]">{def.h1}</h1>
      <p className="text-slate-600">{def.intro}</p>
      <ol className="space-y-3">
        {def.steps.map((step, i) => (
          <li key={step.title} className={`${card} flex gap-3.5`}>
            <span className="w-7 h-7 shrink-0 rounded-full bg-home-stone text-home-brass text-sm font-bold flex items-center justify-center">{i + 1}</span>
            <div className="min-w-0 space-y-2">
              <p className="font-bold leading-snug">{step.title}</p>
              <p className="text-sm text-slate-700 leading-relaxed">{step.body}</p>
              {step.link && (step.link.internal ? (
                // Opens in a new tab so the visitor's place in the tool stays put (it's saved on the device anyway).
                <a href={step.link.href} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-sm font-bold text-home-ink underline underline-offset-4 decoration-home-oak">
                  {step.link.label} <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <a href={step.link.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-bold text-home-ink underline underline-offset-4 decoration-home-oak">
                  {step.link.label} <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ))}
              {step.source && <SourceLine source={step.source} />}
            </div>
          </li>
        ))}
      </ol>
      <button type="button" className={btnPrimary} onClick={() => set({ stage: 'record' })}>
        I’ve looked. Here’s what I found <ArrowRight className="w-4 h-4" />
      </button>
    </section>
  );
};
