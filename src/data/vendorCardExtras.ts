import { canBuyReportAd, FIXED_REPORT_SLOT_CATEGORIES } from './sponsoredVendors.js';

// Optional extras on a Report Ad card (owner, 2026-11-22: "build 1, 2, 5, 6 and 7").
// Plan and reasoning: docs/plans/paid-evaluation-fee-2026-11.md.
//
//   1. Jobs they do, matched to the report item the card sits beside
//   2. The price of their pre-closing visit, optionally credited toward the work
//   5. How soon they can usually come out
//   6. When someone answers the phone, and whether texts are OK
//   7. Languages spoken
//
// Every extra is OPTIONAL. A card with none set looks exactly as it did before.
//
// RULE: STRUCTURED ONLY, NEVER FREE TEXT. The free-text `tagline` was retired because advertisers
// filled it with licence and credential claims that the site then published as its own words (see
// the NOTE ON `tagline` in src/server/db.ts). Every extra here is a number, a switch, or a pick from
// a list whose wording we wrote. Nothing here claims a credential (licensed since, insured, family
// owned, badges); those were left out on purpose because we cannot check them.
//
// This file is imported by the server (src/server/*.ts), so its own imports MUST carry the .js
// extension -- an extensionless import in a server-reachable src/data file took down every /api
// route on 2026-10-12.

export const EVAL_FEE_MIN_USD = 25;
export const EVAL_FEE_MAX_USD = 2000;
/** How many matched jobs one card prints, so the card stays short on a phone and in print. */
export const MAX_JOBS_SHOWN = 3;

export interface JobOption {
  id: string;
  trade: string;
  label: string;
  /**
   * Report items this job is relevant to: PRIORITY_TRADE_CATEGORY / FINDING_TRADE_CATEGORY /
   * SELLER_QUESTION_TRADE_CATEGORY keys. The card prints a ticked job only beside one of these.
   */
  items: readonly string[];
}

const ELECTRICAL = ['knob_and_tube', 'electrical_aluminum_wiring', 'electrical_panel_brand', 'f_elec'] as const;
const FOUNDATION = ['foundation_pre_posttension', 'foundation_posttension', 'foundation_type_general'] as const;
const SUPPLY = ['galvanized_supply', 'polybutylene_supply'] as const;
const PEST = ['termite_wdi_inspection', 'pest_inspection_general'] as const;

