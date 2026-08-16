// Thin CLI wrapper around src/server/contentAudit.ts -- the SAME module the admin panel's
// "Content audit" button calls (GET /api/admin/content-audit), so a terminal run of this skill
// and a button click in the browser check for identically the same defects. Never writes to the
// database, only reports.
//
// Usage: npx tsx .claude/skills/article-faqs/scripts/content-audit.ts [id id id ...]
//   No args  -> scans every published article (the full-corpus sweep).
//   With ids -> scans only those articles (the current FAQ batch).
import 'dotenv/config';
import { runContentAudit, type AuditReport } from '../../../../src/server/contentAudit.js';

const requestedIds = process.argv.slice(2).map((s) => parseInt(s, 10)).filter(Number.isFinite);

async function main() {
  const report = await runContentAudit(requestedIds.length > 0 ? requestedIds : undefined);
  const total = Object.entries(report)
    .filter(([k]) => k !== 'scanned')
    .reduce((n, [, v]) => n + (v as unknown[]).length, 0);

  console.log(`Scanned ${report.scanned} article(s)${requestedIds.length ? ` (ids: ${requestedIds.join(', ')})` : ' (full corpus)'}.`);
  console.log(total === 0 ? '\nClean -- no findings.' : `\n${total} finding(s):`);
  for (const [key, findings] of Object.entries(report)) {
    if (key === 'scanned' || (findings as unknown[]).length === 0) continue;
    console.log(`\n${key} (${(findings as unknown[]).length}):`);
    console.log(JSON.stringify(findings, null, 1));
  }
}

main().catch((e) => { console.error(e); process.exitCode = 1; });

// Re-exported only so this file's own type-checking catches a signature drift against
// contentAudit.ts immediately, rather than surfacing as a confusing runtime shape mismatch later.
export type { AuditReport };
