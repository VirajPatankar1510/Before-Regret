import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, Check, Flag, HelpCircle, ChevronLeft, Copy, RotateCcw, ExternalLink, ShieldAlert } from 'lucide-react';
import {
  DECADES, FOUNDATIONS, splitChecks, type Foundation, type WalkthroughCheck,
} from '../data/walkthroughChecks';
import { getSellerQuestions } from '../engine/sellerQuestions';

// -------------------------------------------------------------------------------------------
// The 20-Minute Walkthrough Radar.
//
// Built for one situation: a buyer standing in a driveway on a phone, about to get somewhere
// between thirty and ninety minutes inside a house they may spend a decade paying for. Every
// decision here follows from that.
//
// NO ADDRESS, NO SIGN-UP, NO NETWORK. Era and foundation are the only inputs, and both are things
// you can answer from the listing or by looking at the building. Requiring an address would put the
// geoValidationGate in front of a tool meant to be opened in thirty seconds, and that gate has
// false-positived on whole cities before. Everything runs client-side from a static array, so it
// works on a bad signal in a basement -- which is exactly where several of the checks send you.
//
// STATE SURVIVES A RELOAD. Answers go to localStorage, because phones lock, browsers evict
// backgrounded tabs, and losing fifteen minutes of taps at check nine would be worse than never
// having offered the tool. Wrapped in try/catch: private mode and blocked site data must degrade to
// a working, forgetful page rather than a broken one.
//
// WHAT IT DELIBERATELY DOES NOT DO. It does not score the house. An earlier version of this brief
// asked for a "Walkthrough Clarity Score", and a number attached to a stranger's home implies a
// verdict the inputs cannot support -- two identical taps mean different things in a 1920s
// bungalow and a 2015 build. What it counts instead is how much of the list the buyer got through,
// which is a fact about the viewing rather than a judgement about the property.
// -------------------------------------------------------------------------------------------

type Answer = 'pass' | 'flag' | 'unsure';
type Answers = Record<string, Answer>;

const STORAGE_KEY = 'br-walkthrough-v1';

interface Saved { decade: number | null; foundation: Foundation | null; answers: Answers }

function load(): Saved {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { decade: null, foundation: null, answers: {} };
    const parsed = JSON.parse(raw) as Saved;
    return {
      decade: typeof parsed.decade === 'number' ? parsed.decade : null,
      foundation: parsed.foundation ?? null,
      answers: parsed.answers && typeof parsed.answers === 'object' ? parsed.answers : {},
    };
  } catch {
    return { decade: null, foundation: null, answers: {} };
  }
}

function save(state: Saved): void {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* private mode */ }
}

const ANSWER_STYLE: Record<Answer, string> = {
  pass: 'bg-emerald-600 text-white border-emerald-600',
  flag: 'bg-amber-500 text-white border-amber-500',
  unsure: 'bg-slate-500 text-white border-slate-500',
};