// The wording is ours and fixed. Each job is a service, not a credential.
export const JOB_OPTIONS: readonly JobOption[] = [
  { id: 'kt_eval', trade: 'Electrician', label: 'Knob-and-tube evaluations', items: ['knob_and_tube', 'f_elec'] },
  { id: 'elec_insurance_letter', trade: 'Electrician', label: 'Insurance letter on the wiring and panel', items: ELECTRICAL },
  { id: 'panel_replacement', trade: 'Electrician', label: 'Panel replacements', items: ['electrical_panel_brand', 'f_elec'] },
  { id: 'aluminum_repair', trade: 'Electrician', label: 'Aluminum wiring repairs (COPALUM or AlumiConn)', items: ['electrical_aluminum_wiring', 'f_elec'] },

  { id: 'sewer_video', trade: 'Sewer Scope', label: 'Camera inspection, and the buyer gets the video', items: ['sewer_cast_iron'] },
  { id: 'sewer_locate', trade: 'Sewer Scope', label: 'Line locating and depth', items: ['sewer_cast_iron'] },
  { id: 'sewer_lining', trade: 'Sewer Scope', label: 'Pipe lining and trenchless repair', items: ['sewer_cast_iron'] },

  { id: 'repipe', trade: 'Plumber', label: 'Whole-house repipes', items: SUPPLY },
  { id: 'plumb_written', trade: 'Plumber', label: 'Written findings for the buyer', items: SUPPLY },

  { id: 'found_written', trade: 'Foundation Repair', label: 'Written evaluation for the buyer', items: FOUNDATION },
  { id: 'found_pier_beam', trade: 'Foundation Repair', label: 'Pier-and-beam foundations', items: FOUNDATION },
  { id: 'found_slab', trade: 'Foundation Repair', label: 'Slab foundations', items: FOUNDATION },

  { id: 'insp_crawlspace', trade: 'Home Inspector', label: 'Full crawlspace entry', items: ['pier_and_beam'] },
  { id: 'insp_new_build', trade: 'Home Inspector', label: 'Pre-drywall and 11-month warranty inspections', items: ['pier_and_beam'] },

  { id: 'roof_letter', trade: 'Roof Inspection', label: 'Roof condition letter for insurance', items: ['roof_age', 'f_roof'] },
  { id: 'roof_wind_mit', trade: 'Roof Inspection', label: 'Wind mitigation inspections', items: ['roof_age', 'f_roof'] },

  { id: 'hvac_written', trade: 'HVAC Inspection', label: 'Written condition report for the buyer', items: ['hvac_age', 'f_hvac'] },
  { id: 'hvac_ducts', trade: 'HVAC Inspection', label: 'Duct and airflow checks', items: ['hvac_age', 'f_hvac'] },

  { id: 'radon_continuous', trade: 'Radon Testing', label: '48-hour continuous monitor test', items: ['radon_test'] },
  { id: 'radon_mitigation', trade: 'Radon Testing', label: 'Radon mitigation systems', items: ['radon_test'] },

  { id: 'chimney_camera', trade: 'Chimney Sweep', label: 'Level 2 inspection with camera', items: ['chimney_level2'] },
  { id: 'chimney_written', trade: 'Chimney Sweep', label: 'Written report for the buyer', items: ['chimney_level2'] },

  { id: 'pest_wdi_lender', trade: 'Pest/Termite Control', label: 'Termite (WDI) report for the lender', items: PEST },
  { id: 'pest_treatment', trade: 'Pest/Termite Control', label: 'Termite treatment', items: PEST },

  { id: 'asb_sampling', trade: 'Asbestos/Mold Abatement', label: 'Asbestos sampling with lab results', items: ['asbestos_materials'] },
  { id: 'asb_abatement', trade: 'Asbestos/Mold Abatement', label: 'Asbestos removal', items: ['asbestos_materials'] },

  { id: 'eifs_probe', trade: 'Stucco & EIFS', label: 'Moisture probe testing', items: ['eifs_stucco'] },
  { id: 'eifs_written', trade: 'Stucco & EIFS', label: 'Written report for the buyer', items: ['eifs_stucco'] },

  { id: 'septic_sale', trade: 'Well & Septic Services', label: 'Septic inspection for a home sale', items: ['septic_seller'] },
  { id: 'well_water', trade: 'Well & Septic Services', label: 'Well water testing', items: ['septic_seller'] },

  // Widened 2026-11-22 (owner: "both"): the jobs each report check most often leads to. Services
  // only, never credentials. New ones also arrive through "Suggest a service" (vendor_service_suggestions).
  { id: 'elec_rewire', trade: 'Electrician', label: 'Whole-house rewiring', items: ['knob_and_tube', 'electrical_aluminum_wiring', 'f_elec'] },
  { id: 'elec_service_upgrade', trade: 'Electrician', label: 'Service upgrades (for example 100 to 200 amp)', items: ['electrical_panel_brand', 'knob_and_tube', 'f_elec'] },
  { id: 'elec_gfci_afci', trade: 'Electrician', label: 'GFCI and AFCI protection', items: ELECTRICAL },
  { id: 'elec_grounding', trade: 'Electrician', label: 'Grounding and ungrounded-outlet fixes', items: ELECTRICAL },

  { id: 'sewer_jetting', trade: 'Sewer Scope', label: 'Hydro-jetting and root cutting', items: ['sewer_cast_iron'] },
  { id: 'sewer_spot_repair', trade: 'Sewer Scope', label: 'Spot repairs', items: ['sewer_cast_iron'] },
  { id: 'sewer_replacement', trade: 'Sewer Scope', label: 'Full sewer line replacement', items: ['sewer_cast_iron'] },
  { id: 'sewer_cleanout', trade: 'Sewer Scope', label: 'Cleanout installs', items: ['sewer_cast_iron'] },

  { id: 'plumb_main_line', trade: 'Plumber', label: 'Main water line replacement', items: SUPPLY },
  { id: 'plumb_pressure', trade: 'Plumber', label: 'Water pressure and flow testing', items: SUPPLY },
  { id: 'plumb_leak_detect', trade: 'Plumber', label: 'Leak detection', items: SUPPLY },

  { id: 'found_piering', trade: 'Foundation Repair', label: 'Piering and underpinning', items: FOUNDATION },
  { id: 'found_crack', trade: 'Foundation Repair', label: 'Crack repair and sealing', items: FOUNDATION },
  { id: 'found_encapsulation', trade: 'Foundation Repair', label: 'Crawlspace encapsulation', items: FOUNDATION },
  { id: 'found_drainage', trade: 'Foundation Repair', label: 'Drainage and waterproofing', items: FOUNDATION },
  { id: 'found_leveling', trade: 'Foundation Repair', label: 'Floor leveling', items: FOUNDATION },

  { id: 'insp_thermal', trade: 'Home Inspector', label: 'Thermal imaging', items: ['pier_and_beam'] },
  { id: 'insp_sewer_addon', trade: 'Home Inspector', label: 'Sewer scope add-on', items: ['pier_and_beam'] },
  { id: 'insp_radon_addon', trade: 'Home Inspector', label: 'Radon test add-on', items: ['pier_and_beam'] },
  { id: 'insp_wdi_addon', trade: 'Home Inspector', label: 'Termite (WDI) inspection add-on', items: ['pier_and_beam'] },

  { id: 'roof_repair', trade: 'Roof Inspection', label: 'Roof repairs', items: ['roof_age', 'f_roof'] },
  { id: 'roof_replacement', trade: 'Roof Inspection', label: 'Full roof replacement', items: ['roof_age', 'f_roof'] },
  { id: 'roof_claim', trade: 'Roof Inspection', label: 'Insurance claim inspections', items: ['roof_age', 'f_roof'] },
  { id: 'roof_flashing', trade: 'Roof Inspection', label: 'Flashing and gutter repairs', items: ['roof_age', 'f_roof'] },

  { id: 'hvac_replacement', trade: 'HVAC Inspection', label: 'System replacement', items: ['hvac_age', 'f_hvac'] },
  { id: 'hvac_heat_exchanger', trade: 'HVAC Inspection', label: 'Furnace heat exchanger inspection', items: ['hvac_age', 'f_hvac'] },
  { id: 'hvac_refrigerant', trade: 'HVAC Inspection', label: 'Refrigerant leak checks', items: ['hvac_age', 'f_hvac'] },
  { id: 'hvac_duct_cleaning', trade: 'HVAC Inspection', label: 'Duct cleaning', items: ['hvac_age', 'f_hvac'] },

  { id: 'radon_short_term', trade: 'Radon Testing', label: 'Short-term test with lab report', items: ['radon_test'] },
  { id: 'radon_system_check', trade: 'Radon Testing', label: 'Mitigation system checks and fan replacement', items: ['radon_test'] },
  { id: 'radon_water', trade: 'Radon Testing', label: 'Radon in water testing', items: ['radon_test'] },

  { id: 'chimney_sweep', trade: 'Chimney Sweep', label: 'Sweeping and cleaning', items: ['chimney_level2'] },
  { id: 'chimney_relining', trade: 'Chimney Sweep', label: 'Chimney relining', items: ['chimney_level2'] },
  { id: 'chimney_masonry', trade: 'Chimney Sweep', label: 'Crown and masonry repair', items: ['chimney_level2'] },
  { id: 'chimney_cap', trade: 'Chimney Sweep', label: 'Chimney caps', items: ['chimney_level2'] },

  { id: 'pest_full', trade: 'Pest/Termite Control', label: 'Full pest inspection', items: PEST },
  { id: 'pest_moisture', trade: 'Pest/Termite Control', label: 'Moisture and wood-rot checks', items: PEST },
  { id: 'pest_rodent', trade: 'Pest/Termite Control', label: 'Rodent exclusion', items: PEST },
  { id: 'pest_bait', trade: 'Pest/Termite Control', label: 'Termite bait systems', items: PEST },

  { id: 'mold_testing', trade: 'Asbestos/Mold Abatement', label: 'Mold testing with lab results', items: ['asbestos_materials'] },
  { id: 'mold_remediation', trade: 'Asbestos/Mold Abatement', label: 'Mold remediation', items: ['asbestos_materials'] },
  { id: 'asb_encapsulation', trade: 'Asbestos/Mold Abatement', label: 'Asbestos encapsulation', items: ['asbestos_materials'] },
  { id: 'asb_clearance', trade: 'Asbestos/Mold Abatement', label: 'Air clearance testing', items: ['asbestos_materials'] },

  { id: 'eifs_infrared', trade: 'Stucco & EIFS', label: 'Infrared moisture scan', items: ['eifs_stucco'] },
  { id: 'eifs_repair', trade: 'Stucco & EIFS', label: 'Stucco and EIFS repair', items: ['eifs_stucco'] },
  { id: 'eifs_remediation', trade: 'Stucco & EIFS', label: 'Remediation and re-cladding', items: ['eifs_stucco'] },
  { id: 'eifs_flashing', trade: 'Stucco & EIFS', label: 'Window and flashing leak checks', items: ['eifs_stucco'] },

  { id: 'septic_pumping', trade: 'Well & Septic Services', label: 'Septic pumping', items: ['septic_seller'] },
  { id: 'septic_drainfield', trade: 'Well & Septic Services', label: 'Drain field evaluation', items: ['septic_seller'] },
  { id: 'septic_locate', trade: 'Well & Septic Services', label: 'Tank locating', items: ['septic_seller'] },
  { id: 'well_flow', trade: 'Well & Septic Services', label: 'Well flow and pressure tests', items: ['septic_seller'] },
];

