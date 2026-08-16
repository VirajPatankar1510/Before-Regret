// Pulls the next batch of published articles that still have no FAQ items, and writes two files:
//   .tmp-faq-batch.txt   -- full readable source (title, quick answer, body) to write FAQs FROM
//   .tmp-faq-draft.json  -- a skeleton keyed by article id, to fill in and hand to faq-save.ts
//
// Lives inside the repo (under .claude/skills/) on purpose: node resolves `dotenv/config` and
// `@neondatabase/serverless` by walking UP from the script's own directory, so a script parked in
// /tmp cannot see this repo's node_modules, while this one can. Run it from the repo root.
import 'dotenv/config';
import fs from 'fs';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL as string);

const LIMIT = parseInt(process.argv[2] || '10', 10);

async function main() {
  // No OFFSET on purpose. Articles are selected by "still has no FAQ", so once a batch is saved
  // those rows drop out of this query by themselves and the next run picks up the next 10. An
  // offset would silently skip articles whenever a prior batch was partially saved.
  const rows = await sql`
    SELECT id, slug, title, quick_answer, body_markdown, article_type
    FROM articles
    WHERE status = 'published' AND (faq_json = '[]' OR faq_json IS NULL)
    ORDER BY id ASC
    LIMIT ${LIMIT}
  `;
  const list = rows as unknown as Array<{
    id: number; slug: string; title: string; quick_answer: string; body_markdown: string; article_type: string;
  }>;

  if (list.length === 0) {
    console.log('No published articles left without FAQs. Nothing to do.');
    return;
  }

  const readable = list.map((r) =>
    `\n===== ARTICLE id=${r.id} type=${r.article_type} =====\nTITLE: ${r.title}\nSLUG: ${r.slug}\nQUICK_ANSWER: ${r.quick_answer}\n--- BODY ---\n${r.body_markdown}\n`
  ).join('\n');
  fs.writeFileSync('.tmp-faq-batch.txt', readable);

  const skeleton = list.map((r) => ({
    id: r.id,
    title: r.title,
    faqItems: [{ question: '', answer: '' }, { question: '', answer: '' }, { question: '', answer: '' }],
  }));
  fs.writeFileSync('.tmp-faq-draft.json', JSON.stringify(skeleton, null, 2));

  const remaining = await sql`
    SELECT COUNT(*)::int AS c FROM articles
    WHERE status = 'published' AND (faq_json = '[]' OR faq_json IS NULL)
  `;
  console.log(`Batch of ${list.length} written to .tmp-faq-batch.txt (${readable.length} chars)`);
  console.log(`Draft skeleton written to .tmp-faq-draft.json`);
  console.log(`IDs: ${list.map((r) => r.id).join(', ')}`);
  console.log(`Remaining without FAQs (including this batch): ${(remaining as any[])[0].c}`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
