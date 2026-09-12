// Fix the heading-level skips an accessibility audit flagged on the research studies.
//
//   npx tsx scripts/fix-heading-order.ts            # dry run
//   APPLY=true npx tsx scripts/fix-heading-order.ts
//
// -----------------------------------------------------------------------------------------------
// WHAT WAS ACTUALLY WRONG, which is not what "heading levels skip" suggests.
//
// Four studies share a hand-written county-lookup block that opens with <h3>Look up your county</h3>
// sitting directly under the page <h1>, followed by an EMPTY <h4 class="lk-name" id="lkname"></h4>
// that JavaScript fills with the selected county's name at runtime.
//
// The empty h4 is the real defect and the audit never mentioned it. A county name is a result label,
// not a document section, and an empty heading is noise to a screen reader navigating by headings.
// It becomes a <p>. Nothing depends on the tag: the JS targets it by id and the CSS by .lk-name,
// both verified before changing it.
//
// WHY ALLEGHENY AND NORTH TEXAS WERE ALREADY CLEAN, which is the useful part: they use the shared
// lookupMarkup() helper in scripts/lib/county-lookup.ts, which uses <p class="lk-eyebrow"> and emits
// no heading at all. The four skipping studies predate that helper and carry their own inline copy.
// The fix brings them level with it rather than inventing a new convention.
//
// raise-or-remove is a different case: an <h4> inside a call-to-action box, again directly under the
// h1. It is a section in its own right, so it becomes an h2.
//
// /advertise/ is fixed separately in src/components/AdvertiseCompare.tsx -- its three step cards
// were h3 with no section heading above them at all, so it gained the <h2>How it works</h2> the
// source comment already implied.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APPLY = process.env.APPLY === 'true';

/** The four hand-maintained studies, and the intro heading each uses after the lookup block. */
const STUDIES: Array<{ file: string; intro: string }> = [
  { file: 'docs/outside-the-zone.html', intro: 'The question' },
  { file: 'docs/high-hazard-dams.html', intro: 'What this is' },
  { file: 'docs/risk-without-price.html', intro: 'The question' },
  { file: 'docs/risk-without-cover.html', intro: 'The question' },
];

type Edit = { file: string; from: string; to: string; label: string; expect?: number; rx?: RegExp };

const EDITS: Edit[] = [];
for (const s of STUDIES) {
  EDITS.push(
    { file: s.file, label: 'lookup heading h3 -> h2',
      from: '<h3>Look up your county</h3>', to: '<h2>Look up your county</h2>' },
    // An empty heading filled by JS is a result slot, not a section. Matched on the CLASS, not a
    // literal id: risk-without-cover carries two lookup widgets (stname, tkname) where the other
    // three carry one (lkname), and keying on the id missed both of them.
    { file: s.file, label: 'empty lk-name h4 -> p', rx: /<h4(\s+class="lk-name"\s+id="[a-z]+")><\/h4>/g,
      to: '<p$1></p>', from: '', expect: 0 },
    { file: s.file, label: `intro heading "${s.intro}" h3 -> h2`,
      from: `<h3>${s.intro}</h3>`, to: `<h2>${s.intro}</h2>` },
  );
}
// risk-without-price carries a second skip the audit did not report: its six FAQ questions are h4
// directly under the h2 "What this study answers". They must be h3 to descend one step -- but in
// these documents h3 is an EYEBROW (every other h3 precedes an h2: "Method", "Limitations",
// "Appendix", "Citation"), and it is styled accordingly. Promoting them bare would make six
// questions look like kickers. So they become h3 with a class carrying h4's exact appearance,
// which keeps the page identical to the eye and correct to a screen reader.
EDITS.push(
  { file: 'docs/risk-without-price.html', label: 'FAQ questions h4 -> h3.faq-q',
    rx: /<h4>(Which state|What is the average|Do homeowners|Why doesn|How many US)/g,
    to: '<h3 class="faq-q">$1', from: '', expect: 0 },
  { file: 'docs/risk-without-price.html', label: 'close the FAQ h3 tags',
    rx: /(<h3 class="faq-q">[^<]*)<\/h4>/g, to: '$1</h3>', from: '', expect: 0 },
  { file: 'docs/risk-without-price.html', label: 'h3.faq-q inherits h4 styling',
    from: 'h4{font-family:var(--serif);font-size:1.12rem;line-height:1.35;font-weight:600;',
    to: 'h4,h3.faq-q{font-family:var(--serif);font-size:1.12rem;line-height:1.35;font-weight:600;' },
);

EDITS.push({
  file: 'scripts/build-raise-or-remove-study.ts', label: 'CTA heading h4 -> h2',
  from: '<h4>A ZIP code is not a house</h4>', to: '<h2>A ZIP code is not a house</h2>',
});

/** Recomputed after editing: the whole point is that no skip remains. */
function skips(html: string): Array<[number, number, string]> {
  const hs = [...html.matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/g)]
    .map((m) => [Number(m[1]), m[2].replace(/<[^>]+>/g, '').trim()] as [number, string]);
  const out: Array<[number, number, string]> = [];
  for (let i = 0; i < hs.length - 1; i++) {
    if (hs[i + 1][0] - hs[i][0] > 1) out.push([hs[i][0], hs[i + 1][0], hs[i + 1][1].slice(0, 40)]);
  }
  return out;
}

function main() {
  const staged = new Map<string, string>();
  const get = (f: string) => staged.get(f) ?? fs.readFileSync(path.join(ROOT, f), 'utf8');

  for (const e of EDITS) {
    const text = get(e.file);
    if (e.rx) {
      const hits = [...text.matchAll(e.rx)].length;
      if (hits < 1) throw new Error(`ABORT: ${e.file} — "${e.label}" matched 0, expected at least 1`);
      staged.set(e.file, text.replace(e.rx, e.to));
      console.log(`  ${path.basename(e.file).padEnd(30)}  ${e.label} (${hits})`);
      continue;
    }
    const n = text.split(e.from).length - 1;
    const want = e.expect ?? 1;
    if (n !== want) throw new Error(`ABORT: ${e.file} — "${e.label}" matched ${n}, expected ${want}`);
    staged.set(e.file, text.split(e.from).join(e.to));
    console.log(`  ${path.basename(e.file).padEnd(30)}  ${e.label}`);
  }

  // Verify on the edited HTML, not on intent. The builder file is TypeScript, so only the four
  // study documents can be checked here; raise-or-remove is verified after the next build.
  console.log('');
  let remaining = 0;
  for (const s of STUDIES) {
    const left = skips(staged.get(s.file)!);
    // An empty heading is also reported, since removing one was half the point.
    const empties = [...staged.get(s.file)!.matchAll(/<h([1-6])[^>]*>\s*<\/h\1>/g)].length;
    remaining += left.length + empties;
    console.log(`  ${path.basename(s.file).padEnd(28)} skips ${left.length}, empty headings ${empties}`);
    for (const [a, b, t] of left.slice(0, 2)) console.log(`      h${a} -> h${b}  "${t}"`);
  }
  if (remaining) throw new Error(`ABORT: ${remaining} heading problem(s) still present after the edit`);
  console.log(`\n  ok  four studies now descend one level at a time, no empty headings\n`);

  if (!APPLY) { console.log('  DRY RUN -- nothing written.\n'); return; }
  for (const [file, text] of staged) {
    fs.writeFileSync(path.join(ROOT, file), text);
    console.log(`  wrote ${file}`);
  }
}

main();
