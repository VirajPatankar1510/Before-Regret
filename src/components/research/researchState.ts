// Guided research tool (owner, 2026-11-18) -- state and fixed rules. UNPUBLISHED: lives on the local branch
// `guided-research-tool` until the owner says the whole tool is ready (docs/plans/guided-research-tool-2026-11.md).
//
// No AI anywhere in this tool. Everything a visitor sees is either (a) what they told us, (b) what the address
// step already confirmed, (c) the report engine's era rules (src/engine/inspectionPriorities.ts), or (d) fixed
// text chosen by rules below. State lives only in this browser (localStorage), never on our server.

import type { PropertySearchResult } from '../../types';
import { CURRENT_YEAR, PRIORITY_RULES, getEraLabel, getInspectionPriorities } from '../../engine/inspectionPriorities';
import type { InspectionPriority } from '../../engine/inspectionPriorities';
import type { PermitAuthority } from '../../data/permitRecords/authority';
import type { PermitLevel } from './permitAnswer';
import { MISSIONS, MISSION_IDS, type Meaning, type MissionId } from './missions';

export const RESEARCH_PATH = '/tools/house-research/';
const STORAGE_KEY = 'br-house-research-v1';

export type BuyingStage = 'looking' | 'offer' | 'contract';
export type ResearchView = 'setup' | 'plan' | 'era' | 'permits' | MissionId | 'report' | 'final';

export const WORK = {
  roof: 'Roof',
  kitchen: 'Kitchen remodel',
  bath: 'Bathroom remodel',
  electrical: 'Electrical work',
  plumbing: 'Plumbing work',
  hvac: 'Heating or AC',
  addition: 'Addition',
  basement: 'Finished basement',
} as const;
export type WorkKey = keyof typeof WORK;

/** 'any' stands in when the seller named no specific work: the visitor checks the permit history as a whole. */
export type PermitItemKey = WorkKey | 'any';
export interface PermitFinding { found?: 'yes' | 'no' | 'cant'; fin?: 'yes' | 'no' | 'unsure' }
/** What the visitor was shown, saved when they finish, so the report says exactly where they looked. */
export interface OfficeSnapshot {
  label: string | null;
  department: string | null;
  portalName: string | null;
  portalUrl: string | null;
  onlineFrom: string | null;
  level: PermitLevel;
  /** Verified state note for addresses outside city limits (Layer 1 sheet), e.g. Texas builder inspections. */
  outsideCityNote?: string | null;
  /** The one-line version for a single job; "{work}" is replaced with the job's name. */
  outsideCityJobNote?: string | null;
}
export interface PermitsState {
  stage: 'how' | 'record' | 'solved';
  ans: Partial<Record<PermitItemKey, PermitFinding>>;
  /** Census lookup result, cached on the device; undefined = not looked up yet, null = lookup failed. */
  authority?: PermitAuthority | null;
  office: OfficeSnapshot | null;
  /** In 'record', which job is on screen. */
  step?: number;
  /** Answered. Kept apart from the stage, so opening an answered question to change it never un-answers it.
   *  (Progress saved before 2026-11-18 marks it with stage 'solved' instead.) */
  done?: boolean;
}

/** Stage 3 questions (missions.ts): which step, and the visitor's picks per record question. */
export interface MissionState { stage: 'how' | 'record' | 'solved'; ans: Record<string, string[]>; done?: boolean; /** Which screen of the flow is open (missions.ts `screens`). */ step?: number }

export interface ResearchState {
  v: 1;
  property: PropertySearchResult;
  startedOn: string; // yyyy-mm-dd, local
  view: ResearchView;
  setupStep: 0 | 1 | 2;
  stage: BuyingStage | null;
  deadline: string; // yyyy-mm-dd or ''
  claims: WorkKey[];
  /** step: which item is on screen (one item per screen, "any home" items last). */
  era: { picked: string[] | null; solved: boolean; step?: number };
  permits: PermitsState;
  missions: Partial<Record<MissionId, MissionState>>;
  /** The saved free report built at the end (an /insights/ id). The findings themselves never leave the device. */
  finalReportId?: string;
  /** Funnel events already sent for this house, so a reload or a changed answer never counts twice. */
  funnel?: string[];
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function freshResearch(property: PropertySearchResult): ResearchState {
  return {
    v: 1,
    property,
    startedOn: todayIso(),
    view: 'setup',
    setupStep: 0,
    stage: null,
    deadline: '',
    claims: [],
    era: { picked: null, solved: false },
    permits: { stage: 'how', ans: {}, office: null },
    missions: {},
  };
}

// Every storage call is wrapped: private windows and blocked site data throw, and the tool must still work
// (it just won't remember the visitor's progress).
export function loadResearch(): ResearchState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.v === 1 && parsed.property && typeof parsed.property.yearBuilt === 'number') {
      // Progress saved before the permit question existed.
      if (!parsed.permits) parsed.permits = { stage: 'how', ans: {}, office: null };
      if (!parsed.missions) parsed.missions = {};
      return parsed as ResearchState;
    }
  } catch (e) {}
  return null;
}
export function saveResearch(state: ResearchState | null): void {
  try {
    if (state) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    else localStorage.removeItem(STORAGE_KEY);
  } catch (e) {}
}

