import { canBuyReportAd, FIXED_REPORT_SLOT_CATEGORIES } from './sponsoredVendors.js';

// Optional extras on a Report Ad card. Plan and history: docs/plans/paid-evaluation-fee-2026-11.md.
//
//   - The price of their evaluation, inspection or test (labelled per trade, EVAL_FEE_LABELS), exact
//     or "from", so buyers know before they call that it isn't a free quote; optionally credited
//     toward the work if they hire the business (not for home inspectors).
//   - When someone answers the phone: the business picks its own days and hours.
//   - Whether buyers can text the number.
//
// Owner, 2026-11-22: the first version also had jobs-per-report-item, "Suggest a service", the usual
// visit wait and languages. Those were removed the same day, before any business used them; keep only
// the three above.
//
// Every extra is OPTIONAL. A card with none set looks exactly as it did before.
//
// RULE: STRUCTURED ONLY, NEVER FREE TEXT. The free-text `tagline` was retired because advertisers
// filled it with licence and credential claims that the site then published as its own words (see
// the NOTE ON `tagline` in src/server/db.ts). Every extra here is a number, a switch, or a pick from
// a list whose wording we wrote.
//
// This file is imported by the server (src/server/*.ts), so its own imports MUST carry the .js
// extension -- an extensionless import in a server-reachable src/data file took down every /api
// route on 2026-10-12.

export const EVAL_FEE_MIN_USD = 25;
export const EVAL_FEE_MAX_USD = 2000;

// What the price is FOR, worded per trade (owner, 2026-11-22: "pre-closing visit" didn't fit every
// vendor -- a radon tester or home inspector sells the test or inspection itself). Our wording, fixed;
// the business only enters the number.
export const EVAL_FEE_LABELS: Record<string, string> = {
  'Electrician': 'Electrical evaluation',
  'Plumber': 'Plumbing evaluation',
  'Foundation Repair': 'Foundation evaluation',
  'Sewer Scope': 'Sewer camera inspection',
  'Roof Inspection': 'Roof inspection',
  'HVAC Inspection': 'HVAC inspection',
  'Radon Testing': 'Radon test',
  'Chimney Sweep': 'Chimney inspection',
  'Pest/Termite Control': 'Termite inspection',
  'Asbestos/Mold Abatement': 'Testing visit',
  'Stucco & EIFS': 'Moisture inspection',
  'Well & Septic Services': 'Septic inspection',
  'Home Inspector': 'Home inspection',
};
export function evalFeeLabel(trade: string): string {
  return EVAL_FEE_LABELS[trade] || 'Evaluation';
}

/**
 * Whether "credited toward the work if you hire them" is offered. Not for home inspectors: they
 * generally don't do the repairs they find, and some states bar an inspector from repairing a home
 * they inspected.
 */
export function offersFeeCredit(trade: string): boolean {
  return offersEvaluation(trade) && trade !== 'Home Inspector';
}

/** Monday first, the way a business owner reads a week. */
export const WEEK_DAYS = [
  { key: 'mon', short: 'Mon' },
  { key: 'tue', short: 'Tue' },
  { key: 'wed', short: 'Wed' },
  { key: 'thu', short: 'Thu' },
  { key: 'fri', short: 'Fri' },
  { key: 'sat', short: 'Sat' },
  { key: 'sun', short: 'Sun' },
] as const;
export type WeekDay = typeof WEEK_DAYS[number]['key'];
const DAY_KEYS: readonly string[] = WEEK_DAYS.map((d) => d.key);

/** Times a business can pick, as minutes after midnight: every half hour from 5 AM to 11 PM. */
export const PHONE_TIME_OPTIONS: readonly number[] = Array.from({ length: (23 - 5) * 2 + 1 }, (_, i) => 5 * 60 + i * 30);

export function formatTime(minutes: number): string {
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h24 < 12 ? 'AM' : 'PM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return m === 0 ? `${h12} ${suffix}` : `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export interface PhoneHours {
  days: WeekDay[];
  /** Minutes after midnight, from PHONE_TIME_OPTIONS. */
  from: number;
  to: number;
}

export interface CardExtras {
  evalFeeUsd?: number;
  /** "My price depends on the house": printed as "from $X". $X is then the lowest price they charge. */
  evalFeeFrom?: boolean;
  evalFeeCredited?: boolean;
  phoneHours?: PhoneHours;
  textsOk?: boolean;
}

/**
 * Trades that do a paid check before closing. Only these get the visit price. The fixed-box trades
 * (movers, agents, interior designers) have no evaluation to price; they still get phone hours and texts.
 * Home Inspector has a fixed box too (since 2026-11-22) but sells an inspection, so it keeps its price.
 */
export function offersEvaluation(trade: string): boolean {
  return canBuyReportAd(trade) && (trade === 'Home Inspector' || !FIXED_REPORT_SLOT_CATEGORIES.has(trade));
}

// One flat shape (not a discriminated union) because this repo compiles without strictNullChecks,
// where narrowing on `ok` doesn't work. `error` is set exactly when ok is false.
export type SanitizeResult = { ok: boolean; extras: CardExtras | null; error?: string };

