// The high-effort brief: the owner's five questions (2026-10-14), answered in writing BEFORE a word of
// the article is drafted, and checked by code so the answers cannot be skipped or faked with filler.
// The write-article skill (.claude/skills/write-article/SKILL.md) is the flow that uses this.
//
//   1. Is the content edited and curated thoughtfully, organised around the reader's goal, with the
//      most valuable part easy to find?
//   2. Did we add something unique that does not exist elsewhere -- first-party data, facts, observations?
//   3. Does the content show evidence of work -- methodology, our own screenshots or diagrams, observations?
//   4. Does it go beyond common facts? If a summary of the top search results could reproduce it, it is
//      low-effort. Details and edge cases from primary sources, never made-up stories or cases.
//   5. Does it provide deep discussion -- where the subject needs it? Not every page does.
//
// Same reasoning as articleBrief.ts: a regex over the finished article cannot tell whether the thinking
// happened, so the check moves to the INPUT. This cannot make anyone think. It makes not thinking fail.
import fs from 'node:fs';
import path from 'node:path';

export interface FirstPartyItem {
  /** What it is, in plain words: "sag grades from San Mateo's lateral form, read as PDF text". */
  what: string;
  /** Where it lives, checkable: a repo path (data file, ledger, image we made, script output), a
   *  capture id under data/keywords/, or a URL on beforeregret.com. Never a third-party article. */
  source: string;
}

export interface EffortBrief {
  slug: string;
  // Q1 -- curation around the reader's goal
  /** The single goal the page is organised around, as the reader would put it. */
  readerGoal: string;
  /** What the reader gets on the first phone screen, before scrolling. */
  firstScreen: string;
  // Q2 -- something unique
  /** At least one item that exists nowhere else: our data, our computation, our observation, a primary
   *  document we read and quote that no competitor page carries. */
  firstParty: FirstPartyItem[];
  // Q3 -- evidence of work
  /** What on the page SHOWS the work: "methodology section", "screenshot public/images/x.webp",
   *  "table computed from docs/data/y.json". Paths are checked for existence. */
  evidenceOfWork: string[];
  // Q4 -- beyond common facts
  /** Specifics a summary of the top results would not contain: thresholds, exceptions, edge cases,
   *  exact wording of a form or statute, local details. Each must be backed by the fact ledger. */
  beyondCommonFacts: string[];
  /** The honest answer to "could someone rebuild this page by summarising the top five results?" */
  reproducibilityCheck: string;
  // Q5 -- depth where the subject needs it
  discussion: 'needed' | 'not-needed';
  /** Why: what genuinely needs weighing (trade-offs, conflicting sources, when the advice changes), or
   *  why the reader is best served by a short, direct page. */
  discussionReason: string;
}

const FILLER = /^(n\/a|na|tbd|todo|none|various|general|see above|same as above|-)$/i;
const REPO = process.cwd();

function looksLikePath(s: string): boolean {
  return /^(src|data|docs|public|scripts|guides)\//.test(s.trim());
}

