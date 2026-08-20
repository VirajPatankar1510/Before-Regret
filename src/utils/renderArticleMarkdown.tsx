import React from 'react';
import { resolveKnownSource } from '../data/knownSources';

// Small, dependency-free renderer for exactly the markdown subset the AI generation prompt
// produces (see src/server/articleGenerator.ts): ## through ###### headers, **bold**, paragraphs,
// bullet/numbered lists, GFM tables, fenced code blocks, and [CODE] inline citations. Not a
// general CommonMark implementation -- before this existed, the article body was dumped as plain
// text with `whitespace-pre-line`, so a "## Heading" line rendered as the literal characters
// "## Heading" instead of an actual heading. That's the bug this fixes; it isn't meant to handle
// arbitrary markdown from anywhere else.
//
// Table and fenced-code support were added after both showed up in real generated articles with
// neither block type recognized: a pipe-delimited GFM table (header row + `:---` separator row)
// and a ``` -fenced ASCII-art flowchart both fell through to the paragraph branch below, which
// joins lines with a single space and lets the browser collapse the rest -- turning a table or a
// carefully-aligned diagram into one garbled run-on line. Confirmed on a live published guide.

// Splits inline text on **bold**, single-asterisk *emphasis*, [CODE] citation markers, and real
// [text](url) markdown links. Single-asterisk emphasis is a defensive fallback, not something the
// prompt asks for (it now explicitly tells the model to use **double asterisks** only) -- this
// just means any content generated before that instruction existed still renders cleanly instead
// of showing literal asterisk characters. [CODE] only ever renders as a link if it resolves
// against the same hand-verified list the prompt was given (src/data/knownSources.ts) -- an
// unresolved bracket (which shouldn't happen, since the model is constrained to that list) just
// renders as plain text instead of a broken link.
//
// [text](url) support was added after real generated content shipped with genuinely broken
// links: the county-comparison report, defect-reference library, and FEMA county-event
// generators (all added after this file was first written) all cite real guide/county/declaration
// URLs using standard markdown link syntax, which this parser didn't recognize at all -- the
// whole "[title](url)" fell through to the plain-text branch and rendered as literal bracket
// text, not a link. Confirmed on a real published guide before this fix.
// Exported for callers that only need one line of inline formatting rendered -- the Quick Answer
// box in GuidePageView.tsx is a single paragraph, not multi-block markdown, so it uses this
// directly rather than the full block-level renderArticleMarkdown below.
export function parseInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|\[[^\]]+\]\([^)\s]+\)|\[[A-Z]+\])/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (linkMatch) {
      const [, linkText, url] = linkMatch;
      const isInternal = url.startsWith('https://www.beforeregret.com/') || url.startsWith('/');
      return (
        <a
          key={i}
          href={url}
          {...(isInternal ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
        >
          {linkText}
        </a>
      );
    }
    const citationMatch = part.match(/^\[([A-Z]+)\]$/);
    if (citationMatch) {
      const source = resolveKnownSource(citationMatch[1]);
      if (source) {
        return (
          <a
            key={i}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            title={source.name}
            className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-[0.85em] align-super"
          >
            [{citationMatch[1]}]
          </a>
        );
      }
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

export function renderArticleMarkdown(markdown: string): React.ReactNode[] {
  const lines = markdown.split('\n');
  const blocks: React.ReactNode[] = [];
  let paragraphBuffer: string[] = [];
  let i = 0;

  const flushParagraph = () => {
    if (paragraphBuffer.length > 0) {
      const text = paragraphBuffer.join(' ').trim();
      if (text) {
        blocks.push(
          <p key={blocks.length} className="text-slate-700 leading-relaxed mb-4">
            {parseInline(text)}
          </p>
        );
      }
      paragraphBuffer = [];
    }
  };

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (trimmed === '') {
      flushParagraph();
      i++;
      continue;
    }

    // Any depth from ## to ###### -- not just ## and ###. Originally this only matched those two
    // exact prefixes, which meant a real, well-formed #### line (confirmed live on two FEMA
    // county-event guides -- src/server/countyEventGenerator.ts's prompt never asks for it, but
    // nothing stops the model from nesting a section one level deeper on its own) matched neither
    // branch and fell through to the paragraph buffer below, dumping the literal "#### Heading"
    // text into visible body copy instead of rendering as a heading. Matching any 2-6 hash prefix
    // closes the whole class of "unsupported heading depth" bugs instead of only this one
    // instance -- a fifth level would have hit the exact same failure.
    const headingMatch = trimmed.match(/^(#{2,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      const level = headingMatch[1].length;
      const text = parseInline(headingMatch[2]);
      if (level === 2) {
        blocks.push(
          <h2 key={blocks.length} className="text-lg sm:text-xl font-extrabold text-slate-900 mt-8 mb-3 pb-2 border-b border-slate-100">
            {text}
          </h2>
        );
      } else if (level === 3) {
        blocks.push(
          <h3 key={blocks.length} className="text-base font-bold text-slate-900 mt-6 mb-2">
            {text}
          </h3>
        );
      } else {
        // Levels 4-6 collapse to one visual style, one step below h3 -- this renderer only ever
        // needs to distinguish "section," "subsection," and "everything nested past that," and
        // the prompt has never asked for deliberate 5-6 level nesting; this exists so a stray
        // deeper heading still renders as a heading instead of falling through to plain text.
        blocks.push(
          <h4 key={blocks.length} className="text-sm font-bold text-slate-800 mt-4 mb-1.5">
            {text}
          </h4>
        );
      }
      i++;
      continue;
    }

    if (/^-{3,}$/.test(trimmed)) {
      flushParagraph();
      blocks.push(<hr key={blocks.length} className="my-6 border-slate-200" />);
      i++;
      continue;
    }

    // Fenced code block: ``` or ```lang ... ```. Content lines are pushed raw (not `.trim()`-ed)
    // -- the whole point is preserving exact whitespace/alignment (an ASCII diagram, a code
    // sample), which a plain <p> collapses. Not run through parseInline: a code block renders
    // literally, no bold/citation parsing inside it, same as CommonMark.
    if (trimmed.startsWith('```')) {
      flushParagraph();
      i++;
      const codeLines: string[] = [];
      while (i < lines.length && lines[i].trim() !== '```') {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip the closing ``` line (or run off the end if the fence was never closed)
      blocks.push(
        <pre key={blocks.length} className="bg-slate-900 text-slate-100 rounded-xl p-4 mb-4 overflow-x-auto text-xs leading-relaxed font-mono">
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      continue;
    }

    // GFM table: a `| a | b |` header row immediately followed by a `| :-- | --: |`-style
    // separator row. Only treated as a table when both lines match -- a single pipe-containing
    // line without a real separator row underneath it is just a sentence that happens to use a
    // pipe, not a table.
    const isTableRow = (l: string) => l.startsWith('|') && l.endsWith('|') && l.length > 1;
    const isSeparatorRow = (l: string) => /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/.test(l);
    if (isTableRow(trimmed) && i + 1 < lines.length && isSeparatorRow(lines[i + 1].trim())) {
      flushParagraph();
      const splitRow = (l: string) => {
        let row = l.trim();
        if (row.startsWith('|')) row = row.slice(1);
        if (row.endsWith('|')) row = row.slice(0, -1);
        return row.split('|').map((c) => c.trim());
      };
      const headerCells = splitRow(trimmed);
      const alignments = splitRow(lines[i + 1].trim()).map((c) => {
        const left = c.startsWith(':');
        const right = c.endsWith(':');
        if (left && right) return 'text-center';
        if (right) return 'text-right';
        return 'text-left';
      });
      i += 2;
      const bodyRows: string[][] = [];
      while (i < lines.length && lines[i].trim() !== '' && isTableRow(lines[i].trim())) {
        bodyRows.push(splitRow(lines[i]));
        i++;
      }
      blocks.push(
        <div key={blocks.length} className="mb-4">
          {/* Real table from sm: (640px) up. A 3+ column table with sentence-length cells
              genuinely cannot fit an actual mobile viewport at readable font size -- shrinking
              text or scrolling inside the table are both worse than not needing to scroll at
              all, so mobile gets a different layout below, not a squeezed version of this one. */}
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-50">
                <tr>
                  {headerCells.map((cell, idx) => (
                    <th
                      key={idx}
                      className={`px-3 py-2 font-bold text-slate-900 border-b border-slate-200 ${alignments[idx] || 'text-left'}`}
                    >
                      {parseInline(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="border-b border-slate-100 last:border-0">
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className={`px-3 py-2 align-top text-slate-700 ${alignments[cellIdx] || 'text-left'}`}>
                        {parseInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Below sm: each row becomes a stacked label/value card instead, using the header
              row as the label for every cell -- no horizontal scroll, nothing to shrink. Built
              from the same headerCells/bodyRows the table above uses, not a separate parse. */}
          <div className="sm:hidden rounded-xl border border-slate-200 divide-y divide-slate-100">
            {bodyRows.map((row, rowIdx) => (
              <div key={rowIdx} className="p-3 space-y-2">
                {row.map((cell, cellIdx) => (
                  <div key={cellIdx}>
                    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      {parseInline(headerCells[cellIdx] || '')}
                    </div>
                    <div className="text-sm text-slate-700">{parseInline(cell)}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      );
      continue;
    }

    if (/^[*-]\s+/.test(trimmed)) {
      flushParagraph();
      const items: string[] = [];
      while (i < lines.length && /^[*-]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[*-]\s+/, ''));
        i++;
      }
      blocks.push(
        <ul key={blocks.length} className="list-disc list-outside pl-5 space-y-1.5 mb-4 text-slate-700">
          {items.map((item, idx) => (
            <li key={idx}>{parseInline(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      flushParagraph();
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }
      blocks.push(
        <ol key={blocks.length} className="list-decimal list-outside pl-5 space-y-1.5 mb-4 text-slate-700">
          {items.map((item, idx) => (
            <li key={idx}>{parseInline(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    paragraphBuffer.push(trimmed);
    i++;
  }

  flushParagraph();
  return blocks;
}

// For contexts that need plain text, not JSX -- e.g. the FAQPage JSON-LD schema's `text` field,
// where a bracket citation marker would just look like a stray formatting artifact rather than
// a clickable link (structured data has nowhere to put the link).
export function stripCitationMarkers(text: string): string {
  return text.replace(/\s*\[[A-Z]+\]/g, '');
}
