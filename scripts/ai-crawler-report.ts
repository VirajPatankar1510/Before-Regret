// Summarizes src/server/aiCrawlerLog.ts's ai_crawler_visits table -- which AI answer-engine /
// AI-training crawlers have actually fetched this site, how often, and which pages.
//
//   npx tsx scripts/ai-crawler-report.ts [days]        # default 30
//
// WHY THIS EXISTS. Search Console reports nothing about AI Overviews, AI Mode, or any
// answer-engine citation -- this is the only visibility this app has into whether ChatGPT,
// Perplexity, Claude, or any other AI system has even looked at this site, which is the
// prerequisite question behind "are we being cited." A page can only be cited if something
// fetched it first. Read-only: never writes anything.
import 'dotenv/config';
import { withDb, isDbConfigured } from '../src/server/db.js';

async function main() {
  const days = parseInt(process.argv[2] || '30', 10);
  if (!isDbConfigured()) throw new Error('DATABASE_URL is not set.');

  const byBot = await withDb((sql) => sql`
    SELECT bot_name, COUNT(*)::int AS visits, COUNT(DISTINCT path)::int AS unique_paths,
           MIN(visited_at) AS first_seen, MAX(visited_at) AS last_seen
    FROM ai_crawler_visits
    WHERE visited_at >= now() - (${days} || ' days')::interval
    GROUP BY bot_name
    ORDER BY visits DESC
  `) as unknown as Array<{ bot_name: string; visits: number; unique_paths: number; first_seen: string; last_seen: string }>;

  const total = await withDb((sql) => sql`
    SELECT COUNT(*)::int AS c FROM ai_crawler_visits WHERE visited_at >= now() - (${days} || ' days')::interval
  `) as unknown as Array<{ c: number }>;

  console.log(`=== AI CRAWLER VISITS (last ${days} days) ===`);
  console.log(`total visits: ${total[0].c}\n`);

  if (byBot.length === 0) {
    console.log('No AI crawler visits recorded in this window.');
    console.log('(Either none have come yet, or the logging middleware was deployed too recently to have data.)');
    return;
  }

  for (const row of byBot) {
    console.log(`${row.bot_name}`);
    console.log(`  visits       : ${row.visits}`);
    console.log(`  unique pages : ${row.unique_paths}`);
    console.log(`  first seen   : ${new Date(row.first_seen).toISOString()}`);
    console.log(`  last seen    : ${new Date(row.last_seen).toISOString()}`);
    console.log();
  }

  const topPages = await withDb((sql) => sql`
    SELECT path, COUNT(*)::int AS visits, COUNT(DISTINCT bot_name)::int AS distinct_bots
    FROM ai_crawler_visits
    WHERE visited_at >= now() - (${days} || ' days')::interval
    GROUP BY path
    ORDER BY visits DESC
    LIMIT 20
  `) as unknown as Array<{ path: string; visits: number; distinct_bots: number }>;

  console.log(`=== TOP 20 PAGES BY AI CRAWLER VISITS ===`);
  for (const row of topPages) {
    console.log(`  ${String(row.visits).padStart(4)} visits  (${row.distinct_bots} bot${row.distinct_bots === 1 ? '' : 's'})  ${row.path}`);
  }
}

main().catch((e) => { console.error('FAILED:', e); process.exit(1); });