function checkPhoneHours(raw: unknown): { ok: boolean; hours?: PhoneHours; error?: string } {
  if (raw === undefined || raw === null) return { ok: true };
  if (typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, error: 'Invalid phone hours.' };
  const r = raw as Record<string, unknown>;
  const days = Array.isArray(r.days) ? Array.from(new Set(r.days)) : [];
  if (days.length === 0) return { ok: true }; // no days ticked = don't show hours
  if (days.some((d) => typeof d !== 'string' || !DAY_KEYS.includes(d))) return { ok: false, error: 'Choose days from the list.' };
  const from = Number(r.from);
  const to = Number(r.to);
  if (!PHONE_TIME_OPTIONS.includes(from) || !PHONE_TIME_OPTIONS.includes(to)) return { ok: false, error: 'Choose a start and end time from the lists.' };
  if (to <= from) return { ok: false, error: 'The end time must be after the start time.' };
  const ordered = DAY_KEYS.filter((d) => days.includes(d)) as WeekDay[];
  return { ok: true, hours: { days: ordered, from, to } };
}

/**
 * The one gate for extras, used by the server on every write AND on every read. Anything not on a
 * list is refused on write. An empty result is null, meaning "no extras".
 */
export function sanitizeCardExtras(raw: unknown, trade: string): SanitizeResult {
  if (raw === null || raw === undefined) return { ok: true, extras: null };
  if (typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, extras: null, error: 'Invalid extras.' };
  const r = raw as Record<string, unknown>;
  const out: CardExtras = {};

  if (r.evalFeeUsd !== undefined && r.evalFeeUsd !== null && r.evalFeeUsd !== '') {
    if (!offersEvaluation(trade)) return { ok: false, extras: null, error: `A visit price isn't offered for ${trade}.` };
    const fee = typeof r.evalFeeUsd === 'number' ? r.evalFeeUsd : Number(r.evalFeeUsd);
    if (!Number.isInteger(fee) || fee < EVAL_FEE_MIN_USD || fee > EVAL_FEE_MAX_USD) {
      return { ok: false, extras: null, error: `Enter the visit price in whole dollars, from $${EVAL_FEE_MIN_USD} to $${EVAL_FEE_MAX_USD.toLocaleString('en-US')}, or leave it empty.` };
    }
    out.evalFeeUsd = fee;
    if (r.evalFeeFrom === true) out.evalFeeFrom = true;
    if (r.evalFeeCredited === true && offersFeeCredit(trade)) out.evalFeeCredited = true;
  }

  const hours = checkPhoneHours(r.phoneHours);
  if (!hours.ok) return { ok: false, extras: null, error: hours.error };
  if (hours.hours) out.phoneHours = hours.hours;

  if (r.textsOk === true) out.textsOk = true;

  return { ok: true, extras: Object.keys(out).length > 0 ? out : null };
}

/**
 * Read-side: parse the stored JSON text and keep every part that is still valid, dropping only the
 * parts that aren't, so one stale value never wipes a business's other extras. Never throws.
 */
export function parseStoredCardExtras(json: string | null | undefined, trade: string): CardExtras | undefined {
  if (!json) return undefined;
  let raw: Record<string, unknown>;
  try {
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return undefined;
    raw = parsed as Record<string, unknown>;
  } catch {
    return undefined;
  }
  const parts: Array<Record<string, unknown>> = [
    { evalFeeUsd: raw.evalFeeUsd, evalFeeFrom: raw.evalFeeFrom, evalFeeCredited: raw.evalFeeCredited },
    { phoneHours: raw.phoneHours },
    { textsOk: raw.textsOk },
  ];
  const out: CardExtras = {};
  for (const part of parts) {
    const result = sanitizeCardExtras(part, trade);
    if (result.ok && result.extras) Object.assign(out, result.extras);
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/** "Mon–Fri", "Mon–Fri, Sun", "Every day", "Tue, Thu". Runs of 3+ days become a range. */
export function formatDays(days: WeekDay[]): string {
  if (days.length === 7) return 'Every day';
  const idx = days.map((d) => DAY_KEYS.indexOf(d)).sort((a, b) => a - b);
  const runs: number[][] = [];
  for (const i of idx) {
    const last = runs[runs.length - 1];
    if (last && i === last[last.length - 1] + 1) last.push(i);
    else runs.push([i]);
  }
  const name = (i: number) => WEEK_DAYS[i].short;
  return runs
    .map((run) => (run.length >= 3 ? `${name(run[0])}–${name(run[run.length - 1])}` : run.map(name).join(', ')))
    .join(', ');
}

export interface CardExtrasLines {
  fee?: string;
  meta: string[];
}

/** The exact text a card prints, e.g. "Electrical evaluation: $195" or "Home inspection from $350". */
export function cardExtrasLines(extras: CardExtras | undefined, trade: string): CardExtrasLines {
  const lines: CardExtrasLines = { meta: [] };
  if (!extras) return lines;
  if (extras.evalFeeUsd) {
    const price = `$${extras.evalFeeUsd.toLocaleString('en-US')}`;
    const credited = extras.evalFeeCredited && offersFeeCredit(trade) ? ', credited toward the work if you hire them' : '';
    lines.fee = `${evalFeeLabel(trade)}${extras.evalFeeFrom ? ` from ${price}` : `: ${price}`}${credited}`;
  }
  if (extras.phoneHours) {
    const h = extras.phoneHours;
    lines.meta.push(`Answers ${formatDays(h.days)}, ${formatTime(h.from)}–${formatTime(h.to)}`);
  }
  if (extras.textsOk) lines.meta.push('Texts OK');
  return lines;
}