export const VISIT_WAIT_OPTIONS = {
  one_two_days: 'Can usually come out in 1–2 days',
  this_week: 'Can usually come out this week',
  one_two_weeks: 'Usually booked 1–2 weeks out',
} as const;
export type VisitWait = keyof typeof VISIT_WAIT_OPTIONS;

export const CALL_WINDOW_OPTIONS = {
  before_8am: 'Best to call before 8 AM',
  business_hours: 'Answers during business hours',
  after_4pm: 'Best to call after 4 PM',
  evenings_weekends: 'Also answers evenings and weekends',
} as const;
export type CallWindow = keyof typeof CALL_WINDOW_OPTIONS;

export const LANGUAGE_OPTIONS = {
  spanish: 'Spanish',
  chinese: 'Chinese',
  vietnamese: 'Vietnamese',
  korean: 'Korean',
  tagalog: 'Tagalog',
  russian: 'Russian',
  portuguese: 'Portuguese',
  polish: 'Polish',
  haitian_creole: 'Haitian Creole',
  arabic: 'Arabic',
} as const;
export type Language = keyof typeof LANGUAGE_OPTIONS;

export interface CardExtras {
  evalFeeUsd?: number;
  evalFeeCredited?: boolean;
  jobs?: string[];
  visitWait?: VisitWait;
  callWindow?: CallWindow;
  textsOk?: boolean;
  languages?: Language[];
}

