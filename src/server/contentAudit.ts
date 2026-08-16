import { withDb } from './db.js';
import { KNOWN_SOURCES } from '../data/knownSources.js';
import { COVERED_COUNTIES } from '../data/coveredCounties.js';
import { findAdversarialCounterpartyFraming } from './articleGenerator.js';

// The single source of truth for the article-quality checks -- imported by both the admin
// content-audit route below and the article-faqs skill's CLI script
// (.claude/skills/article-faqs/scripts/content-audit.ts), so a button click in the admin panel
// and a terminal run of the skill can never check for different things or drift apart.
//
// Every check here corresponds to a defect this site has actually shipped and caught, not a
// theoretical concern: truncated bodies (articles #28, #38), non-code content wrapped in a ```
// fence rendering as an unreadable monochrome box (the "bowing basement wall" table, then #101,
// #137, #143), a table missing its GFM separator row (silently falls through to garbled prose --
// see renderArticleMarkdown.tsx's own comments for that history), a [text](url) link whose URL
// contains whitespace (fails the renderer's link regex, falls through to literal bracket text),
// a [CODE] citation that doesn't resolve against knownSources.ts (silently drops the link), an
// internal link to a guide/county that doesn't exist or isn't published (a dead link on your own
// site), an external link that 404s or times out, and the one confirmed-bad "adversarial
// counterparty framing" pattern (articleGenerator.ts's own comment: describing a standard,
// disclosed practice as if it were designed in bad faith -- a real, published mistake once) --
// previously only checked on the article currently open in the editor, never swept backward
// across everything already published before that check existed.
//
// This is read-only: it never writes to the database. The dead-link check does make real network
// requests to external URLs, which is the one part of this that isn't instant -- everything else
// is pure string/regex work against content already in the database.

const knownKeys = new Set(KNOWN_SOURCES.map((s) => s.key));
const coveredCountySlugs = new Set(COVERED_COUNTIES.map((c) => c.slug));

export interface AuditFinding {
  id: number;
  slug: string;
  title: string;
  detail: string;
}

export interface AuditReport {
  scanned: number;
  truncated: AuditFinding[];
  nonCodeFence: AuditFinding[];
  malformedTable: AuditFinding[];
  brokenLink: AuditFinding[];
  unresolvedCitation: AuditFinding[];
  thin: AuditFinding[];
  deadLink: AuditFinding[];
  adversarialFraming: AuditFinding[];
}

interface ArticleRow {
  id: number;
  slug: string;
  title: string;
  article_type: string;
  body_markdown: string;
}

interface LinkCheckOptions {
  /** External HTTP checks are the one slow, network-dependent part of this audit. On by default
   *  (it's the whole point when someone asks to "verify the links"), but a caller that wants a
   *  fast, DB-only pass can turn it off. */
  checkExternalLinks?: boolean;
  timeoutMs?: number;
  concurrency?: number;
}

/** Extracts every [text](url) target from a body, deduped, keeping which article(s) cited it. */
function collectLinks(rows: ArticleRow[]): Map<string, ArticleRow[]> {
  const byUrl = new Map<string, ArticleRow[]>();
  for (const r of rows) {
    for (const m of r.body_markdown.matchAll(/\[[^\]]+\]\(([^)\s]+)\)/g)) {
      const url = m[1];
      const list = byUrl.get(url) ?? [];
      list.push(r);
      byUrl.set(url, list);
    }
  }
  return byUrl;
}