/** Throws unless every one of the five questions has a specific, checkable answer. */
export function validateEffortBrief(b: EffortBrief): void {
  const fail = (m: string) => { throw new Error(`ABORT effort brief[${b.slug || '?'}]: ${m}`); };
  const text = (k: string, v: string | undefined, min: number) => {
    const t = (v ?? '').trim();
    if (!t) fail(`${k} is empty`);
    if (FILLER.test(t)) fail(`${k} is filler: "${t}"`);
    if (t.length < min) fail(`${k} is ${t.length} chars, under ${min} -- be specific`);
  };

  text('readerGoal', b.readerGoal, 25);
  text('firstScreen', b.firstScreen, 25);

  if (!Array.isArray(b.firstParty) || b.firstParty.length === 0) {
    fail('Q2: no first-party item -- if nothing on the page exists elsewhere, it is not worth writing yet');
  }
  for (const item of b.firstParty) {
    text('firstParty.what', item.what, 20);
    text('firstParty.source', item.source, 5);
    const src = item.source.trim();
    if (looksLikePath(src) && !fs.existsSync(path.join(REPO, src))) fail(`Q2: firstParty source does not exist: ${src}`);
    if (/^https?:\/\//.test(src) && !/beforeregret\.com/.test(src)) {
      fail(`Q2: "${src}" is someone else's page -- a primary document we read belongs in the fact ledger and beyondCommonFacts; firstParty is what WE made, measured or observed`);
    }
  }

  if (!Array.isArray(b.evidenceOfWork) || b.evidenceOfWork.length === 0) fail('Q3: no evidence of work listed');
  for (const e of b.evidenceOfWork) {
    text('evidenceOfWork', e, 10);
    const p = e.match(/\b((?:src|data|docs|public|scripts)\/[^\s,;)]+)/)?.[1];
    if (p && !fs.existsSync(path.join(REPO, p))) fail(`Q3: evidence path does not exist: ${p}`);
  }

  if (!Array.isArray(b.beyondCommonFacts) || b.beyondCommonFacts.length < 2) {
    fail('Q4: name at least two specifics a summary of the top results would not contain');
  }
  for (const f of b.beyondCommonFacts) text('beyondCommonFacts', f, 20);
  text('reproducibilityCheck', b.reproducibilityCheck, 40);
  if (/^(no|nope|it can'?t|cannot)\.?$/i.test(b.reproducibilityCheck.trim())) fail('Q4: reproducibilityCheck must say WHY it cannot be reproduced');

  if (b.discussion !== 'needed' && b.discussion !== 'not-needed') fail('Q5: discussion must be "needed" or "not-needed"');
  text('discussionReason', b.discussionReason, 25);
}

// ------------------------------------------------------------------------------------------------
// The finished draft: what a reader (and a quality rater) notices first.

/** Phrases that mark machine-written filler. Literal domain uses are rare enough to rephrase. */
const AI_TELLS: Array<[RegExp, string]> = [
  [/\bit'?s (important|worth|crucial) to (note|remember|understand)\b/i, '"it\'s important to note"'],
  [/\bin today'?s\b/i, '"in today\'s…"'],
  [/\bdelv(e|es|ing)\b/i, '"delve"'],
  [/\bnavigat(e|ing) the (complexit|world|landscape|process)/i, '"navigate the…"'],
  [/\b(ever-evolving|ever-changing|fast-paced)\b/i, '"ever-evolving"'],
  [/\bin conclusion\b|\bto sum up\b|\bin summary\b/i, 'a summary sign-off'],
  [/\bwhether you'?re a\b/i, '"whether you\'re a…"'],
  [/\blook no further\b|\bunlock\b|\bgame[- ]changer\b|\bembark\b/i, 'marketing filler'],
  [/\b(comprehensive|ultimate|definitive) guide\b/i, '"comprehensive guide"'],
  [/\bdive (in|into|deeper)\b|\bdeep dive\b/i, '"dive into"'],
  [/\b(furthermore|moreover)\b/i, '"furthermore/moreover"'],
  [/\b(crucial|pivotal|paramount)\b/i, '"crucial/pivotal"'],
  [/\b(regulatory )?landscape\b/i, '"landscape"'],
  [/\bwhen it comes to\b/i, '"when it comes to"'],
  [/\bpeace of mind\b/i, '"peace of mind"'],
  [/\bnot only\b[^.]{0,80}\bbut also\b/i, '"not only… but also"'],
];

const trigrams = (t: string) => {
  const w = t.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  return new Set(w.slice(0, -2).map((_, i) => `${w[i]} ${w[i + 1]} ${w[i + 2]}`));
};

/**
 * Throws on the draft-level failures the five questions are meant to prevent:
 * machine phrasing, an opening paragraph that repeats the quick answer, and a page with no visible
 * evidence of work (a "How we checked this" style section, or an image we made).
 */
export function assertHumanDraft(slug: string, body: string, quickAnswer: string): void {
  const problems: string[] = [];
  for (const [re, label] of AI_TELLS) {
    const m = body.match(re) ?? quickAnswer.match(re);
    if (m) problems.push(`AI tell ${label}: "…${m[0]}…"`);
  }
  // The first paragraph must move the reader forward, not say the quick answer again (owner 2026-10-14).
  const firstPara = body.split(/\n\s*\n/).find((p) => p.trim() && !p.trim().startsWith('#') && !p.trim().startsWith('!')) ?? '';
  if (quickAnswer.trim()) {
    const q = trigrams(quickAnswer), f = trigrams(firstPara);
    let shared = 0; f.forEach((g) => { if (q.has(g)) shared++; });
    if (f.size && shared / f.size > 0.25) problems.push(`first paragraph repeats the quick answer (${Math.round((shared / f.size) * 100)}% shared phrases)`);
  }
  // Evidence of work must be visible to the reader, not only in our ledger.
  const hasMethod = /^#{2,3} .*(how we (checked|researched|tested|measured|built|got)|our method|methodology|where (these|the) (numbers|figures|facts) come from|sources)/im.test(body);
  const hasOwnImage = /!\[[^\]]+\]\(\/images\/[^)]+\)/.test(body);
  if (!hasMethod && !hasOwnImage) problems.push('no visible evidence of work: add a "How we checked this" section or an image we made (/images/...)');
  if (problems.length) throw new Error(`ABORT draft[${slug}]:\n  - ${problems.join('\n  - ')}`);
}
