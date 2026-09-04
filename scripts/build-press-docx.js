// Builds the .docx press packs from their .txt sources.
//
//   node scripts/build-press-docx.js
//
// WHY THIS EXISTS. docs/Before-Regret-Press-Outreach.docx was made by hand on 30 August and then
// went stale the moment the .txt gained a section -- there was no way to regenerate it, so the two
// files silently disagreed about what the pack contained. The .txt is the source of truth; this
// turns it into the .docx, so editing one and forgetting the other stops being possible.
//
// It reproduces the hand-made document's design rather than inventing a new one: US Letter,
// Consolas throughout, an 8pt eyebrow above a Heading 1, Heading 2 per section, and the small
// field labels (To / Outlet / Beat / When / SUBJECT LINE) that make an email block scannable.
//
// THE .TXT'S OWN PUNCTUATION IS THE GRAMMAR. Nothing here is guessed:
//   ====  a banner pair wraps a section title            -> Heading 2
//   ----  a rule pair wraps the SUBJECT: line            -> "SUBJECT LINE" label + the subject
//   TO: / OUTLET: / BEAT: / WHEN:                        -> small label + value
//   anything else                                        -> body
// A .txt that stops using those markers will produce a flat document, which is visible
// immediately rather than subtly wrong.
// ESM: package.json sets "type": "module", so require() is not available here.
import fs from 'node:fs';
import path from 'node:path';
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, LineRuleType,
} from 'docx';

const MONO = 'Consolas';
const BODY = { font: MONO, size: 21 };        // 10.5pt, as in the original
const LABEL = { font: MONO, size: 16, color: '666666' };  // 8pt
const PAGE = { width: 12240, height: 15840 }; // US Letter
const MARGIN = { top: 1100, right: 1200, bottom: 1100, left: 1200, header: 708, footer: 708 };

const FIELD = /^(TO|OUTLET|BEAT|WHEN):\s*(.*)$/;
const BANNER = /^={10,}$/;
const RULE = /^-{10,}$/;

const body = (text, opts = {}) => new Paragraph({
  children: [new TextRun({ text, ...BODY, ...opts })],
  spacing: { after: 120, line: 260, lineRule: LineRuleType.AUTO },
});

const label = (text) => new Paragraph({
  children: [new TextRun({ text, ...LABEL, allCaps: true, characterSpacing: 30 })],
  spacing: { before: 100, after: 20 },
});

function parse(txt) {
  const lines = txt.split('\n');
  const out = [];
  let i = 0;

  // The file opens with a banner block: first line is the eyebrow, the rest is the title.
  if (BANNER.test(lines[0].trim())) {
    const close = lines.findIndex((l, n) => n > 0 && BANNER.test(l.trim()));
    const head = lines.slice(1, close).filter((l) => l.trim());
    out.push({ kind: 'eyebrow', text: head[0] || '' });
    for (const t of head.slice(1)) out.push({ kind: 'title', text: t.trim() });
    i = close + 1;
  }

  for (; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    if (BANNER.test(line)) {
      // Section title: everything up to the closing banner.
      const close = lines.findIndex((l, n) => n > i && BANNER.test(l.trim()));
      if (close < 0) continue;
      const title = lines.slice(i + 1, close).map((l) => l.trim()).filter(Boolean);
      if (title.length) {
        out.push({ kind: 'section', text: title[0] });
        for (const sub of title.slice(1)) out.push({ kind: 'subtitle', text: sub });
      }
      i = close;
      continue;
    }

    if (RULE.test(line)) {
      // A rule pair around SUBJECT:. Emit the label and the subject, then skip past the pair.
      const close = lines.findIndex((l, n) => n > i && RULE.test(l.trim()));
      if (close < 0) continue;
      const inner = lines.slice(i + 1, close).map((l) => l.trim()).filter(Boolean);
      if (inner[0] && /^SUBJECT:/.test(inner[0])) {
        out.push({ kind: 'label', text: 'Subject line' });
        for (const s of inner.slice(1)) out.push({ kind: 'subject', text: s });
      } else {
        // A rule pair used as a plain divider around a heading-ish line.
        for (const s of inner) out.push({ kind: 'section', text: s });
      }
      i = close;
      continue;
    }

    // A bare `SUBJECT:` line, i.e. one not wrapped in a rule pair. The dams pack writes them this
    // way; the Risk Without Price pack wraps them. Both are legitimate, so both are handled --
    // otherwise a whole file's subject lines render as ordinary body text, which is exactly what
    // happened on the first run.
    if (/^SUBJECT:\s*$/.test(line)) {
      out.push({ kind: 'label', text: 'Subject line' });
      let j = i + 1;
      while (j < lines.length && !lines[j].trim()) j++;
      if (j < lines.length) { out.push({ kind: 'subject', text: lines[j].trim() }); i = j; }
      continue;
    }

    const f = raw.match(FIELD);
    if (f) {
      out.push({ kind: 'label', text: f[1] });
      out.push({ kind: 'field', text: f[2].trim() });
      continue;
    }

    if (!line) { out.push({ kind: 'blank' }); continue; }
    out.push({ kind: 'body', text: raw.replace(/\s+$/, '') });
  }
  return out;
}

function render(items) {
  const kids = [];
  let lastBlank = false;
  for (const it of items) {
    switch (it.kind) {
      case 'eyebrow':
        kids.push(new Paragraph({
          children: [new TextRun({ text: it.text, ...LABEL, allCaps: true, characterSpacing: 40 })],
          spacing: { after: 60 },
        }));
        break;
      case 'title':
        kids.push(new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: it.text, font: MONO, size: 30 })],
          spacing: { after: 200 },
        }));
        break;
      case 'section':
        kids.push(new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: it.text, font: MONO, size: 24 })],
          spacing: { before: 360, after: 140 },
        }));
        break;
      case 'subtitle':
        kids.push(body(it.text, { color: '666666' }));
        break;
      case 'label':
        kids.push(label(it.text));
        break;
      case 'field':
      case 'subject':
        kids.push(body(it.text, { bold: it.kind === 'subject' }));
        break;
      case 'blank':
        if (!lastBlank) kids.push(new Paragraph({ children: [], spacing: { after: 60 } }));
        break;
      default:
        kids.push(body(it.text));
    }
    lastBlank = it.kind === 'blank';
  }
  return kids;
}

const SOURCES = [
  { txt: 'docs/Before-Regret-Press-Outreach.txt', docx: 'docs/Before-Regret-Press-Outreach.docx' },
  { txt: 'docs/press-high-hazard-dams.txt', docx: 'docs/press-high-hazard-dams.docx' },
];

(async () => {
  for (const src of SOURCES) {
    if (!fs.existsSync(src.txt)) { console.log(`  skip (missing): ${src.txt}`); continue; }
    const items = parse(fs.readFileSync(src.txt, 'utf8'));
    const doc = new Document({
      creator: 'Before Regret',
      title: path.basename(src.docx, '.docx'),
      styles: { default: { document: { run: BODY } } },
      sections: [{ properties: { page: { size: PAGE, margin: MARGIN } }, children: render(items) }],
    });
    const buf = await Packer.toBuffer(doc);
    fs.writeFileSync(src.docx, buf);
    const sections = items.filter((i) => i.kind === 'section').length;
    const subjects = items.filter((i) => i.kind === 'subject').length;
    console.log(`  wrote ${src.docx}  (${buf.length.toLocaleString()} bytes, ${sections} sections, ${subjects} subject lines)`);
  }
})();
