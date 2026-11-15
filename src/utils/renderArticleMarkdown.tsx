import React from 'react';
import { resolveKnownSource } from '../data/knownSources';
import {
  REUSABLE_DIAGRAMS,
  DIAGRAM_CREDIT,
  DIAGRAM_LICENSE_NAME,
  DIAGRAM_LICENSE_URL,
  diagramAnchorId,
} from '../data/reusableDiagrams';
import { IMAGE_DIMENSIONS } from '../data/imageDimensions';

const SITE_ORIGIN = 'https://www.beforeregret.com';

function escapeHtmlAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// The collapsed reuse panel under a licensable diagram -- see src/data/reusableDiagrams.ts for why
// it exists and why the terms are CC BY rather than "must link". Collapsed because the person
// reading a guide is usually a buyer, for whom this is noise; the person it is for (an inspector,
// a trade writing its own blog) will open it. A readonly <textarea> rather than a copy button so
// it works in the prerendered HTML with no JavaScript at all.
function DiagramReusePanel({ src, alt, pageUrl }: { src: string; alt: string; pageUrl: string }) {
  const absoluteSrc = `${SITE_ORIGIN}${src}`;
  const dims = IMAGE_DIMENSIONS[src];
  const snippet =
    `<figure>\n` +
    `  <img src="${absoluteSrc}" alt="${escapeHtmlAttr(alt)}"${dims ? ` width="${dims.width}" height="${dims.height}"` : ''} loading="lazy">\n` +
    `  <figcaption>Diagram: <a href="${pageUrl}">${DIAGRAM_CREDIT}</a>, ${DIAGRAM_LICENSE_NAME}</figcaption>\n` +
    `</figure>`;
  return (
    <details id={diagramAnchorId(src)} className="mt-2 text-xs text-slate-500">
      <summary className="cursor-pointer select-none text-center hover:text-slate-700">
        Free to use with credit ({DIAGRAM_LICENSE_NAME})
      </summary>
      <div className="mt-3 space-y-2 text-left bg-slate-50 border border-slate-200 rounded-xl p-4 leading-relaxed">
        <p>
          You can use this diagram on your own website, in an inspection report or in training
          material, including commercially. The one condition is credit to {DIAGRAM_CREDIT} as the
          source.{' '}
          <a
            href={DIAGRAM_LICENSE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
          >
            License terms
          </a>
        </p>
        <label className="block font-medium text-slate-600" htmlFor={`${diagramAnchorId(src)}-code`}>
          HTML with the credit already in place:
        </label>
        <textarea
          id={`${diagramAnchorId(src)}-code`}
          readOnly
          rows={5}
          value={snippet}
          onFocus={(e) => e.currentTarget.select()}
          className="w-full font-mono text-[11px] text-slate-700 bg-white border border-slate-200 rounded-lg p-2 resize-y"
        />
        <p>
          Or{' '}
          <a href={src} download className="text-blue-600 hover:text-blue-800 hover:underline font-medium">
            download the image
          </a>{' '}
          and credit it as “Diagram: {DIAGRAM_CREDIT}” with a link to this page.
        </p>
      </div>
    </details>
  );
}

export interface RenderArticleOptions {
  /** Canonical URL of the page the markdown renders on. Needed for a diagram's reuse panel, whose
   *  credit link points back at the page the diagram was found on; without it the panel is not
   *  rendered at all. */
  pageUrl?: string;
}

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
  // The image form is captured by the same split so that an image which somehow reaches inline
  // context -- mid-paragraph, inside a table cell, anywhere the block handler in
  // renderArticleMarkdown never sees it -- is recognised and dropped rather than falling through
  // to the link branch below, which would render it as a hyperlink with a stray "!" in front. The
  // block handler is where images are supposed to be caught; this is the guard for everywhere else.
  const parts = text.split(/(!\[[^\]]*\]\([^)\s]+\)|\*\*[^*]+\*\*|\*[^*\s][^*]*\*|\[[^\]]+\]\([^)\s]+\)|\[[A-Z]+\])/g);
  return parts.map((part, i) => {
    if (part.startsWith('![')) {
      // Deliberately renders nothing. An inline image in this content set is a mistake in the
      // markdown, and showing a broken link where a diagram was meant is worse than a gap.
      return <React.Fragment key={i} />;
    }
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
          className="text-blue-700 hover:text-blue-900 underline decoration-blue-300 underline-offset-2 hover:decoration-blue-700 font-medium"
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
            className="text-home-brass hover:text-home-ink font-semibold no-underline text-[0.7em] align-super ml-0.5"
          >
            [{citationMatch[1]}]
          </a>
        );
      }
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

