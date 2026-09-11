// The brief every publishing script must fill in before it may write an article.
//
// -----------------------------------------------------------------------------------------------
// WHY A DECLARATION AND NOT A REGEX.
//
// Two of the content standard's §7 rules cannot be checked by reading the finished article:
//
//   "Answer three questions in writing BEFORE drafting: who is searching this, what do they want,
//    what are they trying to achieve."
//   "Match content type to intent."
//
// A regex over the published body cannot tell whether that thinking happened. It can only see the
// output, and confident, fluent output looks identical either way -- the same property that makes
// invented keywords dangerous. The `article_type` column cannot stand in for it either: 56 of 57
// published rows say "guide", so it carries no information about intent at all.
//
// So the enforcement moves from the artifact to the INPUT. A publishing script cannot call
// validateBrief() without having written the three answers down, and the validator rejects
// boilerplate, placeholders and text copied between briefs. It does not make anyone think, but it
// makes NOT thinking visible at review time, which is the most a tool can honestly do here.
//
// It is also the same pattern already proven in this project: targetKeywords.ts requires a
// `rationale` written after reading a capture, and ctr-round-3-eifs-la.ts requires a `why` per edit.

export type SearchIntent =
  /** Wants to understand something. A guide. */
  | 'informational'
  /** Already knows what they want and is trying to DO it. Needs steps, costs, and who to call --
   *  not a definition of the thing they already named. */
  | 'transactional'
  /** Looking for a specific place or record. Needs the link and how to use it, fast. */
  | 'navigational';

export interface ArticleBrief {
  slug: string;
  /** The measured query this is written for. Must exist in a capture under data/keywords/. */
  targetQuery: string;
  /** Capture id backing targetQuery -- the provenance gate's citation, repeated here so a brief
   *  cannot be written against a keyword nobody measured. */
  capture: string;
  intent: SearchIntent;
  /** Who is searching this. Not "homeowners" -- a person in a situation. */
  who: string;
  /** What they want to know, in their terms. */
  want: string;
  /** What they are ultimately trying to achieve. Usually a decision or an action, not knowledge. */
  achieve: string;
  /** The outcome the TITLE promises. Must be something the body delivers. */
  titlePromise: string;
}

/** Phrases that mean the field was filled in to get past the validator rather than to say
 *  anything. Cheap to list, and catching even the obvious ones raises the floor. */
const BOILERPLATE = [
  'n/a', 'na', 'tbd', 'todo', 'xxx', 'placeholder', 'none', 'various', 'general',
  'homeowners', 'home buyers', 'buyers', 'users', 'readers', 'people', 'anyone',
  'information', 'info', 'to learn more', 'learn more', 'find out',
];

const MIN = { who: 25, want: 25, achieve: 25, titlePromise: 8 } as const;

/**
 * Throws unless the brief is filled in with something specific.
 *
 * Deliberately strict about length: a 25-character answer is roughly "a buyer whose inspector
 * flagged X", which is the shortest form that actually names a situation. Anything shorter is a
 * category, and a category is what gets written when the question was skipped.
 */
export function validateBrief(b: ArticleBrief): void {
  const fail = (m: string) => { throw new Error(`ABORT brief[${b.slug || '?'}]: ${m}`); };

  if (!b.slug?.trim()) fail('no slug');
  if (!b.targetQuery?.trim()) fail('no targetQuery -- write for a measured query, not a topic');
  if (!b.capture?.trim()) fail('no capture id -- targetQuery must trace to data/keywords/');
  if (!['informational', 'transactional', 'navigational'].includes(b.intent)) {
    fail(`intent "${b.intent}" is not one of informational | transactional | navigational`);
  }

  for (const [k, min] of Object.entries(MIN) as Array<[keyof typeof MIN, number]>) {
    const v = (b[k] ?? '').trim();
    if (!v) fail(`${k} is empty`);
    if (v.length < min) fail(`${k} is ${v.length} chars, under ${min} -- name a situation, not a category`);
    if (BOILERPLATE.includes(v.toLowerCase())) fail(`${k} is boilerplate: "${v}"`);
  }

  // The three answers must differ from one another. Pasting the same sentence into all three is the
  // most likely way to satisfy the length check without doing the work.
  const three = [b.who, b.want, b.achieve].map((s) => s.trim().toLowerCase());
  if (new Set(three).size !== 3) fail('who / want / achieve are not three distinct answers');

  // INTENT MATCHING. A transactional or navigational searcher already knows what the thing is;
  // opening by defining it is the specific failure §7 names. Checked against the title here, and
  // against the body by scripts/assert-article-quality.ts.
  if (b.intent !== 'informational' && /^what (is|are|does)\b/i.test(b.titlePromise.trim())) {
    fail(`intent is ${b.intent} but titlePromise reads like a definition: "${b.titlePromise}"`);
  }
}

/** Convenience for scripts publishing several articles at once. */
export function validateBriefs(briefs: ArticleBrief[]): void {
  const seen = new Set<string>();
  for (const b of briefs) {
    validateBrief(b);
    if (seen.has(b.slug)) throw new Error(`ABORT: duplicate brief for ${b.slug}`);
    seen.add(b.slug);
  }
  // Briefs copied between articles are the scaled-content signature §1 warns about.
  for (const field of ['who', 'want', 'achieve'] as const) {
    const vals = briefs.map((b) => b[field].trim().toLowerCase());
    if (new Set(vals).size !== vals.length) {
      throw new Error(`ABORT: two briefs share the same "${field}" -- they are not different articles`);
    }
  }
}
