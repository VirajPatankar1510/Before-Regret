# Florida building-permit due-diligence cluster — pilot report (2026-11-17)

Status (updated 2026-11-17, after the owner said "do whatever you think is the right thing"):
- **The Collier draft is final, with the title set to "Collier County Permit Search: CityView, CDPlus & Pre-1989" (57 characters).** Every portal name is kept.
- **Bulletin 14 was read and changed the status section.** In CDPlus, SUSPEND = cancelled and closed; VOID = needs action. The first draft had read SUSPEND as open.
- **The production writes were refused by the session's permission check**, so nothing is live:
  - the Collier publish;
  - the #351 correction.
  Both await an explicit "publish". The #351 fix is `scripts/fix-351-florida-permit-expiry.ts` (dry run verified).
- **Not done on purpose:**
  - accepting the Property Appraiser's Terms of Use (a legal agreement in the owner's name; the page doesn't need it);
  - editing the ranking hub #286.

## Stage 1 — existing-site audit (read only, no production edits)

**Live Florida / permit pages that the cluster must link to, not duplicate**

| id | URL | role in the cluster |
|---|---|---|
| 286 | /guides/look-up-building-permits-by-address/ | national hub with the county list; gets a Collier line by script (owner OK) |
| 351 | /guides/resolve-open-building-permits-before-closing/ | what to do about an open permit; county pages link here instead of restating § 553.79(16) |
| 319 | /guides/accela-citizen-access-permit-search/ | Accela how-to; Manatee (Accela, if confirmed) links here instead of repeating it |
| 362 | /guides/check-building-permits-pinellas-county-fl/ | sibling county guide (4.0% overlap with the Collier draft) |
| 208 | /guides/check-building-permits-hillsborough-county-fl/ | sibling |
| 214 | /guides/check-building-permits-broward-county-fl/ | sibling; holds the condo milestone law |
| 90 | /guides/check-building-permits-miami-dade-county-fl/ | sibling |
| 287, 315 | unpermitted-work guides | the "no permit at all" side |
| 83 | /guides/check-code-violations-property-online/ | code enforcement side |

- **Duplicate risk: none.** No Collier, Sarasota, Manatee or Brevard slug exists in any status. Removed slugs not to reuse: check-building-permits-orange-county-fl, check-building-permits-palm-beach-county-fl.
- **URL structure.** Keep the existing convention, `/guides/check-building-permits-<county>-county-fl/`. There is no `/permits/` route; adding one means App.tsx, server.ts `KNOWN_STATIC_ROUTE_PREFIXES`, a new prerenderer and sitemap work, for no ranking benefit. A Florida hub, if built, should be a `/guides/` slug.
- **Technical constraints.** Guides are prerendered, so a DB row without a rebuild is a soft 404. Titles ≤60 unless in `OWNER_LONG_TITLES`. Quick answer only on question titles; county titles aren't questions. The official page must be linked in the first paragraph (new navigational guides). Trigram overlap ≤8%.
- **Ad architecture (recommendations only, nothing changed).**
  - Every guide already carries one Topic Ad slot (GuideAdSlot, county tier $29). Topic Ads have no location targeting.
  - Local trades are sold as ZIP Report Ads. General Contractor is the closest existing trade.
  - Permit expediters, architects and code consultants are not trade categories. Attorneys and engineers are deliberately excluded.
  - Adding any of these is an owner decision, and so is any checkout change. My recommendation: no change until a pilot page shows readers.

## Stage 3 — Collier evidence (2026-11-17)

Full quotes are in `data/fact-ledgers/check-building-permits-collier-county-fl.json` (24 facts plus the portal walk). The normalized record is `docs/data/florida-permit-systems.json`.

**Leads re-verified at the county's own page:** CityView 2011–present, CDPlus 1989–2011, Property Appraiser before 1989. All three are confirmed word for word.

