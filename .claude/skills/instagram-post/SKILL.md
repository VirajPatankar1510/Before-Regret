---
name: instagram-post
description: Turn BeforeRegret's guides, research and diagrams into Instagram posts that a US homebuyer would actually send to their spouse -- human consequence first, fact second, every number traced back to a real source before it is written. Use whenever the user wants an Instagram post, reel, carousel, caption, hook, hashtags, image prompt, content calendar or series idea for @beforeregret.official, asks what to post, asks how to grow the account, or wants an article or research study turned into social content. Also use before posting anything to the account, including reusing an existing diagram or research chart. Do NOT use for LinkedIn posts, for writing guide articles (use write-guide), or for FAQs (use article-faqs).
---

# Instagram for Before Regret

## The mission

Grow qualified US organic reach by making a homebuyer think:

> "Wait. I never thought about that."

Not a real-estate company. **The account people follow because it tells them what they wish someone had told them before they bought the house.**

Optimise for: **qualified attention → saves → shares → profile visits → website visits.** Never for follower count.

## Where the account actually is

`@beforeregret.official` — **10.7K followers, zero posts** (as of 2026-09-20). Display name "Before Regret", website field points at beforeregret.com, linked to the Facebook page through Meta, and claimed in `sameAs` in `index.html`.

That cold-start shapes the first month of work. An empty grid under a five-figure follower count reads as bought or abandoned, which is worse than no profile — so **early posts exist to make the account look real**, not to go viral. Ship a coherent first nine before optimising anything.

---

## Step 1 — Ground the post in a real source. Never skip.

**Every factual claim must be traceable before you write the hook, not after.** This is the same rule the rest of the project runs on: never invent statistics, costs, percentages, dates, study findings, insurance rules, code requirements, state laws, or "experts say" claims.

Pull the source first:

**Guide articles** live in Neon, not in the repo:

```
SELECT slug, title, quick_answer, body_markdown FROM articles WHERE slug = '<slug>' AND status='published'
```

**Research numbers** live in verified figure files — use these rather than reading a number off the rendered page:

```
docs/data/permit-pulse-figures.json        docs/data/risk-without-price-figures.json
docs/data/storm-and-premium-figures.json   docs/data/raise-or-remove-figures.json
docs/data/flood-outside-zone.json          docs/data/county-premiums.json
docs/data/dams-high-hazard.json            docs/data/flood-takeup.json
```

**Existing visuals**, already rendered and free to reuse — 11 diagrams in `public/images/*.webp`, 12 research charts in `public/research/data/*.png`. On a profile with no posts these are the fastest honest content available.

If a number is not in a source: **do not use it.** If jurisdiction matters, say the jurisdiction. If the outcome depends on the insurer, inspector, contractor, code or condition, say so.

---

## Step 2 — Pick the angle

Classify the source material. One primary angle per post:

| | angle | the promise |
|---|---|---|
| 1 | MONEY | "This could cost you." |
| 2 | SURPRISE | "You probably didn't know this." |
| 3 | REGRET | "You wish you'd checked this earlier." |
| 4 | SHOWING BLIND SPOT | "You won't notice this during a normal tour." |
| 5 | INSURANCE | "This can affect whether the house is insured." |
| 6 | INSPECTION | "Your inspector needs to look at this." |
| 7 | SELLER QUESTION | "Ask the seller this before you sign." |
| 8 | OLD HOUSE | "Older homes have a hidden pattern buyers miss." |
| 9 | LOCATION | "Where the house sits changes the risk." |
| 10 | DATA | "The national number hides what's happening underneath." |
| 11 | BUYER PSYCHOLOGY | "Here's why buyers miss this." |
| 12 | DECISION | "Would this change your decision to buy?" |

Prefer angles that create an immediate mental image or a personal scenario.

---

## Step 3 — Lead with the consequence, not the fact

**This is the core principle. Recognition before education.**

| weak | strong |
|---|---|
| "Polybutylene pipes were used extensively between the 1970s and 1990s." | "That gray pipe under the sink could make your new house harder to insure." |
| "Cast iron sewer pipes can corrode internally." | "The house can look perfect upstairs while the sewer line is quietly failing underground." |
| "Some flood claims occur outside high-risk flood zones." | "Your house can be outside the high-risk flood zone and still have a flood claim." |

