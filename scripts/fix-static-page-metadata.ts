// Bring the two over-budget non-guide pages inside the title/meta budgets.
//
//   npx tsx scripts/fix-static-page-metadata.ts            # dry run
//   APPLY=true npx tsx scripts/fix-static-page-metadata.ts
//
// -----------------------------------------------------------------------------------------------
// WHY THESE ESCAPED, which is the part worth fixing properly.
//
// The 60/155 budgets are enforced on GUIDES, by each publishing script, before it writes to the
// database. Nothing enforced them on the pages that do not come from the database:
//
//   /research/        meta 394 chars -- hardcoded in scripts/prerender-research.tsx
//   /sample-report/   title 69, meta 197 -- a hand-authored static file in public/, copied
//                     verbatim into dist by Vite, which is why no prerender script references it
//
// Two different origins, one gap: the budget lived in the publishing path rather than in the built
// output. scripts/assert-canonical-urls.ts now checks every indexable page in dist/, which is the
// only place both origins meet.
//
// An OpenSEO site audit flagged nine pages. Seven were /embed/ iframes with no meta description --
// and those carry noindex, so a missing snippet on them is not a defect. Nine findings, two real.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APPLY = process.env.APPLY === 'true';

type Fix = { file: string; from: string; to: string; label: string; budget: number };

// /research/ -- 394 chars listing all seven studies. A description is a snippet, not a table of
// contents; the page itself lists them.
const RESEARCH_OLD =
  'Seven original analyses of US public housing-risk data: insurance pricing against modelled risk, flood insurance take-up, flood claims paid outside the mapped zone, the condition and emergency planning status of high-hazard dams, storm frequency against what households actually pay to insure, and synchronised housing construction under hail. Every figure downloadable, every method published.';
const RESEARCH_NEW =
  'Seven original analyses of US housing-risk data: insurance pricing against modelled risk, flood claims outside mapped zones, and high-hazard dams.';

// /sample-report/ -- the title said "Before Regret" twice, which is where most of the 69 characters
// went. The brand is already in the first half.
const SAMPLE_TITLE_OLD = 'Sample Report — See Exactly What Before Regret Checks | Before Regret';
const SAMPLE_TITLE_NEW = 'Sample Report — What Before Regret Actually Checks';
const SAMPLE_META_OLD =
  'A real, unedited Before Regret property report with the address redacted. See what a live USGS and Census query returns, what we mark as not yet verified, and the inspection questions it generates.';
const SAMPLE_META_NEW =
  'A real, unedited property report with the address redacted: what a live USGS and Census query returns, and the inspection questions it generates.';

const FIXES: Fix[] = [
  { file: 'scripts/prerender-research.tsx', from: RESEARCH_OLD, to: RESEARCH_NEW, label: '/research/ meta', budget: 155 },
  { file: 'public/sample-report/index.html', from: SAMPLE_TITLE_OLD, to: SAMPLE_TITLE_NEW, label: '/sample-report/ title', budget: 60 },
  { file: 'public/sample-report/index.html', from: SAMPLE_META_OLD, to: SAMPLE_META_NEW, label: '/sample-report/ meta', budget: 155 },
];

function main() {
  const staged = new Map<string, string>();
  const get = (f: string) => staged.get(f) ?? fs.readFileSync(path.join(ROOT, f), 'utf8');

  for (const f of FIXES) {
    const text = get(f.file);
    const n = text.split(f.from).length - 1;
    if (n !== 1) throw new Error(`ABORT: ${f.label} matched ${n} times in ${f.file}, expected 1`);
    if (f.to.length > f.budget) throw new Error(`ABORT: ${f.label} new value ${f.to.length} chars, over ${f.budget}`);
    // A description under ~70 characters wastes the slot rather than overflowing it.
    if (f.budget === 155 && f.to.length < 70) throw new Error(`ABORT: ${f.label} only ${f.to.length} chars`);
    staged.set(f.file, text.replace(f.from, f.to));
    console.log(`  ${f.label}`);
    console.log(`    ${f.from.length} -> ${f.to.length} chars (budget ${f.budget})`);
    console.log(`    +  ${f.to}`);
  }

  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.\n'); return; }
  for (const [file, text] of staged) {
    fs.writeFileSync(path.join(ROOT, file), text);
    console.log(`  wrote ${file}`);
  }
}

main();