/**
 * Trades that do a paid check before closing. Only these get the visit price (2), the jobs (1) and
 * the visit wait (5). The fixed-box trades (movers, agents, interior designers) have no evaluation
 * to price; they still get the phone window (6) and languages (7).
 */
export function offersEvaluation(trade: string): boolean {
  return canBuyReportAd(trade) && !FIXED_REPORT_SLOT_CATEGORIES.has(trade);
}

export function jobsForTrade(trade: string): JobOption[] {
  return JOB_OPTIONS.filter((j) => j.trade === trade);
}

const has = <T extends object>(obj: T, key: unknown): key is keyof T =>
  typeof key === 'string' && Object.prototype.hasOwnProperty.call(obj, key);

// One flat shape (not a discriminated union) because this repo compiles without strictNullChecks,
// where narrowing on `ok` doesn't work. `error` is set exactly when ok is false.
export type SanitizeResult = { ok: boolean; extras: CardExtras | null; error?: string };

/**
 * The one gate for extras, used by the server on every write AND on every read (so an option we
 * later remove from a list simply stops printing, instead of printing a stale id). Anything not on
 * a list is refused on write. An empty result is null, meaning "no extras".
 */
export function sanitizeCardExtras(raw: unknown, trade: string): SanitizeResult {
  if (raw === null || raw === undefined) return { ok: true, extras: null };
  if (typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, extras: null, error: 'Invalid extras.' };
  const r = raw as Record<string, unknown>;
  const out: CardExtras = {};
  const evaluation = offersEvaluation(trade);

  if (r.evalFeeUsd !== undefined && r.evalFeeUsd !== null && r.evalFeeUsd !== '') {
    if (!evaluation) return { ok: false, extras: null, error: `A visit price isn't offered for ${trade}.` };
    const fee = typeof r.evalFeeUsd === 'number' ? r.evalFeeUsd : Number(r.evalFeeUsd);
    if (!Number.isInteger(fee) || fee < EVAL_FEE_MIN_USD || fee > EVAL_FEE_MAX_USD) {
      return { ok: false, extras: null, error: `Enter the visit price in whole dollars, from $${EVAL_FEE_MIN_USD} to $${EVAL_FEE_MAX_USD.toLocaleString('en-US')}, or leave it empty.` };
    }
    out.evalFeeUsd = fee;
    if (r.evalFeeCredited === true) out.evalFeeCredited = true;
  }

  if (r.jobs !== undefined && r.jobs !== null) {
    if (!Array.isArray(r.jobs)) return { ok: false, extras: null, error: 'Invalid job list.' };
    const allowed = new Set(jobsForTrade(trade).map((j) => j.id));
    const picked = Array.from(new Set(r.jobs.filter((j): j is string => typeof j === 'string')));
    if (picked.some((j) => !allowed.has(j))) return { ok: false, extras: null, error: `One of the jobs isn't available for ${trade}.` };
    if (picked.length > 0) out.jobs = picked;
  }

  if (r.visitWait !== undefined && r.visitWait !== null && r.visitWait !== '') {
    if (!evaluation || !has(VISIT_WAIT_OPTIONS, r.visitWait)) return { ok: false, extras: null, error: 'Choose how soon you can usually come out from the list.' };
    out.visitWait = r.visitWait;
  }

  if (r.callWindow !== undefined && r.callWindow !== null && r.callWindow !== '') {
    if (!has(CALL_WINDOW_OPTIONS, r.callWindow)) return { ok: false, extras: null, error: 'Choose when someone answers from the list.' };
    out.callWindow = r.callWindow;
  }
  if (r.textsOk === true) out.textsOk = true;

  if (r.languages !== undefined && r.languages !== null) {
    if (!Array.isArray(r.languages)) return { ok: false, extras: null, error: 'Invalid language list.' };
    const picked = Array.from(new Set(r.languages));
    if (picked.some((l) => !has(LANGUAGE_OPTIONS, l))) return { ok: false, extras: null, error: 'Choose languages from the list.' };
    if (picked.length > 0) out.languages = picked as Language[];
  }

  return { ok: true, extras: Object.keys(out).length > 0 ? out : null };
}