**Tested ourselves (CDPlus, county Government Center, 3299/3301 Tamiami Trl E):**
- Typing the street suffix returns 0 results; the bare name "TAMIAMI" works.
- At 3301 the 200-row cap stopped the list at 2004, although CDPlus runs to 2011.
- 2011 permits sit in CDPlus.
- Permit-number formats change by era. This was seen at one address only.
- Statuses: COED 148, VOID 31, SUSPEND 21. Bulletin 14 (amended 2023-08-02): SUSPEND = cancelled, closed (omitted from the web page's closed list); VOID = requires action; CDPlus CANCEL and EXPIRED need research.
- Permit 2011061518: reads as never inspected (expired 1/10/2012, no CO), but SUSPEND means it was closed. That is the example of a status misleading by its sound. Two screenshots were taken, with the contractor and contact rows cropped out.

**New statewide fact a buyer needs** (2026 Florida Statutes, from HB 803, ch. 2026-63, in force 2026-07-01):
- § 553.79(1)(g) exempts some single-family work under $7,500 from permits. The exemption needs a written request with the contract, and it doesn't apply in a flood hazard area or to electrical, plumbing, structural, mechanical or gas work.
- § 553.79(1)(c): single-family permits now expire after 1 year, or when the next edition of the building code takes effect, whichever is later.

**County lien search:** $25 per address, needs an account, and the county states it does **not** report open permits.

**First-party figure:** 81.9% of Collier homes were built before 2010, so their construction permit predates CityView. Source: Census ACS 2020–2024, B25034, via scripts/build-florida-permit-era-shares.ts. Sarasota is 84.8%, Manatee 77.6%, Brevard 89.1%.

**Blocked (recorded, not worked around):**
- Collier CityView (403, region), the Naples portal (Cloudflare country ban) and the Marco Island EnerGov portal (403).
- The Property Appraiser's terms gate needs owner OK.
- Bulletin 14 and the Everglades City agreement are PDF downloads that need owner OK.

**Consequence:** the current portal is untested. The draft says so plainly, and it describes CityView only in the county's words.

## Stage 4 — draft

`guides/check-building-permits-collier-county-fl.md` (≈1,990 words, 2 screenshots, a table built from our data, and a "How we checked this" section).
- Dry run of `scripts/publish-collier-county-permit-guide.ts`: all checks pass. Overlap with the 8 siblings is 0.9%–4.0%. Every number and quote traces to the ledger.
- `assert-article-quality.ts --draft`: exit 0.

## Stage 5 — review and scoring (self-review, honest)

| criterion | score /5 | note |
|---|---|---|
| Records accuracy | 4 | every claim quoted; status meanings deliberately not guessed |
| Original investigation | 4 | real CDPlus tests and a status example; current portal untested (blocked) |
| Buyer usefulness | 5 | era table, suffix trap, cap, exemption paper trail, lien-vs-permit gap |
| Unique vs top results | 4 | no county or generic page tests CDPlus or links HB 803 to reading a permit list |
| Completeness | 3 | CityView, city portals, the Property Appraiser Detail tab and Bulletin 14 unseen |
| Template risk | 5 | shape differs from Pinellas (4.0% overlap) |

**Methodology lesson for the other three counties:** expect current portals to geo-block. Test the legacy system plus the county's own instructions, and say what wasn't tested. Sarasota (AMANDA before 2023-08-18) has the same "legacy archive" shape, so the method transfers.

## Problems found in live pages (not fixed — need owner OK)

- **#351 (resolve-open-building-permits-before-closing, live 2026-11-12) is out of date on Florida.** Its comparison table says "When a permit lapses | Not set in § 553.79". The 2026 statute now sets it for single-family dwellings: § 553.79(1)(c), 1 year after issuance or the next code edition, whichever is later. The fix is one table cell plus the source line.

## Owner decisions needed

1. **Title.** Your proposed title is 65 characters (budget 60):
   - keep it word for word (add it to OWNER_LONG_TITLES; Google may cut "Records"); or
   - use "Collier County Permit Search: CityView, CDPlus & Pre-1989" (57 characters).
2. **Publish** the Collier draft as it stands? (FAQs, Permit Pulse block, build and IndexNow follow, as for Pinellas.)
3. **OK to accept the Property Appraiser's Terms of Use** to see a pre-1989 Detail tab on a public parcel?
4. **OK to download** Bulletin 14 (PDF, 165KB) and the Everglades City interlocal agreement (PDF, 560KB) from collier.gov?
5. **Fix #351's Florida cell?**
6. **Go ahead with Stage 6/7?** The hub is recommended only after the 3 remaining pilots (8 Florida county pages). Pace: about 2 counties a week.
