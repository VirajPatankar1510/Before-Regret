// Regression test for the Inspection Report Decoder paste-scan (src/data/inspectionDecoderTerms.ts): real findings
// match, negated mentions ("no visible mold") and benign wording ("furnace operated normally") do not.
//   npx tsx scripts/test-decoder-matching.ts

import { findTermsInText } from '../src/data/inspectionDecoderTerms.js';
const cases: Array<[string, string[]]> = [
  ['No visible mold observed.', []],
  ['Possible mold on bathroom ceiling.', ['mold']],
  ['No GFCI protection at kitchen counter.', ['gfci']],
  ['GFCI did not trip when tested.', ['gfci']],
  ['The furnace operated normally. Ceiling has a slight sag in the hallway.', []],
  ['Attic not inspected due to storage.', ['not-inspected-storage']],
  ['Several outlets tested with an open ground; hot/neutral reversed at island.', ['open-ground', 'reverse-polarity']],
  ['Panel is Zinsco. Double tapped breaker noted.', ['double-tap', 'zinsco-panel']],
  ['Water heater lacks a TPR discharge pipe.', ['tpr-valve']],
  ['Evidence of termites (mud tubes) at sill plate.', ['termites-wdo']],
  ['No evidence of wood destroying insects.', []],
];
let bad = 0;
for (const [txt, want] of cases) {
  const got = findTermsInText(txt).map((t) => t.id).sort();
  const ok = JSON.stringify(got) === JSON.stringify([...want].sort());
  if (!ok) bad++;
  console.log(ok ? 'ok  ' : 'FAIL', JSON.stringify(txt), '->', got.join(','));
}
console.log(bad ? `${bad} failing` : "all pass"); if (bad) process.exit(1);
