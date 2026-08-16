// Read-only diagnostic scan for the specific defect classes this site has actually shipped and
// caught before: truncated articles, non-code content wrapped in a ``` fence (renders as an
// unreadable monochrome box -- see src/utils/renderArticleMarkdown.tsx's own comments for the
// history), tables missing a valid GFM separator row (silently falls through to garbled prose
// instead of rendering as a table), broken [text](url) links, and [CODE] citations that don't
// resolve against src/data/knownSources.ts. This never writes to the database -- it only reports.
//
// Usage: npx tsx .claude/skills/article-faqs/scripts/content-audit.ts [id id id ...]
//   No args  -> scans every published article (the full-corpus sweep).
//   With ids -> scans only those articles (the current FAQ batch).
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { KNOWN_SOURCES } from '../../../../src/data/knownSources';

const sql = neon(process.env.DATABASE_URL as string);
const knownKeys = new Set(KNOWN_SOURCES.map((s) => s.key));
const requestedIds = process.argv.slice(2).map((s) => parseInt(s, 10)).filter(Number.isFinite);

async function main() {
  const rows = requestedIds.length > 0
    ? await sql`SELECT id, title, article_type, body_markdown FROM articles WHERE status='published' AND id = ANY(${requestedIds})`
    : await sql`SELECT id, title, article_type, body_markdown FROM articles WHERE status='published'`;

  const findings: Record<string, any[]> = {
    truncated: [], nonCodeFence: [], malformedTable: [], brokenLink: [], unresolvedCitation: [], thin: [],
  };

  for (const r of rows as any[]) {
    const b: string = r.body_markdown;
    const trimmed = b.trim();
    const id = r.id, title = r.title;

    // A real article always ends on a complete sentence. A cut connection ends on nothing.
    if (!/[.!?]['")]?$/.test(trimmed)) findings.truncated.push({ id, title });

    // Any fenced block whose content doesn't read as an actual programming language is almost
    // certainly a step list, option list, or comparison table the model wrapped in ``` instead of
    // real markdown -- these guide articles never legitimately contain code.
    const fences = trimmed.match(/```[\s\S]*?```/g) || [];
    for (const f of fences) {
      const inner = f.replace(/^```\w*\n?/, '').replace(/```$/, '');
      const looksLikeCode = /^\s*(function|const|let|var|import|class|def |<[a-z]|\{|\/\/|#include)/m.test(inner);
      if (!looksLikeCode) findings.nonCodeFence.push({ id, title, snippet: inner.slice(0, 80).replace(/\n/g, ' ') });
    }

    // A `| a | b |` line only renders as a table if the very next line is a valid GFM separator
    // (`|---|---|`) -- see renderArticleMarkdown.tsx's isSeparatorRow. Anything else silently
    // falls through to the paragraph branch and joins into one garbled run-on line.
    const lines = trimmed.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i].trim();
      const isTableRow = l.startsWith('|') && l.endsWith('|') && l.length > 1;
      if (!isTableRow) continue;
      const prevWasTableRow = i > 0 && lines[i - 1].trim().startsWith('|') && lines[i - 1].trim().endsWith('|');
      if (prevWasTableRow) continue; // already inside a table body, not a new header row
      const next = (lines[i + 1] || '').trim();
      const isSep = /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/.test(next);
      if (!isSep) findings.malformedTable.push({ id, title, line: l.slice(0, 80) });
    }

    // The renderer's link regex requires no whitespace inside the URL -- [text](url with spaces)
    // fails to match and falls through to literal bracket text instead of a link.
    const linkMatches = trimmed.match(/\[[^\]]+\]\([^)]*\)/g) || [];
    for (const link of linkMatches) {
      if (!/^\[[^\]]+\]\([^)\s]+\)$/.test(link)) findings.brokenLink.push({ id, title, link: link.slice(0, 100) });
    }

    // A citation bracket that doesn't resolve against knownSources.ts renders as plain text --
    // the link silently disappears, and the claim reads as attributed to nothing.
    const citeMatches = trimmed.match(/\[[A-Z]{2,}\]/g) || [];
    for (const c of citeMatches) {
      if (!knownKeys.has(c.slice(1, -1))) findings.unresolvedCitation.push({ id, title, code: c });
    }

    const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
    if (wordCount < 500) findings.thin.push({ id, title, wordCount });
  }

  const total = Object.values(findings).reduce((n, v) => n + v.length, 0);
  console.log(`Scanned ${(rows as any[]).length} article(s)${requestedIds.length ? ` (ids: ${requestedIds.join(', ')})` : ' (full corpus)'}.`);
  console.log(total === 0 ? '\nClean -- no findings.' : `\n${total} finding(s):`);
  for (const [k, v] of Object.entries(findings)) {
    if (v.length === 0) continue;
    console.log(`\n${k} (${v.length}):`);
    console.log(JSON.stringify(v, null, 1));
  }
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
