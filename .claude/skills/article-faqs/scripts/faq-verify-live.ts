// Verifies that FAQs saved by faq-save.ts are actually live on beforeregret.com -- in the page's
// FAQPage JSON-LD *and* in the visible accordion -- for the given article ids.
//
//   npx tsx .claude/skills/article-faqs/scripts/faq-verify-live.ts 57 67 71 72
//
// Exists because the ad-hoc `curl | grep` this step used to be done with produced a FALSE ALARM on
// a real batch: it reported one Question entity per page where there were four, and nearly got a
// schema bug filed against a deploy that was fine. Three separate things were wrong with that
// approach, and this script fixes each of them:
//
//   1. WRONG FIELD. The recipe grepped for `"question":"..."`. schema.org's Question type has no
//      `question` property -- it uses `name` (see the FAQPage block in scripts/prerender-guides.tsx).
//      The pattern could never match, so "first question" came back empty on every page and looked
//      like missing data rather than a broken check.
//
//   2. SUBSTRING MATCHING ON JSON. Even the corrected `grep -o '"name":"[^"]*'` truncates at the
//      first escaped quote: a real article title came back as `What Does \` because the name
//      contained \". Any question with a quotation mark in it would silently look wrong. This
//      script parses the JSON-LD and compares parsed strings, so escaping cannot lie to it.
//
//   3. NO TOLERANCE FOR A ROLLOUT RACE. Vercel serves old and new builds side by side while a
//      deploy propagates, so two identical requests seconds apart can legitimately return different
//      HTML -- which is exactly what happened: the same command returned 1, then 4. A single-shot
//      check turns that race into a confident wrong answer. This script polls until the page
//      matches or the timeout expires, and says which happened.
//
// The expected questions come from the DATABASE, never from anything typed here, so this checks
// what was actually saved rather than what someone remembered saving.
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL as string);

const SITE = process.env.VERIFY_SITE_ORIGIN || 'https://www.beforeregret.com';
const TIMEOUT_MS = parseInt(process.env.VERIFY_TIMEOUT_MS || '300000', 10); // 5 min default
const POLL_INTERVAL_MS = 20000;

interface Expected {
  id: number;
  slug: string;
  title: string;
  questions: string[];
}

/** Every application/ld+json block on the page, parsed. Unparseable blocks are reported, not
 *  skipped silently -- malformed JSON-LD is itself a defect worth seeing. */
function parseJsonLd(html: string): { blocks: unknown[]; unparseable: number } {
  const blocks: unknown[] = [];
  let unparseable = 0;
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const m of html.matchAll(re)) {
    try {
      blocks.push(JSON.parse(m[1].trim()));
    } catch {
      unparseable++;
    }
  }
  return { blocks, unparseable };
}

function faqQuestionNames(blocks: unknown[]): string[] | null {
  const flat = blocks.flatMap((b) => (Array.isArray(b) ? b : [b])) as Array<Record<string, any>>;
  const faq = flat.find((b) => b && b['@type'] === 'FAQPage');
  if (!faq) return null;
  const entities = Array.isArray(faq.mainEntity) ? faq.mainEntity : [];
  return entities
    .filter((e: any) => e && e['@type'] === 'Question' && typeof e.name === 'string')
    .map((e: any) => e.name as string);
}

/** The accordion renders the question as page text, so entities land HTML-escaped. Decoding the
 *  handful React emits is enough to compare against the raw DB string, and is far less brittle
 *  than trying to re-escape the expected value to match. */