// A 401/403 is not treated as a finding at all, not even a hedged one: confirmed live (a real
// browser, not just curl, from this tool's own infrastructure -- unrelated to Vercel's IP range or
// any one visitor's location) that FEMA.gov returns "Access Denied" to automated traffic
// regardless of User-Agent, for a URL a human visitor loads fine. Bot-protected .gov and
// enterprise sites do this routinely -- an ASN/IP-reputation block, not a statement about the
// resource -- and it isn't reliable enough signal to distinguish from a genuinely dead link.
// Surfacing it, even hedged, still reads as "the audit found 7 problems" and trains a human to
// stop trusting the count. 404/5xx/DNS failure/timeout are real, actionable signals and stay
// findings; 401/403 is silently not one.
async function checkExternalUrl(url: string, timeoutMs: number): Promise<string | null> {
  const browserHeaders = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  };
  try {
    let res = await fetch(url, { method: 'HEAD', redirect: 'follow', headers: browserHeaders, signal: AbortSignal.timeout(timeoutMs) });
    // Some servers don't implement HEAD correctly (405, or a 200 that lies) -- a real GET is the
    // only way to be sure for those, so it's worth the extra request rather than reporting a false
    // positive against a page that actually loads fine in a browser.
    if (!res.ok) {
      res = await fetch(url, { method: 'GET', redirect: 'follow', headers: browserHeaders, signal: AbortSignal.timeout(timeoutMs) });
    }
    if (res.ok || res.status === 401 || res.status === 403) return null;
    return `External link returned HTTP ${res.status}`;
  } catch (err: any) {
    const reason = err?.name === 'TimeoutError' || err?.name === 'AbortError' ? 'timed out' : (err?.message || 'unreachable');
    return `External link ${reason}`;
  }
}

/** Simple bounded-concurrency map -- keeps a handful of checks in flight without opening one
 *  connection per unique URL at once, which matters once the corpus (and its citation count)
 *  grows well past what it is today. */
async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function findDeadLinks(rows: ArticleRow[], opts: LinkCheckOptions): Promise<AuditFinding[]> {
  const findings: AuditFinding[] = [];
  const byUrl = collectLinks(rows);
  const externalUrls: string[] = [];

  for (const [url, citingRows] of byUrl) {
    const guideMatch = url.match(/\/guides\/([a-z0-9-]+)\/?/);
    const countyMatch = url.match(/\/county\/([a-z0-9-]+)\/?/);

    if (guideMatch || countyMatch) {
      // Internal -- only worth checking links that actually target this site's own content
      // routes; a link to /advertise or /report-ads isn't an article reference and has nothing
      // in the database to check it against.
      const isBeforeRegretHost = url.startsWith('/') || url.includes('beforeregret.com');
      if (!isBeforeRegretHost) continue;

      if (guideMatch) {
        const exists = guideRowsBySlug.has(guideMatch[1]);
        if (!exists) {
          for (const r of citingRows) {
            findings.push({ id: r.id, slug: r.slug, title: r.title, detail: `Internal link to a guide that doesn't exist or isn't published: ${url}` });
          }
        }
      } else if (countyMatch) {
        if (!coveredCountySlugs.has(countyMatch[1])) {
          for (const r of citingRows) {
            findings.push({ id: r.id, slug: r.slug, title: r.title, detail: `Internal link to a county this site doesn't cover: ${url}` });
          }
        }
      }
      continue;
    }

    if (opts.checkExternalLinks && /^https?:\/\//.test(url) && !url.includes('beforeregret.com')) {
      externalUrls.push(url);
    }
  }

  if (externalUrls.length > 0) {
    const timeoutMs = opts.timeoutMs ?? 8000;
    const concurrency = opts.concurrency ?? 5;
    const results = await mapWithConcurrency(externalUrls, concurrency, (url) => checkExternalUrl(url, timeoutMs));
    externalUrls.forEach((url, i) => {
      const problem = results[i];
      if (!problem) return;
      for (const r of byUrl.get(url)!) {
        findings.push({ id: r.id, slug: r.slug, title: r.title, detail: `${problem}: ${url}` });
      }
    });
  }

  return findings;
}

// Populated once per runContentAudit() call (see below) -- module-level so findDeadLinks above
// doesn't need the whole articles array threaded through just to build one Set.
let guideRowsBySlug = new Map<string, true>();

