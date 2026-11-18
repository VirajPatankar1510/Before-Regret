import React from 'react';
import { ArrowRight, Check, ExternalLink } from 'lucide-react';
import { MISSIONS, type Choice as ChoiceDef, type HowStep, type MissionId, type Source } from './missions';
import { advance, forDeadline, type MissionState, type ResearchState } from './researchState';
import { Choice, FlowHeader, Progress, btnPrimary, card, type Updater } from './ui';

// One screen for the Stage 3 questions (insurance, water line, inspection report). All text comes from missions.ts.
// Step by step (owner, 2026-11-18: one thing at a time): each screen shows one action and, where there is one, the
// answer that goes with it, the way the permit question works. Done goes straight back to the questions.

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

const MeaningBox: React.FC<{ choice: ChoiceDef; t: (x: string) => string }> = ({ choice, t }) => (
  <div className={`rounded-2xl p-4 ${choice.meaning.tone === 'good' ? 'bg-home-sage/60' : choice.meaning.tone === 'ask' ? 'bg-amber-50' : 'bg-home-stone'}`}>
    <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">What this means</span>
    {t(choice.meaning.text)}
  </div>
);

const StepBody: React.FC<{ step: HowStep; showTitle: boolean; t: (x: string) => string }> = ({ step, showTitle, t }) => (
  <div className="min-w-0 space-y-2">
    {showTitle && <p className="font-bold leading-snug">{t(step.title)}</p>}
    <p className="leading-relaxed">{t(step.body)}</p>
    {step.link && (
      // Opens in a new tab so the visitor's place in the tool stays put (it's saved on the device anyway).
      <a href={step.link.href} target="_blank" rel={step.link.internal ? 'noopener' : 'noopener noreferrer'}
        className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-home-ink bg-white text-home-ink font-bold text-base px-5 py-3.5 hover:bg-home-stone transition-colors">
        Open {step.link.label} <ExternalLink className="w-4 h-4" />
      </a>
    )}
    {step.source && <SourceLine source={step.source} />}
  </div>
);

export const MissionView: React.FC<{ id: MissionId; state: ResearchState; update: Updater }> = ({ id, state, update }) => {
  const def = MISSIONS[id];
  const t = (x: string) => forDeadline(x, state);
  const ms: MissionState = state.missions?.[id] || { stage: 'how', ans: {} };
  const set = (patch: Partial<MissionState>) => update((s) => ({ missions: { ...s.missions, [id]: { ...(s.missions?.[id] || { stage: 'how', ans: {} }), ...patch } } }));

  const screens = def.screens;
  const i = Math.max(0, Math.min(ms.step ?? 0, screens.length - 1));
  const screen = screens[i];
  const last = i === screens.length - 1;
  const q = screen.ask ? def.record.find((r) => r.id === screen.ask) : undefined;
  const picked = q ? ms.ans[q.id] || [] : [];
  const steps = screen.steps.map((n) => def.steps[n]);
  const single = steps.length === 1;

  const pick = (cid: string) => {
    if (!q) return;
    const exclusive = new Set(q.choices.filter((c) => c.exclusive).map((c) => c.id));
    const next = !q.multi
      ? [cid]
      : picked.includes(cid)
        ? picked.filter((x) => x !== cid)
        : exclusive.has(cid) ? [cid] : [...picked.filter((x) => !exclusive.has(x)), cid];
    set({ ans: { ...ms.ans, [q.id]: next } });
  };
  const finish = () => update((s) => {
    const ns = { ...s, missions: { ...s.missions, [id]: { ...(s.missions?.[id] || ms), stage: 'record' as const, step: 0, done: true } } };
    return { missions: ns.missions, ...advance(ns, id) };
  });

  return (
    <section className="space-y-5">
      {i === 0 ? <FlowHeader state={state} id={id} update={update} /> : (
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => set({ step: i - 1 })} className="text-sm font-semibold text-slate-600 hover:text-home-ink cursor-pointer">← Previous</button>
        </div>
      )}
      {screens.length > 1 && <Progress n={i + 1} total={screens.length} label={`Step ${i + 1} of ${screens.length}`} />}
      <p className="text-sm font-semibold text-slate-500">{def.h1}</p>
      <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight [text-wrap:balance] !mt-1">{t(screen.title)}</h1>
      {i === 0 && <p className="text-slate-600">{t(def.intro)}</p>}

      <div className={`${card} space-y-4`}>
        {single ? <StepBody step={steps[0]} showTitle={false} t={t} /> : (
          <ol className="space-y-4">
            {steps.map((s, n) => (
              <li key={s.title} className="flex gap-3">
                <span className="w-6 h-6 shrink-0 rounded-full bg-home-stone text-home-brass text-xs font-bold flex items-center justify-center mt-0.5">{n + 1}</span>
                <StepBody step={s} showTitle t={t} />
              </li>
            ))}
          </ol>
        )}
      </div>

      {q && (
        <div className="space-y-2.5">
          <p id={`mq-${id}-${q.id}`} className="font-bold text-lg">{q.label}</p>
          <div className="space-y-2.5" role="group" aria-labelledby={`mq-${id}-${q.id}`}>
            {q.choices.map((c) => <Choice key={c.id} multi={q.multi} on={picked.includes(c.id)} onClick={() => pick(c.id)}>{c.label}</Choice>)}
          </div>
          {q.choices.filter((c) => picked.includes(c.id)).map((c) => <MeaningBox key={c.id} choice={c} t={t} />)}
        </div>
      )}

      <button type="button" className={btnPrimary} disabled={!!q && picked.length === 0} onClick={() => (last ? finish() : set({ step: i + 1 }))}>
        {last ? <>Done <Check className="w-4 h-4" /></> : <>Next <ArrowRight className="w-4 h-4" /></>}
      </button>
    </section>
  );
};