/** Whole days from today to the deadline (negative once it has passed), or null with no deadline. */
export function daysLeft(deadline: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) return null;
  const [y, m, d] = deadline.split('-').map(Number);
  const now = new Date();
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 864e5);
}
export function formatShortDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
export function listOf(items: string[]): string {
  if (items.length < 2) return items[0] || '';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

// ---- The era question: the report engine's rules, grouped by WHY they apply ----

export type EraGroup = 'era' | 'area' | 'any';
export interface EraItem extends InspectionPriority { group: EraGroup }

/**
 * Same rules, same filtering as the free report (getInspectionPriorities), so the tool can never disagree with
 * the report. Grouped so each card says honestly why it's there: the house's age, the state or county, or
 * "worth asking about any home".
 */
export function eraItems(property: PropertySearchResult): { eraLabel: string; items: EraItem[] } | null {
  const year = property.yearBuilt;
  const result = getInspectionPriorities(year, property.county, property.state);
  if (!result || !year) return null;
  const items = result.priorities.map((p): EraItem => {
    const rule = PRIORITY_RULES.find((r) => r.id === p.id);
    const yearGated = !!rule && (rule.minYear > 1800 || rule.maxYear < CURRENT_YEAR);
    const areaGated = !!rule && (!!rule.states?.length || !!rule.counties?.length);
    return { ...p, group: yearGated ? 'era' : areaGated ? 'area' : 'any' };
  });
  return { eraLabel: getEraLabel(year), items };
}


// ---- Questions on the plan screen ----

export type QuestionId = 'era' | 'permits' | 'insure' | 'water' | 'decode';
export interface QuestionDef {
  id: QuestionId;
  live: boolean; // false = built in a later stage (see the plan doc); shown, not clickable
  title: (s: ResearchState) => string;
  teaser: string;
}
export const QUESTIONS: QuestionDef[] = [
  {
    id: 'era',
    live: true,
    title: (s) => `What should I ask about a house built in ${s.property.yearBuilt}?`,
    teaser: 'What was common in homes of that age, and how to check each one.',
  },
  {
    id: 'permits',
    live: true,
    title: (s) => (s.claims.length ? `Did anyone pull a permit for the ${listOf(s.claims.map((k) => WORK[k].toLowerCase()))}?` : 'Did anyone pull a permit for the work?'),
    teaser: 'A nice-looking job doesn’t tell you whether it was approved. The records do.',
  },
  {
    id: 'insure',
    live: true,
    title: () => 'Will this house be hard to insure?',
    teaser: 'The flood map, the claims history (CLUE) report, and what to ask an insurer.',
  },
  {
    id: 'water',
    live: true,
    title: () => 'Is the pipe from the street lead?',
    teaser: 'Your water utility keeps a public record. Here’s how to read it.',
  },
  {
    id: 'decode',
    live: true,
    title: () => 'Found something odd in the inspection report?',
    teaser: 'After the inspection, we’ll help you work out what it means.',
  },
];

export function isSolved(s: ResearchState, id: QuestionId): boolean {
  if (id === 'era') return s.era.solved;
  if (id === 'permits') return !!s.permits.done || s.permits.stage === 'solved';
  const m = s.missions?.[id];
  return !!m && (!!m.done || m.stage === 'solved');
}

// ---- The permit question: fixed text chosen by the visitor's answers (no AI) ----

export function permitItems(s: ResearchState): PermitItemKey[] {
  return s.claims.length ? s.claims : ['any'];
}
export function itemLabel(k: PermitItemKey): string {
  return k === 'any' ? 'Permit history' : WORK[k];
}
function workNoun(k: PermitItemKey): string {
  return k === 'any' ? 'past work on the house' : WORK[k].toLowerCase();
}

export const OPEN_PERMITS_GUIDE = '/guides/resolve-open-building-permits-before-closing/';
export const GENERAL_PERMITS_GUIDE = '/guides/look-up-building-permits-by-address/';

export interface PermitMeaning {
  tone: 'good' | 'ask' | 'neutral';
  text: string;
  /** Shown after the text as a link to our open-permits guide. */
  openPermitsLink?: boolean;
  seller: string | null;
  verify: string | null;
  /** Report table: what the visitor found, and the next step. */
  found: string;
  next: string;
}

export function permitMeaning(k: PermitItemKey, a: PermitFinding | undefined, office: OfficeSnapshot | null): PermitMeaning | null {
  if (!a?.found) return null;
  const w = workNoun(k);
  const any = k === 'any';
  if (a.found === 'yes') {
    if (!a.fin) return null;
    if (a.fin === 'yes') {
      return { tone: 'good', text: 'On record and signed off. Nice. Note the permit number for your files.', seller: null, verify: null, found: 'Permit on record, finaled', next: 'Keep the permit number' };
    }
    if (a.fin === 'no') {
      return {
        tone: 'ask',
        text: 'There’s a permit, but it isn’t closed. That doesn’t automatically mean something’s wrong. Ask the seller to get it inspected and signed off before you close.',
        openPermitsLink: true,
        seller: any ? 'There’s an open permit on the house. Can it be inspected and closed out before closing?' : `The ${w} permit isn’t shown as finaled. Can it be inspected and closed out before closing?`,
        verify: any ? 'Open permits are closed out' : `The ${w} permit is closed out`,
        found: 'Permit found, still open',
        next: 'Ask the seller to close it out',
      };
    }
    return {
      tone: 'ask',
      text: 'There’s a permit. If you can’t see a final inspection or a finaled date, treat it as open and ask the seller.',
      seller: any ? 'Were all permits on the house finaled? Can you share the final inspection records?' : `Was the ${w} permit finaled? Can you share the final inspection record?`,
      verify: any ? 'Every permit on the house was finaled' : `The ${w} permit was finaled`,
      found: 'Permit found, closure unclear',
      next: 'Ask for the final inspection',
    };
  }
  if (a.found === 'no') {
    const online = office?.onlineFrom ? ` Online records for this office start: ${office.onlineFrom}.` : ' Older records are often not online.';
    return {
      tone: 'ask',
      text: (() => {
        // A new house or an addition is what the state notes describe in full; a single job gets the one-line version.
        const whole = any || k === 'addition';
        if (whole && office?.outsideCityNote) return `No permit online? That doesn’t mean they skipped it. ${office.outsideCityNote}`;
        if (!whole && office?.outsideCityJobNote) return `No permit online? That doesn’t mean they skipped it. ${office.outsideCityJobNote.replace('{work}', w)}`;
        if (any) return `No permit online? That doesn’t mean they skipped it.${online} Ask the seller for the paperwork.`;
        // Work the seller says they did: it may be recent, so don't assume it predates the online records
        // (fresh-eyes walk-through 2026-11-18). When it was done is the question that decides what's missing.
        const start = office?.onlineFrom ? ` Online records here start: ${office.onlineFrom}.` : '';
        return `Nothing online for the ${w}. Work done before the online records start may only have a paper permit.${start} Ask the seller when the work was done and who did it, and for the permit number or the invoice.`;
      })(),
      seller: any ? 'Has any work on the house been done with a permit? If so, can you share the permit numbers?' : `When was the ${w} done, and by whom? Was it done with a permit? If so, can you share the permit number or the contractor’s invoice?`,
      verify: any ? 'Permit paperwork for past work' : `Permit or paperwork for the ${w}`,
      found: 'No permit found online',
      next: 'Ask the seller for paperwork',
    };
  }
  const who = office?.department || (office?.label ? `${office.label}’s building department` : 'the building department');
  return {
    tone: 'neutral',
    text: `That happens. Call or email ${who} and ask for the permit history for this address, or ask the seller for the permit number.`,
    seller: any ? 'Has any work on the house been done with a permit? If so, can you share the permit numbers?' : `Was the ${w} done with a permit? If so, can you share the permit number?`,
    verify: any ? 'Permit history for the house' : `Permit status of the ${w}`,
    found: 'Couldn’t search yet',
    next: 'Ask the office or the seller',
  };
}

/** Everything the visitor has decided to take away so far, assembled for the report. */
export function collectFindings(s: ResearchState) {
  const era = eraItems(s.property);
  const checklist = s.era.solved && era ? era.items.filter((i) => (s.era.picked ?? era.items.filter((x) => x.group !== 'any').map((x) => x.id)).includes(i.id)) : [];
  const permitRows: { key: PermitItemKey; meaning: PermitMeaning }[] = [];
  if (isSolved(s, 'permits')) {
    for (const k of permitItems(s)) {
      const m = permitMeaning(k, s.permits.ans[k], s.permits.office);
      if (m) permitRows.push({ key: k, meaning: m });
    }
  }
  const missionRows = missionFindings(s);
  const meanings = [...permitRows.map((r) => r.meaning), ...missionRows.flatMap((m) => m.rows.map((r) => r.meaning))];
  const uniq = (xs: (string | null | undefined)[]) => [...new Set(xs.filter((x): x is string => !!x))];
  const seller = uniq(meanings.map((m) => m.seller));
  const verify = uniq(meanings.map((m) => m.verify));
  return { checklist, permitRows, missionRows, seller, verify };
}

/** Answered Stage 3 questions, in plan order: one row per picked choice. */
export function missionFindings(s: ResearchState): { id: MissionId; title: string; rows: { key: string; meaning: Meaning }[] }[] {
  const out: { id: MissionId; title: string; rows: { key: string; meaning: Meaning }[] }[] = [];
  for (const id of MISSION_IDS) {
    const st = s.missions?.[id];
    if (!st || !isSolved(s, id)) continue;
    const def = MISSIONS[id];
    const rows: { key: string; meaning: Meaning }[] = [];
    for (const q of def.record) {
      for (const pick of st.ans[q.id] || []) {
        const c = q.choices.find((x) => x.id === pick);
        if (c) rows.push({ key: `${q.id}-${c.id}`, meaning: c.meaning });
      }
    }
    if (rows.length) out.push({ id, title: def.reportTitle, rows });
  }
  return out;
}
