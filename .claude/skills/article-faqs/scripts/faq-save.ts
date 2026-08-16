// Validates a filled-in .tmp-faq-draft.json against each article's REAL stored body, then writes
// to articles.faq_json. Refuses to write anything if any check fails.
//
// Usage (from repo root):
//   npx tsx .claude/skills/article-faqs/scripts/faq-save.ts --dry-run   # check only, write nothing
//   npx tsx .claude/skills/article-faqs/scripts/faq-save.ts             # check, then write
//
// Why this exists rather than trusting careful writing: a hand-written FAQ that invents a figure
// looks exactly like one that didn't, and the article body is the only thing that can settle it.
// Checking mechanically against the source is the difference between "I was careful" and "this is
// verified". The numeric check below is the highest-value one -- an invented number is both the
// most likely error and the most damaging on a site whose whole promise is "nothing fabricated".
import 'dotenv/config';
import fs from 'fs';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL as string);
const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');

interface FaqItem { question: string; answer: string }
interface DraftEntry { id: number; title?: string; faqItems: FaqItem[] }

const STOPWORDS = new Set(['the','a','an','and','or','but','if','of','to','in','on','for','with','is','are','was','were','be','been','it','its','that','this','as','at','by','from','can','you','your','their','they','not','no','yes','will','may','must','has','have','had','do','does','did','than','then','when','what','which','who','how','why','also','any','all','more','most','some','into','out','up','down','over','under','after','before','about','because','so','such','only','other','same','each']);

function contentWords(text: string): Set<string> {
  return new Set(
    text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w))
  );
}

function containment(a: Set<string>, b: Set<string>): number {
  if (a.size === 0) return 0;
  let hits = 0;
  for (const w of a) if (b.has(w)) hits++;
  return hits / a.size;
}

// Digit-bearing tokens only. Words like "three" carry no fabrication risk worth flagging, but a
// specific figure (a year, a dollar amount, 4.0 pCi/L, a 30-60 day window, an amperage) does --
// those are exactly what a reader would act on and what must trace back to the source text.
function numericTokens(text: string): string[] {
  return (text.match(/\d[\d,.]*/g) || [])
    .map((t) => t.replace(/,/g, '').replace(/\.$/, ''))
    .filter((t) => t.length > 0);
}

function citationTokens(text: string): string[] {
  return (text.match(/\[[A-Z]{2,}\]/g) || []);
}

async function main() {
  if (!fs.existsSync('.tmp-faq-draft.json')) {
    console.error('.tmp-faq-draft.json not found. Run faq-fetch.ts first.');
    process.exitCode = 1;
    return;
  }
  const draft = JSON.parse(fs.readFileSync('.tmp-faq-draft.json', 'utf8')) as DraftEntry[];
  const ids = draft.map((d) => d.id);
  const rows = await sql`
    SELECT id, title, quick_answer, body_markdown, faq_json FROM articles WHERE id = ANY(${ids})
  `;
  const byId = new Map<number, any>();
  for (const r of rows as any[]) byId.set(r.id, r);

  const problems: string[] = [];
  let totalItems = 0;

  for (const entry of draft) {
    const article = byId.get(entry.id);
    const label = `article #${entry.id}`;
    if (!article) { problems.push(`${label}: not found in database`); continue; }

    if (!FORCE && article.faq_json && article.faq_json !== '[]') {
      problems.push(`${label}: already has FAQ items -- pass --force to overwrite`);
      continue;
    }

    const items = (entry.faqItems || []).filter((i) => i.question.trim() && i.answer.trim());
    if (items.length < 2) {
      problems.push(`${label}: only ${items.length} complete FAQ item(s); write at least 2`);
      continue;
    }

    // Normalized source text: everything the FAQ is allowed to draw facts from.
    const source = `${article.title}\n${article.quick_answer}\n${article.body_markdown}`;
    const sourceNums = new Set(numericTokens(source));
    const sourceCites = new Set(citationTokens(source));
    const quickWords = contentWords(article.quick_answer || '');

    const seenQuestions: Array<{ q: string; words: Set<string> }> = [];

    for (const item of items) {
      totalItems++;
      const where = `${label} Q="${item.question.slice(0, 60)}"`;

      if (!item.question.trim().endsWith('?')) {
        problems.push(`${where}: question should end with a question mark`);
      }
      if (item.question.length > 100) {
        problems.push(`${where}: question is ${item.question.length} chars; keep under 100 so it reads as a real search query`);
      }
      if (item.answer.length < 120) {
        problems.push(`${where}: answer is only ${item.answer.length} chars; too thin to add value`);
      }
      if (item.answer.length > 900) {
        problems.push(`${where}: answer is ${item.answer.length} chars; tighten to a few sentences`);
      }

      // The core grounding check.
      for (const num of numericTokens(item.answer + ' ' + item.question)) {
        if (!sourceNums.has(num)) {
          problems.push(`${where}: figure "${num}" does not appear in the article body -- either it was invented, or it is phrased differently than the source (match the source exactly)`);
        }
      }
      for (const cite of citationTokens(item.answer + ' ' + item.question)) {
        if (!sourceCites.has(cite)) {
          problems.push(`${where}: citation ${cite} is not cited anywhere in the article body`);
        }
      }

      // Thin-content check: an FAQ that just restates the Quick Answer adds nothing for a reader
      // and reads to a search engine as padding.
      const answerWords = contentWords(item.answer);
      const overlap = containment(answerWords, quickWords);
      if (overlap > 0.7) {
        problems.push(`${where}: ${Math.round(overlap * 100)}% of this answer's vocabulary is already in the Quick Answer -- cover something the Quick Answer doesn't`);
      }

      const qWords = contentWords(item.question);
      for (const prev of seenQuestions) {
        if (containment(qWords, prev.words) > 0.8) {
          problems.push(`${where}: nearly duplicates earlier question "${prev.q.slice(0, 60)}"`);
        }
      }
      seenQuestions.push({ q: item.question, words: qWords });
    }
  }

  if (problems.length > 0) {
    console.error(`\nFAILED ${problems.length} check(s) -- nothing written:\n`);
    for (const p of problems) console.error(`  - ${p}`);
    process.exitCode = 1;
    return;
  }

  console.log(`All checks passed: ${totalItems} FAQ items across ${draft.length} articles.`);
  if (DRY_RUN) { console.log('Dry run -- nothing written.'); return; }

  for (const entry of draft) {
    const items = entry.faqItems.filter((i) => i.question.trim() && i.answer.trim())
      .map((i) => ({ question: i.question.trim(), answer: i.answer.trim() }));
    await sql`UPDATE articles SET faq_json = ${JSON.stringify(items)}, updated_at = now() WHERE id = ${entry.id}`;
    console.log(`  saved ${items.length} FAQ items to article #${entry.id}`);
  }

  const remaining = await sql`
    SELECT COUNT(*)::int AS c FROM articles
    WHERE status = 'published' AND (faq_json = '[]' OR faq_json IS NULL)
  `;
  console.log(`\nDone. Published articles still without FAQs: ${(remaining as any[])[0].c}`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
