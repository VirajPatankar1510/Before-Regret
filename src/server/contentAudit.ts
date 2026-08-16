import { withDb } from './db.js';
import { KNOWN_SOURCES } from '../data/knownSources.js';

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
// and a [CODE] citation that doesn't resolve against knownSources.ts (silently drops the link).
// This is read-only: it never writes to the database.

const knownKeys = new Set(KNOWN_SOURCES.map((s) => s.key));

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
}

interface ArticleRow {
  id: number;
  slug: string;
  title: string;
  article_type: string;
  body_markdown: string;
}

/** No ids -> scans every published article. With ids -> scans only those (e.g. one FAQ batch). */
export async function runContentAudit(ids?: number[]): Promise<AuditReport> {
  const rows = await withDb((sql) => (
    ids && ids.length > 0
      ? sql`SELECT id, slug, title, article_type, body_markdown FROM articles WHERE status = 'published' AND id = ANY(${ids})`
      : sql`SELECT id, slug, title, article_type, body_markdown FROM articles WHERE status = 'published'`
  ));

  const report: AuditReport = {
    scanned: 0, truncated: [], nonCodeFence: [], malformedTable: [], brokenLink: [], unresolvedCitation: [], thin: [],
  };

  for (const r of rows as unknown as ArticleRow[]) {
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
  }

  return report;
}
