// Guide #335 sewer-line-belly-found-inspection: one connecting sentence + the sewer-scope cutaway (owner OK
// 2026-10-18). The sentence is what lets the diagram's labels live in this page's prose: #335 never said
// "broken section" or "scale buildup". Every core label is checked after the insert. Body-only; title (the
// owner's exact 85-char title), meta, quick_answer and slug untouched.
//
//   npx tsx scripts/place-sewer-diagram-335.ts            # dry run
//   APPLY=true npx tsx scripts/place-sewer-diagram-335.ts
import 'dotenv/config';
import './lib/neon-curl.js';
import { withDb } from '../src/server/db.js';
import { assertHumanDraft } from '../src/seo/effortBrief.js';

const APPLY = process.env.APPLY === 'true';
const SLUG = 'sewer-line-belly-found-inspection';
const IMAGE = '/images/sewer-scope-four-findings-cutaway.webp';
const ANCHOR = '## Turning the scope into a number';
const INSERT =
  'The same camera that shows a belly where water can collect can show three other problems along the line: tree ' +
  'roots at a joint, a crack or broken section, and corrosion or scale buildup narrowing the pipe. Our guide to ' +
  '[what a sewer scope can reveal before you buy](/guides/sewer-scope-before-buying-house/) covers what the camera ' +
  'can and can\'t establish for each.\n\n' +
  '![' + 'Technical cross-section showing four conditions a sewer-scope camera may reveal: tree-root intrusion at a pipe joint, a crack or broken section, a sag where wastewater can collect, and internal corrosion or scale buildup. A camera inspection shows only the accessible, visible interior of the pipe.' + '](' + IMAGE + ')\n\n';
const LABELS = ['tree roots', 'joint', 'crack', 'broken section', 'belly', 'water', 'corrosion', 'scale buildup', 'camera'];

async function main() {
  const [row] = (await withDb((sql) => sql`SELECT id, body_markdown FROM articles WHERE slug = ${SLUG} AND status = 'published'`)) as unknown as Array<{ id: number; body_markdown: string }>;
  if (!row) throw new Error('ABORT: #335 not published');
  const body = row.body_markdown;
  if (body.includes(IMAGE)) throw new Error('ABORT: already placed');
  if (body.split(ANCHOR).length - 1 !== 1) throw new Error(`ABORT: "${ANCHOR}" not found exactly once`);
  const next = body.replace(ANCHOR, INSERT + ANCHOR);
  const prose = next.replace(/!\[[^\]]*\]\([^)]*\)/g, '');
  const missing = LABELS.filter((l) => !new RegExp(l.replace(/[-\s]/g, '[-\\s]'), 'i').test(prose));
  if (missing.length) throw new Error(`ABORT: prose never says ${missing.join(', ')}`);
  assertHumanDraft(SLUG, next, '');
  const [t] = (await withDb((sql) => sql`SELECT 1 FROM articles WHERE slug = 'sewer-scope-before-buying-house' AND status = 'published'`)) as unknown as unknown[];
  if (!t) throw new Error('ABORT: link target not published yet');
  console.log(`  #${row.id}: sentence + diagram above "${ANCHOR}"; labels checked: ${LABELS.length}`);
  if (!APPLY) { console.log('  DRY RUN -- nothing written.'); return; }
  await withDb((sql) => sql`UPDATE articles SET body_markdown = ${next}, updated_at = now() WHERE id = ${row.id} AND slug = ${SLUG}`);
  console.log('  wrote. Run npm run build.');
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
