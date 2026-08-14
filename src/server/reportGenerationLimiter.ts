import { withDb, isDbConfigured } from './db.js';

// Pre-call admission control for /api/property/generate-report's Gemini call -- see
// report_generation_daily_cap / report_generation_ip_daily_cap in db.ts for the schema and full
// rationale. Before this existed, that route had no server-side limit at all: the "one free
// report" rule was (and still is, for the UX) enforced only in the browser via localStorage, so a
// direct POST to the endpoint from any number of IPs could fire Gemini calls indefinitely with no
// ceiling on real-money cost. This is the fix for that specific gap -- it does not touch the
// free-vs-paid product decision, only guarantees a hard ceiling on how much the Gemini side of it
// can ever cost in a day.
//
// Defaults are deliberately conservative and meant to be tuned with real data, not treated as
// permanent: gemini_usage_log's own comment records a real report-generation call measured at
// 1,277 output tokens + 3,317 thinking tokens (Google bills thinking at the output rate), which
// at gemini-3.6-flash's $7.50/M output rate is roughly $0.035-0.04/call including the prompt.
// REPORT_GENERATION_DAILY_CAP=150 (default) therefore bounds worst-case daily spend on this route
// to roughly $5-6/day -- a real, calculable ceiling, not a guess -- regardless of traffic. Raise
// it via env var once real usage data (visible in the admin panel's Gemini usage dashboard) shows
// the default is actually limiting legitimate visitors.
const DEFAULT_DAILY_CAP = 150;
const DEFAULT_IP_DAILY_CAP = 5;

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export interface CapacityCheckResult {
  allowed: boolean;
  reason?: 'db_unavailable' | 'ip_cap' | 'global_cap';
}

/**
 * Atomically checks and reserves one unit of today's Gemini-report-generation capacity for the
 * given IP. Checks the per-IP cap first (cheaper to exhaust, and means a single blocked caller
 * never "spends" any of the global budget) -- only checks the global cap if the IP-level one
 * passes. Both checks are single-statement conditional upserts (INSERT ... ON CONFLICT DO UPDATE
 * ... WHERE count < cap), so they're safe under real concurrency across Vercel's separate
 * serverless instances: Postgres serializes the row-level upsert, there is no
 * read-then-write window for two simultaneous requests to both slip through.
 *
 * Fails CLOSED if the database isn't configured or a query throws -- an admission-control check
 * that silently fails open would defeat the entire point of this module. The one exception is the
 * database being the actual cause of an outage: a broken DB shouldn't also take down the site's
 * core report feature, so callers should treat db_unavailable as "fall back to the non-Gemini
 * report" (which the route already does for every other Gemini failure mode) rather than as a
 * hard error to the visitor.
 */
export async function checkAndReserveReportGenerationCapacity(ipAddress: string): Promise<CapacityCheckResult> {
  if (!isDbConfigured()) {
    return { allowed: false, reason: 'db_unavailable' };
  }

  const ipCap = envInt('REPORT_GENERATION_IP_DAILY_CAP', DEFAULT_IP_DAILY_CAP);
  const globalCap = envInt('REPORT_GENERATION_DAILY_CAP', DEFAULT_DAILY_CAP);

  try {
    const ipRows = await withDb((sql) => sql`
      INSERT INTO report_generation_ip_daily_cap (ip_address, usage_date, call_count)
      VALUES (${ipAddress}, CURRENT_DATE, 1)
      ON CONFLICT (ip_address, usage_date)
      DO UPDATE SET call_count = report_generation_ip_daily_cap.call_count + 1
      WHERE report_generation_ip_daily_cap.call_count < ${ipCap}
      RETURNING call_count
    `);
    if (ipRows.length === 0) {
      return { allowed: false, reason: 'ip_cap' };
    }

    const globalRows = await withDb((sql) => sql`
      INSERT INTO report_generation_daily_cap (usage_date, call_count)
      VALUES (CURRENT_DATE, 1)
      ON CONFLICT (usage_date)
      DO UPDATE SET call_count = report_generation_daily_cap.call_count + 1
      WHERE report_generation_daily_cap.call_count < ${globalCap}
      RETURNING call_count
    `);
    if (globalRows.length === 0) {
      return { allowed: false, reason: 'global_cap' };
    }

    return { allowed: true };
  } catch (err) {
    console.error('[report-generation-limiter] capacity check failed:', err);
    return { allowed: false, reason: 'db_unavailable' };
  }
}
