// Guide #289 splice-romex-knob-tube-wiring: three text corrections plus the new diagram, as one change
// (owner request 2026-10-18, from a reviewer's spec for the diagram that applies equally to the prose).
//
//   npx tsx scripts/fix-romex-grounding-and-diagram.ts            # dry run
//   APPLY=true npx tsx scripts/fix-romex-grounding-and-diagram.ts
//
// 1. The grounding bullet said the Romex ground is non-functional "unless a separate grounding path is
//    established ... or the circuit is protected by a GFCI". A GFCI gives shock protection; it does not
//    create an equipment ground. Rewritten in the reviewer's wording.
// 2. "The NEC strictly prohibits surrounding active knob-and-tube wiring with thermal insulation" -> generally,
//    concealed, subject to provisions and exceptions that depend on the adopted edition. The table row follows.
// 3. Tape deterioration was stated as certain; it is a possibility, and exposed live copper a potential hazard.
// 4. Each knob-and-tube conductor enters through its own bushed hole (the reviewer cites NEC 300.16(A); not read
//    here -- NFPA's free access needs an account -- so the prose states it without a section number).
// Then the diagram goes under the NEC heading. Every label it draws must be in the corrected prose.
// Surgical: title, meta, quick_answer, slug untouched. Each old sentence must match exactly once.
import 'dotenv/config';
import './lib/neon-curl.js';
import fs from 'node:fs';
import path from 'node:path';
import { withDb } from '../src/server/db.js';
import { extractFirstArticleImage } from '../src/utils/articleImage.js';
import { assertHumanDraft } from '../src/seo/effortBrief.js';

const APPLY = process.env.APPLY === 'true';
const SLUG = 'splice-romex-knob-tube-wiring';
const IMAGE = '/images/romex-spliced-to-knob-and-tube-junction-box.webp';
const ANCHOR = '## What the National Electrical Code Says About Splicing';

const EDITS: Array<[string, string]> = [
  [
    'The ground wire in the Romex cable will be "open" or non-functional unless a separate grounding path is established back to the main service panel, or the circuit is protected by a Ground Fault Circuit Interrupter (GFCI) device or breaker.',
    'The ground wire in the Romex cable will be "open" or non-functional unless it connects to a valid grounding path back to the main service panel: a ground wire in Romex does not guarantee a functioning equipment ground. A Ground Fault Circuit Interrupter (GFCI) device or breaker can provide shock protection on certain ungrounded circuits, but it does not create an equipment ground, and applicable receptacle labeling requirements still apply.',
  ],
  [
    'The NEC strictly prohibits surrounding active knob-and-tube wiring with thermal insulation [NFPA].',
    'The NEC generally prohibits surrounding concealed knob-and-tube wiring with thermal insulation, subject to code provisions and exceptions that depend on the edition your jurisdiction has adopted [NFPA].',
  ],
  [
    '| **Permitted in Insulation** | No | Yes (Within standard thermal limits) |',
    '| **Permitted in Insulation** | Generally no (exceptions vary) | Yes (Within standard thermal limits) |',
  ],
  [
    'the individual K&T conductors must enter the box through protective non-metallic tubing (often called loom).',
    'the individual K&T conductors must enter the box through protective non-metallic tubing (often called loom), each through its own bushed hole in the box where the code requires it.',
  ],
  [
    'Over time, the electrical tape dries out, unravels, and exposes live copper.',
    'Over time, electrical tape can dry out and unravel, and exposed live copper is a potential hazard.',
  ],
];

const ALT =
  'Side-by-side diagram of Romex connected to knob-and-tube wiring. Left, a flying splice: two knob-and-tube ' +
  'conductors on ceramic knobs twisted to the Romex wires and covered only with electrical tape, with no junction ' +
  'box, beside thermal insulation. Right, an accessible junction box: each knob-and-tube conductor enters through ' +
  'its own loom and its own bushed hole in the box wall, the splices are made with mechanical connectors inside the box, and a note says the ' +
  'equipment grounding path is not established by this splice. A GFCI can provide shock ' +
  'protection on certain ungrounded circuits but does not create an equipment ground.';
const LABELS = ['flying splice', 'electrical tape', 'knob-and-tube', 'Romex', 'thermal insulation', 'junction box',
  'loom', 'bushed hole', 'mechanical connectors', 'ground wire', 'equipment ground', 'grounding path', 'GFCI', 'labeling',
  'live copper', 'potential hazard', 'code provisions', 'concealed', 'three-prong', 'licensed electrician',
  'inspection contingency'];

async function main() {
  if (!fs.existsSync(path.join(process.cwd(), 'public', IMAGE))) throw new Error(`ABORT: ${IMAGE} not rendered`);
  const [row] = (await withDb((sql) => sql`SELECT id, body_markdown FROM articles WHERE slug = ${SLUG} AND status = 'published'`)) as unknown as Array<{ id: number; body_markdown: string }>;
  if (!row) throw new Error('ABORT: guide not published');
  let body = row.body_markdown;
  for (const [from, to] of EDITS) {
    const n = body.split(from).length - 1;
    if (n !== 1) throw new Error(`ABORT: expected once, found ${n}: "${from.slice(0, 70)}..."`);
    body = body.replace(from, to);
    console.log(`  - ${from.slice(0, 90)}...\n  + ${to.slice(0, 90)}...\n`);
  }
  if (body.includes(IMAGE)) throw new Error('ABORT: diagram already placed');
  if (body.split(ANCHOR).length - 1 !== 1) throw new Error(`ABORT: heading "${ANCHOR}" not found once`);
  const missing = LABELS.filter((l) => !new RegExp(l.replace(/[-\s]/g, '[-\\s]'), 'i').test(body));
  if (missing.length) throw new Error(`ABORT: the diagram draws ${missing.join(', ')} but the corrected prose never says it`);
  body = body.replace(ANCHOR, `${ANCHOR}\n\n![${ALT}](${IMAGE})`);
  if (!extractFirstArticleImage(body)?.endsWith(IMAGE)) throw new Error('ABORT: image not recognised as the block image');
  assertHumanDraft(SLUG, body, '');
  console.log(`  labels checked: ${LABELS.length}, all in the corrected prose; diagram under "${ANCHOR}"`);
  console.log('  title, meta, quick_answer, slug untouched');
  if (!APPLY) { console.log('\n  DRY RUN -- nothing written.\n'); return; }
  await withDb((sql) => sql`UPDATE articles SET body_markdown = ${body}, updated_at = now() WHERE id = ${row.id} AND slug = ${SLUG}`);
  console.log(`  wrote #${row.id} ${SLUG}. Run npm run build.`);
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
