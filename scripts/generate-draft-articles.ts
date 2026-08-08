import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { withDb, isDbConfigured } from '../src/server/db.js';
import { buildArticlePrompt } from '../src/server/articleGenerator.js';
import { KNOWN_SOURCES } from '../src/data/knownSources.js';

// Batch draft generator for scaling the guide library (12 -> 150 target). Reuses the exact same
// prompt and duplicate-title guard as the "Generate with AI" button in SeoAdminPanel.tsx
// (src/server/articleGenerator.ts) -- this is not a separate, looser content pipeline, just a
// way to run that same generation multiple times without clicking through the admin UI once per
// article.
//
// Everything this writes lands with status = 'draft', identical to a freshly generated article
// in the admin editor before Save/Publish. Nothing here ever sets status = 'published' -- that
// stays a deliberate, one-at-a-time human action in SeoAdminPanel, on purpose. Bulk-publishing
// AI-generated pages without review is exactly the "scaled content abuse" pattern Google's spam
// policies call out, and it's also just how you'd end up re-creating the fabricated-content
// problem this site already had to clean up once this session. This script only ever queues
// drafts for a human to read, edit, and decide on.
//
// Progress across runs is tracked in scripts/draft-topics-log.json (gitignored, local-only) so
// re-running this script with TOPIC_LIMIT doesn't regenerate a draft for a topic seed already
// attempted in an earlier run.

const TOPIC_SEEDS: string[] = [
  'Federal Pacific Electric (FPE) panel and whether it fails insurance underwriting the same way a Zinsco panel does',
  'Aluminum branch circuit wiring (not just the service entrance) and insurance/financing treatment',
  'Double-tapped circuit breakers found during inspection and what they mean for the buyer',
  'Ungrounded two-prong outlets and what it means for insurance, financing, or renovation cost',
  'EIFS (synthetic stucco) moisture inspection before buying a house',
  'Galvanized supply pipe lifespan and insurance treatment before buying a house',
  'Orangeburg pipe (bituminous fiber sewer line) and what buyers should know before closing',
  'Getting a septic system inspected before buying a house',
  'Getting well water tested before buying a house',
  'Vermiculite attic insulation and asbestos risk before buying a house',
  'UFFI (urea-formaldehyde foam insulation) and what it means for a home purchase',
  'Wood-destroying-organism (WDO) report versus a general home inspection',
  '"Evidence of prior moisture" on an inspection report and what to do next',
  'Inspector noted "no access" to an area on the report -- what buyers should do',
  '"Evidence of an active leak" versus an active leak on an inspection report',
  'Cosmetic versus structural foundation cracks on an inspection report',
  'Efflorescence versus mold on foundation or basement walls',
  'Wind mitigation inspection for homeowners insurance in coastal states',
  'Roof certification requirement for homeowners insurance',
  'Roof age and 4-point inspection insurance failure specifically (narrower than a general 4-point overview)',
  'HVAC system age and how it affects insurability or financing',
  'Water heater age and TPR valve flags on an inspection report',
  'Chimney liner deficiencies found during inspection',
  'Lead-based paint disclosure and testing for homes built before 1978',
];

interface GeneratedArticle {
  title: string;
  metaDescription: string;
  quickAnswer: string;
  sources: string[];
  bodyMarkdown: string;
}

function parseGeneratedText(fullText: string): GeneratedArticle {
  const delimiterIndex = fullText.indexOf('\n---\n');
  const headerBlock = delimiterIndex === -1 ? fullText : fullText.slice(0, delimiterIndex);
  const body = delimiterIndex === -1 ? '' : fullText.slice(delimiterIndex + 5);
  const titleMatch = headerBlock.match(/^TITLE:\s*(.+)$/m);
  const metaMatch = headerBlock.match(/^META:\s*(.+)$/m);
  const quickAnswerMatch = headerBlock.match(/^QUICK_ANSWER:\s*(.+)$/m);
  const sourcesMatch = headerBlock.match(/^SOURCES:\s*(.+)$/m);
  const knownKeys = new Set(KNOWN_SOURCES.map((s) => s.key));
  const sources = sourcesMatch
    ? sourcesMatch[1].split(',').map((s) => s.trim().toUpperCase()).filter((s) => knownKeys.has(s))
    : [];
  return {
    title: titleMatch ? titleMatch[1].trim() : '',
    metaDescription: metaMatch ? metaMatch[1].trim() : '',
    quickAnswer: quickAnswerMatch ? quickAnswerMatch[1].trim() : '',
    sources,
    bodyMarkdown: delimiterIndex === -1 ? fullText : body,
  };
}

