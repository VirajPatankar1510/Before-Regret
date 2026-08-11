import 'dotenv/config';
import { withDb, isDbConfigured } from '../src/server/db.js';

// CLI insert path for the backlink-leads queue (see src/server/backlinksApi.ts / db.ts's
// backlink_leads table). Exists so the automated scan (run on a schedule from chat, not from any
// server route) can add a row by connecting to the database directly -- the same Neon instance
// local dev and production share -- rather than needing an authenticated HTTP session against a
// dev server that may not even be running when the scan fires. Never touches the admin
// password/TOTP path; a direct DB write is the same trust boundary every other script in this
// folder (fetch-county-data.ts, generate-draft-articles.ts) already operates in.
//
// Usage: npx tsx scripts/add-backlink-lead.ts '{"source":"City-Data","title":"...","url":"...","topicSnippet":"...","countySlug":"dallas-county-tx"}'
// Skips silently (exit 0, prints "duplicate") if a lead with the same URL already exists --
// the daily scan runs unattended, so it must be safe to re-find the same thread on a later day
// without cluttering the queue with copies.

async function main() {
  const raw = process.argv[2];
  if (!raw) {
    console.error('Usage: npx tsx scripts/add-backlink-lead.ts \'{"source":...,"title":...,"url":...}\'');
    process.exit(1);
  }
  let input: { source?: string; title?: string; url?: string; topicSnippet?: string; countySlug?: string };
  try {
    input = JSON.parse(raw);
  } catch {
    console.error('Invalid JSON argument.');
    process.exit(1);
  }
  const source = (input.source || '').trim();
  const title = (input.title || '').trim();
  const url = (input.url || '').trim();
  const topicSnippet = (input.topicSnippet || '').trim();
  const countySlug = (input.countySlug || '').trim() || null;
  if (!source || !title || !url) {
    console.error('A lead needs at least a source, title, and URL.');
    process.exit(1);
  }
  if (!isDbConfigured()) {
    console.error('DATABASE_URL is not configured.');
    process.exit(1);
  }

  const result = await withDb(async (sql) => {
    const existing = await sql`SELECT id FROM backlink_leads WHERE url = ${url} LIMIT 1`;
    if (existing.length > 0) return { duplicate: true, id: existing[0].id };
    const rows = await sql`
      INSERT INTO backlink_leads (source, title, url, topic_snippet, county_slug)
      VALUES (${source}, ${title}, ${url}, ${topicSnippet}, ${countySlug})
      RETURNING id
    `;
    return { duplicate: false, id: rows[0].id };
  });

  if (result.duplicate) {
    console.log(`duplicate (existing lead id ${result.id})`);
  } else {
    console.log(`inserted lead id ${result.id}`);
  }
}

main().catch((err) => {
  console.error('Failed to insert lead:', err);
  process.exit(1);
});
