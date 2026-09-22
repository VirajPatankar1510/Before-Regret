// Announce the research studies to IndexNow after their content changes.
//
//   npx tsx scripts/submit-research-indexnow.ts            # dry run
//   APPLY=true npx tsx scripts/submit-research-indexnow.ts
//
// -----------------------------------------------------------------------------------------------
// WHY THIS EXISTS. IndexNow has been wired into this repo since the guides work, but only
// src/server/articlesApi.ts ever calls it, on the publish and unpublish actions for a row in the
// articles table. The research studies are not articles -- they are assembled by
// scripts/prerender-research.tsx at build time -- so nothing has ever announced one. A third-party
// crawl of /research/allegheny-storm-premium/ on 2026-09-22 flagged exactly that, and it is true of
// all eight studies. They are the pages carrying ScholarlyArticle and Dataset markup, which makes
// them the most valuable pages on the domain to have discovered promptly, and they were the only
// ones waiting entirely on organic crawl.
//
// WHY A SCRIPT AND NOT A BUILD STEP, which is the obvious thing to reach for and is wrong here.
// The prerender runs on EVERY deploy, including deploys that change a stylesheet. Submitting eight
// unchanged URLs on every push is precisely the abuse IndexNow's protocol asks callers not to
// commit, and the documented consequence is the key being throttled or ignored -- which would take
// the guide submissions down with it, since they share one key.
//
// Change detection inside the build was considered and rejected. prerender-research.tsx has no
// database access, and bing_url_submissions stores a timestamp with no content hash, so there is
// nothing to compare against. A hash manifest committed to the repo would work, but only if it were
// regenerated in the same commit as the content -- otherwise the build detects a mismatch and
// resubmits on every deploy until someone remembers, which is the failure it was meant to prevent.
//
// So the trigger is the honest one: research content changes rarely, and always because a person
// did something. Run this after the monthly Permit Pulse rebuild, or after publishing a new study.
//
// VERIFIES BEFORE IT SUBMITS. Every URL is fetched first and must return 200. Announcing a URL that
// 404s asks a search engine to spend crawl budget on a dead page and teaches it the signal is
// unreliable. The embed pages are excluded on purpose -- they are noindex, and asking an engine to
// index a page that tells it not to is a contradiction, not an optimisation.
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { submitUrlsToIndexNow, INDEXNOW_HOST } from '../src/utils/indexNowService.js';

const APPLY = process.env.APPLY === 'true';
const DIST = path.join(process.cwd(), 'dist', 'research');

/** Published study URLs, read from what the build actually produced rather than a hand-kept list. */
function studyUrls(): string[] {
  if (!fs.existsSync(DIST)) {
    throw new Error('ABORT: dist/research does not exist -- run `npm run build` first');
  }
  const urls: string[] = [`https://${INDEXNOW_HOST}/research/`];
  for (const entry of fs.readdirSync(DIST, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === 'data') continue;
    // The embed pages are excluded structurally rather than by the noindex test below: they live at
    // research/<study>/embed/, one level deeper than this scan reaches, so they are never
    // enumerated. The test still earns its place as a guard -- if a STUDY page is ever set noindex,
    // submitting it would be asking an engine to index a page telling it not to.
    const page = path.join(DIST, entry.name, 'index.html');
    if (!fs.existsSync(page)) continue;
    if (/<meta name="robots" content="[^"]*noindex/i.test(fs.readFileSync(page, 'utf8'))) {
      console.log(`  skip (noindex): /research/${entry.name}/`);
      continue;
    }
    urls.push(`https://${INDEXNOW_HOST}/research/${entry.name}/`);
  }
  return urls;
}

async function main() {
  const urls = studyUrls();
  console.log(`\n  ${urls.length} indexable research URL(s) found\n`);

  const live: string[] = [];
  for (const u of urls) {
    let status = 0;
    try {
      status = (await fetch(u, { method: 'GET', redirect: 'follow' })).status;
    } catch {
      status = 0;
    }
    const ok = status === 200;
    if (ok) live.push(u);
    console.log(`    ${ok ? 'OK  ' : 'SKIP'} ${String(status).padStart(3)}  ${u.replace(`https://${INDEXNOW_HOST}`, '')}`);
  }

  const dead = urls.length - live.length;
  if (dead) console.log(`\n  ${dead} URL(s) excluded -- a submitted URL that is not 200 wastes crawl budget and devalues the signal.`);
  if (!live.length) throw new Error('ABORT: nothing verified 200, refusing to submit');

  if (!APPLY) {
    console.log(`\n  would submit ${live.length} URL(s). DRY RUN -- nothing sent.\n`);
    return;
  }

  const result = await submitUrlsToIndexNow(live);
  console.log(`\n  IndexNow: ${result.success ? 'accepted' : 'FAILED'} -- ${result.message}`);
  if (result.statusCode) console.log(`  HTTP ${result.statusCode}`);
  if (!result.success) process.exitCode = 1;
  console.log();
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
