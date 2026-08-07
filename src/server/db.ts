import { neon } from '@neondatabase/serverless';

// Same fail-closed pattern as adminAuth.ts: a missing DATABASE_URL must mean "the write path is
// unavailable," never a silent fallback or crash deep in a query. isDbConfigured() lets callers
// check before touching sql() at all.

let cachedSql: ReturnType<typeof neon> | null = null;
let schemaEnsured = false;

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function getSql() {
  if (!isDbConfigured()) {
    throw new Error('DATABASE_URL is not configured.');
  }
  if (!cachedSql) {
    cachedSql = neon(process.env.DATABASE_URL as string);
  }
  return cachedSql;
}

// Idempotent -- safe to call on every cold start. Runs once per warm instance thanks to
// schemaEnsured; CREATE TABLE IF NOT EXISTS makes repeat calls (e.g. after a redeploy that
// creates a fresh instance) harmless either way. The two ALTER TABLE ... ADD COLUMN IF NOT
// EXISTS statements are the migration path for columns added after the table already existed in
// production -- CREATE TABLE IF NOT EXISTS alone would silently no-op against the old shape.
export async function ensureArticlesSchema(): Promise<void> {
  if (schemaEnsured) return;
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS articles (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      meta_description TEXT NOT NULL DEFAULT '',
      body_markdown TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      published_at TIMESTAMPTZ
    )
  `;
  await sql`ALTER TABLE articles ADD COLUMN IF NOT EXISTS quick_answer TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE articles ADD COLUMN IF NOT EXISTS sources_json TEXT NOT NULL DEFAULT '[]'`;
  schemaEnsured = true;
}

export async function withDb<T>(fn: (sql: ReturnType<typeof neon>) => Promise<T>): Promise<T> {
  await ensureArticlesSchema();
  return fn(getSql());
}
