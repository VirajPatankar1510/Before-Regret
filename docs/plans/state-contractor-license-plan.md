# The 50-state contractor-license set: full plan

**Owner decisions, 2026-11-13:**
- All 50 states, each published as soon as it's ready (changed later the same day from "all at once").
- No thin pages and no duplicated content.
- Each page under 60% shared with any other, and better if it's entirely unique.
- Plain, human language: no AI tone, no jargon.
- Plan first, so nothing gets invented and the work doesn't drift.

How this plan fits with the other files:
- **This plan** is the why and the what.
- **The skill** `.claude/skills/state-license-guides/SKILL.md` is the step-by-step how.
- **The tracker** `docs/plans/state-contractor-license-pages.md` records where each state stands.
- **The checker** `scripts/check-state-license-set.ts` enforces the rules.

If any of them disagree, this plan wins and the others get fixed.

---

## 1. What the pages are for

A buyer or homeowner is about to hire someone for work on a house. They want to know:
1. where to check the person's license in their state;
2. what the record tells them;
3. whether the job even needs a licensed contractor;
4. what protection they have if it goes wrong.

Contractors read these pages too, because the lookup shows them what their customers see.

Every page answers those questions for one state, from that state's own laws and its own lookup. A page that only
gives a link isn't worth publishing. The value is in what the state's sources say, put plainly and checked.

## 2. What we know before starting (from our own data, 2026-11-13)

- **Search interest exists unevenly.**
  - Bing shows signal for about 10-11 states: CA, FL, AZ, OR, TX, NC, GA, UT, TN, VA, NM, WA.
  - For the rest it shows none. That's unknown, not zero.
  - Several large states (NY, IL, OH, MI, NJ) don't issue a statewide contractor license, so people there search for
    something else, such as "home improvement contractor registration" or a city license. Each of those pages has to
    use the words people in that state actually use.
- **New pages start small.** Our county guides restored in October got 17-56 Google impressions per page after
  5 weeks. Expect the same order here.
- **Some state sites block automated access.**
  - Seven of the 30 tested showed a security check: AZ, NC, UT, FL, HI, RI, GA.
  - The owner supplies screenshots or PDFs of those from a normal browser. Arizona's homepage is already in.
- **California is live** as #350. Its check is on 15 December.

## 3. The phases

### Phase 1: the survey (all 50 states, one row each)

Before writing any page, fill one row per state with verified facts only:
- which body or bodies license residential work, using the state's own names;
- what kind of system the state has (see the five types below);
- the official lookup URL, opened on the survey date, or BLOCKED;
- the licensing statute section.

The five types:
- **A:** a statewide license for general or residential contractors.
- **B:** statewide licenses only for some trades (electrical, plumbing, HVAC), not for general contractors.
- **C:** a home-improvement registration rather than a license.
- **D:** licensing left to cities and counties.
- **E:** a mix of the above.

This survey becomes the hub table, so it's useful on its own. The type decides each page's starting point, which is
the first defence against fifty pages that look alike.

**Done when:** all 50 rows are filled or marked BLOCKED, and the owner has the list of blocked states that need
screenshots.

### Phase 2: deep research, one state at a time

For each state:
1. **Demand.** Run `topic-demand.ts` for the state's real search words: "contractor license lookup", or
   "home improvement contractor registration", or "[city] contractor license", whichever the state's type suggests.
   Record its related searches. They decide which extra topics the page covers.
2. **Portal walk.** In the browser, or from the owner's screenshots for blocked states:
   - every search option;
   - one record from a large business, never an individual;
   - what the record shows and what it leaves out;
   - quirks.

   Take one screenshot with no names in it.
3. **The law.** Quote the licensing statute and every topic the related searches call for, into the state's ledger.
4. **Distinctive facts.** List what this state does that others in the survey don't. Look for:
   - a thresholds, such as no license needed under a dollar amount;
   - a recovery fund;
   - a separate registration;
   - a city that licenses instead of the state;
   - an unusual record field;
   - a disciplinary-history window.

   The page will open with the strongest of these.
5. **Count.** At least 12 verified state-specific facts. 10 is the hard floor. If it's short, research more topics
   from the bank in §5, chosen by that state's related searches, until it isn't. No page is dropped, and none is
   padded with general advice.

### Phase 3: writing, in groups of about 5 states

1. Draft each page from its ledger only. Nothing on the page that isn't in the ledger, except connecting sentences
   that state no facts.
2. Run the checker across every draft written so far (§6).
3. Rewrite whatever it flags. Never loosen the checker to pass a page.
4. Mark the tracker REVIEW.

### Phase 4: owner review, page by page

As soon as a page passes the checker, the owner gets:
- a one-line summary;
- its overlap figure;
- whether it needed extra topics;
- anything cut or blocked.

Ready pages can be sent together if several finish the same day. Nothing publishes before the owner says "publish".

### Phase 5: publish each page when it's ready

- Each page goes live on its own once it's ready (owner decision, 2026-11-13). The set builds up over weeks; it is
  never one burst.
- **The hub** publishes once the Phase 1 survey rows are verified. It grows as state pages go live, each row linking
  to its state page.
- Each page gets FAQs written only from its own content, with state-specific questions.
- After each deploy: verify the page live, submit it to IndexNow, and confirm it's in the sitemap.
- Each page gets its own read date, 5 weeks after it goes live.

### Phase 6: measure, then keep it true

- **Five weeks after each page goes live:** is it indexed and shown (Google and Bing), fetched by AI crawlers, and
  clicked? Report the numbers plainly. Also give a running total across the set.
- **Every six months:** re-verify every state. Boards change URLs and dollar thresholds.

