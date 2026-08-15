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
  await sql`
    CREATE TABLE IF NOT EXISTS guide_ad_orders (
      id SERIAL PRIMARY KEY,
      paypal_order_id TEXT UNIQUE NOT NULL,
      business_name TEXT NOT NULL,
      trade_category TEXT NOT NULL,
      phone TEXT NOT NULL,
      website TEXT,
      tagline TEXT,
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
      tagline TEXT,
      paid_through TIMESTAMPTZ NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_guide_ad_purchases_slot ON guide_ad_purchases(article_id, position)`;

  // clerk_user_id: the stable identity the placement-manager dashboard (/my-ads) keys off of.
  // contact_email alone can't be trusted for that -- it's client-synthesized as
  // `user.email || \`${uid}@beforeregret.com\`` at checkout time (see GuideAdsCheckout.tsx /
  // VendorSignupForm.tsx), so two orders from the same vendor with different email states would
  // never join together. Nullable because it backfills nothing for orders placed before this
  // column existed; those just won't surface in the dashboard, same as any other pre-feature row.
  await sql`ALTER TABLE guide_ad_orders ADD COLUMN IF NOT EXISTS clerk_user_id TEXT`;
  await sql`CREATE INDEX IF NOT EXISTS idx_guide_ad_orders_clerk_user ON guide_ad_orders(clerk_user_id)`;

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
      tagline TEXT,
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
      tagline TEXT,
      paid_through TIMESTAMPTZ NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_zip_ad_purchases_slot ON zip_ad_purchases(zip_code, trade_category)`;

  // Same stable-identity column and same reasoning as guide_ad_orders.clerk_user_id above.
  await sql`ALTER TABLE zip_ad_orders ADD COLUMN IF NOT EXISTS clerk_user_id TEXT`;
  await sql`CREATE INDEX IF NOT EXISTS idx_zip_ad_orders_clerk_user ON zip_ad_orders(clerk_user_id)`;

  // backlink_leads: candidate forum threads (City-Data, Bogleheads, etc.) found by manually
  // running a search-based scan from the admin page -- see src/server/backlinksApi.ts. Deliberately
  // just a queue, not a live scanner: the forums that are actually reachable (unlike Reddit, which
  // blocks both search indexing and direct navigation outright) still block automated page-fetching,
  // so a human reads the real thread and either pastes it in for a drafted reply or writes one
  // directly -- draft_answer is never auto-posted anywhere, only stored for the admin to copy.
  await sql`
    CREATE TABLE IF NOT EXISTS backlink_leads (
      id SERIAL PRIMARY KEY,
      source TEXT NOT NULL,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      topic_snippet TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'new',
      draft_answer TEXT NOT NULL DEFAULT '',
      county_slug TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_backlink_leads_status ON backlink_leads(status)`;

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

  schemaEnsured = true;
}

export async function withDb<T>(fn: (sql: NeonQueryFunction<false, false>) => Promise<T>): Promise<T> {
  await ensureArticlesSchema();
  return fn(getSql());
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