function decodeEntities(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

async function fetchPage(slug: string): Promise<string> {
  // Cache-buster plus no-cache headers: without them a CDN edge can keep answering from the build
  // that was live before the deploy, which is the failure this script exists to survive.
  const url = `${SITE}/guides/${slug}/?_cb=${Date.now()}`;
  const res = await fetch(url, {
    headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

interface CheckResult {
  ok: boolean;
  detail: string;
  missingFromSchema: string[];
  missingFromBody: string[];
}

function check(html: string, expected: Expected): CheckResult {
  const { blocks, unparseable } = parseJsonLd(html);
  const names = faqQuestionNames(blocks);
  if (names === null) {
    return {
      ok: false,
      detail: unparseable > 0
        ? `no FAQPage block found (and ${unparseable} JSON-LD block(s) failed to parse)`
        : 'no FAQPage block found in the page JSON-LD',
      missingFromSchema: expected.questions,
      missingFromBody: [],
    };
  }
  const nameSet = new Set(names);
  const missingFromSchema = expected.questions.filter((q) => !nameSet.has(q));

  const text = decodeEntities(html);
  const missingFromBody = expected.questions.filter((q) => !text.includes(q));

  // The title-as-question entry comes from quick_answer and is prepended by the prerenderer, so the
  // expected total is questions + 1 whenever the article has a quick answer. Reported for context
  // rather than asserted -- an article with no quick answer legitimately has no such entry.
  const detail = `${names.length} Question entities in schema (expected ${expected.questions.length} FAQ + title entry)`;
  return {
    ok: missingFromSchema.length === 0 && missingFromBody.length === 0,
    detail,
    missingFromSchema,
    missingFromBody,
  };
}

async function main() {
  const ids = process.argv.slice(2).map((a) => parseInt(a, 10)).filter((n) => Number.isFinite(n));
  if (ids.length === 0) {
    console.error('Usage: npx tsx .claude/skills/article-faqs/scripts/faq-verify-live.ts <id> [id...]');
    process.exit(1);
  }

  const rows = await sql`
    SELECT id, slug, title, faq_json
    FROM articles
    WHERE id = ANY(${ids}) AND status = 'published'
  ` as unknown as Array<{ id: number; slug: string; title: string; faq_json: string }>;

  const expected: Expected[] = rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    questions: (JSON.parse(r.faq_json || '[]') as Array<{ question: string }>).map((f) => f.question),
  }));

  const missingIds = ids.filter((id) => !expected.some((e) => e.id === id));
  if (missingIds.length > 0) console.log(`WARNING: not found as published articles: ${missingIds.join(', ')}\n`);

  const withoutFaqs = expected.filter((e) => e.questions.length === 0);
  if (withoutFaqs.length > 0) {
    console.log(`WARNING: no FAQs stored for id(s) ${withoutFaqs.map((e) => e.id).join(', ')} -- nothing to verify there.\n`);
  }

  const targets = expected.filter((e) => e.questions.length > 0);
  if (targets.length === 0) {
    console.log('Nothing to verify.');
    return;
  }

  console.log(`Verifying ${targets.length} article(s) against ${SITE}\n`);

  const pending = new Map(targets.map((t) => [t.id, t]));
  const results = new Map<number, CheckResult>();
  const deadline = Date.now() + TIMEOUT_MS;
  let round = 0;

  while (pending.size > 0) {
    round++;
    for (const [id, t] of [...pending]) {
      let result: CheckResult;
      try {
        result = check(await fetchPage(t.slug), t);
      } catch (err: any) {
        result = { ok: false, detail: `fetch failed: ${err?.message ?? err}`, missingFromSchema: [], missingFromBody: [] };
      }
      results.set(id, result);
      if (result.ok) {
        pending.delete(id);
        console.log(`  OK   #${id} ${t.slug} -- ${result.detail}`);
      }
    }
    if (pending.size === 0) break;
    if (Date.now() >= deadline) break;
    console.log(`  ...${pending.size} not live yet (round ${round}); waiting ${POLL_INTERVAL_MS / 1000}s -- a deploy may still be rolling out`);
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  if (pending.size === 0) {
    console.log(`\nAll ${targets.length} article(s) verified live: every saved FAQ present in both the FAQPage schema and the visible accordion.`);
    return;
  }

  console.log(`\nFAILED after ${Math.round(TIMEOUT_MS / 1000)}s -- ${pending.size} article(s) still not matching:`);
  for (const [id, t] of pending) {
    const r = results.get(id)!;
    console.log(`\n  #${id} ${t.slug}`);
    console.log(`    ${r.detail}`);
    for (const q of r.missingFromSchema) console.log(`    missing from schema:   ${q}`);
    for (const q of r.missingFromBody) console.log(`    missing from page text: ${q}`);
  }
  console.log('\nIf the deploy genuinely finished, this is a real defect -- investigate before writing the next batch.');
  process.exit(1);
}

main().catch((err) => {
  console.error('faq-verify-live failed:', err);
  process.exit(1);
});
