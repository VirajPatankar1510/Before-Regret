import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

// Same fail-closed pattern as adminAuth.ts: a missing DATABASE_URL must mean "the write path is
// unavailable," never a silent fallback or crash deep in a query. isDbConfigured() lets callers
// check before touching sql() at all.

// neon() below is always called with no options, so it always runs in its default mode
// (arrayMode: false, fullResults: false) -- rows come back as Record<string, any>[]. Typed
// explicitly as NeonQueryFunction<false, false> rather than ReturnType<typeof neon>, which
// widens both generics to their `boolean` constraint and makes every query's return type a
// three-way union including FullQueryResults (the fullResults: true shape, never actually used
// here). That union is why `(await sql\`...\`).length` doesn't typecheck at several call sites --
// FullQueryResults doesn't have a `.length`, even though it's never the type in this app.
let cachedSql: NeonQueryFunction<false, false> | null = null;
let schemaEnsured = false;

export interface Transaction {
  id: number;
  user_id: string;
  user_email: string;
  paypal_order_id: string;
  amount: string;
  currency: string;
  type: 'report' | 'vendor_subscription';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  property_address?: string;
  vendor_id?: string;
  paypal_capture_id?: string;
  payer_name?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function getSql() {
  if (!isDbConfigured()) {
    throw new Error('DATABASE_URL is not configured.');
  }
  if (!cachedSql) {
    cachedSql = neon(process.env.DATABASE_URL as string);
  }
  return cachedSql;
}

export async function ensureArticlesSchema(): Promise<void> {
  if (schemaEnsured) return;
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS articles (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      meta_description TEXT NOT NULL DEFAULT '',
      body_markdown TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      published_at TIMESTAMPTZ
    )
  `;
  await sql`ALTER TABLE articles ADD COLUMN IF NOT EXISTS quick_answer TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE articles ADD COLUMN IF NOT EXISTS sources_json TEXT NOT NULL DEFAULT '[]'`;
  // Array of {question, answer} pairs, same JSON-in-TEXT convention as sources_json. Rendered as a
  // visible accordion at the foot of the guide and merged into the page's FAQPage JSON-LD -- see
  // GuidePageView.tsx. Google deprecated the FAQ rich-result dropdown in May 2026 (even for the
  // narrow government/health-site allowlist it had left since August 2023), so this schema no
  // longer earns a SERP dropdown for anyone; it's kept because Google has said it still uses FAQ
  // structured data to understand a page, and because the visible accordion is real, useful
  // content in its own right, independent of what the schema does.
  await sql`ALTER TABLE articles ADD COLUMN IF NOT EXISTS faq_json TEXT NOT NULL DEFAULT '[]'`;
  // 'guide' (the default, evergreen content) or 'news' (a timely FEMA-declaration county-event
  // piece -- see countyEventsApi.ts). Drives which schema.org type the prerender step emits:
  // Article for a guide, NewsArticle for news. Evergreen guides stay Article deliberately --
  // NewsArticle is schema.org's type for actual news content, not "how to" reference material.
  await sql`ALTER TABLE articles ADD COLUMN IF NOT EXISTS article_type TEXT NOT NULL DEFAULT 'guide'`;
  // Set only for article_type = 'reference' rows (see defectReferenceApi.ts), to the
  // inspectionPriorities.ts rule id the page covers (e.g. 'knob_and_tube'). Lets the batch
  // generator skip a defect that already has a page instead of creating a duplicate on a re-run
  // -- a real need, not theoretical: the batch can genuinely fail partway through (a Gemini quota
  // limit hit after generating some but not all 8), and re-running it should resume, not duplicate.
  await sql`ALTER TABLE articles ADD COLUMN IF NOT EXISTS defect_rule_id TEXT`;
  // Set for both article_type = 'comparison' (the singleton report, see countyComparisonApi.ts)
  // and article_type = 'reference' (the 8-defect library, see defectReferenceApi.ts) rows, to how
  // many counties were ranked the last time that row was generated or updated. Lets each admin
  // panel button tell "coverage grew since this was last written" from "nothing's changed" without
  // re-running Gemini just to find out, and lets each update route refuse a no-op regeneration --
  // the mechanism that keeps a defect page from ever needing (or getting) a second, near-duplicate
  // copy once county coverage grows: the existing one gets refreshed in place instead.
  await sql`ALTER TABLE articles ADD COLUMN IF NOT EXISTS counties_ranked INTEGER`;
  // Which price band this guide's ad slot sells at -- 'standard' or 'geo'. See adPricing.ts for
  // why two bands exist at all (short version: a county-specific guide reaches a local audience a
  // local trade can actually serve, and was being sold at the same price as a national one).
  //
  // Defaults to 'standard' rather than being derived from the slug on read, so that a guide can be
  // marked local by hand when its slug doesn't name a county, and so that renaming a slug can
  // never silently change what a page costs. The initial values were set by
  // scripts/backfill-guide-ad-tiers.ts, which reports what it would change before changing it.
  await sql`ALTER TABLE articles ADD COLUMN IF NOT EXISTS ad_tier TEXT NOT NULL DEFAULT 'standard'`;

  await sql`
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_email TEXT NOT NULL,
      paypal_order_id TEXT UNIQUE NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      currency TEXT DEFAULT 'USD',
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      property_address TEXT,
      vendor_id TEXT,
      paypal_capture_id TEXT,
      payer_name TEXT,
      error_message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_transactions_paypal_order_id ON transactions(paypal_order_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status)`;

  // terms_acceptances: the canonical "who agreed to which revision of the Terms, and when" ledger
  // for CONSUMERS. The two ad checkouts record their own assent inline on the order row (see
  // guide_ad_orders/zip_ad_orders.terms_version), because there a purchase always exists to hang
  // it on. Consumers are different: the free report creates no order and no transaction row, so
  // there is no per-user record anywhere to attach assent to -- hence a dedicated table rather
  // than more columns somewhere.
  //
  // Why this exists at all: until it did, consumers never affirmatively agreed to anything. The
  // Terms were reachable only from a footer link, which is browsewrap -- the weakest form of
  // assent in US law, and routinely held insufficient to bind someone to terms they never saw.
  // That matters most for any provision the Terms rely on being enforceable, since such a
  // provision is only worth what you can prove the user accepted.
  //
  // UNIQUE on (clerk_user_id, terms_version) makes acceptance idempotent and, critically,
  // preserves the FIRST acceptance timestamp for a given revision -- re-accepting the same text
  // on a later visit must not overwrite the date you would actually rely on. A new TERMS_VERSION
  // (see src/data/legalVersions.ts) naturally produces a new row rather than mutating the old one,
  // so the history of what each user accepted stays intact across revisions.
  await sql`
    CREATE TABLE IF NOT EXISTS terms_acceptances (
      id SERIAL PRIMARY KEY,
      clerk_user_id TEXT NOT NULL,
      user_email TEXT,
      terms_version TEXT NOT NULL,
      context TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      accepted_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_terms_acceptances_user_version ON terms_acceptances(clerk_user_id, terms_version)`;

  // arbitration_opt_outs: the other half of the terms_acceptances ledger, and until now the
  // missing half.
  //
  // Terms 7.9 gives every user 30 days to reject the arbitration agreement by email, and that
  // right is published in six places (Terms 7.9, Disclaimer, Privacy Policy, Refund Policy, and
  // both acceptance controls). Nothing recorded it. terms_acceptances proved who agreed; no table
  // anywhere proved who declined, so the opt-out was a promise with no mechanism behind it.
  //
  // Two distinct problems that creates, both worth stating because they pull in opposite
  // directions. The first is evidential and runs against the company: a 30-day opt-out is a large
  // part of why a consumer arbitration clause survives an unconscionability challenge at all, and
  // an opt-out nobody can show was honoured argues against the very clause it exists to
  // legitimise. The second is operational and is worse: without a record you cannot tell whether
  // a given user opted out, so you could one day move to compel arbitration against someone who
  // validly declined. That is a filing you cannot take back.
  //
  // received_at vs recorded_at is the load-bearing distinction here and must not be collapsed.
  // The 30-day clock in 7.9 runs to the moment the USER SENT their email, not to whenever an
  // operator got round to transcribing it. Storing only an insertion timestamp would make every
  // late transcription look like a late opt-out, which is precisely backwards -- the delay would
  // be ours and the prejudice theirs. received_at is therefore supplied by the recorder from the
  // email itself and is NOT defaulted to now().
  //
  // clerk_user_id is nullable on purpose: the email may arrive from an address that resolves to
  // no account, or to an account created later. An opt-out is valid when sent, so it must be
  // recordable against the email alone. The unique index is on the email, not the user id, for
  // the same reason.
  await sql`
    CREATE TABLE IF NOT EXISTS arbitration_opt_outs (
      id SERIAL PRIMARY KEY,
      user_email TEXT NOT NULL,
      clerk_user_id TEXT,
      terms_version TEXT NOT NULL,
      received_at TIMESTAMPTZ NOT NULL,
      recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      recorded_by TEXT,
      raw_message TEXT,
      notes TEXT
    )
  `;
  // Idempotent per (email, revision): re-recording the same opt-out must not create a second row
  // or move received_at, on the same reasoning as terms_acceptances -- the first record is the one
  // that matters. Email is lowercased by the route before insert so the index is meaningful.
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_arbitration_opt_outs_email_version ON arbitration_opt_outs(user_email, terms_version)`;

  // serp_research_briefs: durable storage for the pre-generation competitive briefs produced by
  // /api/admin/articles/serp-research (see src/server/serpResearch.ts).
  //
  // Existed nowhere before this. A brief lived only in React state in the admin panel, so a page
  // refresh, switching to another article and back, or a dev-server reload destroyed it -- and a
  // brief is not cheap to replace. Grounded search runs on exactly one model on this project
  // (SEARCH_GROUNDING_MODELS in geminiModel.ts), and that model's free-tier cap is 20 requests a
  // day, so every lost brief costs 5% of a day's entire research capacity. Several were lost that
  // way in a single afternoon of testing.
  //
  // Keyed by the QUERY, not by article id, and deliberately so. The article a brief was fetched
  // for may be a throwaway draft that gets deleted, while the research itself stays valid -- it is
  // a description of what ranks for a search phrase, which has nothing to do with which draft row
  // happened to be open. Keying by query also makes the cache do double duty: researching the same
  // title again later, from any draft, costs nothing.
  //
  // additional_topic used to add its own second search and its own section to the brief, which is
  // why it was made part of the key rather than a detail hanging off it. That second search is now
  // DISCONNECTED (see the DISCONNECTED note atop buildSerpResearchPrompt in serpResearch.ts) --
  // articlesApi.ts's serp-research route always writes '' here now, so in practice every row's key
  // is just the query. The column and the composite key are left in place rather than migrated away,
  // since dropping them buys nothing and a schema change is not something to do as a side effect of
  // a quota investigation. Empty string, never NULL, so the unique index actually constrains the
  // common case (NULLs do not compare equal in a unique index, which would silently permit unlimited
  // duplicate rows otherwise).
  //
  // No TTL and no expiry sweep. Search results drift slowly and unevenly, and there is no honest
  // number of days after which a brief flips from good to bad -- so rather than invent one and
  // silently re-spend a scarce call when it elapses, fetched_at is returned to the client and shown
  // as the brief's age. Staleness becomes a judgement the writer makes with the date in front of
  // them, and re-running is always explicit and never automatic.
  await sql`
    CREATE TABLE IF NOT EXISTS serp_research_briefs (
      id SERIAL PRIMARY KEY,
      query TEXT NOT NULL,
      additional_topic TEXT NOT NULL DEFAULT '',
      brief TEXT NOT NULL,
      source_domains_json TEXT NOT NULL DEFAULT '[]',
      search_queries_json TEXT NOT NULL DEFAULT '[]',
      grounded BOOLEAN NOT NULL DEFAULT true,
      model TEXT NOT NULL DEFAULT '',
      fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_serp_research_briefs_query ON serp_research_briefs(query, additional_topic)`;

  // County research pages (see scripts/fetch-county-data.ts and src/server/countiesApi.ts).
  // data_complete is the enforcement point for the "no data, no page" rule: it's only ever set
  // true by the fetch script, and only when all four real data sources (EPA radon zone, Census
  // ACS housing age, FEMA National Risk Index, NOAA Storm Events) returned genuine data for that
  // county -- never a partial/best-effort record. The public read route in countiesApi.ts treats
  // data_complete = false exactly like a missing row (404), so an incomplete county is never
  // reachable by its URL, the same fail-closed posture as isDbConfigured() elsewhere in this file.
  await sql`
    CREATE TABLE IF NOT EXISTS county_data (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      county_name TEXT NOT NULL,
      state_name TEXT NOT NULL,
      state_abbrev TEXT NOT NULL,
      population INTEGER,
      radon_zone INTEGER,
      census_total_units INTEGER,
      census_year_built_json TEXT NOT NULL DEFAULT '{}',
      fema_risk_rating TEXT,
      fema_risk_score DOUBLE PRECISION,
      fema_hazards_json TEXT NOT NULL DEFAULT '{}',
      noaa_event_counts_json TEXT NOT NULL DEFAULT '{}',
      noaa_years_covered TEXT,
      data_complete BOOLEAN NOT NULL DEFAULT FALSE,
      fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  // Raw ACS B25141 "Homeowners Insurance Costs by Mortgage Status" bucket counts for mortgaged
  // households (see fetchCensusInsuranceCosts in countyDataFetcher.ts) -- feeds the county
  // insurance-cost comparison report (countyInsuranceComparisonGenerator.ts). Deliberately NOT part
  // of the data_complete gate above: that boolean already controls whether a county's own /county/
  // <slug>/ page exists at all, and this data has nothing to do with that page -- it only feeds a
  // separate singleton comparison report. Making it a hard requirement would mean one Census table
  // hiccup on one county could 404 an already-published, unrelated county page. Raw buckets, not a
  // precomputed percentage, for the same reason computeHousingAgeRankings() takes raw year-built
  // buckets rather than a precomputed age split: every displayed number should be re-derivable in
  // code from the actual Census counts, not trusted from an intermediate that could itself be wrong.
  await sql`ALTER TABLE county_data ADD COLUMN IF NOT EXISTS census_insurance_json TEXT NOT NULL DEFAULT '{}'`;
  // Per-county prose, written from that county's own hazard/era profile -- see
  // countyNarrativeGenerator.ts for the measurement that prompted it (two unrelated county pages
  // measured 79% identical, and Search Console reports every county page as "Discovered -
  // currently not indexed" while the hubs above them are indexed fine). Empty means the page still
  // renders exactly as it did before, so this rolls out county by county rather than all at once.
  await sql`ALTER TABLE county_data ADD COLUMN IF NOT EXISTS narrative_markdown TEXT NOT NULL DEFAULT ''`;
  // The reviewer-facing one-liner naming the angle taken. Kept alongside the prose specifically so
  // two counties that came back with the same story are spottable without reading both in full.
  await sql`ALTER TABLE county_data ADD COLUMN IF NOT EXISTS narrative_angle TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE county_data ADD COLUMN IF NOT EXISTS narrative_generated_at TIMESTAMPTZ`;

  // Gemini token/cost tracking (see src/server/geminiUsageTracker.ts). Persisted here rather than
  // kept in memory for the same reason property reports shouldn't be in-memory either: a
  // serverless instance can vanish or a request can land on a different one at any time, and a
  // cost counter that silently resets on that boundary would be misleading rather than merely
  // imprecise. estimated_cost_usd can be NULL -- deliberately, for a model with no verified
  // pricing entry, rather than a fabricated number.
  await sql`
    CREATE TABLE IF NOT EXISTS gemini_usage_log (
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      source TEXT NOT NULL,
      model TEXT NOT NULL,
      prompt_tokens INTEGER NOT NULL DEFAULT 0,
      output_tokens INTEGER NOT NULL DEFAULT 0,
      thinking_tokens INTEGER NOT NULL DEFAULT 0,
      total_tokens INTEGER NOT NULL DEFAULT 0,
      estimated_cost_usd DOUBLE PRECISION
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_gemini_usage_created_at ON gemini_usage_log(created_at)`;

  // Durable record of what a requester actually declared when a property report was generated
  // (see POST /api/property/generate-report in server.ts). Same rationale as gemini_usage_log
  // just above: reports themselves lived only in an in-process `reportsStore` Map, which a
  // serverless instance loses on every cold start or redeploy -- fine for serving the report back
  // during that session, not fine as the only record of what was submitted. declared_property_type
  // and declared_year_built are requester-self-reported and never independently verified (see
  // Terms 3.5-3.6 and Disclaimer section 6); this table exists so that claim is provable later --
  // if a report is disputed as "wrong" weeks after the fact, this is the evidence of what was
  // actually typed, not just whatever the disputing party now says they entered. clerk_user_id is
  // nullable: the generate-report endpoint captures it best-effort from an Authorization header
  // when the client sends one, but was never gated on having one, so it can't be required here
  // without breaking every historical and unauthenticated row.
  await sql`
    CREATE TABLE IF NOT EXISTS generated_reports (
      id SERIAL PRIMARY KEY,
      report_id TEXT UNIQUE NOT NULL,
      clerk_user_id TEXT,
      formatted_address TEXT NOT NULL,
      city TEXT,
      state TEXT,
      zip_code TEXT,
      county TEXT,
      declared_property_type TEXT,
      declared_year_built INTEGER,
      declared_unit_number TEXT,
      attested_accurate BOOLEAN NOT NULL DEFAULT FALSE,
      ip_address TEXT,
      user_agent TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_generated_reports_clerk_user_id ON generated_reports(clerk_user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_generated_reports_created_at ON generated_reports(created_at)`;
  // Free vs paid, and the price actually charged. Added because the table could not answer the one
  // question the business most needs from it: what share of people who take the free report ever
  // buy a second. Without this column every report looked identical here, so the free-to-paid
  // conversion rate -- the input any revenue projection is most sensitive to -- was unmeasurable,
  // and the transactions table can't substitute (it only has rows once PayPal is involved, so free
  // reports leave no trace there at all). price_usd is stored rather than derived from is_paid so a
  // future price change doesn't silently rewrite the history of what past buyers were charged.
  await sql`ALTER TABLE generated_reports ADD COLUMN IF NOT EXISTS is_paid BOOLEAN NOT NULL DEFAULT FALSE`;
  await sql`ALTER TABLE generated_reports ADD COLUMN IF NOT EXISTS price_usd NUMERIC(10,2)`;
  // The delivered report itself, as the client-projected JSON that was actually sent. Added
  // 2026-08-21 to fix a live defect: report bodies existed ONLY in an in-memory Map in server.ts,
  // which on Vercel dies with the serverless instance. GET /api/insights/:id then fell through to
  // generating a placeholder for "Subject Property, Austin, TX" and returning it as success:true --
  // so a reloaded or shared permalink served a fabricated report about a property nobody had
  // researched, under a heading reading "CONFIRMED FOR THIS ADDRESS". A paid $14.99 report was not
  // durably stored anywhere at all. This column is where a report actually lives now; the Map is
  // only a same-instance fast path in front of it.
  await sql`ALTER TABLE generated_reports ADD COLUMN IF NOT EXISTS report_json TEXT`;

  // Who the report permalink was emailed to, and when. See src/server/reportEmailService.ts.
  //
  // recipient_email is resolved from Clerk at generation time and STORED rather than looked up
  // again on demand, for one concrete reason: "re-send me my report" is the first support request
  // this feature will produce, and Clerk cannot answer it once the account's primary address has
  // changed or the account is gone. The address is the requester's own, captured for the
  // transactional purpose they asked for, and the same kind of data terms_acceptances.user_email
  // already holds -- this is not a new category of storage for this app.
  //
  // Both nullable, and a null in either is a real state rather than a gap: a signed-out requester
  // has no address to resolve, and a report generated while SMTP_PASSWORD is unset is never sent.
  // The web permalink is the delivery mechanism in both cases; email is an addition to it.
  await sql`ALTER TABLE generated_reports ADD COLUMN IF NOT EXISTS recipient_email TEXT`;
  await sql`ALTER TABLE generated_reports ADD COLUMN IF NOT EXISTS report_emailed_at TIMESTAMPTZ`;

  // Why a send failed, when one did. Added 2026-08-29 after a report showed recipient_email set
  // and report_emailed_at null -- which says only "it did not finish", and cannot distinguish an
  // SMTP rejection from a timeout from a killed function. The error was being logged to Vercel,
  // which is exactly where it is least reachable when someone asks "why didn't I get the email".
  //
  // Cleared on a successful send, so a non-null value always describes the LAST failure and never
  // a stale one from an earlier attempt.
  await sql`ALTER TABLE generated_reports ADD COLUMN IF NOT EXISTS report_email_error TEXT`;
  // How long the SMTP submission actually took, in milliseconds. Recorded because the first
  // successful send landed five minutes after the report row was created, which is far outside
  // what an SMTP handshake should cost and is the sort of thing that only looks like a problem
  // once it is measured rather than assumed.
  await sql`ALTER TABLE generated_reports ADD COLUMN IF NOT EXISTS report_email_ms INTEGER`;

  // Vendor ad slots on guide pages (see src/server/guideAdsApi.ts). Two tables, not one:
  // guide_ad_orders is the checkout attempt (one row per PayPal order, holding the pending slot
  // selection as JSON until captured); guide_ad_purchases is the actual sold inventory (one row
  // per slot actually paid for). Splitting them matters because a single order can buy many
  // slots at once (the vendor picks N guide pages in one checkout), and a slot can be resold
  // later once it expires -- (article_id, position) is deliberately NOT unique here, "who's
  // active right now" is always a live query (paid_through > now() AND active), never a status
  // flag that could drift stale.
  //
  // No auto-renewal by design: $7.99 buys a flat 30-day window (paid_through), full stop. No
  // recurring billing was built for a feature with zero proven vendor demand yet -- the existing
  // PayPal integration here only does one-time orders anyway, and true subscriptions are a
  // separate integration (PayPal Billing Plans + webhooks) not worth building before anyone's
  // paid for anything once.
  //
  // NOTE ON `tagline`: the four ad tables below each still carry a `tagline` column, but nothing
  // reads or writes it any more. It was a free-text line a vendor wrote about themselves that this
  // site then published verbatim on its own pages -- and in practice what vendors wrote were
  // licensure claims ("Licensed, insured, 20 years in the field") that BeforeRegret never verified
  // and had no way to stand behind. Publishing an unverified credential claim as site content is a
  // materially different exposure from a vendor privately warranting their own licensure under
  // Terms 4.4, so the field was removed from both checkouts, the post-purchase edit flow, and both
  // ad render components. The columns are deliberately left in place rather than dropped: dropping
  // them destroys the historical record of what was actually sold and displayed at the time.
  await sql`
    CREATE TABLE IF NOT EXISTS guide_ad_orders (
      id SERIAL PRIMARY KEY,
      paypal_order_id TEXT UNIQUE NOT NULL,
      business_name TEXT NOT NULL,
      trade_category TEXT NOT NULL,
      phone TEXT NOT NULL,
      website TEXT,
      tagline TEXT, -- RETIRED: no longer read or written (see note above); kept so existing rows aren't lost
      contact_email TEXT NOT NULL,
      slots_json TEXT NOT NULL,
      amount_usd NUMERIC(10,2) NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      paypal_capture_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS guide_ad_purchases (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES guide_ad_orders(id),
      article_id INTEGER NOT NULL,
      position TEXT NOT NULL,
      business_name TEXT NOT NULL,
      trade_category TEXT NOT NULL,
      phone TEXT NOT NULL,
      website TEXT,
      tagline TEXT, -- RETIRED: no longer read or written (see note above); kept so existing rows aren't lost
      paid_through TIMESTAMPTZ NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_guide_ad_purchases_slot ON guide_ad_purchases(article_id, position)`;

  // A vendor gets exactly one pass at correcting their own contact info post-purchase -- unlimited
  // self-edits would turn "phone/website" into an unreviewed second draft of what was
  // actually sold, drifting further from the identity a human approved at purchase time with every
  // edit. One edit covers the real case (a typo, a number that changed) without reopening that gap.
  await sql`ALTER TABLE guide_ad_purchases ADD COLUMN IF NOT EXISTS contact_edited BOOLEAN NOT NULL DEFAULT FALSE`;

  // What this specific placement was actually sold for, captured at purchase time. Renewals quote
  // from this column first and only fall back to the article's current tier price when it's absent
  // -- which is what makes a "founding rate, locked for a year" offer something the system honours
  // rather than something a person has to remember. Without it, every renewal would silently
  // re-price to whatever the tier costs today, and the first price rise would break the promise
  // for every early advertiser at once.
  //
  // Nullable because rows sold before this column existed genuinely have no recorded price;
  // defaulting them to today's number would invent a fact about a past transaction.
  await sql`ALTER TABLE guide_ad_purchases ADD COLUMN IF NOT EXISTS price_usd NUMERIC(10,2)`;

  // clerk_user_id: the stable identity the placement-manager dashboard (/my-ads) keys off of.
  // contact_email alone can't be trusted for that -- it's client-synthesized as
  // `user.email || \`${uid}@beforeregret.com\`` at checkout time (see GuideAdsCheckout.tsx /
  // VendorSignupForm.tsx), so two orders from the same vendor with different email states would
  // never join together. Nullable because it backfills nothing for orders placed before this
  // column existed; those just won't surface in the dashboard, same as any other pre-feature row.
  await sql`ALTER TABLE guide_ad_orders ADD COLUMN IF NOT EXISTS clerk_user_id TEXT`;
  await sql`CREATE INDEX IF NOT EXISTS idx_guide_ad_orders_clerk_user ON guide_ad_orders(clerk_user_id)`;

  // Set only on orders created through the dedicated /renew route (see guideAdsApi.ts) -- marks
  // "this order isn't claiming a new slot, it's extending a purchase the same vendor already
  // owns," so capture can skip the availability check entirely (there's nothing to contend for,
  // it's already theirs) and extend paid_through in place instead of inserting a new row.
  await sql`ALTER TABLE guide_ad_orders ADD COLUMN IF NOT EXISTS renews_purchase_id INTEGER REFERENCES guide_ad_purchases(id)`;

  // Clickwrap receipt for the checkout attestation. The checkbox itself was already required and
  // enforced server-side, but the answer was validated and thrown away -- so for any existing
  // order there is no way to show the vendor ever agreed to anything, which is exactly what a
  // disputed Terms 4.4 licensure warranty would turn on. These two columns record which revision
  // of the Terms was accepted (see src/data/legalVersions.ts) and when. Nullable by necessity:
  // orders placed before this existed genuinely have no recorded assent, and inventing a default
  // timestamp for them would fabricate a record rather than admit its absence.
  await sql`ALTER TABLE guide_ad_orders ADD COLUMN IF NOT EXISTS terms_version TEXT`;
  await sql`ALTER TABLE guide_ad_orders ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ`;

  // The per-slot breakdown behind amount_usd: [{articleId, tier, priceUsd}, ...] as JSON, same
  // JSON-in-TEXT convention as slots_json beside it. Written at checkout, read at capture.
  //
  // It exists so capture can stamp each purchase's price_usd with the number the vendor was
  // actually quoted, instead of re-deriving it from the article's tier minutes later. Those two
  // are the same figure today and would silently stop being the same the first time a tier price
  // changes while an order sits unpaid in a PayPal tab -- and the row that would end up wrong is
  // the one a renewal quotes from forever after. Nullable: orders placed before this column
  // existed have no breakdown, and capture falls back to the tier price for them.
  await sql`ALTER TABLE guide_ad_orders ADD COLUMN IF NOT EXISTS slot_prices_json TEXT`;

  // zip_ad_orders / zip_ad_purchases: same split as guide_ad_orders/guide_ad_purchases above and
  // for the same reason (order = checkout attempt, purchase = actually-sold inventory, "who's
  // active right now" is always a live query never a status flag). One selection per order here
  // (zip_code + trade_category), not a cart of many, because this product is inherently
  // one-ZIP-one-trade per vendor rather than "pick as many as you want" -- MAX_SLOTS_PER_ZIP_TRADE
  // (2) caps how many vendors can be active per (zip, trade) pair at once, enforced by checking
  // COUNT(*) of active, unexpired purchases rather than a unique constraint, since a slot reopens
  // automatically once paid_through passes with no renewal action needed.
  await sql`
    CREATE TABLE IF NOT EXISTS zip_ad_orders (
      id SERIAL PRIMARY KEY,
      paypal_order_id TEXT UNIQUE NOT NULL,
      business_name TEXT NOT NULL,
      trade_category TEXT NOT NULL,
      zip_code TEXT NOT NULL,
      phone TEXT NOT NULL,
      website TEXT,
      tagline TEXT, -- RETIRED: no longer read or written (see note above); kept so existing rows aren't lost
      contact_email TEXT NOT NULL,
      amount_usd NUMERIC(10,2) NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      paypal_capture_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS zip_ad_purchases (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES zip_ad_orders(id),
      zip_code TEXT NOT NULL,
      trade_category TEXT NOT NULL,
      business_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      website TEXT,
      tagline TEXT, -- RETIRED: no longer read or written (see note above); kept so existing rows aren't lost
      paid_through TIMESTAMPTZ NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_zip_ad_purchases_slot ON zip_ad_purchases(zip_code, trade_category)`;

  // Same stable-identity column and same reasoning as guide_ad_orders.clerk_user_id above.
  await sql`ALTER TABLE zip_ad_orders ADD COLUMN IF NOT EXISTS clerk_user_id TEXT`;
  await sql`CREATE INDEX IF NOT EXISTS idx_zip_ad_orders_clerk_user ON zip_ad_orders(clerk_user_id)`;

  // Clicks on a paying advertiser's phone number or website link. See adClicksApi.ts for the full
  // reasoning; the parts that constrain this schema:
  //
  //   click_day + visitor_hash + the unique index below are what make a "click" mean one
  //   interested person per day rather than one tap. Deduplication is enforced by the index at
  //   write time (ON CONFLICT DO NOTHING) instead of by a DISTINCT at read time, so the table
  //   cannot grow without bound from someone holding down a link, and so every reader of this
  //   table gets the same definition of a click without having to remember to apply it.
  //
  //   visitor_hash is a salted HMAC of the request IP, never the IP. Its only job is same-day
  //   deduplication. It is never selected back out, never joined to anything, and cannot identify
  //   a reader -- the salt is a server secret, so the digest can't be checked against a guessed
  //   address the way a bare hash of a 32-bit space could be.
  //
  //   There is deliberately no impressions table. Guide pages are prerendered and CDN-served, so
  //   this process never sees them being viewed -- the same limitation funnelApi.ts documents for
  //   sessions. Counting "views" here would mean inventing them.
  //
  // No foreign key to either purchases table: ad_kind selects which one a row belongs to, and a
  // column can't reference two parents. Orphaned rows are harmless (reads always filter by
  // ad_kind + purchase_id) and preferable to losing a placement's click history the moment a row
  // is cleaned up.
  await sql`
    CREATE TABLE IF NOT EXISTS vendor_ad_clicks (
      id BIGSERIAL PRIMARY KEY,
      ad_kind TEXT NOT NULL,
      purchase_id INTEGER NOT NULL,
      target TEXT NOT NULL,
      click_day DATE NOT NULL,
      visitor_hash TEXT NOT NULL,
      clicked_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_vendor_ad_clicks_unique
    ON vendor_ad_clicks(ad_kind, purchase_id, target, click_day, visitor_hash)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_vendor_ad_clicks_lookup
    ON vendor_ad_clicks(ad_kind, purchase_id, click_day)
  `;

  // Advertiser-supplied licence / registration / certification number, added to all four ad tables
  // at once so an order and the purchase it becomes carry the same value. See
  // requiresLicenceNumber() in src/data/sponsoredVendors.ts for which trade categories must supply
  // one and why the publisher (not just the advertiser) has an interest in collecting it.
  //
  // Nullable rather than NOT NULL, for two reasons that are both about not lying: existing rows
  // predate the field and there is no honest value to backfill them with, and the one exempt
  // category legitimately has nothing to put here. Enforcement therefore lives at the checkout
  // routes, which reject a missing number for a category that requires one, rather than in the
  // column constraint -- the same division as the rest of this schema, where the DB stores what
  // happened and the route decides what is allowed to happen.
  //
  // This is stored and displayed EXACTLY as the vendor typed it and is never validated against any
  // state licensing board -- no such integration exists here, and every surface that prints it says
  // so. That honesty is the point: an unverified number presented as verified would be a worse
  // position than collecting nothing at all.
  await sql`ALTER TABLE zip_ad_orders ADD COLUMN IF NOT EXISTS licence_number TEXT`;
  await sql`ALTER TABLE zip_ad_purchases ADD COLUMN IF NOT EXISTS licence_number TEXT`;
  await sql`ALTER TABLE guide_ad_orders ADD COLUMN IF NOT EXISTS licence_number TEXT`;
  await sql`ALTER TABLE guide_ad_purchases ADD COLUMN IF NOT EXISTS licence_number TEXT`;

  // Superseded by renews_order_id below -- a bundle renewal extends every purchase under one
  // order, not a single purchase row, so "which purchase does this renew" stopped being the right
  // question the moment one order could cover more than one ZIP. Column kept, never dropped, so
  // any historical row that used it stays readable.
  await sql`ALTER TABLE zip_ad_orders ADD COLUMN IF NOT EXISTS renews_purchase_id INTEGER REFERENCES zip_ad_purchases(id)`;

  // Same one-edit-ever rule and reasoning as guide_ad_purchases.contact_edited above.
  await sql`ALTER TABLE zip_ad_purchases ADD COLUMN IF NOT EXISTS contact_edited BOOLEAN NOT NULL DEFAULT FALSE`;

  // --- 3-ZIP bundle + booking-style hold, added when the product changed from 1 ZIP per $29
  // purchase to 3. zip_code/trade_category above stay as-is (trade_category is still one value --
  // a bundle is one trade across 3 ZIPs, not 3 independent trades -- and zip_code is populated
  // with the first of the three for any code that still only reads the singular column); the
  // real, authoritative list of what an order actually covers is zip_codes_json.
  //
  // hold_expires_at is the ticket-booking-app pattern: the instant a vendor's checkout passes the
  // availability check, this same zip_ad_orders row -- while still status='pending' -- IS the
  // reservation, for hold_expires_at's duration (see HOLD_DURATION_MINUTES in zipAdsApi.ts).
  // Every availability check (the public slots endpoint, a new checkout's own availability check,
  // and the atomic claim at checkout time) counts a live hold exactly like a real purchase, so a
  // second vendor can never start paying for a ZIP someone else is already mid-checkout on. A
  // hold that lapses (payment abandoned, or simply never finished) just stops counting -- nothing
  // deletes the row, same as this codebase never cleans up any other failed/abandoned order.
  await sql`ALTER TABLE zip_ad_orders ADD COLUMN IF NOT EXISTS zip_codes_json TEXT NOT NULL DEFAULT '[]'`;
  await sql`ALTER TABLE zip_ad_orders ADD COLUMN IF NOT EXISTS hold_expires_at TIMESTAMPTZ`;
  // The bundle-aware replacement for renews_purchase_id above -- points at the original order
  // being renewed (whose zip_codes_json lists every ZIP in the bundle), not one purchase row, so
  // a single renewal payment extends all of them together, matching how the bundle was sold and
  // priced as one $29 unit rather than three.
  await sql`ALTER TABLE zip_ad_orders ADD COLUMN IF NOT EXISTS renews_order_id INTEGER REFERENCES zip_ad_orders(id)`;

  // Clickwrap receipt -- same reasoning as guide_ad_orders.terms_version above.
  await sql`ALTER TABLE zip_ad_orders ADD COLUMN IF NOT EXISTS terms_version TEXT`;
  await sql`ALTER TABLE zip_ad_orders ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ`;

  // Dedup ledger for the FEMA-declaration county-event drafter (see
  // src/server/femaDeclarationsService.ts / countyEventGenerator.ts). OpenFEMA has no "give me
  // only what's new" cursor -- every check re-fetches a wide recent window, so this table is what
  // actually stops the same declaration+county pair from being redrafted on every cron run.
  await sql`
    CREATE TABLE IF NOT EXISTS fema_declaration_events (
      id SERIAL PRIMARY KEY,
      disaster_number INTEGER NOT NULL,
      county_slug TEXT NOT NULL,
      fema_declaration_string TEXT NOT NULL DEFAULT '',
      declaration_title TEXT NOT NULL DEFAULT '',
      article_id INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(disaster_number, county_slug)
    )
  `;

  // Admission-control counters for /api/property/generate-report's Gemini call (see
  // src/server/reportGenerationLimiter.ts). This is deliberately a *pre-call* gate, separate from
  // gemini_usage_log above: gemini_usage_log records real token/cost data *after* a call succeeds,
  // which is the wrong tool for capping spend before it happens. Before this existed, that route
  // had zero server-side limit of any kind -- the "one free report" rule was enforced only in the
  // browser (localStorage), so a direct POST to the endpoint, from any number of IPs, could fire
  // Gemini calls indefinitely with no ceiling on cost.
  //
  // Two independent counters, not one: a global daily cap bounds total worst-case spend
  // regardless of how many IPs are involved (the actual dollar-figure guarantee); a per-IP daily
  // cap stops a single caller from single-handedly exhausting that whole day's budget and denying
  // every real visitor the AI-enhanced report for the rest of the day. Both are checked and
  // incremented with a single `INSERT ... ON CONFLICT DO UPDATE ... WHERE count < cap` statement
  // (see reportGenerationLimiter.ts) -- one atomic round-trip per counter, so concurrent requests
  // on Vercel's separate serverless instances can't race past the cap the way a plain
  // SELECT-then-INSERT (or any in-memory counter, which wouldn't even be shared across instances)
  // would allow.
  await sql`
    CREATE TABLE IF NOT EXISTS report_generation_daily_cap (
      usage_date DATE PRIMARY KEY,
      call_count INTEGER NOT NULL DEFAULT 0
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS report_generation_ip_daily_cap (
      ip_address TEXT NOT NULL,
      usage_date DATE NOT NULL,
      call_count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (ip_address, usage_date)
    )
  `;

  // A FIFO backlog of exact-title questions to write about, so the admin can paste a whole batch
  // (from keyword research, reader questions, whatever) once instead of maintaining a separate
  // spreadsheet and copy-pasting one title at a time into the "Exact title" field. See
  // questionQueueApi.ts. id is the queue order -- oldest (lowest id) is always "next".
  await sql`
    CREATE TABLE IF NOT EXISTS question_queue (
      id SERIAL PRIMARY KEY,
      question_text TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  // Reader-reported inaccuracies, from the report page and from guide articles.
  //
  // This table exists because the feature that collects these did not have one. The error-reporting
  // modal on property reports had a submit handler whose entire body was setSubmitted(true) -- no
  // fetch, no endpoint, no storage -- while telling the reader "our data research team will
  // cross-verify ... and respond within 1-2 business days" and printing a ticket ID built from
  // Date.now(). Every correction anyone had ever submitted went nowhere, and the promise of a reply
  // could not be kept by anyone. That is the same category as the fabricated Austin report and the
  // overbroad legal claims: a statement about what happens that is not true.
  //
  // source_type distinguishes a report ('report') from a guide ('guide'); source_ref holds the
  // report id or the guide slug. Kept as one table rather than two because the triage question is
  // identical either way -- "did we get something wrong, and where."
  await sql`
    CREATE TABLE IF NOT EXISTS content_reports (
      id SERIAL PRIMARY KEY,
      source_type TEXT NOT NULL,
      source_ref TEXT NOT NULL,
      source_label TEXT,
      topic TEXT NOT NULL,
      description TEXT NOT NULL,
      reporter_email TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      ip_address TEXT,
      user_agent TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      resolved_at TIMESTAMPTZ,
      resolution_note TEXT
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status, created_at DESC)`;

  // Which URLs have already been sent to Bing's SubmitUrlBatch, so a later run continues from
  // where the last one stopped instead of resending the same first N.
  //
  // Needed because the submit script had no memory: it took the first N URLs of a deterministic
  // list every time, so a second run with --limit 50 would have re-sent 50 URLs already submitted
  // the day before and never reached the ~163 still waiting. An offset flag would have worked
  // until the next article shifted the ordering (guides sort by published_at, counties by
  // population), which is exactly the kind of silent drift that wastes a capped monthly quota
  // without anyone noticing.
  await sql`
    CREATE TABLE IF NOT EXISTS bing_url_submissions (
      url TEXT PRIMARY KEY,
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  // Passive record of which AI crawlers actually fetch this site -- see aiCrawlerLog.ts for the
  // user-agent matching this is fed from. The question "does an AI answer engine cite us" has no
  // real answer until the prerequisite question is answered first: "does its crawler even come
  // here." Search Console reports nothing about AI Overviews, AI Mode, or any answer-engine
  // citation -- this table is the only visibility this app has into that at all. bot_name is the
  // canonical name resolved from the user-agent (GPTBot, ClaudeBot, PerplexityBot, etc.), not the
  // raw header, so a report can group by bot without re-parsing every row's user_agent.
  await sql`
    CREATE TABLE IF NOT EXISTS ai_crawler_visits (
      id SERIAL PRIMARY KEY,
      visited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      bot_name TEXT NOT NULL,
      path TEXT NOT NULL,
      user_agent TEXT NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_ai_crawler_visits_visited_at ON ai_crawler_visits(visited_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_ai_crawler_visits_bot_name ON ai_crawler_visits(bot_name)`;

  schemaEnsured = true;
}

export async function withDb<T>(fn: (sql: NeonQueryFunction<false, false>) => Promise<T>): Promise<T> {
  await ensureArticlesSchema();
  return fn(getSql());
}

export interface GeneratedReportInput {
  reportId: string;
  clerkUserId: string | null;
  formattedAddress: string;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  county: string | null;
  declaredPropertyType: string | null;
  declaredYearBuilt: number | null;
  declaredUnitNumber: string | null;
  attestedAccurate: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  isPaid: boolean;
  priceUsd: number | null;
  /** The client-projected report as delivered. Serving a permalink depends on this being here. */
  reportJson: string | null;
}

// Fire-and-forget from the caller's perspective (see server.ts) -- a failed write here must never
// block report delivery, the same "log the fact, don't gate on it" posture as gemini_usage_log.
// ON CONFLICT DO NOTHING rather than erroring: the fallback-report code path in server.ts can call
// this after already having called it once for the same reportId in rare retry scenarios, and the
// first write is the one worth keeping (closer to the moment of submission).
export async function saveGeneratedReportInputs(data: GeneratedReportInput): Promise<void> {
  await withDb(async (sql) => {
    await sql`
      INSERT INTO generated_reports (
        report_id, clerk_user_id, formatted_address, city, state, zip_code, county,
        declared_property_type, declared_year_built, declared_unit_number, attested_accurate,
        ip_address, user_agent, is_paid, price_usd, report_json
      ) VALUES (
        ${data.reportId}, ${data.clerkUserId}, ${data.formattedAddress}, ${data.city}, ${data.state},
        ${data.zipCode}, ${data.county}, ${data.declaredPropertyType}, ${data.declaredYearBuilt},
        ${data.declaredUnitNumber}, ${data.attestedAccurate}, ${data.ipAddress}, ${data.userAgent},
        ${data.isPaid}, ${data.priceUsd}, ${data.reportJson}
      )
      -- DO NOTHING on the row as a whole, but still fill report_json if the existing row has none.
      -- The retry path this guard was written for calls this once WITHOUT a body (the audit write,
      -- which happens before generation finishes) and once WITH it, and a plain DO NOTHING would
      -- discard the body and leave the permalink permanently unservable.
      ON CONFLICT (report_id) DO UPDATE
        SET report_json = COALESCE(generated_reports.report_json, EXCLUDED.report_json)
    `;
  });
}

/**
 * The durable copy of a delivered report, for GET /api/insights/:id.
 *
 * Returns null when the id is unknown OR when the row exists but predates report_json (every
 * report generated before 2026-08-21). Null must mean "show the reader nothing" at the call site
 * -- never "invent something to show them," which is the exact defect this was written to end.
 */
export async function getGeneratedReportBody(reportId: string): Promise<any | null> {
  return withDb(async (sql) => {
    const rows = await sql`
      SELECT report_json FROM generated_reports WHERE report_id = ${reportId} LIMIT 1
    `;
    const raw = (rows as any[])[0]?.report_json;
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (err) {
      // A row whose JSON won't parse is corrupt, not absent. Same outcome for the reader either
      // way, but say so in the log rather than silently reporting "not found".
      console.error(`[insights] report_json for ${reportId} failed to parse:`, err);
      return null;
    }
  });
}

// The Privacy Policy commits to deleting report request records after three years ("Report request
// records" in section 7). That sentence is only true if something actually enforces it -- an
// unenforced retention promise is the same category of misstatement as having no disclosure at all,
// just harder to notice. This is that enforcement. Deliberately a single set-based DELETE rather
// than a batched loop: the table gains at most one row per generated report, so the daily delete
// volume is tiny and there is no long-running-transaction concern to design around.
export const REPORT_REQUEST_RETENTION_YEARS = 3;

export async function purgeExpiredReportRequestRecords(): Promise<number> {
  return withDb(async (sql) => {
    const rows = await sql`
      DELETE FROM generated_reports
      WHERE created_at < now() - ${`${REPORT_REQUEST_RETENTION_YEARS} years`}::interval
      RETURNING id
    `;
    return rows.length;
  });
}

// report_generation_ip_daily_cap is keyed (ip_address, usage_date) and is only ever READ for
// CURRENT_DATE -- see checkAndReserveReportGenerationCapacity in reportGenerationLimiter.ts. Every
// row for a past date is therefore dead weight that still happens to be an IP address, i.e.
// personal data held for no operating purpose. Found by the data map: it had no purge, no stated
// retention period, and no privacy-policy paragraph covering it, so in practice the answer to "how
// long do you keep visitor IPs" was "forever, by omission." That is the weakest possible position
// to be in -- indefinite retention nobody chose and nobody disclosed.
//
// 30 days rather than 1: the mechanism only needs today, but a short window is what makes "this
// IP has hit the cap every day this week" answerable, which is the abuse-investigation purpose the
// Privacy Policy already claims. Bounded, stated, and enforced beats unbounded and silent.
export const IP_RATE_LIMIT_RETENTION_DAYS = 30;

export async function purgeExpiredIpRateLimitRecords(): Promise<number> {
  return withDb(async (sql) => {
    const rows = await sql`
      DELETE FROM report_generation_ip_daily_cap
      WHERE usage_date < CURRENT_DATE - ${IP_RATE_LIMIT_RETENTION_DAYS}::integer
      RETURNING ip_address
    `;
    return rows.length;
  });
}

export async function createTransaction(data: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Promise<Transaction> {
  return withDb(async (sql) => {
    const result = await sql`
      INSERT INTO transactions (
        user_id,
        user_email,
        paypal_order_id,
        amount,
        currency,
        type,
        status,
        property_address,
        vendor_id,
        paypal_capture_id,
        payer_name,
        error_message
      ) VALUES (
        ${data.user_id},
        ${data.user_email},
        ${data.paypal_order_id},
        ${data.amount},
        ${data.currency || 'USD'},
        ${data.type},
        ${data.status || 'pending'},
        ${data.property_address || null},
        ${data.vendor_id || null},
        ${data.paypal_capture_id || null},
        ${data.payer_name || null},
        ${data.error_message || null}
      )
      RETURNING *
    `;
    return result[0] as Transaction;
  });
}

export async function updateTransaction(
  paypalOrderId: string,
  updates: Partial<Omit<Transaction, 'id' | 'created_at' | 'paypal_order_id'>>
): Promise<Transaction | null> {
  return withDb(async (sql) => {
    let result;

    if (updates.status !== undefined) {
      result = await sql`UPDATE transactions SET status = ${updates.status}, updated_at = now() WHERE paypal_order_id = ${paypalOrderId} RETURNING *`;
      return result[0] as Transaction | undefined || null;
    }

    if (updates.paypal_capture_id !== undefined) {
      result = await sql`UPDATE transactions SET paypal_capture_id = ${updates.paypal_capture_id}, updated_at = now() WHERE paypal_order_id = ${paypalOrderId} RETURNING *`;
      return result[0] as Transaction | undefined || null;
    }

    if (updates.payer_name !== undefined) {
      result = await sql`UPDATE transactions SET payer_name = ${updates.payer_name}, updated_at = now() WHERE paypal_order_id = ${paypalOrderId} RETURNING *`;
      return result[0] as Transaction | undefined || null;
    }

    if (updates.error_message !== undefined) {
      result = await sql`UPDATE transactions SET error_message = ${updates.error_message}, updated_at = now() WHERE paypal_order_id = ${paypalOrderId} RETURNING *`;
      return result[0] as Transaction | undefined || null;
    }

    return null;
  });
}

export async function getTransaction(paypalOrderId: string): Promise<Transaction | null> {
  return withDb(async (sql) => {
    const result = await sql`SELECT * FROM transactions WHERE paypal_order_id = ${paypalOrderId}`;
    return result[0] as Transaction | undefined || null;
  });
}

export async function getTransactionsByUser(userId: string): Promise<Transaction[]> {
  return withDb(async (sql) => {
    const result = await sql`SELECT * FROM transactions WHERE user_id = ${userId} ORDER BY created_at DESC`;
    return result as Transaction[];
  });
}
