// Why is one of our pages ranking below the pages above it?
//
//   npx tsx scripts/diagnose-ranking.ts \
//     --url https://www.beforeregret.com/guides/get-home-insurance-aluminum-wiring/ \
//     --vs https://a.example/x,https://b.example/y,https://c.example/z
//
// -----------------------------------------------------------------------------------------------
// WHAT THIS IS FOR. "We rank low because of domain authority" is the answer an agent will reach for
// every time, it is unfalsifiable, and it is usually wrong in the useful sense -- there is almost
// always a content or coverage gap underneath it that nobody looked for. This measures the things
// that CAN be measured, side by side, so the domain-age explanation has to survive contact with
// evidence rather than being assumed.
//
// It fetches the live competitor pages. It does not call DataForSEO, both because that account is
// currently returning 402 on every endpoint and because the useful comparison here is what the
// pages actually contain, which is free to look at.
//
// WHAT IT DELIBERATELY WILL NOT TELL YOU: it does not score anything, does not output a "grade",
// and does not rank the competitors. It prints measurements and a coverage gap. The judgement is
// the reader's, because a page can be shorter than every rival and still be the better answer.
import fs from 'node:fs';
import path from 'node:path';

const arg = (n: string) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};

/** Reused verbatim from scripts/assert-article-quality.ts -- one list, not two that drift. */
const CLICHES: Array<[string, RegExp]> = [
  ['no legitimate use here', /\b(delve[sd]?|delving|tapestry|demystif\w+|myriad|plethora|realm of|pivotal|in conclusion|moreover|furthermore|a testament to|navigating the complexities|it'?s worth noting|embark on)\b/i],
  ['metaphorical landscape', /\b(regulatory|current|evolving|changing|competitive|digital|modern)\s+landscape\b|\blandscape\s+of\s+(?!architecture|design)/i],
  ['leverage as a verb', /\b(to|can|will|should|must|help[s]?\s+you)\s+leverage\b|\bleveraging\b/i],
  ['seamless as a metaphor', /\bseamless(ly)?\s+(experience|integration|process|transition|journey)\b/i],
  ['filler', /\b(it is important to note|when it comes to|needless to say|at the end of the day|in today'?s world)\b/i],
  ['empty intensifier', /\bcrucial\b/i],
];

/**
 * Structural tells, which matter more than individual words.
 *
 * A banned word is a lexical accident; these are shapes that appear when a page was generated to
 * fill a brief rather than written to answer a question. Google's documented target is unhelpful
 * content, not a phrase list -- so the reason to care about these is that they travel with thin
 * derivative writing, not because any one of them is a ranking factor. Report them as symptoms.
 */
const SLOP: Array<[string, RegExp]> = [
  ['hollow opener', /\b(in this (article|guide|post),? (we|you)|this (article|guide) (will|explores|covers)|let'?s (dive|take a look))\b/i],
  ['whether-you-are hedge', /\bwhether you(?:'| a)re an? [a-z ]{3,30} or an? [a-z ]{3,30},/i],
  ['not-only-but-also', /\bnot only\b[^.]{0,80}\bbut also\b/i],
  ['promissory filler', /\b(read on|keep reading|we'?ll (explain|cover|explore)|below,? we)\b/i],
  ['empty summary close', /\b(ultimately|in summary|to sum up|the bottom line is)\b/i],
  ['unsourced consensus', /\b(experts (agree|say|recommend)|studies show|research (shows|suggests)|it is widely (known|believed))\b(?![^.]{0,60}\()/i],
];

interface Page {
  url: string; ok: boolean; status: number;
  title: string; h1: string; h2s: string[];
  words: number; text: string;
  schema: string[]; tables: number; lists: number;
  outboundGov: number; outboundTotal: number;
  dateSignals: string[];
}

const strip = (html: string) => {
  let t = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
  t = t.replace(/<nav[\s\S]*?<\/nav>/gi, ' ').replace(/<footer[\s\S]*?<\/footer>/gi, ' ');
  return t;
};
const textOf = (html: string) =>
  strip(html).replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ').trim();

async function grab(url: string): Promise<Page> {
  const blank: Page = { url, ok: false, status: 0, title: '', h1: '', h2s: [], words: 0, text: '', schema: [], tables: 0, lists: 0, outboundGov: 0, outboundTotal: 0, dateSignals: [] };
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; BeforeRegretResearch/1.0; +https://www.beforeregret.com/)' },
      redirect: 'follow',
    });
    blank.status = res.status;
    if (!res.ok) return blank;
    const html = await res.text();
    const text = textOf(html);
    const schema: string[] = [];
    for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
      try {
        const d = JSON.parse(m[1]);
        for (const x of (Array.isArray(d) ? d : [d])) if (x?.['@type']) schema.push(String(x['@type']));
      } catch { /* a malformed block is itself worth not crashing on */ }
    }
    const links = [...html.matchAll(/href="(https?:\/\/[^"]+)"/gi)].map((m) => m[1]);
    const host = new URL(url).hostname.replace(/^www\./, '');
    const outbound = links.filter((l) => !l.includes(host));
    return {
      url, ok: true, status: res.status,
      title: (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '').replace(/\s+/g, ' ').trim(),
      h1: textOf(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? '').slice(0, 90),
      h2s: [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map((m) => textOf(m[1])).filter(Boolean).slice(0, 40),
      words: text.split(/\s+/).length,
      text,
      schema: [...new Set(schema)],
      tables: (html.match(/<table[\s>]/gi) ?? []).length,
      lists: (html.match(/<[uo]l[\s>]/gi) ?? []).length,
      outboundGov: outbound.filter((l) => /\.gov\b|\.edu\b/.test(l)).length,
      outboundTotal: outbound.length,
      dateSignals: [...new Set((text.match(/\b(20[12]\d)\b/g) ?? []))].sort().slice(-4),
    };
  } catch (e) {
    return blank;
  }
}

const STOP = new Set(('a an the and or but if then than that this these those of to in on at for with by from as is are was were be been being it its you your they their we our i he she not no do does did can could will would should may might must have has had more most other some such only own same so too very s t just don now here there when where who what which how why all any both each few nor own than too about after again against because before below between during further into off out over under up down once' ).split(' '));

/** Terms the pages above us use that ours does not. The single most actionable output here. */
function coverageGap(ours: Page, rivals: Page[]) {
  const grams = (p: Page) => {
    const w = p.text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter((x) => x.length > 2 && !STOP.has(x));
    const set = new Set<string>();
    for (let i = 0; i < w.length; i++) {
      set.add(w[i]);
      if (i + 1 < w.length) set.add(`${w[i]} ${w[i + 1]}`);
      if (i + 2 < w.length) set.add(`${w[i]} ${w[i + 1]} ${w[i + 2]}`);
    }
    return set;
  };
  const mine = grams(ours);
  const counts = new Map<string, number>();
  for (const r of rivals.filter((x) => x.ok)) {
    for (const g of grams(r)) if (!mine.has(g)) counts.set(g, (counts.get(g) ?? 0) + 1);
  }
  const live = rivals.filter((x) => x.ok).length;
  // Only terms MOST rivals use. One rival's brand name is noise; three rivals' shared term is a gap.
  const threshold = Math.max(2, Math.ceil(live * 0.66));
  return [...counts.entries()]
    .filter(([g, n]) => n >= threshold && g.split(' ').length >= 2)
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, 40)
    .map(([g, n]) => ({ term: g, rivals: n }));
}

async function main() {
  const url = arg('url');
  const vs = (arg('vs') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!url) throw new Error('usage: --url <our page> --vs <comma-separated competitor urls>');
  if (!vs.length) throw new Error('ABORT: no competitors given. Run a real search first and pass the pages that actually outrank this one -- a comparison against nothing is an opinion.');

  console.log(`\n  fetching ${1 + vs.length} pages...\n`);
  const [ours, ...rivals] = await Promise.all([grab(url), ...vs.map(grab)]);
  if (!ours.ok) throw new Error(`ABORT: our own page returned ${ours.status}`);

  const dead = rivals.filter((r) => !r.ok);
  if (dead.length) {
    console.log(`  could not fetch ${dead.length} competitor(s) -- many large sites block automated requests:`);
    for (const d of dead) console.log(`    ${d.status || 'network error'}  ${d.url}`);
    console.log(`  the comparison below uses the ${rivals.length - dead.length} that responded.\n`);
  }
  const live = rivals.filter((r) => r.ok);
  if (!live.length) throw new Error('ABORT: no competitor page could be fetched. Read them by hand rather than guessing.');

  const short = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, '').slice(0, 26); } catch { return u.slice(0, 26); } };
  const rows = [{ label: 'OURS', p: ours }, ...live.map((p) => ({ label: short(p.url), p }))];

  console.log(`  ${'page'.padEnd(28)}${'words'.padStart(7)}${'h2'.padStart(5)}${'tables'.padStart(8)}${'lists'.padStart(7)}${'.gov/.edu'.padStart(11)}${'out'.padStart(6)}  schema`);
  for (const { label, p } of rows) {
    console.log(`  ${label.padEnd(28)}${p.words.toString().padStart(7)}${p.h2s.length.toString().padStart(5)}${p.tables.toString().padStart(8)}${p.lists.toString().padStart(7)}${p.outboundGov.toString().padStart(11)}${p.outboundTotal.toString().padStart(6)}  ${p.schema.slice(0, 3).join(', ') || '—'}`);
  }

  const med = (xs: number[]) => xs.slice().sort((a, b) => a - b)[Math.floor(xs.length / 2)];
  const mw = med(live.map((p) => p.words));
  const mh = med(live.map((p) => p.h2s.length));
  console.log(`\n  ours vs the median of those above us: words ${ours.words} vs ${mw} (${ours.words >= mw ? '+' : ''}${Math.round(((ours.words - mw) / mw) * 100)}%), H2s ${ours.h2s.length} vs ${mh}`);

  console.log(`\n  --- WHAT THEY COVER THAT WE DO NOT ---`);
  const gap = coverageGap(ours, live);
  if (!gap.length) console.log(`  nothing shared by most of them is missing here. The gap is not topical coverage.`);
  for (const g of gap.slice(0, 25)) console.log(`    ${String(g.rivals)}/${live.length}  ${g.term}`);

  console.log(`\n  --- OUR PAGE: CLICHES AND SLOP ---`);
  let hits = 0;
  for (const [label, re] of [...CLICHES, ...SLOP]) {
    const m = ours.text.match(re);
    if (m) { console.log(`    [${label}] "${m[0].trim().slice(0, 70)}"`); hits++; }
  }
  if (!hits) console.log(`    none.`);

  console.log(`\n  --- THE SAME CHECK ON THE PAGES ABOVE US ---`);
  for (const p of live) {
    const found = [...CLICHES, ...SLOP].filter(([, re]) => re.test(p.text)).length;
    console.log(`    ${short(p.url).padEnd(28)} ${found} hit(s)`);
  }
  console.log(`\n  If the pages outranking us carry as many or more, phrasing is not what separates them,`);
  console.log(`  and rewriting it will not change the ranking. Fix it because it reads badly, not as SEO.`);

  console.log(`\n  --- WHAT THIS CANNOT SEE ---`);
  console.log(`    Backlinks, domain age, brand search, and click behaviour. Those are usually the real`);
  console.log(`    gap against an established site, and none of them are fixed by editing this page.`);
  console.log(`    Check them before concluding the content is at fault -- and before concluding it is not.\n`);
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