## 4. How every page stays different

Overlap is measured after replacing each page's own state name with a placeholder, so swapping names can't hide
copying. The checker fails a page at 40% or more of its three-word phrases shared with any other page (the owner's
60% rule). It warns at 15% or more (the target for "close to entirely unique").

What keeps pages apart, by design:
1. **A different opening for every page**, built on that state's most distinctive fact (§3, Phase 2, step 4).
2. **Headings written from the content,** never from a list. A heading may not appear on more than 10 pages, and
   generic headings ("Overview", "Conclusion", "What You Need to Know") are banned outright.
3. **Different sections per state type.**
   - Type A pages go deep on the record and the classifications.
   - Type B pages explain which trades are licensed and where general work falls.
   - Type C pages explain what a registration does and doesn't prove.
   - Type D pages walk through two or three city or county systems.
4. **No reusable sentences.** Any sentence of 8 or more words found on another state page fails. Explanations that
   would be the same everywhere aren't written fifty times. They go on the hub once, and each state page links there.
5. **The state's own words.** Quote the board's or statute's phrasing where it's short and telling. That text is
   unique by nature.

## 5. The topic bank (for extra depth, chosen by each state's related searches)

Only from the state's own sources, quoted in the ledger:

- the dollar or job-size threshold below which no license is needed, and its conditions;
- what happens if the contractor is unlicensed: can they sue for payment, can you recover what you paid;
- a homeowner recovery or guaranty fund: who can claim, the cap, how;
- home-improvement contract rules: required terms, down-payment limits, cancellation rights;
- required bond or insurance amounts, and who the bond protects;
- trade licenses (electrical, plumbing, HVAC) and their separate lookups;
- city or county licensing where the state doesn't license, for the largest cities;
- how to file a complaint, and with whom;
- owner-builder permits: can a homeowner pull their own;
- the statewide building code edition, and whether cities can change it;
- mechanic's lien notices a homeowner may receive;
- home inspector licensing and its lookup, if the related searches show buyers check inspectors too;
- the state consumer-protection office, if it handles contractor disputes separately.

## 6. What the checker enforces (fails stop the work)

- Pairwise overlap: fail at 40% or more, warn at 15% or more.
- Any sentence of 8+ words shared with another state page.
- Any heading on more than 10 pages, or any banned generic heading.
- Every number on the page appears in that state's ledger.
- Every quotation of 12+ characters appears in a ledger quote.
- Fewer than 10 state-specific facts in the ledger.
- The official lookup is missing from the first paragraph, or a URL wasn't opened on the read date.
- No state law cited by number.
- No "How we checked this" section.
- The wrong topic bucket.
- **AI tone:** the site's draft gate (`assertHumanDraft`), plus the list in §7. Any hit fails.

## 7. Voice: how the pages should sound

The reader is a homeowner about to hire someone, not a lawyer. Write the way a careful friend who read the rules
would explain them across a table.

- **Short, plain sentences, with the odd longer one.** Say "you" and "the contractor". Say "we" only for what we
  actually did ("we searched the board's lookup on 14 November").
- **Name things the way the state does**, then explain them once in plain words: "a 'qualifying party' (the person
  whose experience the license rests on)".
- **Give a view when the facts support one:** "check the number on the contract, not the name". Say what we don't
  know once, plainly. Don't hedge every sentence.
- **No fear and no sales tone.** Calm and practical.
- **Banned words and phrases (the checker fails on them):**
  - navigate, comprehensive, ensure, seamless, robust, leverage, empower, crucial, vital, pivotal, essential to,
    delve, dive into, unlock, landscape, realm, embark, tailored, streamline, in today's, it's important to note,
    it's worth noting, in summary, in conclusion, whether you're, look no further, peace of mind, plays a key role,
    a variety of, furthermore, moreover, when it comes to, rest assured, game-changer, hassle-free;
  - rhetorical questions as headings;
  - lists of exactly three adjectives;
  - closing lines that sum up the page.
- **Read every page aloud before review.** If a sentence sounds like a brochure, rewrite it.

## 8. Rules about facts (never bent)

- Primary sources only: the state's statutes, the board's own pages, the lookup itself. No blogs, directories,
  lead-generation sites, or memory.
- Every fact is quoted in the ledger with its URL and read date before it is written.
- Blocked sites are never worked around. They wait for the owner's screenshots, and the page says the portal walk
  came from them, with the date.
- No business or person from a record is named. Bond and insurance companies are never named. Screenshots are
  cropped.
- California (#350) keeps its slug and content. It counts toward the 50, and its overlap is checked too.

## 9. Risks, said once

- **Publishing as pages become ready** spreads the set over weeks, which avoids the one-day burst that came before the
  September 2026 cut. Watch the first pages' indexing. If the early pages aren't being indexed 5 weeks in, I report it
  before many more go live, and propose (never do) folding the weakest into the hub.
- **States with no search signal** may stay small however good they are. That's a bet the owner chose.
- **Workload:** at least an hour of research per state, about 50+ hours in all, spread across many sessions. The
  tracker carries the state of the work between sessions.

## 10. Order of work

1. The Phase 1 survey of all 50, which also becomes the hub table. The owner gets the blocked list early.
2. Deep research and writing, by group:
   - **Group 1:** reachable states with search signal (OR, WA, TX, TN, VA, NM). Starting here lets us check the
     process against states with real demand.
   - **Groups 2-8:** the remaining reachable states.
   - **Last:** the blocked states, as the owner's files arrive.
3. Each page: review, publish, then measure 5 weeks later. The hub goes live after Phase 1.