/**
 * Read-side: parse the stored JSON text and keep every part that is still valid, dropping only the
 * parts that aren't (e.g. a job later removed from JOB_OPTIONS), so one stale value never wipes a
 * business's other extras. Never throws.
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
  const allowedJobs = new Set(jobsForTrade(trade).map((j) => j.id));
  const parts: Array<Record<string, unknown>> = [
    { evalFeeUsd: raw.evalFeeUsd, evalFeeCredited: raw.evalFeeCredited },
    { jobs: Array.isArray(raw.jobs) ? raw.jobs.filter((j) => typeof j === 'string' && allowedJobs.has(j)) : undefined },
    { visitWait: raw.visitWait },
    { callWindow: raw.callWindow },
    { textsOk: raw.textsOk },
    { languages: Array.isArray(raw.languages) ? raw.languages.filter((l) => has(LANGUAGE_OPTIONS, l)) : undefined },
  ];
  const out: CardExtras = {};
  for (const part of parts) {
    const result = sanitizeCardExtras(part, trade);
    if (result.ok && result.extras) Object.assign(out, result.extras);
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function joinLanguages(langs: Language[]): string {
  const names = langs.map((l) => LANGUAGE_OPTIONS[l]);
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

export interface CardExtrasLines {
  fee?: string;
  jobs: string[];
  meta: string[];
}

/**
 * The exact text a card prints. `itemKey` is the report item the card sits beside; jobs print only
 * when they belong to that item. With no itemKey (an example card on the advertise page), the
 * first ticked jobs print.
 */
