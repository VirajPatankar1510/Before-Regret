// Link repair for the 2026-09-03 restore of two guides the 2026-09-02 prune cut by mistake:
// get-home-insurance-fuse-box and how-common-are-title-insurance-claims. See the "off-niche"
// block in src/data/prunedGuides.ts for why the original call was wrong.
//
//   npx tsx scripts/fix-restored-guide-links.ts          # dry run, prints the diff
//   APPLY=true npx tsx scripts/fix-restored-guide-links.ts
//
// TWO PROBLEMS, both created by restoring a page into a library that moved on without it.
//
// 1. DEAD LINKS OUT. Both restored guides still linked to guides the prune removed, because
//    scripts/fix-pruned-internal-links.ts only scanned articles that were 'published' when it
//    ran -- these two were 'removed' at that moment and were never examined. Three links: two
//    from the fuse-box guide into merged slugs (both 301 to the same survivor, so the sentence
//    named two different pages that are now one page), and one from the title-insurance guide
//    into a hard 410 with no successor.
//
// 2. NO LINKS IN. Measured 2026-09-03: both restored pages had ZERO inbound internal links from
//    any published guide. A restored page nothing links to is a page Google has no path to
//    recrawl, so the restore would have been an update to the database and nothing else. The
//    four inbound links below are the fix, placed in the guides whose subject genuinely abuts
//    each restored page rather than wherever a sentence would accept one.
//
// Every edit keeps the surrounding sentence's meaning. Nothing here invents a replacement fact:
// the added sentences are navigational, and the only assertion in any of them (that title
// insurance is the policy covering ownership and lien defects) is definitional.
//
// Anchor text is deliberately varied across the three fuse-box inbound links. Three pages
// pointing at one target through three identical anchors is a pattern worth not creating.
import 'dotenv/config';
import { withDb } from '../src/server/db.js';

const APPLY = process.env.APPLY === 'true';

interface Fix { slug: string; find: string; replace: string; note: string; }

