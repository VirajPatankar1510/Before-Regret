// Publish "South-Facing House: How Much Sun Each Side Really Gets".
//
//   npx tsx scripts/publish-south-facing-house.ts            # dry run
//   APPLY=true npx tsx scripts/publish-south-facing-house.ts
//
// -----------------------------------------------------------------------------------------------
// WHY THIS TOPIC. The 2026-09-18 DataForSEO capture measured US demand for house orientation at
// 3,200 searches a month across four queries -- "south facing house" 1,300, west 720, north 590,
// east 590 -- more than any subject the library covered, and nothing in the library answered it.
// The /sunlight/ tool already targets the CHOOSING question ("which direction should a house
// face"); this guide takes the EVALUATING one -- a buyer who has been told a particular house faces
// a particular way -- and hands them to the tool for the room-by-room check. Two pages, two intents.
//
// NO NUMBER IN THIS ARTICLE IS TYPED. Every sun figure is computed here, at publish time, by
// scripts/solar-window.ts -- the engine /sunlight/ runs, which implements the NOAA solar position
// algorithm and passes a self-test against NOAA's published New York values (run it with
// --selftest before publishing). The HVAC replacement range is read from PRIORITY_RULES, the same
// rule the property report prints, so the two cannot disagree. The markdown in guides/ carries
// {{tokens}}, and this script refuses to write if one survives unresolved.
//
// WHAT IS DELIBERATELY NOT CLAIMED. Direct-sun MINUTES, not heat: the engine counts when sun
// reaches an unobstructed vertical window, not how much energy arrives, so the article says west
// sun arrives "when outdoor temperatures are usually at their highest" and stops there. It never
// says south-facing homes cost less to run, and never names a figure for energy savings -- neither
// is something this site has measured.
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { PRIORITY_RULES } from '../src/engine/inspectionPriorities.js';
import { validateBrief, type ArticleBrief } from '../src/seo/articleBrief.js';
import { guideTopic } from '../src/utils/relatedGuides.js';
import { windowDay } from './solar-window.js';

const APPLY = process.env.APPLY === 'true';
// UPDATE=true rewrites the title and body of the already-published row instead of inserting. The
// slug is the URL and never moves; meta and quick_answer are left exactly as they are.
const UPDATE = process.env.UPDATE === 'true';

const BRIEF: ArticleBrief = {
  slug: 'south-facing-house-sun-by-direction',
  targetQuery: 'south facing house',
  capture: '2026-09-18-volumes-south-facing-house',
  intent: 'informational',
  who: 'a buyer who has just been told the house they toured faces south, and is trying to decide whether that is a real advantage or a line from the listing',
  want: 'to know how many hours of direct sun each side of a house actually gets in winter and in summer, and whether south is really the best way to face',
  achieve: 'to judge the rooms they would actually live in before making an offer, and to know when a sunny side means a hotter house and a harder-working air conditioner',
  titlePromise: 'whether a south-facing house is better, shown in hours of direct sun for each side',
};