/** Plain text of a heading line: link text kept, link targets, emphasis and [CODE] markers dropped. */
function headingPlainText(raw: string): string {
  return raw
    .replace(/\[([^\]]+)\]\([^)\s]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\s*\[[A-Z]+\]/g, '')
    .trim();
}

/** Stable, unique-per-article anchor ids for ## headings, in document order. */
function sectionIdGenerator() {
  const seen = new Map<string, number>();
  return {
    next(raw: string): string {
      const base = headingPlainText(raw)
        .toLowerCase()
        .replace(/['’]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60)
        .replace(/-+$/, '') || 'section';
      const n = (seen.get(base) ?? 0) + 1;
      seen.set(base, n);
      return n === 1 ? base : `${base}-${n}`;
    },
  };
}

/**
 * The article's ## sections as {id, label}, for the "On this page" list. Reads the same lines the
 * renderer turns into <h2 id>, with the same id generator, so every entry lands on its heading.
 * Lines inside a ``` fence are skipped, exactly as the renderer skips them.
 */
export function articleSections(markdown: string): Array<{ id: string; label: string }> {
  const ids = sectionIdGenerator();
  const out: Array<{ id: string; label: string }> = [];
  let inFence = false;
  for (const line of markdown.split('\n')) {
    const t = line.trim();
    if (t.startsWith('```')) { inFence = !inFence; continue; }
    if (inFence) continue;
    const m = t.match(/^##\s+(.+)$/);
    if (m) out.push({ id: ids.next(m[1]), label: headingPlainText(m[1]) });
  }
  return out;
}

export function renderArticleMarkdown(markdown: string, options: RenderArticleOptions = {}): React.ReactNode[] {
  const lines = markdown.split('\n');
  const blocks: React.ReactNode[] = [];
  const sectionIds = sectionIdGenerator();
  let paragraphBuffer: string[] = [];
  let i = 0;

  const flushParagraph = () => {
    if (paragraphBuffer.length > 0) {
      const text = paragraphBuffer.join(' ').trim();
      if (text) {
        blocks.push(
          <p key={blocks.length} className="text-slate-700 leading-[1.75] mb-5">
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
    // Block-level image: ![alt](/images/foo.webp "Optional caption")
    //
    // Handled HERE, before anything reaches parseInline, and that ordering is the whole point.
    // parseInline's link pattern is /\[[^\]]+\]\([^)\s]+\)/ -- it has no idea about the leading
    // "!", so an image left to it matched the [alt](url) portion, rendered a blue hyperlink, and
    // left a literal "!" sitting in the body text. That was the actual behaviour before this
    // existed: markdown images did not "not work", they worked wrongly, which is worse.
    //
    // An image is a block, never inline: it gets a <figure>, an optional <figcaption> from the
    // markdown title, and a caption is the natural place to put attribution for a diagram someone
    // else may reuse.
    //
    // alt is REQUIRED, and an image without it is dropped rather than rendered with alt="". These
    // are explanatory diagrams -- a cross-section showing EIFS against traditional stucco is
    // content, not decoration, so an empty alt would hide the actual point of the figure from a
    // screen reader. (Decorative images elsewhere on the site correctly DO use alt="" -- that is
    // the distinction Bing's "missing alt attribute" notice failed to make.)
    //
    // loading="lazy" because every one of these sits well below the fold in article body copy, so
    // none is ever the LCP element. No width/height attributes: markdown carries no dimensions, so
    // there is some layout shift as each loads. Bounded and below the fold, and the alternative
    // (a dimension syntax markdown does not have) is worse than the problem.
    const imageMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/);
    if (imageMatch) {
      flushParagraph();
      const [, alt, src, caption] = imageMatch;
      if (alt.trim()) {
        blocks.push(
          <figure key={blocks.length} className="my-8">
            <img
              src={src}
              alt={alt}
              loading="lazy"
              decoding="async"
              className="w-full h-auto rounded-2xl border border-home-linen bg-home-stone"
            />
            {caption && (
              <figcaption className="mt-2.5 text-sm text-slate-500 leading-relaxed text-center">
                {parseInline(caption)}
              </figcaption>
            )}
            {options.pageUrl && REUSABLE_DIAGRAMS.has(src) && (
              <DiagramReusePanel src={src} alt={alt} pageUrl={options.pageUrl} />
            )}
          </figure>
        );
      } else {
        console.warn(`[renderArticleMarkdown] Dropped an image with no alt text: ${src}`);
      }
      i++;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{2,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      const level = headingMatch[1].length;
      const text = parseInline(headingMatch[2]);
      if (level === 2) {
        // The id is what the "On this page" list links to -- see articleSections below, which
        // derives the same ids from the same lines, so a jump link can never miss its heading.
        blocks.push(
          <h2
            key={blocks.length}
            id={sectionIds.next(headingMatch[2])}
            className="scroll-mt-24 font-serif text-[1.65rem] sm:text-3xl font-semibold text-home-ink tracking-tight leading-tight mt-12 mb-4 first:mt-0"
          >
            {text}
          </h2>
        );
      } else if (level === 3) {
        blocks.push(
          <h3 key={blocks.length} className="text-lg font-bold text-home-ink mt-8 mb-2 leading-snug">
            {text}
          </h3>
        );
      } else {
        // Levels 4-6 collapse to one visual style, one step below h3 -- this renderer only ever
        // needs to distinguish "section," "subsection," and "everything nested past that," and
        // the prompt has never asked for deliberate 5-6 level nesting; this exists so a stray
        // deeper heading still renders as a heading instead of falling through to plain text.
        blocks.push(
          <h4 key={blocks.length} className="text-base font-bold text-home-ink mt-6 mb-1.5">
            {text}
          </h4>
        );
      }
      i++;
      continue;
    }

    if (/^-{3,}$/.test(trimmed)) {
      flushParagraph();
      blocks.push(<hr key={blocks.length} className="my-8 border-home-linen" />);
      i++;
      continue;
    }

    // Blockquote: consecutive `> ` lines. Added for pull-out text a reader is meant to lift and
    // reuse -- the copy-paste request to a seller in prove-roof-age-for-insurance is the case
    // that prompted it. Without this branch a `> ` line fell through to a paragraph and rendered
    // the marker literally, which is what it was doing on that page until this was added.
    //
    // Deliberately NOT a code fence, which is the other block style that visually separates
    // content here: fences render dark and monospaced, correct for a command or an ASCII diagram
    // and wrong for a message a person is about to send to another person.
    //
    // Content runs through parseInline, so bold and links work inside a quote. Nested `> >` is
    // not supported and collapses to one level; no article uses it and CommonMark nesting is not
    // worth the recursion here.
    if (trimmed.startsWith('>')) {
      flushParagraph();
      const quoted: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoted.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      blocks.push(
        <blockquote
          key={blocks.length}
          className="border-l-4 border-home-oak bg-home-stone rounded-r-xl px-5 py-4 mb-5 text-slate-800 leading-[1.75]"
        >
          {parseInline(quoted.join(' '))}
        </blockquote>
      );
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
        <div key={blocks.length} className="mb-6">
          {/* Real table from sm: (640px) up. A 3+ column table with sentence-length cells
              genuinely cannot fit an actual mobile viewport at readable font size -- shrinking
              text or scrolling inside the table are both worse than not needing to scroll at
              all, so mobile gets a different layout below, not a squeezed version of this one. */}
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-home-linen">
            <table className="w-full text-[15px] text-left border-collapse">
              <thead className="bg-home-stone">
                <tr>
                  {headerCells.map((cell, idx) => (
                    <th
                      key={idx}
                      className={`px-4 py-2.5 font-bold text-home-ink border-b border-home-linen ${alignments[idx] || 'text-left'}`}
                    >
                      {parseInline(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="border-b border-home-linen/70 last:border-0">
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className={`px-4 py-2.5 align-top text-slate-700 leading-relaxed ${alignments[cellIdx] || 'text-left'}`}>
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
          <div className="sm:hidden rounded-xl border border-home-linen divide-y divide-home-linen/70">
            {bodyRows.map((row, rowIdx) => (
              <div key={rowIdx} className="p-3 space-y-2">
                {row.map((cell, cellIdx) => (
                  <div key={cellIdx}>
                    <div className="text-[11px] font-bold uppercase tracking-wide text-home-brass">
                      {parseInline(headerCells[cellIdx] || '')}
                    </div>
                    <div className="text-[15px] text-slate-700 leading-relaxed">{parseInline(cell)}</div>
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
        <ul key={blocks.length} className="list-disc list-outside pl-6 space-y-2 mb-5 text-slate-700 leading-[1.7] marker:text-home-oak">
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
        <ol key={blocks.length} className="list-decimal list-outside pl-6 space-y-2 mb-5 text-slate-700 leading-[1.7] marker:text-home-brass marker:font-semibold">
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