const FIXES: Fix[] = [
  // ---- 1. dead links out of the restored guides -------------------------------------------
  {
    slug: 'get-home-insurance-fuse-box',
    note: 'Two links into merged slugs that both 301 to knob-tube-wiring-have-be-replaced-before-closing. Collapsed to a single direct link to the survivor -- as written the sentence promised two distinct pages that are now the same page, and cost the reader two redirect hops.',
    find: `see [What Does a Knob and Tube Fuse Box Look Like?](/guides/knob-tube-fuse-box-look-like/) for how to tell the two apart, and [Can You Get Homeowners Insurance with Knob and Tube Wiring?](/guides/get-homeowners-insurance-knob-tube-wiring/) for how carriers treat it.`,
    replace: `see [whether knob-and-tube wiring has to be replaced before closing](/guides/knob-tube-wiring-have-be-replaced-before-closing/) for how to tell it apart from later cable and how carriers treat it.`,
  },
  {
    slug: 'how-common-are-title-insurance-claims',
    note: 'Final paragraph existed only to point at is-title-insurance-a-waste-of-money, which the prune 410d with no successor. The paragraph is the last thing in the body, so removing it (with its leading blank line) leaves the article ending on the ALTA/NAIC sentence.',
    find: `\n\nIf the low claims ratio has you wondering whether the product is worth buying at all, that argument is examined separately in [is title insurance a waste of money](/guides/is-title-insurance-a-waste-of-money/).`,
    replace: ``,
  },

  // ---- 2. inbound links, so the restored pages are not orphans ------------------------------
  {
    slug: 'will-zinsco-panel-fail-4-point-inspection',
    note: 'Inbound -> fuse-box. The 4-point inspection is an insurance-driven check on older electrical systems, which is the same underwriting context the fuse-box guide answers.',
    find: `Understanding how home inspectors evaluate these panels, why insurance underwriters view them as an unacceptable hazard, and how to resolve the issue during contract negotiations can prevent expensive surprises at the closing table.`,
    replace: `Understanding how home inspectors evaluate these panels, why insurance underwriters view them as an unacceptable hazard, and how to resolve the issue during contract negotiations can prevent expensive surprises at the closing table. Where the panel in question is a fuse box rather than a breaker panel, [what insurers ask for before covering a fuse box](/guides/get-home-insurance-fuse-box/) covers that case.`,
  },
  {
    slug: 'get-home-insurance-aluminum-wiring',
    note: 'Inbound -> fuse-box. Sibling page: both answer "can this house be insured given an older electrical system".',
    find: `Understanding how insurance underwriters evaluate these circuits—and what concrete steps satisfy their underwriting guidelines—is critical for prospective buyers evaluating homes built during this timeframe.`,
    replace: `Understanding how insurance underwriters evaluate these circuits—and what concrete steps satisfy their underwriting guidelines—is critical for prospective buyers evaluating homes built during this timeframe. For the equivalent question about an older fuse box, see [can you get home insurance with a fuse box](/guides/get-home-insurance-fuse-box/).`,
  },
  {
    slug: 'federal-pacific-stab-lok-panel-inspectors-flag',
    note: 'Inbound -> fuse-box. Panel-brand page; the fuse-box guide is the make-independent version of the same insurance problem.',
    find: `Discovering a Federal Pacific Stab-Lok panel during a home purchase creates immediate friction in the transaction, particularly regarding property insurance and mortgage approval.`,
    replace: `Discovering a Federal Pacific Stab-Lok panel during a home purchase creates immediate friction in the transaction, particularly regarding property insurance and mortgage approval. If the property has a fuse box rather than a breaker panel of any make, [insuring a house with a fuse box](/guides/get-home-insurance-fuse-box/) covers what carriers ask for.`,
  },
  {
    slug: 'buy-house-active-hoa-lawsuit',
    note: 'Inbound -> title-insurance-claims. HOA litigation is a closing-table risk, which is the adjacent context for the title policy. The added clause is definitional about what title insurance covers and asserts nothing about claim outcomes.',
    find: `Understanding how pending court battles affect property purchases, mortgage underwriting, and long-term resale value is critical before signing a purchase contract or waiving contingencies.`,
    replace: `Understanding how pending court battles affect property purchases, mortgage underwriting, and long-term resale value is critical before signing a purchase contract or waiving contingencies. Title insurance is the separate policy that deals with ownership and lien defects at closing; [how common are title insurance claims](/guides/how-common-are-title-insurance-claims/) sets out what the industry data shows.`,
  },
];