export function cardExtrasLines(extras: CardExtras | undefined, trade: string, itemKey?: string): CardExtrasLines {
  const lines: CardExtrasLines = { jobs: [], meta: [] };
  if (!extras) return lines;
  if (extras.evalFeeUsd) {
    lines.fee = `Pre-closing visit: $${extras.evalFeeUsd.toLocaleString('en-US')}${extras.evalFeeCredited ? ', credited toward the work if you hire them' : ''}`;
  }
  if (extras.jobs?.length) {
    const byId = new Map(jobsForTrade(trade).map((j) => [j.id, j]));
    lines.jobs = extras.jobs
      .map((id) => byId.get(id))
      .filter((j): j is JobOption => Boolean(j) && (!itemKey || j!.items.includes(itemKey)))
      .slice(0, MAX_JOBS_SHOWN)
      .map((j) => j.label);
  }
  if (extras.visitWait) lines.meta.push(VISIT_WAIT_OPTIONS[extras.visitWait]);
  if (extras.callWindow) lines.meta.push(CALL_WINDOW_OPTIONS[extras.callWindow]);
  if (extras.textsOk) lines.meta.push('Texts OK');
  if (extras.languages?.length) lines.meta.push(`Also speaks ${joinLanguages(extras.languages)}`);
  return lines;
}

// --- "Suggest a service" (owner, 2026-11-22) --------------------------------------------------------
// A business that doesn't see a job it does can suggest one. What it types NEVER prints on its ad: it
// goes to vendor_service_suggestions for the owner to read. A real service gets added to JOB_OPTIONS
// above (for every business in that trade); a claim ("licensed", "#1", "certified") is declined.
// That review step is what keeps free text from repeating the retired `tagline` problem.
export const MAX_SUGGESTIONS_PER_SEND = 3;
export const SUGGESTION_MIN_CHARS = 3;
export const SUGGESTION_MAX_CHARS = 60;

/** Cleans and checks one batch of suggestions. Contact details and links are refused, not stored. */
export function checkServiceSuggestions(raw: unknown): { ok: boolean; suggestions: string[]; error?: string } {
  if (!Array.isArray(raw)) return { ok: false, suggestions: [], error: 'Invalid request.' };
  const cleaned = Array.from(new Set(
    raw.filter((x): x is string => typeof x === 'string').map((x) => x.replace(/\s+/g, ' ').trim()).filter(Boolean),
  ));
  if (cleaned.length === 0) return { ok: false, suggestions: [], error: 'Type at least one service.' };
  if (cleaned.length > MAX_SUGGESTIONS_PER_SEND) return { ok: false, suggestions: [], error: `Send up to ${MAX_SUGGESTIONS_PER_SEND} at a time.` };
  for (const x of cleaned) {
    if (x.length < SUGGESTION_MIN_CHARS || x.length > SUGGESTION_MAX_CHARS) {
      return { ok: false, suggestions: [], error: `Keep each service between ${SUGGESTION_MIN_CHARS} and ${SUGGESTION_MAX_CHARS} characters.` };
    }
    if (/https?:|www\.|\.(com|net|org|us)\b|@|\d{3}[\s.-]?\d{3}[\s.-]?\d{4}/i.test(x)) {
      return { ok: false, suggestions: [], error: 'Just the name of the service, please: no links, emails or phone numbers.' };
    }
  }
  return { ok: true, suggestions: cleaned };
}