// ---- figures, computed -------------------------------------------------------------------------
const PLACES = {
  C: { lat: 41.8943, lon: -87.6455, tz: 'America/Chicago' },  // Cook County, IL
  P: { lat: 33.3452, lon: -112.4989, tz: 'America/Phoenix' }, // Maricopa County, AZ
} as const;
const DAYS = { dec: [2026, 12, 21], jun: [2026, 6, 21] } as const;
const FACINGS = { north: 0, east: 90, south: 180, west: 270 } as const;
const hm = (m: number | null) => (m === null ? '--' : `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);

const F: Record<string, string> = {};
for (const [pk, p] of Object.entries(PLACES)) {
  for (const [dk, [y, mo, d]] of Object.entries(DAYS)) {
    for (const [fk, az] of Object.entries(FACINGS)) {
      const w = windowDay(y, mo, d, p.lat, p.lon, p.tz, az);
      F[`${pk}.${dk}.${fk}`] = (w.directMinutes / 60).toFixed(1);
      F[`${pk}.${dk}.${fk}.first`] = hm(w.firstDirectMin);
      F[`${pk}.${dk}.${fk}.last`] = hm(w.lastDirectMin);
      F[`${pk}.${dk}.peak`] = w.peakElevation.toFixed(1);
    }
  }
}

const hvac = (PRIORITY_RULES as any[]).find((r) => r.id === 'hvac_age');
if (!hvac) throw new Error('ABORT: hvac_age rule missing from PRIORITY_RULES');
const HVAC_COST = (String(hvac.typicalRepairCost).match(/\$[\d,]+\s*[–-]\s*\$[\d,]+\+?/) ?? [])[0];
if (!HVAC_COST) throw new Error(`ABORT: no cost range in hvac_age: "${hvac.typicalRepairCost}"`);

function sunTable(): string {
  const row = (label: string, fk: string) =>
    `| ${label} | ${F[`C.dec.${fk}`]} h | ${F[`C.jun.${fk}`]} h | ${F[`P.dec.${fk}`]} h | ${F[`P.jun.${fk}`]} h |`;
  return [
    '| Window faces | Chicago, 21 Dec | Chicago, 21 Jun | Phoenix, 21 Dec | Phoenix, 21 Jun |',
    '| :--- | ---: | ---: | ---: | ---: |',
    row('North', 'north'), row('East', 'east'), row('South', 'south'), row('West', 'west'),
  ].join('\n');
}

const fill = (s: string) =>
  s.replace(/\{\{SUN_TABLE\}\}/g, sunTable())
   .replace(/\{\{HVAC_COST\}\}/g, HVAC_COST)
   .replace(/\{\{([CP]\.[a-z]+\.[a-z]+(?:\.[a-z]+)?)\}\}/g, (_, k) => {
     if (!(k in F)) throw new Error(`ABORT: unknown figure token {{${k}}}`);
     return F[k];
   });

// Revised 2026-09-26, the day it published. The first title, "South-Facing House: How Much Sun Each
// Side Really Gets", asked no yes/no question, while quick_answer opens "Generally yes" -- a verdict
// answering a question the page never posed. The verdict opening is what the AI-features data says
// gets a page cited, so the TITLE now asks the question the verdict answers, keyword still first.
// The slug was left alone: it already carries the query, and moving a URL needs a redirect.
const TITLE = 'South-Facing House: Is It Better? Sun Hours by Direction';
const META = fill('A south window in Chicago gets {{C.dec.south}} hours of direct sun on the shortest day; a north one gets none. Every side, winter and summer.');
const QUICK_ANSWER = fill(
  'Generally yes. Across most of the US a south-facing window gets the most winter sun, {{C.dec.south}} hours of direct sun ' +
  'on the shortest day in Chicago against none for north, and in hot places less summer sun than east or west: ' +
  '{{P.jun.south}} hours in Phoenix on 21 June, against {{P.jun.west}} for west. What matters is which way the main ' +
  'windows face, not the front door.');
const SOURCES = ['NOAA'];
const SRC_MD = path.join(process.cwd(), 'guides', 'south-facing-house.md');

async function main() {
  validateBrief(BRIEF);

  const raw = fs.readFileSync(SRC_MD, 'utf8');
  const body = fill(raw.replace(/^#\s.*\n+/, '').trim());

  let bad = 0;
  const fail = (m: string) => { console.log(`  FAIL ${m}`); bad++; };

  // ---- budgets and structure ---------------------------------------------------------------------
  if (TITLE.length > 60) fail(`title ${TITLE.length} chars, over 60`);
  if (META.length < 70 || META.length > 155) fail(`meta ${META.length} chars, outside 70-155`);
  if (QUICK_ANSWER.length < 120 || QUICK_ANSWER.length > 450) fail(`quick_answer ${QUICK_ANSWER.length} chars, outside 120-450`);
  if (/^#\s/m.test(body)) fail('an H1 survived in the body');
  if (!/^## /m.test(body)) fail('body has no H2');
  for (const s of [body, META, QUICK_ANSWER]) if (s.includes('{{')) fail('unresolved token');

  // ---- the gate rules this guide has to clear ----------------------------------------------------
  if (!/\$[\d,]{3,}/.test(body)) fail('Rule 2: no cost figure in the body');
  if (guideTopic(BRIEF.slug, TITLE) !== 'orientation') fail(`cluster is ${guideTopic(BRIEF.slug, TITLE)}, expected orientation`);

  // ---- claims that must be present, and ones that must not ---------------------------------------
  const REQUIRED = ['[NOAA]', HVAC_COST, 'front door', 'unobstructed', '/sunlight/'];
  for (const q of REQUIRED) if (!body.includes(q)) fail(`missing required text: "${q}"`);
  // Things this site has not measured and must not assert.
  // 'comparatively little in high summer' shipped on 2026-09-26 and was wrong by the article's own
  // table: Chicago on 21 June gives south 8.1 hours, more than east or west. South's summer advantage
  // north of the Sun Belt is the ANGLE the sun meets the glass at, not fewer hours, and the Phoenix
  // result (south gets the least) does not generalise. Banned so the claim cannot come back.
  const BANNED = ['recall', 'save on energy', 'lower bills', 'energy savings', 'percent cheaper',
    'comparatively little in high summer'];
  for (const q of BANNED) if (body.toLowerCase().includes(q)) fail(`unsupported claim present: "${q}"`);

  // ---- links -------------------------------------------------------------------------------------
  const rows = (await withDb((sql) => sql`SELECT slug, status FROM articles`)) as unknown as Array<{ slug: string; status: string }>;
  const published = new Set(rows.filter((r) => r.status === 'published').map((r) => r.slug));
  const exists = rows.some((r) => r.slug === BRIEF.slug);
  if (exists && !UPDATE) fail(`slug ${BRIEF.slug} already exists -- use UPDATE=true to revise the body`);
  if (!exists && UPDATE) fail(`UPDATE=true but ${BRIEF.slug} does not exist yet`);
  for (const m of body.matchAll(/\]\(\/guides\/([a-z0-9-]+)\/?\)/g)) if (!published.has(m[1])) fail(`dead guide link: ${m[1]}`);
  for (const m of body.matchAll(/\]\((\/(?:sunlight|walkthrough)\/)\)/g)) {
    if (!fs.existsSync(path.join(process.cwd(), 'dist', m[1], 'index.html'))) fail(`tool page not built: ${m[1]}`);
  }
  for (const re of [/\*\*\[[^\]]*\]\([^)]*\)\*\*/g, /\[\*\*[^\]]*\*\*\]\([^)]*\)/g]) {
    for (const m of body.matchAll(re)) fail(`nested bold link: ${m[0]}`);
  }

  // ---- report ------------------------------------------------------------------------------------
  console.log(`\n  NEW  /guides/${BRIEF.slug}/`);
  console.log(`    title (${TITLE.length})  ${TITLE}`);
  console.log(`    meta  (${META.length})  ${META}`);
  console.log(`    quick (${QUICK_ANSWER.length})  ${QUICK_ANSWER}`);
  console.log(`    body  ${body.length} chars, ${(body.match(/^## /gm) || []).length} H2s, ${body.split(/\s+/).length} words`);
  console.log(`    cost  ${HVAC_COST} (read from PRIORITY_RULES hvac_age)`);
  console.log(`    cluster ${guideTopic(BRIEF.slug, TITLE)}`);
  console.log('\n' + sunTable().split('\n').map((l) => '    ' + l).join('\n'));
  console.log(`\n  links out: ${[...body.matchAll(/\]\((\/[a-z0-9/-]+)\)/g)].map((m) => m[1]).join(', ')}`);

  if (bad) throw new Error(`ABORT: ${bad} defect(s)`);
  console.log(`\n  ok  brief valid, budgets met, ${REQUIRED.length} required present, ${BANNED.length} unsupported absent`);

  if (!APPLY) { console.log(`\n  DRY RUN (${UPDATE ? 'update' : 'insert'}) -- nothing written.\n`); return; }

  if (UPDATE) {
    await withDb((sql) => sql`UPDATE articles SET title = ${TITLE}, body_markdown = ${body}, updated_at = now() WHERE slug = ${BRIEF.slug}`);
    console.log(`  updated title and body of ${BRIEF.slug}\n  next: npm run build`);
    return;
  }

  // Inserted as published. The build will not pass until the guide carries FAQs (FAQPage is a
  // required guide schema in assert-canonical-urls.ts), so run the article-faqs skill next, then
  // add the keyword to src/seo/targetKeywords.ts -- which requires the slug to be live -- and build.
  await withDb((sql) => sql`
    INSERT INTO articles (slug, title, meta_description, quick_answer, body_markdown,
                          sources_json, status, article_type, ad_tier, published_at)
    VALUES (${BRIEF.slug}, ${TITLE}, ${META}, ${QUICK_ANSWER}, ${body},
            ${JSON.stringify(SOURCES)}, 'published', 'guide', 'standard', now())`);
  console.log(`  wrote ${BRIEF.slug}\n  next: article-faqs, then targetKeywords.ts, then npm run build\n`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
