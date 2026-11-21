import React from 'react';
import {
  CardExtras, EVAL_FEE_MAX_USD, EVAL_FEE_MIN_USD, PHONE_TIME_OPTIONS, WEEK_DAYS, WeekDay,
  formatTime, offersEvaluation,
} from '../data/vendorCardExtras';

interface CardExtrasFieldsProps {
  trade: string;
  value: CardExtras;
  onChange: (next: CardExtras) => void;
}

const DEFAULT_FROM = 8 * 60;
const DEFAULT_TO = 17 * 60;

// The optional extras a Report Ad can carry (src/data/vendorCardExtras.ts): visit price (+ credited),
// phone days and hours, texts OK. Every input is a number, a switch, or a pick from our own list -- no
// free text, for the reason the tagline field was retired. Used on the details form after checkout and
// on My Placements for later changes.
export const CardExtrasFields: React.FC<CardExtrasFieldsProps> = ({ trade, value, onChange }) => {
  const evaluation = offersEvaluation(trade);
  const field = 'w-full px-3.5 py-3 border border-slate-300 rounded-xl text-base sm:text-sm bg-white';
  const set = (patch: Partial<CardExtras>) => onChange({ ...value, ...patch });
  const hours = value.phoneHours;
  const days = hours?.days || [];

  const toggleDay = (d: WeekDay) => {
    const next = days.includes(d) ? days.filter((x) => x !== d) : [...days, d];
    set({ phoneHours: next.length ? { days: next, from: hours?.from ?? DEFAULT_FROM, to: hours?.to ?? DEFAULT_TO } : undefined });
  };
  const setTime = (key: 'from' | 'to', minutes: number) => {
    if (!hours) return;
    set({ phoneHours: { ...hours, [key]: minutes } });
  };

  return (
    <fieldset className="space-y-4 px-3.5 py-4 bg-amber-50/60 border border-amber-200 rounded-xl">
      <legend className="px-1 text-xs font-bold text-slate-800">
        Optional extras <span className="font-normal text-slate-500">(leave empty to skip)</span>
      </legend>

      {evaluation && (
        <div className="space-y-2">
          <label className="block">
            <span className="text-xs font-bold text-slate-700">Price of your pre-closing visit</span>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-600">$</span>
              <input
                type="number"
                inputMode="numeric"
                min={EVAL_FEE_MIN_USD}
                max={EVAL_FEE_MAX_USD}
                step={1}
                value={value.evalFeeUsd ?? ''}
                onChange={(e) => {
                  const n = e.target.value === '' ? undefined : Math.round(Number(e.target.value));
                  set({ evalFeeUsd: n, evalFeeCredited: n ? value.evalFeeCredited : undefined });
                }}
                className={`${field} max-w-[10rem]`}
              />
            </div>
            <span className="mt-1 block text-[11px] text-slate-500 leading-snug">
              Shown to buyers right under your name, so they know before they call that it isn&apos;t a free quote.
              Whole dollars, ${EVAL_FEE_MIN_USD} to ${EVAL_FEE_MAX_USD.toLocaleString('en-US')}. You must honor the price you show.
            </span>
          </label>
          {value.evalFeeUsd ? (
            <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(value.evalFeeCredited)}
                onChange={(e) => set({ evalFeeCredited: e.target.checked || undefined })}
                className="mt-0.5 w-4 h-4 shrink-0 accent-home-navy cursor-pointer"
              />
              <span>I credit it toward the work if they hire me</span>
            </label>
          ) : null}
        </div>
      )}

      <div>
        <span className="text-xs font-bold text-slate-700">When someone answers the phone</span>
        <span className="block text-[11px] text-slate-500 leading-snug">Tick the days, then pick the hours. Leave all days unticked to skip.</span>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {WEEK_DAYS.map((d) => {
            const on = days.includes(d.key);
            return (
              <button
                key={d.key}
                type="button"
                aria-pressed={on}
                onClick={() => toggleDay(d.key)}
                className={`px-3 py-2 rounded-lg border text-xs font-bold cursor-pointer ${on ? 'bg-home-navy border-home-navy text-white' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}
              >
                {d.short}
              </button>
            );
          })}
        </div>
        {hours && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-700">
            <label className="inline-flex items-center gap-1.5">
              <span>From</span>
              <select value={hours.from} onChange={(e) => setTime('from', Number(e.target.value))} className="px-3 py-2.5 border border-slate-300 rounded-lg text-base sm:text-xs bg-white">
                {PHONE_TIME_OPTIONS.map((m) => <option key={m} value={m}>{formatTime(m)}</option>)}
              </select>
            </label>
            <label className="inline-flex items-center gap-1.5">
              <span>to</span>
              <select value={hours.to} onChange={(e) => setTime('to', Number(e.target.value))} className="px-3 py-2.5 border border-slate-300 rounded-lg text-base sm:text-xs bg-white">
                {PHONE_TIME_OPTIONS.map((m) => <option key={m} value={m}>{formatTime(m)}</option>)}
              </select>
            </label>
          </div>
        )}
      </div>

      <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
        <input
          type="checkbox"
          checked={Boolean(value.textsOk)}
          onChange={(e) => set({ textsOk: e.target.checked || undefined })}
          className="mt-0.5 w-4 h-4 shrink-0 accent-home-navy cursor-pointer"
        />
        <span>Buyers can text this number</span>
      </label>
    </fieldset>
  );
};
