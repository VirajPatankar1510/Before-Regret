// The diagrams other sites may reuse, and the terms they may reuse them on.
//
// WHY THIS EXISTS. On 2026-09-24 a Las Vegas plumber's blog cited why-cast-iron-pipes-corrode as
// the source for its crown-corrosion explanation -- the site's first earned backlink, found by a
// trade business writing its own content and needing a neutral source. Trade blogs need visuals as
// much as they need explanations, and these diagrams are original, so offering them for reuse with
// credit turns each one into something a writer can pick up without asking. Renders as a collapsed
// "Free to use with credit" panel under the figure (renderArticleMarkdown.tsx) and as licence
// metadata on the schema image (articleImage.ts), which is what Google Images reads for its
// "Licensable" label.
//
// AN ALLOWLIST, NOT "everything under /images/". The book cover lives in the same folder and must
// never pick up an open licence by accident. A new diagram is reusable only once it is added here.
//
// CC BY 4.0, deliberately. It requires credit but does not require a followed link, and that
// difference matters: Google's link-spam policy names "requiring a link as part of a Terms of
// Service ... without allowing a third-party content owner the choice of qualifying the outbound
// link" as a link scheme. So the snippet offers a normal credit link and the terms never demand
// one. Do not tighten this into "must link to us".
//
// A CC licence cannot be revoked for copies already made under it. Removing a diagram from this
// list stops offering it; it does not withdraw it from anyone who already took it.

export const DIAGRAM_LICENSE_URL = 'https://creativecommons.org/licenses/by/4.0/';
export const DIAGRAM_LICENSE_NAME = 'CC BY 4.0';
export const DIAGRAM_CREDIT = 'Before Regret';

export const REUSABLE_DIAGRAMS: ReadonlySet<string> = new Set([
  '/images/county-vs-city-permit-jurisdiction.webp',
  '/images/edison-base-fuse-over-fusing-risk.webp',
  '/images/eifs-vs-traditional-stucco-wall-cross-section.webp',
  '/images/knob-and-tube-vs-modern-sheathed-cable.webp',
  '/images/open-ground-vs-bootleg-ground-receptacle-wiring.webp',
  '/images/polybutylene-vs-pex-pipe-identification.webp',
  '/images/reverse-polarity-vs-correct-receptacle-wiring.webp',
  '/images/shared-well-and-y-shaped-driveway-responsibility.webp',
  '/images/single-strand-aluminum-vs-copper-wiring-identification.webp',
]);

/** Fragment id for a diagram's reuse panel -- also the target of the schema's acquireLicensePage,
 *  so it must be derived the same way in both places. */
export function diagramAnchorId(src: string): string {
  const base = src.split('/').pop()!.replace(/\.[a-z0-9]+$/i, '');
  return `use-diagram-${base}`;
}
