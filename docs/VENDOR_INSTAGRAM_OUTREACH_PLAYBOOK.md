# Vendor Instagram Outreach Playbook

Related: [`docs/`](.) architecture notes, [`src/emails/vendorOutreachTemplates.ts`](../src/emails/vendorOutreachTemplates.ts) (the email equivalent of this, Phase 3).

This is a **manual workflow, not a tool**, and that's a deliberate choice, not a gap to fill in
later. Meta's terms prohibit automated or bulk DM outreach to strangers and actively detect it —
scripting this (via their API or via browser automation) risks the account being banned outright,
which defeats the channel entirely. Automating the *mechanics* of outbound contact is what Phase 3
(email) is for; Instagram's value here is specifically that it's warm and personal, which is not a
thing code can do on your behalf. This doc is the checklist a person follows.

## Which trades, and why only these three

Of the 8 trade categories that actually have a placement in the report today (see
`FINDING_TRADE_CATEGORY` / `PRIORITY_TRADE_CATEGORY` in
[`src/data/sponsoredVendors.ts`](../src/data/sponsoredVendors.ts)), only a handful are genuinely
Instagram-native businesses that post their own work:

- **Roof Inspection** — before/after job photos are close to universal in this trade
- **Electrician** — panel upgrades and code-violation fixes are commonly posted
- **HVAC Inspection** — install/replacement photos, less universal than roofing but common enough

The other five eligible trades (Sewer Scope, Radon Testing, Foundation Engineer, Home Inspector,
Insurance Agent) are not naturally visual, social-first businesses — use email (Phase 3) for those
instead of forcing an Instagram angle that won't land.

Same exclusion as Phase 3 applies here too: **do not** reach out to Real Estate Attorney or Moving
Company prospects on any channel yet. Neither has a placement anywhere in the report, so a signed-up
vendor in either category would pay and never actually appear.

## The workflow

1. **Find accounts.** Search a location tag or hashtag for the target city/ZIP + trade (e.g. a
   location tag for Austin, TX plus a search like "austin roofing" or "atx electrician").
2. **Qualify the account.** It should clearly be a real, independent local business — not a
   national franchise's corporate account, and not dormant (posted within roughly the last 60
   days). Skip anything you can't tell is a real operator.
3. **Engage before messaging.** Like one or two recent posts, and follow if it feels natural. Do
   not skip this step — a cold DM from an account with zero prior engagement reads as spam or a bot
   immediately, and gets ignored or reported at a much higher rate than a warm one.
4. **Wait before sending.** Hours, not seconds, between the engagement and the DM.
5. **Send a personalized message.** Use a template below as a starting point, not a script —
   reference something specific and real about their account (a recent job photo, their location,
   their specialty), not a generic line with the business name swapped in.
6. **Log the outcome.** See Tracking below.

## DM templates

Instagram DMs read as spam fast when they're long or formal — keep these short, casual, and edit
the bracketed part before every single send. Never send one of these unedited.

**Roof Inspection**
> Hey! Saw your [recent roof job / before-after post] — nice work. I run BeforeRegret, a site
> homebuyers use to check permit history and flood zone before closing on a house. We put one local
> roofer's contact info right next to the roof-permit finding on every report for a ZIP code — $29/mo,
> only 2 spots per ZIP. Want me to send details?

**Electrician**
> Hey! Saw the [panel upgrade / job] you posted — that's a clean install. I run BeforeRegret, a
> property research site for homebuyers. We show one local electrician's info right next to the
> electrical panel finding on every report for a ZIP — $29/mo, 2 spots max per ZIP, first come
> first served. Want the details?

**HVAC Inspection**
> Hey! Saw your [install/replacement] post — solid work. I run BeforeRegret, a site homebuyers use
> during their option period to check a house's systems before closing. We put one local HVAC
> company's info right next to the HVAC finding on every report for a ZIP — $29/mo, only 2 spots per
> ZIP. Interested?

If they reply with interest, move the conversation to email or straight to
`beforeregret.com/vendors` to actually sign up — Instagram DMs are the warm intro, not where the
transaction happens.

## Tracking

This is low-volume and manual by design, so it doesn't need a database. Two honest options,
pick whichever is less friction:

- Keep a running note (a plain text file, a notes app, whatever) of who you've contacted, when, and
  the outcome.
- Once someone actually replies with interest, add them to
  [`src/data/vendorProspects.ts`](../src/data/vendorProspects.ts) with a note like `"sourced via
  Instagram DM"` — that file already exists for exactly this purpose and feeds the same signup
  flow regardless of which channel a lead came from.

Don't build tooling for this before you have evidence the channel converts at all.

## What not to do

- Don't use any bot, browser-automation script, or third-party "Instagram growth" tool to send
  these at scale. That's precisely the behavior Meta detects and bans for, and it defeats the one
  advantage this channel has over email: that it's actually from a person.
- Don't send the same templated message to a batch of accounts in one sitting. Space it out, vary
  the wording, and only send to accounts you've actually looked at.
- Don't DM an account you're not confident is a real, currently-operating local business.
- Don't quote a number of BeforeRegret users, report volume, or "results" in a DM — there's no
  verified traffic data to back a claim like that yet (same reason the email templates in Phase 3
  don't make one either).
