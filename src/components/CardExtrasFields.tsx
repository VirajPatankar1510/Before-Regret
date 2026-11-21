import React from 'react';
import {
  CardExtras, CALL_WINDOW_OPTIONS, EVAL_FEE_MAX_USD, EVAL_FEE_MIN_USD, LANGUAGE_OPTIONS, Language,
  VISIT_WAIT_OPTIONS, jobsForTrade, offersEvaluation,
} from '../data/vendorCardExtras';

interface CardExtrasFieldsProps {
  trade: string;
  value: CardExtras;
  onChange: (next: CardExtras) => void;
}

// The optional extras a Report Ad can carry (src/data/vendorCardExtras.ts). Every input is a number,
// a switch, or a pick from our own list -- no free text, for the reason the tagline field was retired.
// Used on the details form after checkout and on My Placements for later changes.
export const CardExtrasFields: React.FC<CardExtrasFieldsProps> = ({ trade, value, onChange }) => {
  const evaluation = offersEvaluation(trade);
  const jobs = jobsForTrade(trade);
  const field = 'w-full px-3.5 py-3 border border-slate-300 rounded-xl text-base sm:text-sm bg-white';
  const set = (patch: Partial<CardExtras>) => onChange({ ...value, ...patch });
  const toggle = <T extends string>(list: T[] | undefined, item: T): T[] =>
    (list || []).includes(item) ? (list || []).filter((x) => x !== item) : [...(list || []), item];

  return (
    <fieldset className="space-y-4 px-3.5 py-4 bg-amber-50/60 border border-amber-200 rounded-xl">
      <legend className="px-1 text-xs font-bold text-slate-800">
        Optional extras <span className="font-normal text-slate-500">(all optional; leave empty to skip)</span>
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
              Shown to buyers right under your name, so they know before they call that this visit is paid.
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

      {evaluation && jobs.length > 0 && (
        <div>
          <span className="text-xs font-bold text-slate-700">Jobs you do</span>
          <span className="block text-[11px] text-slate-500 leading-snug">
            Each one prints only beside the report check it belongs to (up to 3 per card).
          </span>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {jobs.map((j) => (
              <label key={j.id} className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(value.jobs || []).includes(j.id)}
                  onChange={() => set({ jobs: toggle(value.jobs, j.id) })}
                  className="mt-0.5 w-4 h-4 shrink-0 accent-home-navy cursor-pointer"
                />
                <span>{j.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {evaluation && (
          <label className="block">
            <span className="text-xs font-bold text-slate-700">How soon you can usually come out</span>
            <select
              value={value.visitWait || ''}
              onChange={(e) => set({ visitWait: (e.target.value || undefined) as CardExtras['visitWait'] })}
              className={`mt-1 ${field}`}
            >
              <option value="">Don&apos;t show</option>
              {Object.entries(VISIT_WAIT_OPTIONS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
          </label>
        )}
        <label className="block">
          <span className="text-xs font-bold text-slate-700">When someone answers the phone</span>
          <select
            value={value.callWindow || ''}
            onChange={(e) => set({ callWindow: (e.target.value || undefined) as CardExtras['callWindow'] })}
            className={`mt-1 ${field}`}
          >
            <option value="">Don&apos;t show</option>
            {Object.entries(CALL_WINDOW_OPTIONS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
        </label>
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

      <div>
        <span className="text-xs font-bold text-slate-700">Other languages you speak with customers</span>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {(Object.entries(LANGUAGE_OPTIONS) as Array<[Language, string]>).map(([k, label]) => (
            <label key={k} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={(value.languages || []).includes(k)}
                onChange={() => set({ languages: toggle(value.languages, k) })}
                className="w-4 h-4 shrink-0 accent-home-navy cursor-pointer"
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>
    </fieldset>
  );
};
