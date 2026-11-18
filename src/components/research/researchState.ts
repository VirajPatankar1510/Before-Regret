// Guided research tool (owner, 2026-11-18) -- state and fixed rules. UNPUBLISHED: lives on the local branch
// `guided-research-tool` until the owner says the whole tool is ready (docs/plans/guided-research-tool-2026-11.md).
//
// No AI anywhere in this tool. Everything a visitor sees is either (a) what they told us, (b) what the address
// step already confirmed, (c) the report engine's era rules (src/engine/inspectionPriorities.ts), or (d) fixed
// text chosen by rules below. State lives only in this browser (localStorage), never on our server.

import type { PropertySearchResult } from '../../types';
import { CURRENT_YEAR, PRIORITY_RULES, getEraLabel, getInspectionPriorities } from '../../engine/inspectionPriorities';
import type { InspectionPriority } from '../../engine/inspectionPriorities';

export const RESEARCH_PATH = '/tools/house-research/';
const STORAGE_KEY = 'br-house-research-v1';

export type BuyingStage = 'looking' | 'offer' | 'contract';
export type ResearchView = 'setup' | 'plan' | 'era' | 'report';

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

export interface ResearchState {
  v: 1;
  property: PropertySearchResult;
  startedOn: string; // yyyy-mm-dd, local
  view: ResearchView;
  setupStep: 0 | 1 | 2;
  stage: BuyingStage | null;
  deadline: string; // yyyy-mm-dd or ''
  claims: WorkKey[];
  era: { picked: string[] | null; solved: boolean };
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
  };
}

// Every storage call is wrapped: private windows and blocked site data throw, and the tool must still work
// (it just won't remember the visitor's progress).
export function loadResearch(): ResearchState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.v === 1 && parsed.property && typeof parsed.property.yearBuilt === 'number') return parsed as ResearchState;
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

/** "Free" or "usually part of a standard inspection" -- i.e. it costs the buyer nothing extra to ask. */
export function costsNothingExtra(item: InspectionPriority): boolean {
  return /^(free|usually included|included)/i.test(item.costToCheck.trim());
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
    teaser: 'What was common in homes of that age, and roughly what it costs to find out.',
  },
  {
    id: 'permits',
    live: false,
    title: (s) => (s.claims.length ? `Did anyone pull a permit for the ${listOf(s.claims.map((k) => WORK[k].toLowerCase()))}?` : 'Did anyone pull a permit for the work?'),
    teaser: 'A nice-looking job doesn’t tell you whether it was approved. The records do.',
  },
  {
    id: 'insure',
    live: false,
    title: () => 'Will this house be hard to insure?',
    teaser: 'The flood map, the claims history (CLUE) report, and what to ask an insurer.',
  },
  {
    id: 'water',
    live: false,
    title: () => 'Is the pipe from the street lead?',
    teaser: 'Your water utility keeps a public record. Here’s how to read it.',
  },
  {
    id: 'decode',
    live: false,
    title: () => 'Found something odd in the inspection report?',
    teaser: 'After the inspection, we’ll help you work out what it means.',
  },
];

export function isSolved(s: ResearchState, id: QuestionId): boolean {
  if (id === 'era') return s.era.solved;
  return false;
}

/** Everything the visitor has decided to take away so far, assembled for the report. */
export function collectFindings(s: ResearchState) {
  const era = eraItems(s.property);
  const checklist = s.era.solved && era ? era.items.filter((i) => (s.era.picked || []).includes(i.id)) : [];
  return { checklist };
}