async function main() {
  const slugs = [...new Set(FIXES.map((f) => f.slug))];
  const rows = await withDb((sql) => sql`
    SELECT slug, status, body_markdown FROM articles WHERE slug = ANY(${slugs})
  `) as unknown as Array<{ slug: string; status: string; body_markdown: string }>;

  if (rows.length !== slugs.length) {
    throw new Error(`ABORT: asked for ${slugs.length} articles, got ${rows.length}`);
  }
  for (const r of rows) {
    if (r.status !== 'published') throw new Error(`ABORT: ${r.slug} is '${r.status}', not 'published'`);
  }

  const bodies = new Map(rows.map((r) => [r.slug, r.body_markdown]));

  console.log(`${FIXES.length} fix(es) across ${slugs.length} article(s)\n`);
  for (const fix of FIXES) {
    const body = bodies.get(fix.slug);
    if (body === undefined) throw new Error(`ABORT: no body for ${fix.slug}`);
    const occurrences = body.split(fix.find).length - 1;
    if (occurrences !== 1) {
      throw new Error(`ABORT: "${fix.note}" matched ${occurrences} times in ${fix.slug}, expected exactly 1`);
    }
    bodies.set(fix.slug, body.replace(fix.find, fix.replace));
    console.log(`  ok  ${fix.slug}\n      ${fix.note}`);
  }

  // --- assertions on the result ------------------------------------------------------------

  // (a) Nothing may still point at a pruned guide.
  const { MERGED_GUIDE_SLUGS, REMOVED_GUIDE_SLUGS } = await import('../src/data/prunedGuides.js');
  const gone = new Set<string>([...Object.keys(MERGED_GUIDE_SLUGS), ...REMOVED_GUIDE_SLUGS]);
  let dead = 0;
  for (const [slug, body] of bodies) {
    for (const m of body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/?\)/g)) {
      if (gone.has(m[1])) { console.log(`  STILL DEAD: ${slug} -> ${m[1]}`); dead++; }
    }
  }
  if (dead > 0) throw new Error(`ABORT: ${dead} dead link(s) remain`);

  // (b) Every link target must be a published article. A link to a slug that simply does not
  //     exist would not be caught by (a), which only knows about the prune's own two lists.
  const live = new Set((await withDb((sql) => sql`
    SELECT slug FROM articles WHERE status = 'published'
  `) as unknown as Array<{ slug: string }>).map((r) => r.slug));
  let missing = 0;
  for (const [slug, body] of bodies) {
    for (const m of body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/?\)/g)) {
      if (!live.has(m[1])) { console.log(`  NOT PUBLISHED: ${slug} -> ${m[1]}`); missing++; }
    }
  }
  if (missing > 0) throw new Error(`ABORT: ${missing} link(s) point at non-published slugs`);

  // (c) renderArticleMarkdown's parseInline does NOT recurse, so a link wrapped in bold, or bold
  //     wrapped in a link, renders as literal markdown on the live page. This shipped once
  //     already; never again from a script in this repo.
  let nested = 0;
  for (const [slug, body] of bodies) {
    for (const re of [/\*\*\[[^\]]*\]\([^)]*\)\*\*/g, /\[\*\*[^\]]*\*\*\]\([^)]*\)/g]) {
      for (const m of body.matchAll(re)) { console.log(`  NESTED LINK/BOLD: ${slug} -> ${m[0]}`); nested++; }
    }
  }
  if (nested > 0) throw new Error(`ABORT: ${nested} nested link/bold construct(s)`);

  // (d) The restored pages must no longer be orphans.
  const restored = ['get-home-insurance-fuse-box', 'how-common-are-title-insurance-claims'];
  const allBodies = await withDb((sql) => sql`
    SELECT slug, body_markdown FROM articles WHERE status = 'published'
  `) as unknown as Array<{ slug: string; body_markdown: string }>;
  console.log('');
  for (const t of restored) {
    const inbound = allBodies
      .map((r) => ({ slug: r.slug, body: bodies.get(r.slug) ?? r.body_markdown }))
      .filter((r) => r.slug !== t && r.body.includes(`/guides/${t}/`));
    console.log(`  inbound -> ${t}: ${inbound.length} [${inbound.map((r) => r.slug).join(', ')}]`);
    if (inbound.length === 0) throw new Error(`ABORT: ${t} is still an orphan`);
  }

  console.log('\nall assertions passed');

  if (!APPLY) {
    console.log('\nDRY RUN -- nothing written. Re-run with APPLY=true to persist.');
    return;
  }

  for (const slug of slugs) {
    const body = bodies.get(slug)!;
    const res = await withDb((sql) => sql`
      UPDATE articles SET body_markdown = ${body}, updated_at = now()
      WHERE slug = ${slug} RETURNING slug, length(body_markdown) AS len
    `) as unknown as Array<{ slug: string; len: number }>;
    if (res.length !== 1) throw new Error(`ABORT: update of ${slug} affected ${res.length} rows`);
    console.log(`  wrote ${res[0].slug} (${res[0].len} chars)`);
  }
  console.log('\nApplied.');
}

main().catch((err) => { console.error(err); process.exit(1); });