The first sentence must make a normal American homeowner care. The fact comes second.

### The two tests

**1.** Would a normal US homebuyer send this to their spouse, friend, parent, sibling or realtor?

**2.** Would someone *not* currently house hunting still understand why it's interesting?

A no on either means find a stronger human angle before writing anything else.

---

## Step 4 — Choose the format from the idea

### Format A — Reel
Strong hook, visual transformation, actable scenario, or the subject benefits from motion.

```
0–2s    HOOK
2–6s    PROBLEM / SURPRISE
6–15s   EXPLANATION
15–25s  WHAT TO DO
end     ONE CTA
```

Never open with "Hey guys", "Did you know", or "Today we're talking about". **Start inside the problem.**

### Format B — Carousel
Three to seven useful points, a checklist, a comparison, or something worth saving.

```
1  A strong human hook          5  What to look for
2  Why this matters             6  What to ask
3  What most buyers miss        7  What to do before offering
4  The actual explanation       →  Save/share CTA
```

Slide 1 is never a generic title.

### Format C — Single image
Only when the visual carries the idea by itself — a strange pipe under a sink, a suspicious outlet, a water line beside the foundation, a basement stain, an attic detail, a buyer noticing something. Don't build a single-image infographic unless the point genuinely can't be shown.

---

## Step 5 — Make the image look real

The audience must not think *"AI-generated real-estate graphic."*

**Avoid:** glossy AI houses, impossible architecture, luxury interiors, heavy symmetry, fake HDR, cinematic listing photography, surreal lighting, floating objects, excessive depth of field, untouched rooms, stock-photo families, text-heavy graphics, exaggerated danger imagery, red arrows, fake warning signs.

**Prefer:** ordinary American homes, modest kitchens, unfinished basements, garages, utility rooms, crawlspaces, attics, electrical panels, driveways, realistic clutter, normal furniture, slightly imperfect surfaces, natural daylight, phone-camera realism, documentary and inspection-style photography.

**The house should feel lived in. Perfect is suspicious.**

Every image prompt specifies all ten: subject, location, camera position, lens/phone feel, lighting, material realism, human imperfection, composition, social format, negative constraints.

Default style line:

> Natural documentary photograph taken by a real person, realistic American residential environment, believable materials, ordinary lived-in home, natural available light, subtle imperfections, authentic phone-camera or documentary photography, no commercial real-estate staging.

Never default to "ultra realistic 8K cinematic masterpiece". **Believable, not impressive.**

### The human visual rule

Technical defect → **show the defect.** Not a worried family looking at a house.

Buyer decision → **show the moment of discovery**: crouching under a sink, a hand on an old pipe, a flashlight in a crawlspace, a camera at a sewer cleanout, someone reading a disclosure.

The visual should tell the story without the caption.

---

## Step 6 — Write the hook

Generate five internally. Select the strongest. Show all five in the output.

- **Regret** — "You can love the house and still regret buying it."
- **Blind spot** — "Most buyers never look here during a showing."
- **Money** — "This tiny thing can turn into a $10,000 problem." *(only with a sourced figure)*
- **Contradiction** — "The house passed the inspection. That doesn't mean this was checked."
- **Question** — "Would you buy a house if you knew this was underneath it?"
- **Scenario** — "You've seen the kitchen. You love the backyard. You're ready to make an offer." → then the reveal.
- **Data** — "Nationally, permits were basically flat. That isn't what happened in hundreds of counties."

---

## Step 7 — Caption

```
HOOK

1–3 short paragraphs explaining the surprising point.

WHAT TO DO:
One to three concrete actions.

Optional question or CTA.
```

**Voice:** American English. An extremely knowledgeable friend, a sharp consumer journalist, someone who has seen the mistake before.

**Not:** a realtor chasing leads, a corporate marketing department, an SEO article, an AI assistant, a motivational speaker, a fear-mongering influencer.

Contractions. Short sentences. Specific nouns. Concrete situations. **Zero emojis by default, two maximum.**

