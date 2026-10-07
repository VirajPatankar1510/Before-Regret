// "Key findings" blocks for the research studies (2026-10-06, owner-approved; the LLM-citation
// plan's remaining move after Permit Pulse got the first one on 2026-10-03).
//
// Each block is a short list of self-contained sentences: one figure, its denominator and its
// source in the same sentence, so an answer engine or a writer can lift any one line without the
// rest of the page and still quote it correctly.
//
// The rule that keeps them safe: a key finding RESTATES the study, it never adds to it. So
// assertKeyFindingsNumbers() fails the build if any number in the block does not already appear
// somewhere else on the same published page. A figure that drifts, or one typed from memory,
// stops the build instead of shipping.

export const KF_CSS = `  .kf{border:1px solid #dfe5e2;background:#fbfcfb;padding:1rem 1.2rem .4rem;margin:1.6rem 0 2rem}
  .kf h2{margin:0 0 .7rem;padding:0;border:0;font-size:1.15rem}
  .kf ul{margin:0 0 .8rem;padding-left:1.1rem}
  .kf li{margin:0 0 .55rem}
  .kf .kf-src{margin:0 0 .6rem;font:400 12px/1.5 ui-sans-serif,system-ui,sans-serif;color:#6b6b6b}`;

export function keyFindingsBlock(items: string[], source: string): string {
  if (items.length < 3 || items.length > 6) throw new Error(`ABORT: key findings need 3-6 items, got ${items.length}`);
  return `<section class="kf" id="key-findings">
    <h2>Key findings</h2>
    <ul>
${items.map((i) => `      <li>${i}</li>`).join('\n')}
    </ul>
    <p class="kf-src">${source}</p>
  </section>`;
}

const toText = (s: string) =>
  s
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[#a-z0-9]+;/gi, ' ');

/** Every number in the key-findings block must already appear elsewhere on the page. */
export function assertKeyFindingsNumbers(html: string, label: string): void {
  const m = html.match(/<section class="kf" id="key-findings">[\s\S]*?<\/section>/);
  if (!m) throw new Error(`ABORT: ${label}: no key-findings block`);
  if (html.split('id="key-findings"').length !== 2) throw new Error(`ABORT: ${label}: key-findings block appears more than once`);
  const block = toText(m[0]);
  const rest = toText(html.replace(m[0], ' '));
  const tokens = block.match(/\d+(?:,\d{3})*(?:\.\d+)?/g) || [];
  const missing = [...new Set(tokens)].filter((t) => !rest.includes(t));
  if (missing.length) throw new Error(`ABORT: ${label}: key findings state numbers the page does not: ${missing.join(', ')}`);
}
