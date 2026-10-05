import { withDb, isDbConfigured } from './db.js';

// Abuse limit for /api/property/generate-report -- see report_generation_daily_cap /
// report_generation_ip_daily_cap in db.ts for the schema.
//
// 2026-10-05, owner: reports are free for everyone, need no account, and no longer call any AI
// model. This module started life as the ceiling on Gemini spend; with that gone it is the only
// thing between a bot and unlimited free reports. What it protects now is the free public APIs the
// route calls (Census geocoder, USGS, Census ACS), whose own rate limits we must not trip for real
// visitors, and the generated_reports table. The route checks it BEFORE the address gate, and a
// caller over the limit gets a 429 with a plain message instead of a report.
//
// Defaults, tunable by env var: 10 reports per IP per day (a buyer comparing several houses in one
// sitting should never hit it) and 500 site-wide per day (two orders of magnitude above the ~2 a
// month seen in September 2026). Raise either if real visitors start meeting the message.
const DEFAULT_DAILY_CAP = 500;
const DEFAULT_IP_DAILY_CAP = 10;

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
 * Atomically checks and reserves one unit of today's report-generation capacity for the
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
 * core report feature, so callers should treat db_unavailable as "let this request through
 * uncounted" (which the route does) rather than as a
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