// Matches src/server/articlesApi.ts's private slugify() exactly -- duplicated rather than
// exported from there because that module is an Express route registrar, not a shared utility
// module, and this is the only other place that needs the same slug shape.
const SLUG_STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'for', 'to', 'in', 'on', 'of', 'with', 'is', 'are',
  'your', 'you', 'how', 'what', 'why', 'can', 'do', 'does', 'this', 'that', 'it', 'its',
]);

function slugify(input: string): string {
  const words = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const stripped = words.filter((w) => !SLUG_STOPWORDS.has(w));
  const chosen = stripped.length >= 3 ? stripped : words;
  const slug = chosen.join('-').slice(0, 60).replace(/-+$/, '');
  return slug || 'article';
}

const LOG_PATH = path.join(process.cwd(), 'scripts', 'draft-topics-log.json');

function loadAttemptedSeeds(): Set<string> {
  try {
    const raw = fs.readFileSync(LOG_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed?.attemptedSeeds) ? parsed.attemptedSeeds : []);
  } catch {
    return new Set();
  }
}

function saveAttemptedSeeds(seeds: Set<string>) {
  fs.writeFileSync(LOG_PATH, JSON.stringify({ attemptedSeeds: Array.from(seeds) }, null, 2), 'utf8');
}

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[generate-draft-articles] GEMINI_API_KEY not set.');
    process.exit(1);
  }
  if (!isDbConfigured()) {
    console.error('[generate-draft-articles] DATABASE_URL not set.');
    process.exit(1);
  }

  const limit = parseInt(process.env.TOPIC_LIMIT || '5', 10);
  const attempted = loadAttemptedSeeds();
  const pending = TOPIC_SEEDS.filter((seed) => !attempted.has(seed)).slice(0, limit);

  if (pending.length === 0) {
    console.log('[generate-draft-articles] No pending topics left in TOPIC_SEEDS (all already attempted per scripts/draft-topics-log.json).');
    return;
  }

  console.log(`[generate-draft-articles] Generating ${pending.length} draft(s) (TOPIC_LIMIT=${limit}, ${TOPIC_SEEDS.length - attempted.size - pending.length} remaining after this run)...`);

  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });

  let existingTitles: string[] = [];
  try {
    const rows = await withDb((sql) => sql`SELECT title FROM articles`);
    existingTitles = (rows as unknown as Array<{ title: string }>)
      .map((r) => r.title)
      .filter((t) => t && t !== 'Untitled article');
  } catch (err) {
    console.error('[generate-draft-articles] Failed to load existing titles for duplicate guard, proceeding without it:', err);
  }

  let successCount = 0;
  for (const seed of pending) {
    console.log(`\n[generate-draft-articles] Generating for seed: "${seed}"`);
    try {
      const { systemInstruction, contents } = buildArticlePrompt(seed, existingTitles, '');
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents,
        config: { systemInstruction, temperature: 0.8 },
      });
      const fullText = response.text || '';
      const parsed = parseGeneratedText(fullText);

      if (!parsed.title || !parsed.bodyMarkdown.trim()) {
        console.error(`[generate-draft-articles] Model output for "${seed}" didn't parse into a usable title/body -- skipping, not counted as attempted so it can be retried.`);
        continue;
      }

      const article = await withDb(async (sql) => {
        const base = slugify(parsed.title);
        let slug = base;
        for (let attempt = 1; attempt <= 20; attempt++) {
          const existing = (await sql`SELECT id FROM articles WHERE slug = ${slug} LIMIT 1`) as unknown[];
          if (existing.length === 0) break;
          slug = `${base}-${attempt + 1}`;
        }
        const rows = await sql`
          INSERT INTO articles (slug, title, meta_description, body_markdown, quick_answer, sources_json, status)
          VALUES (${slug}, ${parsed.title}, ${parsed.metaDescription}, ${parsed.bodyMarkdown}, ${parsed.quickAnswer}, ${JSON.stringify(parsed.sources)}, 'draft')
          RETURNING id, slug, title
        `;
        return rows[0];
      });

      console.log(`[generate-draft-articles] Saved draft #${article.id}: "${article.title}" (slug: ${article.slug})`);
      existingTitles.push(parsed.title);
      attempted.add(seed);
      saveAttemptedSeeds(attempted);
      successCount++;
    } catch (err) {
      console.error(`[generate-draft-articles] Failed to generate for seed "${seed}":`, err);
    }

    // Small pause between calls -- polite to the Gemini API, no functional requirement here.
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(`\n[generate-draft-articles] Done. ${successCount}/${pending.length} draft(s) saved. Review and publish them in the admin panel at /admin/seo.`);
}

run().catch((err) => {
  console.error('[generate-draft-articles] Fatal error:', err);
  process.exit(1);
});
