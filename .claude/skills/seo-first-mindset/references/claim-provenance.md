# Claim provenance

The rule "never invent SEO data" is enforced by the build, not by good intentions.

## The registry

`src/seo/targetKeywords.ts` is **the only file in which a keyword claim may be written**.
Every entry cites a capture id that must exist in `data/keywords/`.

`scripts/assert-keyword-provenance.ts` runs in the build chain and fails it when a claim has no
capture. A guide targeting a phrase absent from every capture cannot ship.

## Captures

A capture is a dated JSON file in `data/keywords/`, written by a pull script, carrying its own
`source`, `endpoint`, `captured_at` and `cost_usd`. Captures are append-only history. Never
hand-edit one — regenerate it.

Naming: `<YYYY-MM-DD>-<source>-<kind>.json`, e.g. `2026-09-16-gsc-queries.json`.

A hand-typed capture is a contradiction in terms. One was typed by hand on 2026-09-11 for Bing
before anyone checked that `src/server/bingWebmasterService.ts` already had `fetchBingQueries`
and the API key was already in `.env`. **Look for the programmatic path first.**

## The brief

`src/seo/articleBrief.ts` → `validateBrief()` rejects a brief missing any of:

`slug` · `targetQuery` · `capture` · `intent` · `who` · `want` · `achieve` · `titlePromise`

`who`/`want`/`achieve` force the searcher to be named before a word is written. `capture` forces
the target to be measured. `titlePromise` is what the body must then deliver.

## Targeting a phrase that was asked for but not measured

This happens often and the answer is always the same. When a request names a phrase that appears
in no capture, **do not target it**. Find the measured demand next to it and target that, then
say plainly what you did and why.

Worked example — the request was "cast iron pipes problems", which appeared in no capture. The
measured neighbours were:

```
cast iron pipe damage            104 impressions, position 84.8
cast iron sewer pipe corrosion    52 impressions, position 71.0
cast iron drain pipes problems     1 impression,  position 69.0
```

The page was retargeted at `cast iron pipe damage`. That is the provenance gate working, not
an obstacle to route around.

## Metadata must be delivered by the body

A title promising something the body does not contain is the defect the gates exist to catch,
and it has been shipped before. When metadata promises a word, assert the body uses it:

```ts
for (const [word, min] of [['damage', 3], ['sewer', 4]] as Array<[string, number]>) {
  const n = (body.match(new RegExp(word, 'gi')) ?? []).length;
  if (n < min) throw new Error(`ABORT: title promises "${word}" but body uses it ${n}x, want ${min}+`);
}
```

## Figures come from the engine, not from the writer

Cost and lifespan figures are read out of `src/engine/inspectionPriorities.ts` at build time and
asserted present in the body. A number typed into prose is a number nobody can re-derive.

## Compute lengths, never eyeball them

Seven metadata overruns shipped before this became a rule. Title ≤ 60, meta 70–155,
`quick_answer` 120–450. Print the candidate lengths before writing.

## No invented specifics, ever

`hello@beforeregret.com` is the only real mailbox. Never fabricate an email, a person, a
testimonial, or a "we verified X" claim. The About page exists precisely because a fake author
with a fake photo would be a false E-E-A-T signal and a trivially discoverable one.
