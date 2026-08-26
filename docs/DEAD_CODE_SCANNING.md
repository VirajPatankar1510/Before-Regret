# Dead-code scanning with knip

Run it with `npm run knip`.

## Why this exists

An earlier attempt to find dead code with `grep` reported Footer, Hero, Navbar and about
twenty other obviously-live components as orphans, because text matching cannot see an
import graph. knip resolves modules properly, which is the difference between a list you
can act on and a list that will break the site.

It earned its place immediately: the first real run found six genuinely dead files,
totalling ~860 lines. Most were leftovers from the product that previously lived on this
domain (an India-focused resident Q&A platform) -- `slotHelper.ts` parsed "20-minute
resident time slots", `validation.ts` enforced "strict anonymity" on user posts,
`seoTypes.ts` typed the fabricated zip_hub/city_hub pSEO dataset that was deleted long ago.
`femaDeclarationsService.ts` was different: it was live until the county-events generator
was removed, and knip caught it going cold in the same pass.

## Reading the output

**"Unused files" is the section worth acting on.** Deleting a whole unreferenced file is
low risk and the finding is usually unambiguous.

**"Unused exports" is mostly noise here, and should not be bulk-actioned.** knip flags an
export that nothing else imports, which on this codebase is frequently deliberate:

- `App` in App.tsx is mounted by main.tsx through a path knip does not follow
- `PRIORITY_RULES`, `LEGACY_GONE_PATHS` and similar are exported so tests and audit scripts
  can assert against the same constant the runtime uses, rather than a re-typed copy --
  see the comment in src/data/legacyUrls.ts for why that matters
- Several are exported purely for readability at the module boundary

Removing the `export` keyword from those would save nothing (the code still ships) while
losing the ability to verify them. Treat this section as a prompt to look, not a task list.

## Suppressed dependencies, and why

`ignoreDependencies` lists five packages knip reports as unused that absolutely are not:

- `vite` -- the build tool itself, invoked through npm scripts rather than imported
- `tailwindcss` / `autoprefixer` -- consumed through the CSS pipeline, never in TS/TSX
- `@tailwindcss/vite`, `@vitejs/plugin-react` -- referenced from vite.config.ts as plugins

**Uninstalling any of these breaks the build.** They are suppressed so a future reader does
not act on a confident-looking false positive.
