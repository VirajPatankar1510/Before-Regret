import React from 'react';

// Small, dependency-free renderer for exactly the markdown subset the AI generation prompt
// produces (see src/server/articleGenerator.ts): ## / ### headers, **bold**, paragraphs, and
// bullet/numbered lists. Not a general CommonMark implementation -- before this existed, the
// article body was dumped as plain text with `whitespace-pre-line`, so a "## Heading" line
// rendered as the literal characters "## Heading" instead of an actual heading. That's the bug
// this fixes; it isn't meant to handle arbitrary markdown from anywhere else.

function parseInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
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