const CheckCard: React.FC<{
  check: WalkthroughCheck;
  answer: Answer | undefined;
  onAnswer: (a: Answer) => void;
}> = ({ check, answer, onAnswer }) => (
  <li className="border border-slate-200 rounded-lg bg-white overflow-hidden">
    <div className="p-4">
      <div className="flex items-start gap-2">
        <p className="flex-1 font-semibold text-slate-900 leading-snug">{check.prompt}</p>
        {check.insuranceFlag && (
          <span
            className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5"
            title="Carriers commonly decline or price up on this"
          >
            <ShieldAlert className="w-3 h-3" aria-hidden="true" />Insurance
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-slate-700">
        <span className="font-medium text-slate-900">Looking for: </span>{check.lookingFor}
      </p>
      {answer === 'flag' && (
        <div className="mt-3 rounded-md bg-amber-50 border border-amber-200 p-3">
          <p className="text-sm text-amber-900">{check.flagMeans}</p>
          <a
            href={`/guides/${check.guide}/`}
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-amber-900 underline underline-offset-2"
          >
            What this actually means <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        </div>
      )}
      {answer === 'unsure' && (
        <div className="mt-3 rounded-md bg-slate-50 border border-slate-200 p-3">
          <p className="text-sm text-slate-700">
            Note it and move on. Unsure is a normal answer to most of these, and it belongs on the
            list you hand your inspector.
          </p>
          <a
            href={`/guides/${check.guide}/`}
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-slate-800 underline underline-offset-2"
          >
            Read this before the inspection <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        </div>
      )}
    </div>
    <div className="grid grid-cols-3 border-t border-slate-200" role="group" aria-label={check.prompt}>
      {([
        ['pass', 'Looks OK', Check],
        ['flag', 'Flag it', Flag],
        ['unsure', 'Unsure', HelpCircle],
      ] as Array<[Answer, string, typeof Check]>).map(([value, label, Icon], i) => (
        <button
          key={value}
          type="button"
          onClick={() => onAnswer(value)}
          aria-pressed={answer === value}
          className={`flex items-center justify-center gap-1.5 py-3 text-sm font-semibold border-r last:border-r-0 border-slate-200 transition-colors ${
            answer === value ? ANSWER_STYLE[value] : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
          style={{ minHeight: 48 }}
        >
          <Icon className="w-4 h-4" aria-hidden="true" />{label}
        </button>
      ))}
    </div>
  </li>
);

export const WalkthroughRadar: React.FC = () => {
  const [state, setState] = useState<Saved>({ decade: null, foundation: null, answers: {} });
  const [hydrated, setHydrated] = useState(false);
  const [showIfTime, setShowIfTime] = useState(false);
  const [copied, setCopied] = useState(false);

  // Read localStorage after mount, never during render: the prerendered HTML must match the first
  // client render or React will complain, and there is no localStorage at build time anyway.
  useEffect(() => { setState(load()); setHydrated(true); }, []);
  useEffect(() => { if (hydrated) save(state); }, [state, hydrated]);

  const { decade, foundation, answers } = state;
  const started = decade !== null && foundation !== null;

  const { primary, ifTime } = useMemo(
    () => (started ? splitChecks(decade!, foundation!) : { primary: [], ifTime: [] }),
    [started, decade, foundation],
  );

  const shown = showIfTime ? [...primary, ...ifTime] : primary;
  const answered = shown.filter((c) => answers[c.id]).length;
  const flagged = shown.filter((c) => answers[c.id] === 'flag');
  const unsure = shown.filter((c) => answers[c.id] === 'unsure');

  // The engine that already knows what to ask about a house of this era. County and state are null
  // here on purpose -- this tool never collects a location, so it gets the national rules only,
  // which is the honest subset rather than a guess at a county.
  const sellerQuestions = useMemo(
    () => (started ? getSellerQuestions(decade!, null, null, 'single_family') : null),
    [started, decade],
  );

  const handoff = useMemo(() => {
    if (!started) return '';
    const lines: string[] = [
      `Walkthrough notes — ${DECADES.find((d) => d.mid === decade)?.label ?? ''} home, ${
        FOUNDATIONS.find((f) => f.id === foundation)?.label.toLowerCase() ?? ''
      } foundation`,
      '',
    ];
    if (flagged.length) {
      lines.push('THINGS I FLAGGED, please confirm in writing:', '');
      flagged.forEach((c, i) => {
        lines.push(`${i + 1}. ${c.lookingFor}`);
        lines.push(`   ${c.flagMeans}`, '');
      });
    }
    if (unsure.length) {
      lines.push('THINGS I COULD NOT TELL:', '');
      unsure.forEach((c, i) => lines.push(`${i + 1}. ${c.prompt}`, ''));
    }
    const qs = sellerQuestions?.questions ?? [];
    if (qs.length) {
      lines.push('QUESTIONS FOR THE SELLER OR AGENT, based on the age of the house:', '');
      qs.forEach((q, i) => lines.push(`${i + 1}. ${q.question}`, `   (${q.whatToListenFor})`, ''));
    }
    if (!flagged.length && !unsure.length && !qs.length) {
      lines.push('Nothing flagged on the walkthrough.', '');
    }
    lines.push('Compiled with the free walkthrough checklist at https://www.beforeregret.com/walkthrough/');
    return lines.join('\n');
  }, [started, decade, foundation, flagged, unsure, sellerQuestions]);

  const copyHandoff = () => {
    navigator.clipboard.writeText(handoff).then(
      () => { setCopied(true); setTimeout(() => setCopied(false), 1600); },
      () => { /* clipboard blocked; the textarea below is still selectable */ },
    );
  };

  // ---------------------------------------------------------------- setup
  if (!started) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-blue-700 mb-2">
          <ClipboardCheck className="w-5 h-5" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-wider">Free · no sign-up</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">
          The 20-minute walkthrough checklist
        </h1>
        <p className="mt-3 text-slate-700">
          Two questions, then a list of things to physically look at while you are inside. Built for
          a phone, in a driveway, before you go in. Nothing is sent anywhere and nothing is stored
          but your own answers, on your own device.
        </p>

        <fieldset className="mt-8">
          <legend className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">
            1 · Roughly when was it built?
          </legend>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DECADES.map((d) => (
              <button
                key={d.mid}
                type="button"
                onClick={() => setState((s) => ({ ...s, decade: d.mid }))}
                aria-pressed={decade === d.mid}
                className={`rounded-lg border px-3 py-3 text-sm font-semibold transition-colors ${
                  decade === d.mid
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400'
                }`}
                style={{ minHeight: 48 }}
              >
                {d.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            The listing usually says. A decade either way changes very little.
          </p>
        </fieldset>

        <fieldset className="mt-8">
          <legend className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">
            2 · What is it sitting on?
          </legend>
          <div className="grid gap-2">
            {FOUNDATIONS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setState((s) => ({ ...s, foundation: f.id }))}
                aria-pressed={foundation === f.id}
                className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                  foundation === f.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white border-slate-300 hover:border-blue-400'
                }`}
                style={{ minHeight: 48 }}
              >
                <span className="block font-semibold">{f.label}</span>
                <span className={`block text-xs ${foundation === f.id ? 'text-blue-100' : 'text-slate-500'}`}>
                  {f.hint}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <p className="mt-8 text-sm text-slate-600 border-t border-slate-200 pt-4">
          This is a prompt list, not an inspection. It tells you where to point your attention and
          what to ask about afterwards. It cannot tell you whether anything is actually wrong, and
          nothing here replaces a licensed inspector.
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------------- checklist
  const decadeLabel = DECADES.find((d) => d.mid === decade)?.label ?? '';
  const foundationLabel = FOUNDATIONS.find((f) => f.id === foundation)?.label ?? '';
  let lastZone = '';

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <button
          type="button"
          onClick={() => setState((s) => ({ ...s, decade: null, foundation: null }))}
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />Change
        </button>
        <span className="text-sm text-slate-600">{decadeLabel} · {foundationLabel}</span>
      </div>

      <div className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-900">{answered} of {shown.length} checked</span>
          <span className="text-slate-600">
            {flagged.length} flagged{unsure.length ? ` · ${unsure.length} unsure` : ''}
          </span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all"
            style={{ width: `${shown.length ? (answered / shown.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      <ul className="mt-5 grid gap-3">
        {shown.map((c) => {
          const header = c.zone !== lastZone ? c.zone : null;
          lastZone = c.zone;
          return (
            <React.Fragment key={c.id}>
              {header && (
                <li className="pt-3 first:pt-0">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">{header}</h2>
                </li>
              )}
              <CheckCard
                check={c}
                answer={answers[c.id]}
                onAnswer={(a) =>
                  setState((s) => ({
                    ...s,
                    // Tapping the same answer again clears it. On a phone the commonest input error
                    // is a mis-tap, and a list you cannot un-answer quietly becomes wrong.
                    answers: s.answers[c.id] === a
                      ? Object.fromEntries(Object.entries(s.answers).filter(([k]) => k !== c.id))
                      : { ...s.answers, [c.id]: a },
                  }))
                }
              />
            </React.Fragment>
          );
        })}
      </ul>

      {ifTime.length > 0 && !showIfTime && (
        <button
          type="button"
          onClick={() => setShowIfTime(true)}
          className="mt-4 w-full rounded-lg border border-dashed border-slate-300 py-3 text-sm font-semibold text-slate-600 hover:border-slate-400"
          style={{ minHeight: 48 }}
        >
          Show {ifTime.length} more, if you have time
        </button>
      )}

      {answered > 0 && (
        <section className="mt-8 border-t border-slate-200 pt-6">
          <h2 className="text-lg font-extrabold text-slate-900">Hand this to your inspector</h2>
          <p className="mt-1 text-sm text-slate-700">
            What you flagged, what you could not tell, and the questions worth asking about a house
            of this age. Copy it into an email or a text.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={copyHandoff}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              style={{ minHeight: 48 }}
            >
              <Copy className="w-4 h-4" aria-hidden="true" />{copied ? 'Copied' : 'Copy the list'}
            </button>
            <button
              type="button"
              onClick={() => { if (window.confirm('Clear every answer for this house?')) setState((s) => ({ ...s, answers: {} })); }}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              style={{ minHeight: 48 }}
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />Reset
            </button>
          </div>
          <textarea
            readOnly
            value={handoff}
            aria-label="Notes to hand your inspector"
            className="mt-3 w-full h-56 rounded-lg border border-slate-300 p-3 font-mono text-xs text-slate-800"
          />
        </section>
      )}

      <p className="mt-8 text-sm text-slate-600 border-t border-slate-200 pt-4">
        A prompt list, not an inspection. Flagging something here means it is worth asking about, not
        that anything is wrong with the house. Nothing replaces a licensed inspector.
      </p>
    </div>
  );
};
