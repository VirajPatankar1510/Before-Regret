// Verifies every walkthrough check points at a guide that is actually published, and that every
// era/foundation combination the tool offers produces a usable list.
//
//   npx tsx scripts/assert-walkthrough-checks.ts
//
// Runs in the build. The tool's entire purpose is to route a buyer from a thing they can see to the
// guide that explains it, so a check whose slug has been unpublished or renamed is not a cosmetic
// problem -- it is the one link in the product that must not break. The prune already removed 120
// guides once; this makes the next one fail loudly here rather than quietly in a user's hand.
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';
import { WALKTHROUGH_CHECKS, DECADES, selectChecks, assertWalkthroughChecks, type Foundation } from '../src/data/walkthroughChecks.js';

async function retry<T>(fn: () => Promise<T>, n = 8): Promise<T> {
  for (let i = 1; i <= n; i++) {
    try { return await fn(); } catch (e: any) {
      const msg = String(e?.message || e?.sourceError?.cause || e);
      if (i === n || !/ENOTFOUND|fetch failed|timeout|not closed cleanly/i.test(msg)) throw e;
      await new Promise((r) => setTimeout(r, 3000 * i));
    }
  }
  throw new Error('unreachable');
}

async function main() {
  const rows = (await retry(() => withDb((sql) => sql`
    SELECT slug FROM articles WHERE status = 'published'
  `))) as unknown as Array<{ slug: string }>;
  const published = new Set(rows.map((r) => r.slug));

  const problems = assertWalkthroughChecks(published);
  if (problems.length) {
    console.error(`[walkthrough] ${problems.length} problem(s):`);
    for (const p of problems) console.error(`  ${p}`);
    process.exit(1);
  }

  const guides = new Set(WALKTHROUGH_CHECKS.map((c) => c.guide));
  console.log(`[walkthrough] ${WALKTHROUGH_CHECKS.length} checks, all linking published guides (${guides.size} distinct)`);
  console.log('[walkthrough] checks offered per configuration:');
  for (const d of DECADES) {
    const counts = (['slab', 'basement', 'crawlspace', 'unsure'] as Foundation[])
      .map((f) => `${f} ${String(selectChecks(d.mid, f).length).padStart(2)}`).join('   ');
    console.log(`    ${d.label.padEnd(16)} ${counts}`);
  }
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