**One CTA, and only when it follows from the post:**

> "Would you have noticed this?" · "Send this to someone house hunting." · "Save this for your next showing." · "Would this change your decision?" · "Ask your inspector about this."

Never a generic motivational ending. Never "Save this for later!" unless it genuinely deserves saving. Never "Follow for more tips!" — give a reason instead: *"Follow if you're buying a house and want the stuff the listing won't tell you."*

---

## Do not manufacture fear

Never inflate the consequence past what the source supports:

| source says | never becomes |
|---|---|
| can increase risk | will destroy your house |
| may affect insurance | your insurer will reject you |
| worth investigating | this house is dangerous |

Before Regret is not a "your house is killing you" account. The brand works because it's **accurate and early**, not because it's alarming.

---

## Research posts

Original research is the account's biggest asset. When working from a study:

1. Find the surprising finding.
2. Find the human implication.
3. Find the visual story.
4. Strip methodology out of the hook.
5. Put methodology in the caption or the last slides.
6. **Preserve the exact denominator and population.**
7. Never turn correlation into causation.
8. Never turn a cohort finding into property-level certainty.

The reaction should be *"I want to see the numbers"* — not *"here's another infographic."*

---

## US cultural grounding

Use real situations: open houses, weekend showings, making an offer, the inspection period, closing, HOA, basements, crawlspaces, garages, attics, sump pumps, driveways, sewer lines, homeowners insurance, property taxes, older subdivisions.

**Don't assume everyone lives in a suburban detached house.** Include condos, townhomes, urban, rural, older and new construction, and different regions. No stereotypes about American households.

**Regional sources:** put the location in the hook — *"Buying an older house in Texas? Look at this before you offer."* Never imply a local fact applies nationally.

---

## Hashtags

**Exactly 5.** One broad category, one homebuyer intent, one specific problem, one homeowner intent, one niche discovery term.

Never `#viral #fyp #explore #trending #reels #love`. Never the same five twice. They must describe the actual content.

Work searchable language naturally into the first caption line, on-screen text or carousel headline — "home inspection", "first-time homebuyer", "buying an older home", "polybutylene pipes". **Never keyword-stuff.**

---

## Series

Recurring, recognisable formats beat one-offs:

**20-Minute Showing** · **Would You Buy This?** · **The Listing Didn't Tell You** · **Before You Sign** · **What Your Inspector Is Looking For** · **Older House, Different Problem** · **Ask the Seller** · **Looks Fine. Isn't Fine.** · **The $___ Detail** *(sourced numbers only)* · **The Data Behind the House**

A strong topic becomes a loop, never duplicated wording: the problem → how to spot it → what it costs → what to ask → what the professional checks → a real example.

## Engagement

**Good:** "Would this change your offer?" · "What year was your house built?" · "Did your inspector check this?" · "Would you pay to fix this or walk away?"

**Bad:** "Comment YES." · "Tag 3 friends." · "Like if you agree." · "Follow for part 2."

---

## Output format

```
## POST STRATEGY
Content angle:
Audience:
Emotional trigger:
Format:
Source (slug / figure file / asset path):
Why this should resonate:

## HOOK OPTIONS
1. … 5.
Selected hook:

## FINAL CAPTION

## HASHTAGS  (exactly 5)

## IMAGE GENERATION PROMPT

## IMAGE NEGATIVE PROMPT

## ON-SCREEN TEXT

## CTA  (one)
```

---

## Final gate

- [ ] A normal US homeowner understands it immediately
- [ ] There's a human problem, not just information
- [ ] The first line stops the scroll
- [ ] Every claim is supported, every number verified against a source named above
- [ ] Jurisdiction stated where it matters
- [ ] Useful **without** visiting the site
- [ ] Sounds like Before Regret
- [ ] The image reads as a real photograph, not generic AI
- [ ] Exactly 5 relevant hashtags
- [ ] Exactly one CTA, and it's natural
- [ ] There's a reason to save or share
- [ ] Distinct from generic real-estate influencer content

Several no's → return **"DO NOT POST — insufficient social hook."** and say what's missing. Do not publish it anyway.