/** No ids -> scans every published article. With ids -> scans only those (e.g. one FAQ batch). */
export async function runContentAudit(ids?: number[], linkOptions?: LinkCheckOptions): Promise<AuditReport> {
  const rows = await withDb((sql) => (
    ids && ids.length > 0
      ? sql`SELECT id, slug, title, article_type, body_markdown FROM articles WHERE status = 'published' AND id = ANY(${ids})`
      : sql`SELECT id, slug, title, article_type, body_markdown FROM articles WHERE status = 'published'`
  )) as unknown as ArticleRow[];

  // A link check needs the FULL set of published slugs to validate against, even when this call
  // was scoped to one FAQ batch's ids -- a link inside a 4-article batch can easily point at
  // article #90, which isn't one of the ids being scanned but is still perfectly real.
  const allPublishedSlugs = ids && ids.length > 0
    ? await withDb((sql) => sql`SELECT slug FROM articles WHERE status = 'published'`) as unknown as { slug: string }[]
    : rows.map((r) => ({ slug: r.slug }));
  guideRowsBySlug = new Map(allPublishedSlugs.map((r) => [r.slug, true as const]));

  const report: AuditReport = {
    scanned: 0, truncated: [], nonCodeFence: [], malformedTable: [], brokenLink: [], unresolvedCitation: [], thin: [],
    deadLink: [], adversarialFraming: [],
  };

  for (const r of rows) {
    report.scanned++;
    const b = r.body_markdown;
    const trimmed = b.trim();
    const ref = { id: r.id, slug: r.slug, title: r.title };

    // A real article always ends on a complete sentence. A cut connection ends on nothing.
    if (!/[.!?]['")]?$/.test(trimmed)) {
      report.truncated.push({ ...ref, detail: `Ends mid-sentence: "…${trimmed.slice(-60)}"` });
    }

    // Any fenced block whose content doesn't read as an actual programming language is almost
    // certainly a step list, option list, or comparison table wrapped in ``` instead of real
    // markdown -- these guide articles never legitimately contain code.
    const fences = trimmed.match(/```[\s\S]*?```/g) || [];
    for (const f of fences) {
      const inner = f.replace(/^```\w*\n?/, '').replace(/```$/, '');
      const looksLikeCode = /^\s*(function|const|let|var|import|class|def |<[a-z]|\{|\/\/|#include)/m.test(inner);
      if (!looksLikeCode) {
        report.nonCodeFence.push({ ...ref, detail: `Non-code content in a \`\`\` fence: "${inner.slice(0, 70).replace(/\n/g, ' ')}…"` });
      }
    }

    // A `| a | b |` line only renders as a real table if the very next line is a valid GFM
    // separator (`|---|---|`) -- anything else falls through to the paragraph branch and joins
    // into one garbled run-on line.
    const lines = trimmed.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i].trim();
      const isTableRow = l.startsWith('|') && l.endsWith('|') && l.length > 1;
      if (!isTableRow) continue;
      const prevWasTableRow = i > 0 && lines[i - 1].trim().startsWith('|') && lines[i - 1].trim().endsWith('|');
      if (prevWasTableRow) continue;
      const next = (lines[i + 1] || '').trim();
      const isSep = /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/.test(next);
      if (!isSep) report.malformedTable.push({ ...ref, detail: `Table row with no valid separator row after it: "${l.slice(0, 70)}"` });
    }

    // The renderer's link regex requires no whitespace inside the URL.
    const linkMatches = trimmed.match(/\[[^\]]+\]\([^)]*\)/g) || [];
    for (const link of linkMatches) {
      if (!/^\[[^\]]+\]\([^)\s]+\)$/.test(link)) report.brokenLink.push({ ...ref, detail: `Malformed link: "${link.slice(0, 90)}"` });
    }

    // A citation bracket that doesn't resolve against knownSources.ts renders as plain text.
    const citeMatches = trimmed.match(/\[[A-Z]{2,}\]/g) || [];
    for (const c of citeMatches) {
      if (!knownKeys.has(c.slice(1, -1))) report.unresolvedCitation.push({ ...ref, detail: `Unresolved citation ${c}` });
    }

    const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
    if (wordCount < 500) report.thin.push({ ...ref, detail: `Only ${wordCount} words (target is 1,200-1,800)` });

    // Same confirmed-bad patterns the editor already blocks on for a NEW save (see
    // SeoAdminPanel.tsx's adversarialFramingHits) -- applied here retroactively, since that check
    // was added after some of these articles already existed and nothing had swept backward.
    for (const hit of findAdversarialCounterpartyFraming(b)) {
      report.adversarialFraming.push({ ...ref, detail: `Adversarial framing of a standard, disclosed practice: "${hit}"` });
    }
  }

  report.deadLink = await findDeadLinks(rows, { checkExternalLinks: true, ...linkOptions });

  return report;
}
