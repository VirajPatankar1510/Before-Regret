import React from 'react';
import { resolveKnownSource } from '../data/knownSources';

// Small, dependency-free renderer for exactly the markdown subset the AI generation prompt
// produces (see src/server/articleGenerator.ts): ## / ### headers, **bold**, paragraphs,
// bullet/numbered lists, and [CODE] inline citations. Not a general CommonMark implementation --
// before this existed, the article body was dumped as plain text with `whitespace-pre-line`, so
// a "## Heading" line rendered as the literal characters "## Heading" instead of an actual
// heading. That's the bug this fixes; it isn't meant to handle arbitrary markdown from anywhere
// else.

// Splits inline text on **bold** and [CODE] citation markers together so both can appear in the
// same sentence. [CODE] only ever renders as a link if it resolves against the same hand-verified
// list the prompt was given (src/data/knownSources.ts) -- an unresolved bracket (which shouldn't
// happen, since the model is constrained to that list) just renders as plain text instead of a
// broken link.
// Exported for callers that only need one line of inline formatting rendered -- the Quick Answer
// box in GuidePageView.tsx is a single paragraph, not multi-block markdown, so it uses this
// directly rather than the full block-level renderArticleMarkdown below.
export function parseInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[A-Z]+\])/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
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

    if (trimmed.startsWith('### ')) {
      flushParagraph();
      blocks.push(
        <h3 key={blocks.length} className="text-base font-bold text-slate-900 mt-6 mb-2">
          {parseInline(trimmed.slice(4))}
        </h3>
      );
      i++;
      continue;
    }

    if (trimmed.startsWith('## ')) {
      flushParagraph();
      blocks.push(
        <h2 key={blocks.length} className="text-lg sm:text-xl font-extrabold text-slate-900 mt-8 mb-3 pb-2 border-b border-slate-100">
          {parseInline(trimmed.slice(3))}
        </h2>
      );
      i++;
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
