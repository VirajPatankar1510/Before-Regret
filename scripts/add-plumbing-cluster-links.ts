// Adds in-body contextual links across the five plumbing guides. Companion to
// scripts/add-electrical-cluster-links.ts; see that file for the measurement this responds to.
//
//   npx tsx scripts/add-plumbing-cluster-links.ts            # dry run, asserts every match
//   APPLY=true npx tsx scripts/add-plumbing-cluster-links.ts
//
// Before this, the cluster had exactly one in-body link: why-cast-iron-pipes-corrode ->
// orangeburg-pipe-collapse, added when the 2026-09-02 prune repaired links into removed guides.
// The other four guides linked to nothing.
//
// As with the electrical pass, every link sits on text that already discussed its target. The
// strongest anchor was already written and simply not linked: orangeburg-pipe-collapse names
// polybutylene by name when listing what insurers refuse to write service-line endorsements for.
//
// NO LINK IS PLACED INSIDE BOLD. src/utils/renderArticleMarkdown.tsx's parseInline emits the
// contents of **...** as a plain string instead of recursing, so "**[text](url)**" reaches readers
// as literal markdown -- brackets and URL visible on the page. The electrical pass hit this and it
// had to be corrected after the fact. Link text has the same limitation, so "[**text**](url)" is
// equally broken. Until parseInline recurses, links and bold cannot be nested in either order.
//
// ONE DELIBERATE GAP: tpr-valve-inspectors-always-check receives a link but sends none. It is
// about a single water-heater safety valve and mentions no other guide's subject; the honest
// options were to leave it or to write a claim into it purely to justify an outbound link. It is
// still reachable from the /guides/ hub and from the polybutylene guide.
import 'dotenv/config';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';
const G = (slug: string) => `/guides/${slug}/`;

interface Edit { slug: string; find: string; replace: string; to: string; note?: string; }

const EDITS: Edit[] = [
  {
    slug: 'orangeburg-pipe-collapse',
    to: 'why-cast-iron-pipes-corrode',
    find: 'While hydro-jetting is highly effective for rigid, structurally sound pipes like cast iron, clay, or PVC,',
    replace: `While hydro-jetting is highly effective for rigid, structurally sound pipes like [cast iron](${G('why-cast-iron-pipes-corrode')}), clay, or PVC,`,
  },
  {
    slug: 'orangeburg-pipe-collapse',
    to: 'spot-polybutylene-pipes-before-buying-house',
    note: 'The article already names polybutylene here as something insurers refuse to endorse.',
    find: 'but many companies will refuse to write these endorsements for homes with known Orangeburg, galvanized steel, or polybutylene plumbing.',
    replace: `but many companies will refuse to write these endorsements for homes with known Orangeburg, galvanized steel, or [polybutylene](${G('spot-polybutylene-pipes-before-buying-house')}) plumbing.`,
  },
  {
    slug: 'orangeburg-pipe-collapse',
    to: 'homeowners-insurance-cover-failed-sump-pump',
    note: 'Sends the reader from a one-line assertion of the exclusion to the guide that explains it.',
    find: 'They almost universally exclude coverage for gradual wear and tear, rust, corrosion, or structural decay of underground service lines.',
    replace: `They almost universally [exclude coverage for gradual wear and tear](${G('homeowners-insurance-cover-failed-sump-pump')}), rust, corrosion, or structural decay of underground service lines.`,
  },
  {
    slug: 'homeowners-insurance-cover-failed-sump-pump',
    to: 'why-cast-iron-pipes-corrode',
    find: '*   Backs up through sewers or drains.',
    replace: `*   Backs up through [sewers or drains](${G('why-cast-iron-pipes-corrode')}).`,
  },
  {
    // The one appended clause. It states only what the destination article establishes -- that
    // inspectors check the TPR valve on every evaluation -- and it lands where this guide is
    // already telling the reader to look at the water heater.
    slug: 'spot-polybutylene-pipes-before-buying-house',
    to: 'tpr-valve-inspectors-always-check',
    find: 'these transition fittings frequently connect to polybutylene pipes just a few inches into the wall or overhead ceiling joists.',
    replace: `these transition fittings frequently connect to polybutylene pipes just a few inches into the wall or overhead ceiling joists. While you are at the tank, the [temperature and pressure relief valve](${G('tpr-valve-inspectors-always-check')}) is the other water-heater item inspectors flag most often.`,
  },
];

async function main() {
  const slugs = [...new Set(EDITS.map((e) => e.slug))];
  const rows = (await withDb((sql) => sql`
    SELECT slug, body_markdown FROM articles WHERE slug = ANY(${slugs}) AND status = 'published'
  `)) as unknown as Array<{ slug: string; body_markdown: string }>;
  const bodies = new Map(rows.map((r) => [r.slug, r.body_markdown]));
  if (bodies.size !== slugs.length) throw new Error(`ABORT: expected ${slugs.length} articles, found ${bodies.size}`);

  const live = new Set(
    ((await withDb((sql) => sql`SELECT slug FROM articles WHERE status = 'published'`)) as unknown as Array<{ slug: string }>)
      .map((p) => p.slug)
  );

  for (const e of EDITS) {
    if (!live.has(e.to)) throw new Error(`ABORT: link target ${e.to} is not published`);
    const body = bodies.get(e.slug)!;
    const n = body.split(e.find).length - 1;
    if (n !== 1) throw new Error(`ABORT: anchor for ${e.slug} -> ${e.to} matched ${n} times, expected exactly 1`);
    bodies.set(e.slug, body.replace(e.find, e.replace));
    console.log(`  ok  ${e.slug}\n        -> ${e.to}${e.note ? `\n        (${e.note})` : ''}`);
  }

  let bad = 0;
  for (const [slug, body] of bodies) {
    for (const m of body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/?\)/g)) {
      if (!live.has(m[1])) { console.log(`  DEAD LINK: ${slug} -> ${m[1]}`); bad++; }
    }
    // The renderer cannot nest links and bold in either direction; catch it before it ships.
    for (const m of body.matchAll(/\*\*\[[^\]]+\]\([^)]+\)\*\*|\[\*\*[^\]]+\*\*\]\([^)]+\)/g)) {
      console.log(`  NESTED LINK/BOLD (renders as literal markdown): ${slug} -> ${m[0]}`); bad++;
    }
  }
  if (bad) throw new Error(`ABORT: ${bad} problem(s) found`);
  console.log(`\n${EDITS.length} links across ${slugs.length} articles; all targets published, none nested in bold.`);

  if (!APPLY) { console.log('\nDRY RUN -- nothing written. Re-run with APPLY=true.'); return; }

  for (const [slug, body] of bodies) {
    const res = (await withDb((sql) => sql`
      UPDATE articles SET body_markdown = ${body}, updated_at = now()
      WHERE slug = ${slug} AND status = 'published' RETURNING slug
    `)) as unknown as Array<{ slug: string }>;
    if (res.length !== 1) throw new Error(`ABORT: update of ${slug} affected ${res.length} rows`);
    console.log(`  wrote ${slug}`);
  }
  console.log('\nApplied.');
}

main().catch((e) => { console.error('FAILED:', e?.message ?? e); process.exit(1); });
