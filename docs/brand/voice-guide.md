# Before Regret voice guide

Owner-approved direction, 2026-11-18. Applies to everything new we write, and to existing pages only as listed under "Where it applies".

**Internal positioning:** the no-nonsense, generous homebuyer research brand.

**The promise:** buying a house is complicated enough. We're not going to make you pay just to understand what you're buying.

**Who's talking:** the knowledgeable American neighbor who has done the homework, knows how houses work, and is happy to share all of it for free. This is a tone of voice, not a character. We never invent a narrator, a name, a hometown or a backstory. We write as "we", the team that actually did the checking.

> "Buying a house? A few things I'd check before handing over that money. Let me show you."

Not corporate. Not a bank. Not a law firm. Not a real-estate salesperson.

## Five traits

| Trait | What it means in practice |
|---|---|
| **Plainspoken** | Talk like you're explaining it to a neighbor over the fence. Short sentences. Everyday words. |
| **Knowledgeable** | Know the subject cold, and don't show off. Real numbers, real code sections, real portal names. |
| **Generous** | Give away the useful part. Never hold back the answer to make someone click, sign up or pay. |
| **Protective** | Help buyers avoid expensive surprises without frightening them. Curiosity and reassurance, never fear. |
| **Independent** | We tell you what's worth checking and why. When you need a pro, we say so plainly. We are not against contractors, inspectors or agents. Many of them read us, link to us and advertise with us. |

A little cheeky is fine. Never intimidating.

## Three levels of voice

| Level | Where | Sounds like |
|---|---|---|
| **1. Friendly and conversational** | Homepage, tools, the report, buttons, Instagram | "Let's check that before you buy." "Here's where to find the records." "Not sure what that means? We'll walk you through it." |
| **2. Practical and knowledgeable** | Guides and inspection advice | "The permit search came up empty? Don't jump to conclusions. Older records may be stored somewhere else." |
| **3. Precise and professional** | Legal, insurance, safety, methodology, disclaimers | "Underwriting varies by carrier and state. Get written confirmation from the insurer before relying on coverage." |

Conversational language must never turn into sloppy technical advice. When levels collide on one page, the precise level wins for the precise sentence.

## Before and after

| Before | After |
|---|---|
| Get Your Free Property Report | Get the free report. No sign-up required. |
| Records to pull yourself | Here's where the records are. We checked the links ourselves. |
| Buyers should verify historical building permit records with the relevant municipal authority. | That new kitchen looks great. Did anyone pull a permit? We'll show you where to look and what to ask the seller. |
| No permit found online doesn't prove the work was unpermitted. | No permit online? Doesn't mean they skipped it. Records here only go back to 1997. Ask the seller for the paperwork. |
| Outstanding permits may require further investigation before the transaction closes. | Found an open permit? Don't ignore it. It doesn't automatically mean something's wrong, but find out what's outstanding and who needs to sort it out before you close. |

## Rules that keep the voice honest

1. **Titles use the searcher's words.** The voice goes in headings inside the page, product screens and buttons. The `<title>` and H1 of a guide use what people actually type. (Searcher wording moved the EIFS guide from position 41 to 16.)
2. **Not every heading is a question.** Mix questions with plain statements. All-question headings read as machine-written.
3. **Every factual claim needs evidence, and the evidence must trace to the original source.** A fact ledger or our engine is where evidence is recorded, not the evidence itself.
   - Government or third-party facts: source URL and the date we checked it.
   - Our calculations: the underlying data, the method and the date.
   - Portal discoveries: the actual test, its date, and a screenshot where it shows no personal data.
   - Technical guidance: reliable supporting sources.
   - Estimates, including the engine's cost ranges: say what they're based on and their limits.

   Never make an unsupported statement more acceptable by writing it casually. (Known gap, 2026-11-18: most cost ranges in `src/engine/inspectionPriorities.ts` don't record their source. They need an audit before the voice leans on them harder.)
4. **Free means free.** Never put an advertised free report, guide or tool behind an unexpected payment or mandatory registration. Say "No sign-up required" wherever that is true. Don't imply that every future service will be account-free. Don't say "no catch": we carry sponsored placements, and being free and open about how we're paid is the stronger message.
5. **No comparisons we haven't checked.** Don't say competitors charge for reports, or name prices, unless we've verified them.
6. **Ads are disclosed as they are today:** paid placements are marked Sponsored. Never describe listings or features we don't have. Find a Pro was removed on 2026-11-15.
7. **Never confuse property data with property condition.** We may show information returned for a specific address, parcel, census tract or area, and we must say what that data actually represents. Never imply a house has aluminum wiring, a failing sewer line, unpermitted work or structural damage unless that condition has actually been established. Label which of these each statement is:
   - information returned for the address (e.g. the geocoded address, the tract's Census profile);
   - neighborhood or county-level context;
   - general construction-era risks (our engine; year built is the buyer's answer, labelled as such);
   - what the seller says;
   - physical conditions that are still unverified.

   This keeps the owner's 2026-10 rule intact: the report never implies house-specific findings.
8. **American English:** neighbor, color, center.
9. **No fear.** "The house looks great. Now let's check what's behind the walls" is fine. "This could cost you everything" is not.

## The generosity test

Before publishing anything (a guide, a tool screen, a report section, an ad or a button), ask:

> Have we given the reader the useful answer, or are we making them work harder so they'll click something else?

| Fails | Passes |
|---|---|
| There are several important things to know about checking building permits. Read our guide to discover them. | Start by finding the building department for the property. In some counties that means checking whether the address is inside city limits. Here's how to find the right office. |

Give away the useful information. The next click should add value, never reveal an answer we held back from the current page.

## Avoid

- Slang overload, fake Southern or regional expressions ("y'all", "ain't", "folks", "howdy").
- "Hey, buddy!" openers.
- Jokes at contractors', inspectors' or agents' expense; anti-realtor messaging.
- Anything implying we are a licensed inspector, contractor, lawyer or insurer.
- The AI tells listed in the answer-ready-writing skill ("delve", "it's important to note", "navigate the…", "peace of mind" and the rest).

A buyer in Boston, Phoenix, Miami or rural Tennessee should all feel spoken to, not performed at. Natural American English, with the occasional memorable phrase.

## Where it applies

| Surface | Apply the voice? |
|---|---|
| Homepage, free report, research tool, buttons and calls to action | Yes, after owner approval of each draft |
| Instagram and other social | Yes |
| New guides from 2026-11-18 | Yes (Level 2, with Level 3 for legal and insurance sentences) |
| Existing guides that rank | **No wholesale voice rewrite** by default. Opening-line changes only, one page at a time, with the owner's OK. Never change URLs or slugs. Title and meta description changes stay allowed through the separate, evidence-based CTR process (Search Console data, owner approval); the title is also the page's H1, so flag that every time. |
| The homepage H1 and the definitional paragraph under it | Unchanged unless the owner decides otherwise. The paragraph is what AI answers quote for "what is Before Regret". |

## Measuring it

Compare report-button clicks per page (`scripts/cta-click-report.ts`) before and after each surface changes, and tool completion once the research tool is live.
