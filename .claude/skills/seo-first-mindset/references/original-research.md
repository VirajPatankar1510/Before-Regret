# Original research

Seven studies computed from federal open data, published free under CC BY 4.0 with the derived
data files linked beside each. This is the site's strongest information-gain asset: figures that
exist nowhere else because we computed them.

## The standard

**Every figure is computed by BeforeRegret from the named federal source, not restated from
another publisher.** That sentence appears in `llms.txt` and must stay true.

Published studies include *Risk Without Price* (50.7M mortgaged households vs FEMA modelled loss
across 3,093 counties), *Risk Without Cover* (NFIP take-up, 2,304 counties), *Outside the Zone*
(2,578,413 NFIP claims; 26.6% paid outside the high-risk zone, $20.6bn), *High-Hazard Dams*
(17,049 dams), and *Raise or Remove* (32,779 FEMA buy-or-elevate decisions).

## Rules

1. **Publish the data.** Every study ships its CSV/JSON alongside, and declares a
   BeforeRegret-authored `Dataset` in JSON-LD with a description and licence. A claim nobody can
   check is not research.
2. **Documentary language.** State what the data shows. The dam study was rewritten in strictly
   documentary language and the pass applied to three others — findings are not pitched.
3. **Guard the outliers.** *Risk Without Price* v1 broke on a Puerto Rico outlier. Impossible
   take-up rates are suppressed. **Check the tails before publishing a national figure.**
4. **Correlation is not the finding.** "Which state a home sits in explains more of the price
   (R² 0.44) than the modelled risk it faces (R² 0.20)" is a statement about variance explained,
   and must not be restated as causation.
5. **Guard every displayed date against its schema `datePublished`.** The build verifies this,
   plus that every llms.txt research URL and every `Dataset` `contentUrl` resolves in `dist`.
6. **Correct overclaims.** The Allegheny study and its press pack were corrected once; a seismic
   code claim was corrected from "introduced" to "strengthened". Corrections are cheap; a wrong
   figure quoted by a journalist is not.
7. **One source label across all studies.** Consistency is part of credibility.

## Why this matters for search

Research is the one content type here that cannot be absorbed by an AI Overview without
attribution, because the numbers do not exist elsewhere. Where definitional content is
vulnerable (`references/search-intent.md`), original data is defensible.

It is also the honest basis for outreach: press files exist per study, routed to shared desks.

## Cautions

- Studies are built by `scripts/prerender-research.tsx` at build time. Editing a builder does not
  regenerate output — **run the build**. A gate once failed after a builder edit because
  `npm run build` reads `docs/*.html` and does not regenerate studies.
- Research pages are a small share of impressions (`/research/raise-or-remove/` ≈ 21 impr/28d).
  Their value is authority, citation and outreach — **do not justify them on impressions**, and
  do not let a weak impression count argue for abandoning them.
