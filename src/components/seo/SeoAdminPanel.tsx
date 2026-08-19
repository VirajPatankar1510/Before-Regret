import React, { useEffect, useState } from 'react';
import {
  Plus, Loader2, FileText, Globe, Clock, ArrowLeft, Send, Undo2, Trash2, AlertCircle, Sparkles,
  Link2, Lock, MessageCircleQuestion, Gauge, ChevronDown, ChevronUp, CloudLightning, BarChart3,
  Library, ShieldCheck, CheckCircle2, Search, Copy, Check
} from 'lucide-react';
import { KNOWN_SOURCES } from '../../data/knownSources';
import { extractCitedSourceCodes, findAdversarialCounterpartyFraming } from '../../server/articleGenerator';
import { NEWS_TOPIC_PRESETS, type NewsTopicPreset } from '../../data/newsTopicPresets';
import { STOPWORDS } from '../../utils/relatedGuides';
import { buildPageTitle, TITLE_SUFFIX_MAX_LENGTH } from '../../utils/pageTitle';
// Type-only -- contentAudit.ts's runtime code pulls in withDb/neon (server-only), so importing
// anything but the type here would try to bundle the database driver into the client. The check
// itself only ever runs server-side, hit via GET /api/admin/content-audit.
import type { AuditReport } from '../../server/contentAudit';

// Grouped once at module load, not per-render -- NEWS_TOPIC_PRESETS is a static import, so this
// never needs to recompute. Preserves the data file's own category order (the order categories
// first appear in), not alphabetical, so "Market & affordability" leads the way it's written.
const newsTopicCategories: Array<[string, NewsTopicPreset[]]> = (() => {
  const map = new Map<string, NewsTopicPreset[]>();
  for (const preset of NEWS_TOPIC_PRESETS) {
    const list = map.get(preset.category);
    if (list) list.push(preset);
    else map.set(preset.category, [preset]);
  }
  return Array.from(map.entries());
})();

interface SeoAdminPanelProps {
  onNavigate: (path: string) => void;
}

interface FaqItem {
  question: string;
  answer: string;
}

interface Article {
  id: number;
  slug: string;
  title: string;
  metaDescription: string;
  bodyMarkdown: string;
  quickAnswer: string;
  sources: string[];
  faqItems: FaqItem[];
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

// Shape returned by GET /api/admin/gemini-usage (see src/server/articlesApi.ts). costUsd is
// null, not 0, whenever GEMINI_MODEL has no verified pricing entry in geminiUsageTracker.ts --
// the UI renders that as "cost unknown" rather than a fabricated "$0.00".
// Shape covers both sources the server may return (see keywordResearchApi.ts): Bing's
// GetRelatedKeywords (query, impressions, broadImpressions) or Search Console's per-query
// breakdown (query, impressions, clicks, ctr, position) -- clicks/ctr/position only ever come
// from the latter, broadImpressions only from the former, so both are optional here.
interface KeywordRow {
  query: string;
  impressions: number;
  clicks?: number;
  ctr?: number;
  position?: number;
  broadImpressions?: number;
  /** Which upstream surfaced this -- see src/server/keywordResearchApi.ts. */
  source?: 'search-console' | 'autocomplete' | 'bing';
  /** True when the phrasing is question-shaped, i.e. a direct FAQ candidate. */
  isQuestion?: boolean;
}

// Shape returned by GET /api/admin/news-coverage (see src/server/newsCoverageApi.ts).
interface NewsCoverageItem {
  title: string;
  url: string;
  domain: string;
  seenAt: string;
  source: 'gdelt' | 'google-news';
}

interface GeminiUsageSummary {
  today: { tokens: number; costUsd: number | null; calls: number };
  month: { tokens: number; costUsd: number | null };
  allTime: { tokens: number; costUsd: number | null; calls: number };
  // Two separate model tiers now, not one -- see geminiModel.ts. reportModel is reserved for the
  // free property report; contentModels is the cascading chain every other Gemini call uses.
  reportModel: string;
  contentModels: string[];
  // Models that can actually run a grounded Google Search request -- a much shorter list than
  // contentModels, because most of that cascade can't, and rejects a grounded request with a 429
  // that is indistinguishable from quota exhaustion. Optional so an older cached response (or a
  // server not yet redeployed) renders without it rather than throwing.
  groundingModels?: string[];
  // Per-model "calls used today" against the free tier's 20/day cap, in priority order (report's
  // own model first) -- see DAILY_FREE_TIER_LIMIT_PER_MODEL in geminiModel.ts for the caveat that
  // this is computed from this app's own logged calls, not read back from a live quota API.
  quotaByModel: Array<{ model: string; callsToday: number; remaining: number; dailyLimit: number }>;
  publishedArticleCount: number;
  recent: Array<{ created_at: string; source: string; model: string; total_tokens: number; estimated_cost_usd: number | null }>;
}

// A title that clearly overlaps with an existing article is flagged the moment it's typed, before
// Generate is ever clicked -- not a semantic/embedding comparison, just weighted shared
// significant words. The server-side duplicate guard (existing titles fed into the Gemini prompt,
// see src/server/articleGenerator.ts) is what actually steers what gets written; this is just an
// instant heads-up (and, below, a hard block on wasting a real Gemini call) in the UI.
//
// Deliberately NOT the shared titleSimilarity() from relatedGuides.ts (used elsewhere for
// "Related Guides" links, left untouched): that function's plain shared-word-count treats two
// titles as near-duplicates whenever they match on this site's OWN repeated title templates --
// e.g. "Can You Get Home Insurance With a Flat Roof?" scored 0.60 against "...With Aluminum
// Wiring?" purely from sharing "get home insurance with", even though the actual topics (flat
// roof vs. aluminum wiring) are unrelated -- a real false positive that blocked a genuinely new
// topic. Fixed by weighting each shared word by how rare it is across the site's existing titles:
// a word repeated in most titles (home, insurance, inspection -- this site's own boilerplate)
// contributes almost nothing; a word unique to one or two titles (aluminum, flat, roof)
// contributes heavily. Verified against the real published-article corpus: the flat-roof/
// aluminum-wiring false positive drops from 0.60 to 0.27, while a genuine near-duplicate (the
// same title minus one word) still scores 1.00 -- a wide, safe margin either side of the 0.5
// threshold below.
function bestTitleOverlap(
  candidateTitle: string,
  otherTitles: string[]
): { matchIndex: number; score: number } | undefined {
  const words = (text: string) => new Set(
    text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOPWORDS.has(w))
  );
  const candidateWords = words(candidateTitle);
  if (candidateWords.size === 0 || otherTitles.length === 0) return undefined;

  const otherWordSets = otherTitles.map(words);
  const docFrequency = new Map<string, number>();
  candidateWords.forEach((w) => {
    docFrequency.set(w, otherWordSets.filter((set) => set.has(w)).length);
  });

  let best: { matchIndex: number; score: number } | undefined;
  otherWordSets.forEach((existingWords, i) => {
    let shared = 0;
    let total = 0;
    candidateWords.forEach((w) => {
      const weight = 1 / ((docFrequency.get(w) || 0) + 1);
      total += weight;
      if (existingWords.has(w)) shared += weight;
    });
    const score = total > 0 ? shared / total : 0;
    if (!best || score > best.score) best = { matchIndex: i, score };
  });
  return best;
}

// Live preview only -- the server (src/server/articlesApi.ts) re-derives and owns the real slug
// on save, including collision handling. This just needs to look right as you type.
function previewSlug(title: string): string {
  const words = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const stripped = words.filter((w) => !STOPWORDS.has(w));
  const chosen = stripped.length >= 3 ? stripped : words;
  return chosen.join('-').slice(0, 60).replace(/-+$/, '') || 'article';
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// costUsd is null (not 0) when the current GEMINI_MODEL has no verified pricing entry -- see
// hasKnownPricing() in geminiUsageTracker.ts. Rendered honestly as "cost unknown" rather than a
// fabricated $0.00, since a $0.00 would read as "this model is free," which may not be true.
function formatCost(usd: number | null): string {
  if (usd === null) return 'cost unknown';
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(2)}`;
}

// Real save/publish path against the Neon-backed /api/admin/articles routes (see
// src/server/articlesApi.ts). Two screens on purpose: a list you can scan at a glance, and one
// simple editor. No jargon, no keyword-volume dashboards, no fake pipeline stages -- title,
// description, body, and one Publish button that actually publishes.
export const SeoAdminPanel: React.FC<SeoAdminPanelProps> = ({ onNavigate }) => {
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Article | null>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  // Tracks whether the admin has hand-edited the web address field -- once true, typing in the
  // title or generating with AI stops auto-updating the slug, so a deliberate custom address
  // never gets silently overwritten.
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Two separate generation inputs, deliberately not the same field as draft.title. The old
  // version fed whatever was typed into the title box straight into the "refine this into the
  // best angle" prompt, so even an already-specific title got rewritten -- e.g. "Buying a house
  // with Zinsco panel" always came back as an insurance-framed question, because that's the
  // model's strongest pattern match for that topic. topicInput asks the model to pick the best
  // SEO title; exactTitleInput is used verbatim, unchanged. Only one is meant to be filled in at
  // a time -- exactTitleInput wins if both are.
  const [topicInput, setTopicInput] = useState('');
  const [exactTitleInput, setExactTitleInput] = useState('');

  // "Additional topic/question to cover" -- a third, independent input layered on top of whichever
  // mode above picks the article's title and main angle. Requires the model to add one genuine ##
  // subheading covering something specific the writer wants included (a real question their
  // audience asks, a wrinkle the main angle wouldn't naturally reach) that would otherwise depend
  // on the model happening to think of it. additionalTopicExact is the checkbox: checked means use
  // this wording verbatim as the subheading itself, same distinction exact-title vs topic-seed
  // makes for the main title -- unchecked lets the model refine the wording into the best SEO
  // subheading phrasing. additionalTopicContent is a separate, later addition: free text the
  // writer pastes in as reference material (a quoted passage, specific figures, exact wording)
  // that the model draws THAT subheading's facts from, instead of researching or inventing them
  // -- the exact checkbox only ever controlled the subheading's WORDING, never its content, so
  // this needed its own field rather than overloading the checkbox's meaning. (See
  // buildArticlePrompt in articleGenerator.ts for what each of the three actually sends.)
  // Deliberately does not reset when topicInput/exactTitleInput change -- this is an addition
  // layered on top of either mode, not tied to one of them, so switching between Topic and Exact
  // Title should not silently drop it.
  const [additionalTopicInput, setAdditionalTopicInput] = useState('');
  const [additionalTopicExact, setAdditionalTopicExact] = useState(false);
  const [additionalTopicContent, setAdditionalTopicContent] = useState('');

  // Pre-generation SERP research (see src/server/serpResearch.ts). Its own explicit step rather
  // than something Generate does invisibly: it spends a second Gemini call from the same 20/day
  // free-tier allowance, and the brief it produces is the one generation input derived from live
  // third-party pages rather than from this app's own verified data -- so it's worth a human
  // reading before it steers an article. serpBrief is what actually gets sent; serpGrounded records
  // whether the search tool really fired (a brief written from the model's own memory of the web,
  // with no live retrieval behind it, is a guess about the SERP and is labelled as one in the UI
  // rather than silently presented as research).
  // What the current brief was actually researched against, kept separate from the live input
  // values. A brief is a snapshot of one query's competitive landscape at one moment; editing the
  // title or the additional question afterwards doesn't update it, and silently sending a brief
  // about a different question would aim the article at the wrong competitors -- the exact failure
  // the feature exists to prevent. Recorded rather than auto-cleared on every keystroke, because
  // discarding a call that cost real grounded-search quota over a one-character typo fix would be
  // worse; the UI warns instead and leaves the choice with the writer.
  const [serpBriefQuery, setSerpBriefQuery] = useState('');
  const [serpBriefAdditionalTopic, setSerpBriefAdditionalTopic] = useState('');
  const [serpBrief, setSerpBrief] = useState('');
  const [serpSourceDomains, setSerpSourceDomains] = useState<string[]>([]);
  const [serpQueries, setSerpQueries] = useState<string[]>([]);
  const [serpGrounded, setSerpGrounded] = useState(true);
  // Whether the brief on screen came from storage (no quota spent) or a fresh grounded call, and
  // when it was originally researched. Both are shown rather than hidden: a stored brief is a real
  // saving worth seeing, and its age is the only basis anyone has for judging whether to spend a
  // call re-running it -- there's no honest expiry rule to apply on their behalf.
  const [serpCached, setSerpCached] = useState(false);
  const [serpFetchedAt, setSerpFetchedAt] = useState('');
  const [serpResearching, setSerpResearching] = useState(false);
  const [serpError, setSerpError] = useState('');
  const [serpBriefOpen, setSerpBriefOpen] = useState(false);

  // The pasted-list-of-titles backlog (see src/server/questionQueueApi.ts), so exact titles can
  // come from one bulk paste instead of a manually-maintained spreadsheet. Always sorted
  // oldest-first by the server, so questionQueue[0] is always "next" -- no separate peek endpoint.
  // importedQuestionId tracks which row (if any) the current exactTitleInput came from, so
  // publishNow() knows which row to delete -- a row is only ever consumed by an actual publish,
  // never by importing it (see the queue card's comment for why that distinction matters).
  const [questionQueue, setQuestionQueue] = useState<Array<{ id: number; questionText: string; createdAt: string }>>([]);
  const [questionQueueLoaded, setQuestionQueueLoaded] = useState(false);
  const [importedQuestionId, setImportedQuestionId] = useState<number | null>(null);
  const [questionQueueOpen, setQuestionQueueOpen] = useState(false);
  const [questionQueueBulkText, setQuestionQueueBulkText] = useState('');
  const [questionQueueBusy, setQuestionQueueBusy] = useState(false);
  const [questionQueueMessage, setQuestionQueueMessage] = useState('');
  const [questionQueueError, setQuestionQueueError] = useState('');
  // Titles generated for this draft earlier in the current editing session, before Save was ever
  // clicked. Passed to the server alongside the DB-backed duplicate list so clicking "Generate"
  // twice in a row for the same topic doesn't produce the same (or near-same) title/angle twice --
  // previously nothing remembered an unsaved attempt, so regenerating looked identical to the
  // model every time.
  const [previousAttempts, setPreviousAttempts] = useState<string[]>([]);
  // Real Google queries this site already gets impressions for, scoped to whatever's typed into
  // topicInput -- see src/server/searchConsoleService.ts. configured starts null (not yet
  // checked) rather than false, so the button doesn't flash a "not set up" state before the first
  // request has even gone out.
  const [keywordResults, setKeywordResults] = useState<KeywordRow[]>([]);
  const [keywordLoading, setKeywordLoading] = useState(false);
  const [keywordConfigured, setKeywordConfigured] = useState<boolean | null>(null);
  const [keywordError, setKeywordError] = useState('');
  // Which row's per-item copy button was just clicked, so only that one row flips to the
  // "Copied!" checkmark rather than every row in the list. Keyed on the query string itself
  // (unique per row -- see the .map key below) rather than an index, so it survives the list
  // re-sorting or filtering between the click and the timeout clearing it.
  const [copiedKeyword, setCopiedKeyword] = useState<string | null>(null);
  // Real search phrases sent alongside the next generate call so the article's own wording
  // reflects how people actually search this topic -- set when a keyword-list row is picked
  // (see the click handler below), cleared on manual typing so a stale list from a previous
  // topic never silently leaks into an unrelated generation.
  const [seoKeywordHints, setSeoKeywordHints] = useState<string[]>([]);
  // Manual, on-demand GDELT search (see src/server/newsCoverageApi.ts) -- always defaulted to the
  // open article's own title on openEditor below, so reviewing a freshly-drafted FEMA county-
  // event article is one click away from "what else is being reported on this" without retyping
  // anything. Freely editable, so it doubles as a general "what's timely right now" search when
  // starting a brand-new evergreen guide. Never auto-runs -- a fresh GDELT hit only ever happens
  // on a real click, matching this whole panel's one-action-per-click pattern.
  const [newsCoverageQuery, setNewsCoverageQuery] = useState('');
  const [newsCoverageResults, setNewsCoverageResults] = useState<NewsCoverageItem[]>([]);
  const [newsCoverageLoading, setNewsCoverageLoading] = useState(false);
  const [newsCoverageError, setNewsCoverageError] = useState('');
  // Set when one source (GDELT or Google News) failed but the other still returned results --
  // distinct from newsCoverageError, which is only for a hard failure of both at once. The
  // results below are still real and worth showing; this just says they're not the full picture.
  const [newsCoverageWarning, setNewsCoverageWarning] = useState('');
  const [newsCoverageFetched, setNewsCoverageFetched] = useState(false);
  // Collapsed by default -- NEWS_TOPIC_PRESETS spans 7 categories now, and most visits to this
  // card are the "check coverage on the article I just opened" case (title already pre-filled),
  // not topic browsing. Same expand/collapse pattern as the Gemini usage panel's usageDetailOpen.
  const [newsTopicsOpen, setNewsTopicsOpen] = useState(false);
  // The overlap check below is a heuristic, and heuristics have false positives -- this is the
  // escape hatch for when it's wrong about a specific title, rather than a hard block with no way
  // through. Reset on any manual edit to Topic/Exact Title so it never silently carries over to a
  // different, unrelated title typed afterward.
  const [overrideSimilarWarning, setOverrideSimilarWarning] = useState(false);

  // Same escape-hatch pattern as overrideSimilarWarning, one field over: the additional topic is
  // itself a specific, standalone question, and it's entirely possible to type in one that already
  // has its own whole article elsewhere on the site (e.g. asking for a sump-pump subheading when
  // "Does Homeowners Insurance Cover a Failed Sump Pump?" already exists as a published guide) --
  // that's a wasted subheading at best, and duplicate-content risk at worst. Kept as its own
  // independent override rather than reusing overrideSimilarWarning, because the two warnings can
  // fire independently (a fine, original main title paired with a duplicate additional topic, or
  // vice versa) and conflating them would let dismissing one silently dismiss the other. Reset on
  // any edit to the additional-topic field, same as the main-title warning is reset on its own
  // inputs, so it never silently survives past the text that triggered it.
  const [overrideAdditionalTopicSimilarWarning, setOverrideAdditionalTopicSimilarWarning] = useState(false);

  // Same escape-hatch pattern as overrideSimilarWarning above, for a different real bug: a
  // generation stream that errors out mid-response (or gets published while still streaming --
  // see the generating-disabled wiring on the Publish/Update buttons below) leaves a real,
  // finished-looking draft that actually ends mid-sentence. Confirmed live: a published Clark
  // County guide ends "...City of North Las Vegas: Maintains" with nothing after it -- 317 words
  // against a 1,200-1,800 word target, no closing section, no punctuation at all on the last
  // line. Reset whenever the body is edited so a genuine fix (or a new generation) re-evaluates
  // cleanly instead of carrying a stale override forward.
  const [overrideTruncatedWarning, setOverrideTruncatedWarning] = useState(false);

  // Same reset-on-edit/reset-on-regenerate treatment as overrideTruncatedWarning above -- see
  // findAdversarialCounterpartyFraming in articleGenerator.ts for what this catches and why.
  const [overrideAdversarialWarning, setOverrideAdversarialWarning] = useState(false);

  // Gemini token/cost counter (see src/server/geminiUsageTracker.ts). "Real time" here means
  // polled every 20s while this screen is open, not a websocket push -- a cost dashboard doesn't
  // need sub-second latency, and polling is the whole mechanism, not a placeholder for something
  // fancier later.
  const [geminiUsage, setGeminiUsage] = useState<GeminiUsageSummary | null>(null);
  const [geminiUsageError, setGeminiUsageError] = useState<string | null>(null);
  const [usageDetailOpen, setUsageDetailOpen] = useState(false);

  // Manual trigger for the FEMA-declaration county-event drafter (see
  // src/server/countyEventsApi.ts) -- same check the daily Vercel Cron runs, callable on demand
  // so a real declaration doesn't have to wait for the next scheduled run to show up as a draft.
  // Processes at most one real match per click (see that file's own comment for why -- a timeout,
  // confirmed live, once coverage grew past 31 counties) -- remainingCount tells the admin whether
  // clicking again would do anything.
  const [countyEventChecking, setCountyEventChecking] = useState(false);
  const [countyEventResult, setCountyEventResult] = useState<{
    declarationsChecked: number; coveredCountyMatches: number; alreadyProcessed: number; draftsCreated: number;
    remainingCount: number; processed: { disasterNumber: number; countySlug: string; slug: string } | null;
    errors: string[]; lookbackDays: number;
  } | null>(null);
  const [countyEventError, setCountyEventError] = useState<string | null>(null);
  // Defaults to the same 14-day window the daily cron uses. Widening it is the actual way to test
  // this against real historical declarations instead of waiting for a live one to land inside the
  // covered-county footprint -- capped server-side at 400 days regardless of what's entered here.
  const [countyEventLookbackDays, setCountyEventLookbackDays] = useState('14');

  // Read-only content-quality scan (see src/server/contentAudit.ts) -- never writes anything, so
  // there's no confirm step and no "undo" to think about, unlike every other button on this page.
  const [contentAuditChecking, setContentAuditChecking] = useState(false);
  const [contentAuditReport, setContentAuditReport] = useState<AuditReport | null>(null);
  const [contentAuditError, setContentAuditError] = useState<string | null>(null);

  // Original data journalism report generator -- see src/server/countyComparisonApi.ts. Admin-
  // triggered (not event-triggered), meant to run occasionally, not on a schedule. A living
  // singleton page rather than a one-shot: comparisonStatus is what lets the button tell "no
  // report yet" from "up to date" from "coverage grew, update available" without wasting a click
  // (and a Gemini call) just to find out.
  const [comparisonGenerating, setComparisonGenerating] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<{ action: 'created' | 'updated'; slug: string; countiesRanked: number } | null>(null);
  const [comparisonError, setComparisonError] = useState<string | null>(null);
  const [comparisonStatus, setComparisonStatus] = useState<{
    exists: boolean; eligibleCounties: number; countiesRanked: number | null; slug: string | null;
  } | null>(null);

  // County homeowners-insurance-cost comparison report -- see src/server/countyInsuranceApi.ts.
  // Same singleton/update-in-place pattern and status mechanism as comparisonStatus above, just
  // gated on counties with real census_insurance_json rather than data_complete (see that
  // column's comment in db.ts for why insurance-cost data doesn't need a county's full data set).
  const [insuranceComparisonGenerating, setInsuranceComparisonGenerating] = useState(false);
  const [insuranceComparisonResult, setInsuranceComparisonResult] = useState<{ action: 'created' | 'updated'; slug: string; countiesRanked: number } | null>(null);
  const [insuranceComparisonError, setInsuranceComparisonError] = useState<string | null>(null);
  const [insuranceComparisonStatus, setInsuranceComparisonStatus] = useState<{
    exists: boolean; eligibleCounties: number; countiesRanked: number | null; slug: string | null;
  } | null>(null);

  // Era x defect reference library -- see src/server/defectReferenceApi.ts. 8 fixed defects, one
  // page per click (not a recurring job) so each draft can be reviewed before the next one is
  // requested, and so a single click can't burn through a whole day's Gemini quota.
  // defectLibraryStatus is what lets the button tell "N pages missing" from "N pages need a
  // refresh because coverage grew" from "all 8 up to date" without spending a click to find out --
  // same mechanism as comparisonStatus above, applied per-defect instead of to one singleton.
  const [defectLibraryGenerating, setDefectLibraryGenerating] = useState(false);
  const [defectLibraryResult, setDefectLibraryResult] = useState<{
    attempted: number; created: number;
    results: Array<{ ruleId: string; slug?: string; action?: 'created' | 'updated'; error?: string; skipped?: boolean }>;
    complete?: boolean;
  } | null>(null);
  const [defectLibraryError, setDefectLibraryError] = useState<string | null>(null);
  const [defectLibraryStatus, setDefectLibraryStatus] = useState<{
    eligibleCounties: number; totalDefects: number; missingCount: number; staleCount: number;
    nextAction: 'create' | 'update' | null; nextRuleId: string | null;
  } | null>(null);

  const loadArticles = () => {
    setLoadError(null);
    fetch('/api/admin/articles')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          setArticles(data.articles);
        } else {
          setLoadError(data?.error || 'Could not load your articles.');
        }
      })
      .catch(() => setLoadError('Could not reach the server.'));
  };

  useEffect(() => {
    loadArticles();
  }, []);

  useEffect(() => {
    loadComparisonStatus();
  }, []);

  useEffect(() => {
    loadInsuranceComparisonStatus();
  }, []);

  useEffect(() => {
    loadDefectLibraryStatus();
  }, []);

  const loadQuestionQueue = () => {
    fetch('/api/admin/question-queue')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) setQuestionQueue(data.questions);
      })
      .catch(() => {})
      .finally(() => setQuestionQueueLoaded(true));
  };

  useEffect(() => {
    loadQuestionQueue();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadUsage = () => {
      fetch('/api/admin/gemini-usage')
        .then((res) => res.json())
        .then((data) => {
          if (cancelled) return;
          if (data?.success) {
            setGeminiUsage(data.usage);
            setGeminiUsageError(null);
          } else {
            setGeminiUsageError(data?.error || 'Could not load usage data.');
          }
        })
        .catch(() => {
          if (!cancelled) setGeminiUsageError('Could not reach the server.');
        });
    };
    loadUsage();
    const interval = setInterval(loadUsage, 20000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const openEditor = (article: Article) => {
    setDraft(article);
    setActionError(null);
    setSlugManuallyEdited(false);
    setTopicInput('');
    setExactTitleInput('');
    // Additional-topic wasn't cleared here before -- a real gap, not a deliberate choice: opening
    // a different article left a previous draft's subheading question sitting in the field, ready
    // to be silently carried into an unrelated article's generation. topicInput/exactTitleInput
    // were always cleared for exactly this reason; this field needs the same treatment.
    setAdditionalTopicInput('');
    setAdditionalTopicExact(false);
    setAdditionalTopicContent('');
    setOverrideAdditionalTopicSimilarWarning(false);
    // Same reasoning as the additional-topic clear directly above, and more urgent: a brief is
    // research about one specific query, and carrying it into a different article's generation
    // would aim that article at a competitive landscape belonging to someone else's topic.
    clearSerpResearch();
    setImportedQuestionId(null);
    setPreviousAttempts([]);
    // Defaulted to this article's own title, not left blank -- the common case opening this is a
    // freshly-drafted FEMA county-event article, where the title already names the county and
    // incident. Results from whatever article was open previously are cleared too, so switching
    // articles never shows stale headlines under a new title.
    setNewsCoverageQuery(article.title);
    setNewsCoverageResults([]);
    setNewsCoverageError('');
    setNewsCoverageFetched(false);
    setView('edit');
  };

  // The "Draft created/updated" result lines below give a slug, not a full Article object -- these
  // are always freshly created/updated by the same generator call that just ran, so loadArticles()
  // (already re-triggered after that call) has it by the time this is clickable. A draft has no
  // public /guides/<slug>/ URL yet (status='published' gates that everywhere else in this app), so
  // "jump to the editor" is the real "go look at it" action here, not an external link.
  const openArticleBySlug = (slug: string) => {
    const article = articles?.find((a) => a.slug === slug);
    if (article) openEditor(article);
  };

  // questionQueue is already sorted oldest-first by the server, so [0] is always "next" -- no
  // network round trip needed just to peek. Non-destructive on purpose: importing only fills the
  // field and remembers which row it came from (importedQuestionId), it does not remove the row.
  // Consuming happens in publishNow() below, and only there -- see questionQueueApi.ts for why.
  const importNextQuestion = () => {
    if (questionQueue.length === 0) return;
    const next = questionQueue[0];
    setExactTitleInput(next.questionText);
    setImportedQuestionId(next.id);
    setTopicInput('');
    setSeoKeywordHints([]);
    setOverrideSimilarWarning(false);
  };

  const addQuestionsToQueue = async () => {
    const lines = questionQueueBulkText.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    setQuestionQueueBusy(true);
    setQuestionQueueError('');
    setQuestionQueueMessage('');
    try {
      const res = await fetch('/api/admin/question-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: lines }),
      });
      const data = await res.json();
      if (data?.success) {
        setQuestionQueue(data.questions);
        setQuestionQueueBulkText('');
        setQuestionQueueMessage(
          data.duplicates > 0
            ? `Added ${data.added} question${data.added === 1 ? '' : 's'} (${data.duplicates} already in the list, skipped).`
            : `Added ${data.added} question${data.added === 1 ? '' : 's'}.`
        );
      } else {
        setQuestionQueueError(data?.error || 'Could not save those questions.');
      }
    } catch {
      setQuestionQueueError('Could not reach the server.');
    } finally {
      setQuestionQueueBusy(false);
    }
  };

  // Manual removal from the list view below -- e.g. a pasted question that was a typo or turned
  // out to be a duplicate of an already-published guide. Separate from the auto-consume on
  // publish, same DELETE route either way.
  const removeQuestionFromQueue = async (id: number) => {
    setQuestionQueue((prev) => prev.filter((q) => q.id !== id));
    if (importedQuestionId === id) setImportedQuestionId(null);
    try {
      await fetch(`/api/admin/question-queue/${id}`, { method: 'DELETE' });
    } catch {
      // Best-effort -- a failed delete here just means a manually-removed row reappears on the
      // next full reload, which is a minor annoyance, not data loss. Not worth an error banner.
    }
  };

  const createArticle = async () => {
    setActionError(null);
    try {
      const res = await fetch('/api/admin/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled article' }),
      });
      const data = await res.json();
      if (data?.success) {
        openEditor(data.article);
        loadArticles();
      } else {
        setActionError(data?.error || 'Could not create a new article.');
      }
    } catch {
      setActionError('Could not reach the server.');
    }
  };

  const checkCountyEvents = async () => {
    setCountyEventChecking(true);
    setCountyEventError(null);
    setCountyEventResult(null);
    try {
      const days = parseInt(countyEventLookbackDays, 10);
      const query = Number.isFinite(days) && days > 0 && days !== 14 ? `?days=${days}` : '';
      const res = await fetch(`/api/admin/county-events/check${query}`);
      const data = await res.json();
      if (data?.success) {
        setCountyEventResult(data.summary);
        if (data.summary?.draftsCreated > 0) loadArticles();
      } else {
        setCountyEventError(data?.error || 'Could not run the check.');
      }
    } catch {
      setCountyEventError('Could not reach the server.');
    } finally {
      setCountyEventChecking(false);
    }
  };

  const runContentAuditCheck = async () => {
    setContentAuditChecking(true);
    setContentAuditError(null);
    try {
      const res = await fetch('/api/admin/content-audit');
      const data = await res.json();
      if (data?.success) {
        setContentAuditReport(data.report);
      } else {
        setContentAuditError(data?.error || 'Could not run the audit.');
      }
    } catch {
      setContentAuditError('Could not reach the server.');
    } finally {
      setContentAuditChecking(false);
    }
  };

  // Deliberately NOT a plain client-side lookup like openArticleBySlug above -- articles is only
  // loaded once, on mount, but the content audit can flag an article that was edited or published
  // entirely outside this browser session (e.g. directly via the database, which is how every fix
  // this skill makes actually lands -- see .claude/skills/article-faqs/). A stale local lookup
  // would silently do nothing on click for exactly the articles someone is most likely to want to
  // open right after fixing them elsewhere. Checking the loaded list first keeps the common case
  // instant; the live GET only fires when that list genuinely doesn't have it yet.
  const [openingArticleId, setOpeningArticleId] = useState<number | null>(null);
  const openArticleById = async (id: number) => {
    const cached = articles?.find((a) => a.id === id);
    if (cached) {
      openEditor(cached);
      return;
    }
    setOpeningArticleId(id);
    // contentAuditError, not actionError -- a failed lookup happens while still on the list view
    // (openEditor/setView('edit') is only reached on success), and actionError only renders
    // inside the editor view below, so it would set state a user could never actually see. This
    // renders right inside the audit card the click came from instead.
    setContentAuditError(null);
    try {
      const res = await fetch(`/api/admin/articles/${id}`);
      const data = await res.json();
      if (data?.success) {
        openEditor(data.article);
      } else {
        setContentAuditError(data?.error || `Could not open article #${id} -- it may have been deleted.`);
      }
    } catch {
      setContentAuditError('Could not reach the server.');
    } finally {
      setOpeningArticleId(null);
    }
  };

  const loadComparisonStatus = () => {
    fetch('/api/admin/reports/county-comparison/status')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          setComparisonStatus({
            exists: data.exists,
            eligibleCounties: data.eligibleCounties,
            countiesRanked: data.countiesRanked,
            slug: data.slug,
          });
        }
      })
      .catch(() => {});
  };

  const generateComparisonReport = async () => {
    setComparisonGenerating(true);
    setComparisonError(null);
    setComparisonResult(null);
    try {
      const res = await fetch('/api/admin/reports/county-comparison', { method: 'POST' });
      const data = await res.json();
      if (data?.success) {
        setComparisonResult({ action: data.action, slug: data.slug, countiesRanked: data.countiesRanked });
        loadArticles();
        loadComparisonStatus();
      } else {
        setComparisonError(data?.error || 'Could not generate the report.');
      }
    } catch {
      setComparisonError('Could not reach the server.');
    } finally {
      setComparisonGenerating(false);
    }
  };

  const loadInsuranceComparisonStatus = () => {
    fetch('/api/admin/reports/county-insurance/status')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          setInsuranceComparisonStatus({
            exists: data.exists,
            eligibleCounties: data.eligibleCounties,
            countiesRanked: data.countiesRanked,
            slug: data.slug,
          });
        }
      })
      .catch(() => {});
  };

  const generateInsuranceComparisonReport = async () => {
    setInsuranceComparisonGenerating(true);
    setInsuranceComparisonError(null);
    setInsuranceComparisonResult(null);
    try {
      const res = await fetch('/api/admin/reports/county-insurance', { method: 'POST' });
      const data = await res.json();
      if (data?.success) {
        setInsuranceComparisonResult({ action: data.action, slug: data.slug, countiesRanked: data.countiesRanked });
        loadArticles();
        loadInsuranceComparisonStatus();
      } else {
        setInsuranceComparisonError(data?.error || 'Could not generate the report.');
      }
    } catch {
      setInsuranceComparisonError('Could not reach the server.');
    } finally {
      setInsuranceComparisonGenerating(false);
    }
  };

  const loadDefectLibraryStatus = () => {
    fetch('/api/admin/reports/defect-reference-library/status')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          setDefectLibraryStatus({
            eligibleCounties: data.eligibleCounties,
            totalDefects: data.totalDefects,
            missingCount: data.missingCount,
            staleCount: data.staleCount,
            nextAction: data.nextAction,
            nextRuleId: data.nextRuleId,
          });
        }
      })
      .catch(() => {});
  };

  const generateDefectLibrary = async () => {
    setDefectLibraryGenerating(true);
    setDefectLibraryError(null);
    setDefectLibraryResult(null);
    try {
      const res = await fetch('/api/admin/reports/defect-reference-library', { method: 'POST' });
      const data = await res.json();
      if (data?.success) {
        setDefectLibraryResult(data.summary);
        if (data.summary?.created > 0) loadArticles();
        loadDefectLibraryStatus();
      } else {
        setDefectLibraryError(data?.error || 'Could not generate the reference library.');
      }
    } catch {
      setDefectLibraryError('Could not reach the server.');
    } finally {
      setDefectLibraryGenerating(false);
    }
  };

  // Parses the model's streamed output -- "TITLE: ...\nMETA: ...\nQUICK_ANSWER: ...\nSOURCES:
  // ...\n---\n<body>" -- from the full accumulated text so far. Re-parsing the whole buffer on
  // every chunk (rather than trying to diff incrementally) is simple and cheap at this size (a
  // few KB for a full article).
  const parseGeneratedText = (
    fullText: string
  ): { title: string; metaDescription: string; quickAnswer: string; sources: string[]; bodyMarkdown: string } => {
    const delimiterIndex = fullText.indexOf('\n---\n');
    const headerBlock = delimiterIndex === -1 ? fullText : fullText.slice(0, delimiterIndex);
    const body = delimiterIndex === -1 ? '' : fullText.slice(delimiterIndex + 5);
    const titleMatch = headerBlock.match(/^TITLE:\s*(.+)$/m);
    const metaMatch = headerBlock.match(/^META:\s*(.+)$/m);
    const quickAnswerMatch = headerBlock.match(/^QUICK_ANSWER:\s*(.+)$/m);
    // Sources come from scanning the body for [CODE] markers actually cited, not from the
    // model's own SOURCES: header line -- confirmed live that gemini-2.5-flash can cite a source
    // inline while leaving that line empty, which would silently drop it from the rendered
    // "Sources" list even though the inline link still resolves. See extractCitedSourceCodes in
    // articleGenerator.ts.
    const sources = extractCitedSourceCodes(delimiterIndex === -1 ? '' : body);
    // Fallback: if the model didn't follow the delimiter format at all, don't lose the output --
    // show everything as the body rather than silently dropping it.
    return {
      title: titleMatch ? titleMatch[1].trim() : '',
      metaDescription: metaMatch ? metaMatch[1].trim() : '',
      quickAnswer: quickAnswerMatch ? quickAnswerMatch[1].trim() : '',
      sources,
      bodyMarkdown: delimiterIndex === -1 ? fullText : body,
    };
  };

  // Researches whatever the article is currently aimed at -- exact title if there is one, since
  // that's the literal query a searcher would type, otherwise the topic seed. Never both: the
  // server searches the string it's given, and concatenating them would search a phrase nobody
  // types. Failure is non-blocking by design; the brief is an enhancement, and Generate stays
  // available without it.
  // refresh = true is the only way to spend a grounded call when a stored brief already exists for
  // these exact inputs. Everything else -- first click, click after a page refresh, coming back
  // tomorrow -- is served from storage for free.
  const runSerpResearch = async (refresh: boolean = false) => {
    const query = (exactTitleInput.trim() || topicInput.trim());
    if (!query || serpResearching) return;
    setSerpResearching(true);
    setSerpError('');
    try {
      const res = await fetch('/api/admin/articles/serp-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // The "Additional topic/question to cover" field is DISCONNECTED from research (see the
        // DISCONNECTED note atop buildSerpResearchPrompt in serpResearch.ts) -- it no longer gets a
        // search of its own, so it is deliberately not sent here.
        body: JSON.stringify({ query, refresh }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setSerpError(data?.error || 'Search research failed. Try again.');
        return;
      }
      setSerpBriefQuery(query);
      setSerpBriefAdditionalTopic('');
      setSerpCached(data.cached === true);
      setSerpFetchedAt(typeof data.fetchedAt === 'string' ? data.fetchedAt : '');
      setSerpBrief(data.brief || '');
      setSerpSourceDomains(Array.isArray(data.sourceDomains) ? data.sourceDomains : []);
      setSerpQueries(Array.isArray(data.searchQueries) ? data.searchQueries : []);
      setSerpGrounded(data.grounded !== false);
      setSerpBriefOpen(true);
    } catch {
      setSerpError('Lost connection while researching.');
    } finally {
      setSerpResearching(false);
    }
  };

  const clearSerpResearch = () => {
    setSerpBriefQuery('');
    setSerpBriefAdditionalTopic('');
    setSerpCached(false);
    setSerpFetchedAt('');
    setSerpBrief('');
    setSerpSourceDomains([]);
    setSerpQueries([]);
    setSerpGrounded(true);
    setSerpError('');
    setSerpBriefOpen(false);
  };

  // overrideTopic/overrideExactTitle/overrideHints let the keyword-list click handler below fire
  // generation immediately with the value it just picked, rather than setting state and hoping a
  // same-tick read of topicInput/seoKeywordHints sees it -- React state updates aren't synchronous,
  // so reading the state variables right after setting them here would still see the old values.
  const generateWithAi = async (overrideTopic?: string, overrideExactTitle?: string, overrideHints?: string[]) => {
    if (!draft || generating) return;
    const trimmedExactTitle = (overrideExactTitle ?? exactTitleInput).trim();
    const trimmedTopic = (overrideTopic ?? topicInput).trim();
    const keywordHints = overrideHints ?? seoKeywordHints;
    setGenerating(true);
    setActionError(null);
    setOverrideTruncatedWarning(false);
    setOverrideAdversarialWarning(false);
    try {
      const res = await fetch('/api/admin/articles/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Exact title wins if somehow both are filled in -- it's the more specific instruction.
          topic: trimmedExactTitle ? '' : trimmedTopic,
          exactTitle: trimmedExactTitle,
          currentArticleId: draft.id,
          previousAttempts,
          relatedKeywords: keywordHints,
          additionalTopic: additionalTopicInput.trim(),
          additionalTopicExact,
          additionalTopicContent: additionalTopicContent.trim(),
          // Empty unless the writer ran (and kept) the research step above -- the prompt is
          // byte-identical to the pre-feature version when this is blank.
          serpBrief,
        }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        setActionError(data?.error || 'AI generation failed. Try again.');
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        const parsed = parseGeneratedText(fullText);
        setDraft((prev) => {
          if (!prev) return prev;
          const next = { ...prev, ...parsed };
          if (!slugManuallyEdited && parsed.title && prev.status !== 'published') {
            next.slug = previewSlug(parsed.title);
          }
          return next;
        });
      }
      // Record the final title so a follow-up Generate click for the same topic (before Save is
      // ever clicked) still gets told what was already tried, instead of starting from a blank
      // duplicate-guard every time.
      const finalTitle = parseGeneratedText(fullText).title;
      if (finalTitle) {
        setPreviousAttempts((prev) => (prev.includes(finalTitle) ? prev : [...prev, finalTitle]));
      }
    } catch {
      setActionError('Lost connection while generating. What was written so far is still here.');
    } finally {
      setGenerating(false);
    }
  };

  const checkKeywords = async () => {
    setKeywordLoading(true);
    setKeywordError('');
    try {
      const res = await fetch(`/api/admin/keyword-research?q=${encodeURIComponent(topicInput.trim())}`);
      const data = await res.json();
      if (data?.configured === false) {
        setKeywordConfigured(false);
        return;
      }
      setKeywordConfigured(true);
      if (data?.success) {
        setKeywordResults(data.rows || []);
      } else {
        setKeywordError('Keyword lookup failed. Try again in a moment.');
      }
    } catch {
      setKeywordError('Lost connection while checking Search Console.');
    } finally {
      setKeywordLoading(false);
    }
  };

  // overrideQuery lets a preset topic chip run its own search immediately, without waiting on a
  // same-tick state update to newsCoverageQuery (React state updates aren't synchronous -- same
  // reasoning as generateWithAi's overrideTopic above).
  const checkNewsCoverage = async (overrideQuery?: string) => {
    const query = (overrideQuery ?? newsCoverageQuery).trim();
    setNewsCoverageLoading(true);
    setNewsCoverageError('');
    setNewsCoverageWarning('');
    try {
      const res = await fetch(`/api/admin/news-coverage?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setNewsCoverageFetched(true);
      if (data?.success) {
        setNewsCoverageResults(data.items || []);
        setNewsCoverageWarning(data.warning || '');
      } else {
        setNewsCoverageError(data?.error || 'News coverage lookup failed. Try again in a moment.');
      }
    } catch {
      setNewsCoverageError('Lost connection while checking for news coverage.');
    } finally {
      setNewsCoverageLoading(false);
    }
  };

  // There's no separate Save action anymore -- Publish now is the only thing that persists the
  // editor's current state, so it has to write it first and only flip status to published if
  // that write actually succeeds (never publish on a failed save, that would go live with
  // whatever the DB last had instead of what's on screen).
  const publishNow = async () => {
    if (!draft) return;
    setSaving(true);
    setActionError(null);
    try {
      const saveRes = await fetch(`/api/admin/articles/${draft.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: draft.title,
          metaDescription: draft.metaDescription,
          bodyMarkdown: draft.bodyMarkdown,
          quickAnswer: draft.quickAnswer,
          sources: draft.sources,
          faqItems: draft.faqItems,
          slug: draft.slug,
        }),
      });
      const saveData = await saveRes.json();
      if (!saveData?.success) {
        setActionError(saveData?.error || 'Could not save your changes.');
        return;
      }
      const pubRes = await fetch(`/api/admin/articles/${draft.id}/publish`, { method: 'POST' });
      const pubData = await pubRes.json();
      if (pubData?.success) {
        setDraft(pubData.article);
        loadArticles();
        // A real publish is the only thing that consumes a question queue row -- see
        // questionQueueApi.ts and importNextQuestion() above for why importing alone doesn't.
        // Fire-and-forget: if this fails, the row just stays queued and gets imported again next
        // time, which is a minor annoyance, not a reason to fail an otherwise-successful publish.
        if (importedQuestionId !== null) {
          const consumedId = importedQuestionId;
          setImportedQuestionId(null);
          setQuestionQueue((prev) => prev.filter((q) => q.id !== consumedId));
          fetch(`/api/admin/question-queue/${consumedId}`, { method: 'DELETE' }).catch(() => {});
        }
      } else {
        setActionError(pubData?.error || 'Could not publish the article.');
      }
    } catch {
      setActionError('Could not reach the server.');
    } finally {
      setSaving(false);
    }
  };

  // For an already-published article: save the current edits WITHOUT touching publish status --
  // no unpublish/republish round trip, so a live page never has to go offline (even briefly) just
  // to fix a typo or update a fact. This used to be the only way to edit published content, via
  // the same unpublish-then-Publish-now dance publishNow above still exists for; that's still
  // available as its own explicit action (Unpublish), but it's no longer the *only* path for an
  // edit that was always going back to published anyway.
  const updateArticle = async () => {
    if (!draft) return;
    setSaving(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/articles/${draft.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: draft.title,
          metaDescription: draft.metaDescription,
          bodyMarkdown: draft.bodyMarkdown,
          quickAnswer: draft.quickAnswer,
          sources: draft.sources,
          faqItems: draft.faqItems,
          slug: draft.slug,
        }),
      });
      const data = await res.json();
      if (data?.success) {
        setDraft(data.article);
        loadArticles();
      } else {
        setActionError(data?.error || 'Could not save your changes.');
      }
    } catch {
      setActionError('Could not reach the server.');
    } finally {
      setSaving(false);
    }
  };

  // Unpublishing takes an already-live article offline -- nothing on screen needs persisting for
  // that to make sense, unlike publishNow/updateArticle above. Still useful on its own when an
  // edit is big enough that the page genuinely shouldn't be live while it's in progress, or when
  // taking the page down is the actual goal.
  const unpublish = async () => {
    if (!draft) return;
    setSaving(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/articles/${draft.id}/unpublish`, { method: 'POST' });
      const data = await res.json();
      if (data?.success) {
        setDraft(data.article);
        loadArticles();
      } else {
        setActionError(data?.error || 'Could not unpublish the article.');
      }
    } catch {
      setActionError('Could not reach the server.');
    } finally {
      setSaving(false);
    }
  };

  // "+ New Article" creates a real DB row immediately (POST /api/admin/articles, see
  // src/server/articlesApi.ts) so it can be opened in the editor -- there's no separate "draft
  // exists only in memory" state. If the admin backs out without typing anything, that empty,
  // still-default "Untitled article" row would otherwise sit in the list forever with nothing in
  // it. Only cleans up a draft that still looks exactly like the untouched, never-published
  // default -- an existing article the admin opened and genuinely blanked out is left alone,
  // since silently deleting content someone had before is a different (and much worse) mistake
  // than leaving one empty stub behind.
  const isUntouchedEmptyDraft = (a: Article) =>
    a.status !== 'published' &&
    (!a.title.trim() || a.title.trim() === 'Untitled article') &&
    !a.metaDescription.trim() &&
    !a.bodyMarkdown.trim() &&
    !a.quickAnswer.trim() &&
    a.sources.length === 0 &&
    a.faqItems.length === 0;

  const backToList = async () => {
    if (draft && isUntouchedEmptyDraft(draft)) {
      try {
        await fetch(`/api/admin/articles/${draft.id}`, { method: 'DELETE' });
      } catch {
        // Best-effort cleanup -- if this fails the empty stub just sits in the list like before,
        // no worse than the bug this is fixing. Not worth blocking navigation over.
      }
      loadArticles();
    }
    setView('list');
    setDraft(null);
  };

  const deleteArticle = async () => {
    if (!draft) return;
    if (!window.confirm(`Delete "${draft.title}"? This can't be undone.`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/articles/${draft.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data?.success) {
        setView('list');
        setDraft(null);
        loadArticles();
      } else {
        setActionError(data?.error || 'Could not delete the article.');
      }
    } catch {
      setActionError('Could not reach the server.');
    } finally {
      setSaving(false);
    }
  };

  // --- List view -------------------------------------------------------------------------------
  if (view === 'list') {
    return (
      <div className="bg-slate-950 text-white min-h-screen font-sans">
        <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Your articles</h1>
              <p className="text-sm text-slate-400 mt-1">Write, save, and publish articles for the site.</p>
            </div>
            <button
              onClick={createArticle}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New article</span>
            </button>
          </div>

          {/* Manual trigger for the FEMA-declaration county-event drafter -- see
              src/server/countyEventsApi.ts. Same check the daily Vercel Cron runs; this button
              exists so a real declaration doesn't have to wait for the next scheduled run. */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                <CloudLightning className="w-3.5 h-3.5" />
                <span>FEMA county-event drafts</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  Lookback (days)
                  <input
                    type="number"
                    min={1}
                    max={400}
                    value={countyEventLookbackDays}
                    onChange={(e) => setCountyEventLookbackDays(e.target.value)}
                    className="w-16 px-2 py-1 bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-md text-white text-xs focus:outline-none"
                  />
                </label>
                <button
                  onClick={checkCountyEvents}
                  disabled={countyEventChecking}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shrink-0"
                >
                  {countyEventChecking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CloudLightning className="w-3.5 h-3.5" />}
                  {countyEventChecking ? 'Checking…' : 'Check now'}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Checks OpenFEMA for new disaster declarations in counties this site already covers, and drafts an article for the first new match found -- one per click, so a run with several real matches can't time out. Same check as the daily automatic run (which always uses 14 days). Widen the lookback above to test against real past declarations instead of waiting for a live one. Click again to work through any remaining matches; drafts land below like any other article, and nothing publishes on its own.
            </p>
            {countyEventError && (
              <p className="text-xs text-rose-400 font-medium flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{countyEventError}</span>
              </p>
            )}
            {countyEventResult && (
              <div className="text-xs text-slate-300 space-y-1 border-t border-slate-800 pt-3">
                <p>{countyEventResult.declarationsChecked} declarations checked in the last {countyEventResult.lookbackDays} days, {countyEventResult.coveredCountyMatches} matched a covered county.</p>
                <p>
                  {countyEventResult.processed ? (
                    <span className="text-emerald-400 font-semibold">
                      Draft created --{' '}
                      <button
                        onClick={() => openArticleBySlug(countyEventResult.processed!.slug)}
                        className="underline decoration-emerald-400/50 hover:decoration-emerald-400 cursor-pointer"
                      >
                        open {countyEventResult.processed.slug}
                      </button>
                    </span>
                  ) : (
                    <span className="text-slate-500">No new drafts -- {countyEventResult.alreadyProcessed} already processed.</span>
                  )}
                </p>
                {countyEventResult.remainingCount > 0 && (
                  <p className="text-blue-400 font-medium">
                    {countyEventResult.remainingCount} more real match{countyEventResult.remainingCount === 1 ? '' : 'es'} still pending -- click Check now again to process the next one.
                  </p>
                )}
                {countyEventResult.errors.length > 0 && (
                  <p className="text-amber-400">{countyEventResult.errors.length} failed: {countyEventResult.errors.join('; ')}</p>
                )}
              </div>
            )}
          </div>

          {/* Read-only content-quality scan -- see src/server/contentAudit.ts. No AI involved:
              pure regex/string checks against body_markdown already in the database, so a click
              here costs nothing and can never hallucinate. Fixing a real finding is still a
              deliberate follow-up edit, not something this button does on its own. */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Content quality audit</span>
              </div>
              <button
                onClick={runContentAuditCheck}
                disabled={contentAuditChecking}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shrink-0"
              >
                {contentAuditChecking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                {contentAuditChecking ? 'Scanning…' : 'Run audit'}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Scans every published article for truncated bodies, non-code content trapped in a code
              fence (renders as an unreadable box), tables missing their separator row (silently
              breaks instead of rendering), malformed links, internal links to a guide or county
              that doesn't exist, external links that actually 404 or time out (a real HTTP check --
              this is the one part of the scan that isn't instant), citations that don't resolve to a
              real source, and the one confirmed-bad accusatory-framing pattern this site has caught
              before. Read-only -- nothing here writes to the database or changes a page. Click any
              flagged article below to jump straight to it in the editor.
            </p>
            {contentAuditError && (
              <p className="text-xs text-rose-400 font-medium flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{contentAuditError}</span>
              </p>
            )}
            {contentAuditReport && (() => {
              const categories: Array<[keyof Omit<AuditReport, 'scanned'>, string]> = [
                ['truncated', 'Truncated bodies'],
                ['nonCodeFence', 'Non-code content in a code fence'],
                ['malformedTable', 'Tables missing a separator row'],
                ['brokenLink', 'Malformed links'],
                ['deadLink', 'Dead or unreachable links'],
                ['unresolvedCitation', 'Unresolved citations'],
                ['adversarialFraming', 'Adversarial framing of a disclosed practice'],
                ['thin', 'Thin content (under 500 words)'],
              ];
              const totalFindings = categories.reduce((n, [key]) => n + contentAuditReport[key].length, 0);
              return (
                <div className="border-t border-slate-800 pt-3 space-y-3">
                  <p className="text-xs text-slate-300">
                    Scanned {contentAuditReport.scanned} published article{contentAuditReport.scanned === 1 ? '' : 's'}.{' '}
                    {totalFindings === 0 ? (
                      <span className="text-emerald-400 font-semibold inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Clean -- no findings.
                      </span>
                    ) : (
                      <span className="text-amber-400 font-semibold">{totalFindings} finding{totalFindings === 1 ? '' : 's'}.</span>
                    )}
                  </p>
                  {categories.map(([key, label]) => {
                    const findings = contentAuditReport[key];
                    if (findings.length === 0) return null;
                    return (
                      <div key={key} className="space-y-1.5">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-amber-500">{label} ({findings.length})</p>
                        <ul className="space-y-1">
                          {findings.map((f, idx) => (
                            <li key={`${f.id}-${idx}`} className="text-xs">
                              <button
                                onClick={() => openArticleById(f.id)}
                                disabled={openingArticleId === f.id}
                                className="text-blue-400 hover:text-blue-300 font-semibold underline decoration-blue-400/40 hover:decoration-blue-300 cursor-pointer disabled:opacity-60 disabled:cursor-wait inline-flex items-center gap-1"
                              >
                                {openingArticleId === f.id && <Loader2 className="w-3 h-3 animate-spin" />}
                                {f.title}
                              </button>
                              <span className="text-slate-500"> -- {f.detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Original data journalism report -- see src/server/countyComparisonApi.ts. Ranks
              every covered county by real Census housing-age data, computed in plain code, never
              by Gemini. Meant to be run occasionally (a handful of times a year), not scheduled. */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            {(() => {
              const eligible = comparisonStatus?.eligibleCounties ?? null;
              const ranked = comparisonStatus?.countiesRanked ?? null;
              const reportExists = comparisonStatus?.exists ?? false;
              const isUpToDate = reportExists && eligible !== null && ranked === eligible;
              const newCounties = reportExists && eligible !== null && ranked !== null ? eligible - ranked : null;
              const label = comparisonGenerating
                ? 'Generating…'
                : isUpToDate
                ? 'Up to date'
                : reportExists
                ? `Update report (+${newCounties})`
                : 'Generate report';

              return (
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>County comparison report</span>
                  </div>
                  <button
                    onClick={generateComparisonReport}
                    disabled={comparisonGenerating || isUpToDate}
                    title={isUpToDate ? `Already ranks all ${eligible} covered counties -- add more county data to unlock an update.` : undefined}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shrink-0"
                  >
                    {comparisonGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BarChart3 className="w-3.5 h-3.5" />}
                    {label}
                  </button>
                </div>
              );
            })()}
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Ranks every county this site covers by real Census housing-age data (% built before 1950 and before 1980) and drafts an original data report around the real ranking table. The table itself is computed here, not by Gemini -- only the surrounding analysis is AI-drafted. A single living page, not one per run -- generating again updates the same article in place instead of creating a duplicate, keeps its current published/draft status as-is, and is only available once county coverage actually grows.
            </p>
            {comparisonError && (
              <p className="text-xs text-rose-400 font-medium flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{comparisonError}</span>
              </p>
            )}
            {comparisonResult && (
              <p className="text-xs text-emerald-400 font-semibold border-t border-slate-800 pt-3">
                {comparisonResult.action === 'updated' ? 'Updated in place' : 'Draft created'}, ranking {comparisonResult.countiesRanked} counties --{' '}
                <button
                  onClick={() => openArticleBySlug(comparisonResult.slug)}
                  className="underline decoration-emerald-400/50 hover:decoration-emerald-400 cursor-pointer"
                >
                  open {comparisonResult.slug}
                </button>
              </p>
            )}
          </div>

          {/* Original data journalism report -- see src/server/countyInsuranceApi.ts. Ranks every
              county with real ACS insurance-cost data, computed in plain code, never by Gemini.
              Same singleton/update-in-place pattern as the housing-age report above. */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            {(() => {
              const eligible = insuranceComparisonStatus?.eligibleCounties ?? null;
              const ranked = insuranceComparisonStatus?.countiesRanked ?? null;
              const reportExists = insuranceComparisonStatus?.exists ?? false;
              const isUpToDate = reportExists && eligible !== null && ranked === eligible;
              const newCounties = reportExists && eligible !== null && ranked !== null ? eligible - ranked : null;
              const label = insuranceComparisonGenerating
                ? 'Generating…'
                : isUpToDate
                ? 'Up to date'
                : reportExists
                ? `Update report (+${newCounties})`
                : 'Generate report';

              return (
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>County insurance cost report</span>
                  </div>
                  <button
                    onClick={generateInsuranceComparisonReport}
                    disabled={insuranceComparisonGenerating || isUpToDate}
                    title={isUpToDate ? `Already ranks all ${eligible} counties with insurance-cost data -- fetch more county data to unlock an update.` : undefined}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shrink-0"
                  >
                    {insuranceComparisonGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BarChart3 className="w-3.5 h-3.5" />}
                    {label}
                  </button>
                </div>
              );
            })()}
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Ranks every county with real ACS homeowners-insurance-cost data (share of mortgaged homeowners paying $3,000+/yr and $2,000+/yr) and drafts an original data report around the real ranking table. The table itself is computed here, not by Gemini -- only the surrounding analysis is AI-drafted. Historical 2019-2023 average data, not a live quote -- the article is required to say so plainly. A single living page, not one per run -- generating again updates the same article in place instead of creating a duplicate, keeps its current published/draft status as-is, and is only available once county coverage actually grows.
            </p>
            {insuranceComparisonError && (
              <p className="text-xs text-rose-400 font-medium flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{insuranceComparisonError}</span>
              </p>
            )}
            {insuranceComparisonResult && (
              <p className="text-xs text-emerald-400 font-semibold border-t border-slate-800 pt-3">
                {insuranceComparisonResult.action === 'updated' ? 'Updated in place' : 'Draft created'}, ranking {insuranceComparisonResult.countiesRanked} counties --{' '}
                <button
                  onClick={() => openArticleBySlug(insuranceComparisonResult.slug)}
                  className="underline decoration-emerald-400/50 hover:decoration-emerald-400 cursor-pointer"
                >
                  open {insuranceComparisonResult.slug}
                </button>
              </p>
            )}
          </div>

          {/* Era x defect reference library -- see src/server/defectReferenceApi.ts. 8 fixed
              defects (knob-and-tube, polybutylene, etc.), each ranking covered counties by real
              Census data for that defect's era. One page generated per click. */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            {(() => {
              const nextAction = defectLibraryStatus?.nextAction ?? null;
              const isUpToDate = defectLibraryStatus !== null && nextAction === null;
              const label = defectLibraryGenerating
                ? 'Generating…'
                : isUpToDate
                ? 'Up to date'
                : nextAction === 'update'
                ? `Update next page (${defectLibraryStatus!.staleCount} stale)`
                : nextAction === 'create'
                ? `Generate next page (${defectLibraryStatus!.missingCount} missing)`
                : 'Generate next page';

              return (
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                    <Library className="w-3.5 h-3.5" />
                    <span>Era x defect reference library</span>
                  </div>
                  <button
                    onClick={generateDefectLibrary}
                    disabled={defectLibraryGenerating || isUpToDate}
                    title={isUpToDate ? `All 8 pages ranked against all ${defectLibraryStatus!.eligibleCounties} covered counties -- add more county data to unlock an update.` : undefined}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shrink-0"
                  >
                    {defectLibraryGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Library className="w-3.5 h-3.5" />}
                    {label}
                  </button>
                </div>
              );
            })()}
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Drafts or refreshes one page per click, for the next missing or stale material/system defect (knob-and-tube wiring, polybutylene pipe, recalled panel brands, cast iron sewer, galvanized supply, lead paint, asbestos, aluminum wiring -- 8 total), ranking covered counties by real Census housing-age data for that defect's era. The description and ranking are real, already-computed facts -- only the connecting analysis is AI-drafted. A page whose county coverage has grown since it was last written gets updated in place (same URL, current published/draft status unchanged) instead of ever getting a second, near-duplicate page for the same defect.
            </p>
            {defectLibraryError && (
              <p className="text-xs text-rose-400 font-medium flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{defectLibraryError}</span>
              </p>
            )}
            {defectLibraryResult && (
              <div className="text-xs text-slate-300 space-y-1 border-t border-slate-800 pt-3">
                {defectLibraryResult.complete ? (
                  <p className="text-emerald-400 font-semibold">All 8 pages up to date -- library complete.</p>
                ) : (
                  <p className="text-emerald-400 font-semibold">{defectLibraryResult.created} of {defectLibraryResult.attempted} pages touched this click.</p>
                )}
                {defectLibraryResult.results.map((r) => (
                  <p key={r.ruleId} className={r.error ? 'text-amber-400' : r.skipped ? 'text-slate-600' : 'text-slate-500'}>
                    {r.ruleId}: {r.error ? (
                      `failed -- ${r.error}`
                    ) : r.skipped ? (
                      'already up to date, skipped'
                    ) : (
                      <>
                        {r.action} --{' '}
                        <button
                          onClick={() => openArticleBySlug(r.slug!)}
                          className="underline decoration-slate-500/50 hover:decoration-slate-300 hover:text-slate-300 cursor-pointer"
                        >
                          open {r.slug}
                        </button>
                      </>
                    )}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Gemini token/cost counter -- see src/server/geminiUsageTracker.ts. Polls every 20s
              (see the effect above); "real time" here means that, not a websocket push. Covers
              every Gemini call the app makes: property reports, this panel's own "Generate with
              AI", and the batch draft-article script -- one shared log, not three separate ones. */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                <Gauge className="w-3.5 h-3.5" />
                <span>
                  Gemini usage
                  {geminiUsage ? ` (report: ${geminiUsage.reportModel} · content: ${geminiUsage.contentModels.join(' → ')})` : ''}
                </span>
              </div>
              {geminiUsage && (
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400" title="Published articles across the whole site">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{geminiUsage.publishedArticleCount} published</span>
                  </div>
                  <button
                    onClick={() => setUsageDetailOpen((v) => !v)}
                    className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Recent calls</span>
                    {usageDetailOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>

            {geminiUsageError && !geminiUsage && (
              <div className="px-4 pb-4 text-xs text-rose-400">{geminiUsageError}</div>
            )}

            {!geminiUsage && !geminiUsageError && (
              <div className="px-4 pb-4 flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Loading usage…</span>
              </div>
            )}

            {geminiUsage && (
              <>
                <div className="grid grid-cols-3 divide-x divide-slate-800 border-t border-slate-800">
                  {[
                    { label: 'Today', tokens: geminiUsage.today.tokens, cost: geminiUsage.today.costUsd, sub: `${geminiUsage.today.calls} call${geminiUsage.today.calls === 1 ? '' : 's'}` },
                    { label: 'This month', tokens: geminiUsage.month.tokens, cost: geminiUsage.month.costUsd },
                    { label: 'All time', tokens: geminiUsage.allTime.tokens, cost: geminiUsage.allTime.costUsd, sub: `${geminiUsage.allTime.calls} call${geminiUsage.allTime.calls === 1 ? '' : 's'}` },
                  ].map((col) => (
                    <div key={col.label} className="p-4">
                      <div className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">{col.label}</div>
                      <div className="text-lg font-bold text-white mt-1">{formatTokens(col.tokens)} <span className="text-xs font-normal text-slate-500">tokens</span></div>
                      <div className={`text-sm font-semibold mt-0.5 ${col.cost === null ? 'text-slate-500 italic' : 'text-emerald-400'}`}>
                        {formatCost(col.cost)}
                      </div>
                      {col.sub && <div className="text-[11px] text-slate-500 mt-1">{col.sub}</div>}
                    </div>
                  ))}
                </div>

                {/* Free-tier quota left today, per model -- see quotaByModel's comment above for
                    why this is computed from our own logged calls, not a live check against
                    Google. Doesn't mean anything once billing is enabled on the project (no cap to
                    count down from), but is the right thing to watch on the free tier this app
                    defaults to. */}
                <div className="border-t border-slate-800 p-4 space-y-2">
                  <div className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">
                    Free-tier quota left today <span className="normal-case font-normal">(estimated from calls logged here)</span>
                  </div>
                  {/* Two separate honesty notes, because they answer two different confusions.
                      First, the direction of the error: "estimated" alone reads as "roughly right
                      either way," when the bias is strictly one-way -- every unlogged path (a call
                      made with the same key outside this app, a log INSERT that hit a database
                      outage) spends real quota without moving this number, so it can only
                      overstate. Second, and the one that actually cost time: the research button
                      is gated by Google Search grounding's own project-wide allowance, which is
                      metered separately from these per-model counters and runs out on its own
                      schedule. Verified directly against the API -- a plain request to
                      gemini-3.5-flash returned 200 while the identical request with google_search
                      returned 429, same key, same minute. Without this line the panel looks broken
                      ("research fails but it says 15 left"); with it, the number is understood for
                      what it measures. See the quota note at the top of serpResearch.ts. */}
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Counts only calls this app logged. Calls made with the same API key elsewhere, or logged while the database was unreachable, still spend quota but never appear here — so this can only ever read <span className="text-slate-400">higher</span> than what's really left. A 429 from Gemini is the authority, not this number.
                  </p>
                  {/* Names the one bar that gates the research button. Measured, not assumed: a
                      grounded request to gemini-3.5-flash or gemini-3.6-flash returns 429 with no
                      quota detail at the same moment a plain request to the same model returns
                      200, and the very first grounded call ever sent to 3.5-flash was already a
                      429 -- so it is unsupported there, not exhausted. Without this line the
                      natural move is to read a healthy bar for a model that cannot ground at all
                      and conclude the feature is broken. */}
                  {geminiUsage.groundingModels && geminiUsage.groundingModels.length > 0 && (
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      "Run live search research" only works on <span className="text-slate-400">{geminiUsage.groundingModels.join(', ')}</span> — the other models reject a grounded request even with quota to spare, so that bar is the only one that gates it.
                    </p>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    {geminiUsage.quotaByModel.map((q) => {
                      const pctLeft = q.remaining / q.dailyLimit;
                      const barColor = pctLeft === 0 ? 'bg-rose-500' : pctLeft <= 0.25 ? 'bg-amber-500' : 'bg-emerald-500';
                      return (
                        <div key={q.model} className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
                          <div className="text-[11px] font-semibold text-slate-300 truncate" title={q.model}>{q.model}</div>
                          <div className="text-sm font-bold text-white mt-1">
                            {q.remaining} <span className="text-[11px] font-normal text-slate-500">/ {q.dailyLimit} left</span>
                          </div>
                          <div className="h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                            <div className={`h-full ${barColor}`} style={{ width: `${pctLeft * 100}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {usageDetailOpen && (
                  <div className="border-t border-slate-800 divide-y divide-slate-800/60 max-h-64 overflow-y-auto">
                    {geminiUsage.recent.length === 0 && (
                      <div className="p-4 text-xs text-slate-500">No calls logged yet.</div>
                    )}
                    {geminiUsage.recent.map((r, i) => (
                      <div key={i} className="px-4 py-2 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-slate-500 shrink-0">
                            {new Date(r.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </span>
                          <span className="text-slate-300 truncate">
                            {r.source === 'report_generation' ? 'Property report'
                              : r.source === 'article_generation' ? 'Article (admin)'
                              : r.source === 'backlink_reply_generation' ? 'Backlink reply'
                              : r.source === 'county_event_generation' ? 'FEMA county event'
                              : r.source === 'county_comparison_generation' ? 'County comparison'
                              : r.source === 'county_insurance_comparison_generation' ? 'County insurance cost'
                              : r.source === 'defect_reference_generation' ? 'Defect reference'
                              : 'Batch draft'}
                          </span>
                          <span className="text-slate-600">·</span>
                          <span className="text-slate-500 truncate">{r.model}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-slate-400">{formatTokens(r.total_tokens)}</span>
                          <span className={r.estimated_cost_usd === null ? 'text-slate-500 italic' : 'text-emerald-400'}>
                            {formatCost(r.estimated_cost_usd)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {loadError && (
            <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-xl text-sm text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loadError}</span>
            </div>
          )}

          {articles === null && !loadError && (
            <div className="py-16 flex justify-center">
              <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
            </div>
          )}

          {articles && articles.length === 0 && (
            <div className="py-16 text-center text-sm text-slate-500 border border-dashed border-slate-800 rounded-2xl">
              Nothing here yet. Click "New article" to write your first one.
            </div>
          )}

          {articles && articles.length > 0 && (
            <div className="space-y-2">
              {articles.map((a) => (
                <button
                  key={a.id}
                  onClick={() => openEditor(a)}
                  className="w-full text-left flex items-center justify-between gap-3 p-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all cursor-pointer"
                >
                  <div className="min-w-0 flex items-start gap-3">
                    <FileText className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-bold text-white text-sm truncate">{a.title || 'Untitled article'}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>Updated {new Date(a.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg ${
                    a.status === 'published'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {a.status === 'published' ? 'Live' : 'Draft'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Editor view -----------------------------------------------------------------------------
  if (!draft) return null;

  // AI generation (and the keyword lookup that feeds it) is only for writing a brand-new article
  // from nothing -- gated off entirely once there's real content to lose, published or not, since
  // Publish now persists whatever's in the editor with no separate save step left to catch a
  // regenerate-over-real-content mistake before it goes live.
  const hasExistingContent = draft.status === 'published' || draft.bodyMarkdown.trim().length > 0;

  // Same precedence as generation itself: exact title wins, then topic (this also covers a topic
  // picked from a keyword-search-query result, since that just sets topicInput too -- no separate
  // check needed for that path), then the saved draft title as a last resort. Topic is included
  // here, not just exact title: a short seed like "TPR valve" against an existing title like
  // "What Is a TPR Valve and Why Do Inspectors Always Check It?" shares most of the seed's few
  // significant words, which is exactly the strong-overlap signal bestTitleOverlap (above) is
  // designed to catch.
  // A brief already fetched, but for a different query than what's in the title/topic fields now.
  // The additional-question field is DISCONNECTED from research (see the DISCONNECTED note atop
  // buildSerpResearchPrompt in serpResearch.ts) and no longer affects the brief, so editing it must
  // NOT mark an otherwise-current brief stale. Exact string compare on the query on purpose --
  // anything fuzzier would have to decide how much drift is "still fine," and there's no honest
  // threshold for that when the answer is one grounded-search call away.
  const serpQueryNow = exactTitleInput.trim() || topicInput.trim();
  const serpBriefIsStale = Boolean(serpBrief) && serpQueryNow !== serpBriefQuery;

  const titleToCheckForDuplicates = exactTitleInput.trim() || topicInput.trim() || draft.title.trim();
  const otherArticles = articles ? articles.filter((a) => a.id !== draft.id) : [];
  const titleOverlap = titleToCheckForDuplicates
    ? bestTitleOverlap(titleToCheckForDuplicates, otherArticles.map((a) => a.title))
    : undefined;
  const similarExisting = titleOverlap && titleOverlap.score > 0.5
    ? otherArticles[titleOverlap.matchIndex]
    : undefined;

  // Same check, run a second time against the additional-topic field -- it's a full, specific
  // question in its own right, and nothing stopped someone typing in one that already has its own
  // dedicated article elsewhere (only the main-title check existed before this). Deliberately its
  // own independent computation against the same otherArticles list, not folded into titleOverlap
  // above: the two fields can each be fine or each be a duplicate independently, and the warnings
  // below need to say which one is the problem, not just that "something" overlaps.
  const additionalTopicTrimmed = additionalTopicInput.trim();
  const additionalTopicOverlap = additionalTopicTrimmed
    ? bestTitleOverlap(additionalTopicTrimmed, otherArticles.map((a) => a.title))
    : undefined;
  const additionalTopicSimilarExisting = additionalTopicOverlap && additionalTopicOverlap.score > 0.5
    ? otherArticles[additionalTopicOverlap.matchIndex]
    : undefined;

  // A second, cheaper check on the same field: does the additional topic just restate the
  // article's OWN main title/topic? Not a duplicate-content risk (nothing else on the site
  // overlaps), so it doesn't block Generate the way additionalTopicSimilarExisting does -- but a
  // subheading that repeats the headline question wastes the slot and reads as padding to a
  // reader, which is exactly what this feature exists to avoid. Reuses bestTitleOverlap against a
  // single-element list rather than a second formula, since "how much does A overlap B" is the
  // same computation regardless of what B's source is.
  const additionalTopicRedundantWithMainTitle = additionalTopicTrimmed && titleToCheckForDuplicates
    ? (bestTitleOverlap(additionalTopicTrimmed, [titleToCheckForDuplicates])?.score ?? 0) > 0.5
    : false;

  // A complete article body always ends in sentence-terminating punctuation (the generation
  // prompt asks it to close with a concrete next step, not a dangling list item or table row) --
  // a stream cut off mid-word leaves the last line with no terminal punctuation at all, which is
  // the actual, confirmed signature of the truncated-publish bug above. Empty bodies are handled
  // by hasExistingContent elsewhere, not flagged here as "truncated."
  //
  // !generating is load-bearing, not a style choice: generateWithAi calls setDraft on every
  // streamed chunk, so bodyMarkdown is mid-sentence for nearly the entire time text is actively
  // arriving -- without this guard, the warning banner below (and the Publish/Update buttons'
  // disabled state, which OR's looksTruncated in) lit up almost continuously WHILE the AI was
  // still writing, not just when a stream genuinely dropped. The real check only means anything
  // once the stream has actually stopped, successfully or not; while generating is still true,
  // the generating flag alone already accounts for "not ready to publish yet."
  const bodyTrimmed = draft.bodyMarkdown.trim();
  const looksTruncated = !generating && bodyTrimmed.length > 0 && !/[.!?]["')\]]?\s*$/.test(bodyTrimmed);
  const adversarialFramingHits = generating ? [] : findAdversarialCounterpartyFraming(draft.bodyMarkdown);

  return (
    <div className="bg-slate-950 text-white min-h-screen font-sans">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <button
          onClick={backToList}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to your articles</span>
        </button>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg ${
            draft.status === 'published'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}>
            {draft.status === 'published' ? `Live at /guides/${draft.slug}/` : 'Draft — not visible on the site yet'}
          </span>

          <div className="flex items-center gap-2">
            {draft.status === 'published' ? (
              <>
                <button
                  onClick={updateArticle}
                  disabled={saving || generating || (looksTruncated && !overrideTruncatedWarning) || (adversarialFramingHits.length > 0 && !overrideAdversarialWarning)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Update</span>
                </button>
                <button
                  onClick={unpublish}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Unpublish</span>
                </button>
              </>
            ) : (
              <button
                onClick={publishNow}
                disabled={saving || generating || (looksTruncated && !overrideTruncatedWarning) || (adversarialFramingHits.length > 0 && !overrideAdversarialWarning)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Publish now</span>
              </button>
            )}
            <button
              onClick={deleteArticle}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-rose-950 border border-slate-800 hover:border-rose-800 text-slate-400 hover:text-rose-300 font-bold text-xs rounded-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {actionError && (
          <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-xl text-sm text-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {looksTruncated && !overrideTruncatedWarning && (
          <div className="p-4 bg-amber-950/40 border border-amber-800/60 rounded-xl text-sm text-amber-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span>
                This doesn't end with a finished sentence -- it may have been cut off mid-generation (a dropped
                connection or an interrupted stream). Check the end of the article below before publishing --{' '}
              </span>
              <button
                onClick={() => setOverrideTruncatedWarning(true)}
                className="font-bold underline underline-offset-2 hover:text-white cursor-pointer"
              >
                it's actually complete, publish anyway
              </button>
              <span>.</span>
            </div>
          </div>
        )}

        {adversarialFramingHits.length > 0 && !overrideAdversarialWarning && (
          <div className="p-4 bg-amber-950/40 border border-amber-800/60 rounded-xl text-sm text-amber-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span>
                This reads as an accusation of bad faith against a standard, disclosed practice (a lease clause, a
                fee, a lender rule) rather than a plain description of the financial risk -- found:{' '}
                <strong>{adversarialFramingHits.map((h) => `"${h}"`).join(', ')}</strong>. Reword it to describe
                the mechanism and consequence, not the counterparty's intent, or{' '}
              </span>
              <button
                onClick={() => setOverrideAdversarialWarning(true)}
                className="font-bold underline underline-offset-2 hover:text-white cursor-pointer"
              >
                it's accurate as written, publish anyway
              </button>
              <span>.</span>
            </div>
          </div>
        )}

        {similarExisting && !overrideSimilarWarning && (
          <div className="p-4 bg-amber-950/40 border border-amber-800/60 rounded-xl text-sm text-amber-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span>This looks similar to an existing article: </span>
              <button
                onClick={() => openEditor(similarExisting)}
                className="font-bold underline underline-offset-2 hover:text-white cursor-pointer"
              >
                "{similarExisting.title}"
              </button>
              <span> ({similarExisting.status === 'published' ? 'live' : 'draft'}). Consider a different angle, or open it to edit instead -- </span>
              <button
                onClick={() => setOverrideSimilarWarning(true)}
                className="font-bold underline underline-offset-2 hover:text-white cursor-pointer"
              >
                or generate anyway
              </button>
              <span> if this is actually a different topic.</span>
            </div>
          </div>
        )}

        {/* Manual, on-demand GDELT search -- see src/server/newsCoverageApi.ts. Deliberately its
            own card, not folded into "Write a first draft with AI" below: that one hides once the
            article already has content, but the main reason to check this is reviewing an
            already-drafted FEMA county-event article for a follow-up angle -- so this has to keep
            working after generation, not just before it. Defaulted to the open article's title
            (see openEditor), freely editable, never auto-runs. */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <div className="text-sm font-bold text-white flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-sky-400" />
            <span>Latest news coverage</span>
          </div>
          <p className="text-xs text-slate-400">
            Recent headlines from GDELT and Google News for whatever's typed below -- useful for checking follow-up angles on a FEMA county-event draft, or for spotting a timely topic before starting a new guide. Never cited as a source; just inspiration for what to write.
          </p>

          <button
            onClick={() => setNewsTopicsOpen((v) => !v)}
            className="text-[11px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
          >
            <span>Browse topics ({NEWS_TOPIC_PRESETS.length})</span>
            {newsTopicsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {newsTopicsOpen && (
            <div className="space-y-2.5">
              {newsTopicCategories.map(([category, presets]) => (
                <div key={category} className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{category}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {presets.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        disabled={newsCoverageLoading}
                        onClick={() => {
                          setNewsCoverageQuery(preset.query);
                          checkNewsCoverage(preset.query);
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-sky-900/60 border border-slate-700 hover:border-sky-700 text-[11px] font-semibold text-slate-300 hover:text-sky-300 rounded-full transition-all cursor-pointer disabled:opacity-40"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newsCoverageQuery}
              onChange={(e) => setNewsCoverageQuery(e.target.value)}
              placeholder="e.g. Pierce County storm, or aluminum wiring lawsuit"
              className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-lg text-white text-sm placeholder:text-slate-600 focus:outline-none"
            />
            <button
              onClick={() => checkNewsCoverage()}
              disabled={newsCoverageLoading}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shrink-0"
            >
              {newsCoverageLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
              {newsCoverageLoading ? 'Checking…' : 'Show latest coverage'}
            </button>
          </div>

          {newsCoverageError && (
            <p className="text-xs text-rose-400 font-medium flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{newsCoverageError}</span>
            </p>
          )}
          {newsCoverageWarning && (
            <p className="text-[11px] text-amber-400 flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{newsCoverageWarning} Showing results from the other source only.</span>
            </p>
          )}
          {newsCoverageFetched && newsCoverageResults.length === 0 && !newsCoverageLoading && !newsCoverageError && (
            <p className="text-xs text-slate-500">No recent headlines matched -- try a broader search.</p>
          )}
          {newsCoverageResults.length > 0 && (
            <div className="space-y-1 max-h-64 overflow-y-auto border-t border-slate-800 pt-3">
              {newsCoverageResults.map((item) => (
                <a
                  key={item.url}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-800/60 group"
                >
                  <Link2 className="w-3.5 h-3.5 text-slate-600 group-hover:text-sky-400 shrink-0 mt-0.5" />
                  <span className="flex-1 text-xs text-slate-300 group-hover:text-white">
                    {item.title}
                    <span className="block text-[10px] text-slate-500 mt-0.5">
                      {item.domain}
                      {' · '}
                      {new Date(item.seenAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {' · '}
                      {item.source === 'gdelt' ? 'GDELT' : 'Google News'}
                    </span>
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-indigo-950/40 border border-indigo-800/60 rounded-2xl space-y-3">
          <div className="text-sm font-bold text-white flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Write a first draft with AI</span>
          </div>
          {hasExistingContent ? (
            <p className="text-xs text-amber-400">
              Disabled -- this article already has content (published or drafted), and generating again would overwrite it. Only works on a brand-new, empty draft.
            </p>
          ) : (
            <p className="text-xs text-slate-400">
              Fill in one of the two fields below, not both -- exact title wins if you do.
            </p>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              Topic <span className="text-slate-500 font-normal normal-case">— AI picks the best SEO title</span>
            </label>
            <input
              type="text"
              value={topicInput}
              onChange={(e) => {
                setTopicInput(e.target.value);
                setSeoKeywordHints([]);
                setOverrideSimilarWarning(false);
                setImportedQuestionId(null);
              }}
              placeholder="e.g. Zinsco electrical panels — leave blank for a pillar-based suggestion"
              disabled={generating || hasExistingContent}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg text-white text-sm placeholder:text-slate-600 focus:outline-none disabled:opacity-60"
            />
            <button
              onClick={checkKeywords}
              disabled={keywordLoading || hasExistingContent}
              className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer disabled:opacity-50"
            >
              {keywordLoading ? 'Checking real search queries...' : 'Check real search queries for this topic'}
            </button>

            {keywordConfigured === false && (
              <p className="text-[11px] text-slate-500">
                No sources connected. Google autocomplete needs no key and should always return phrasings; Search Console (GSC_* vars) adds real positions, and Bing (BING_WEBMASTER_API_KEY) adds a cross-check.
              </p>
            )}
            {keywordError && <p className="text-[11px] text-rose-400">{keywordError}</p>}
            {keywordConfigured && keywordResults.length === 0 && !keywordLoading && !keywordError && (
              <p className="text-[11px] text-slate-500">No real queries found for this yet -- try a broader term, or this may just be a new angle.</p>
            )}
            {keywordResults.length > 0 && (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {keywordResults.map((row) => (
                  <div key={row.query} className="flex items-center gap-1.5">
                  <button
                    disabled={generating || hasExistingContent}
                    onClick={() => {
                      // Picking a result only fills in Topic + the hint list below -- it does NOT
                      // start writing on its own. Generate with AI is still a separate, deliberate
                      // click, so browsing a few candidates before committing never burns a real
                      // Gemini call for each one.
                      const others = keywordResults.filter((r) => r.query !== row.query);
                      // Ranked by relevance to the clicked term first, raw impressions only as the
                      // tiebreaker within a relevance tier. Sorting by impressions alone let
                      // unrelated high-volume noise (a different topic sharing one common word, an
                      // unrelated abbreviation, a local-permit term) bury genuinely on-topic
                      // phrases that are lower-volume simply because they're more specific -- e.g.
                      // "home inspection checklist" ranked 16th by raw volume, behind six unrelated
                      // terms, for the seed "home inspectors near me".
                      //
                      // This is a local formula, not the shared titleSimilarity() from
                      // relatedGuides.ts: that one divides shared-word count by the SHORTER of the
                      // two word counts, which is right for comparing two article titles of
                      // similar length but wrong here -- it rewards a short, often-noisy candidate
                      // ("home guard") for trivially sharing one word with the seed while
                      // penalizing a more specific, more useful long-tail phrase ("home inspection
                      // checklist") for sharing that same one word, purely because it also has more
                      // words of its own. Dividing by the seed's own fixed word count instead
                      // removes that length bias.
                      // "near" specifically (not in the shared STOPWORDS set, which is tuned for
                      // comparing article titles, not search queries) was inflating the "X near
                      // me" cluster -- car/vehicle/state inspection all scored as relevant as
                      // genuine home-inspection phrases purely for sharing that one generic
                      // locational word with the seed.
                      const QUERY_FILLER_WORDS = new Set(['near']);
                      const wordsOf = (text: string) => new Set(
                        text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOPWORDS.has(w) && !QUERY_FILLER_WORDS.has(w))
                      );
                      const seedWords = wordsOf(row.query);
                      const relevance = (candidate: string) => {
                        if (seedWords.size === 0) return 0;
                        const candidateWords = wordsOf(candidate);
                        let shared = 0;
                        seedWords.forEach((w) => { if (candidateWords.has(w)) shared++; });
                        return shared / seedWords.size;
                      };
                      const hints = others
                        .map((r) => ({ query: r.query, impressions: r.impressions, relevance: relevance(r.query) }))
                        .sort((a, b) => b.relevance - a.relevance || b.impressions - a.impressions)
                        .slice(0, 10)
                        .map((r) => r.query);
                      setTopicInput(row.query);
                      setExactTitleInput('');
                      setImportedQuestionId(null);
                      setSeoKeywordHints(hints);
                    }}
                    className="flex-1 min-w-0 flex items-center justify-between gap-2 px-2.5 py-1.5 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 rounded-lg text-left cursor-pointer disabled:opacity-50"
                  >
                    <span className="text-xs text-slate-300 truncate">{row.query}</span>
                    <span className="text-[10px] font-mono text-slate-500 shrink-0">
                      {row.source === 'autocomplete'
                        ? `google suggest${row.isQuestion ? ' · question' : ''}`
                        : `${row.impressions} impr${row.position != null ? ` · pos ${row.position.toFixed(1)}` : ''}`}
                    </span>
                  </button>
                  {/* Copies just this row's raw query text -- separate from the button above,
                      which instead picks the row into Topic + rebuilds the hint list. Sibling
                      button rather than nested, since a button can't contain another button. */}
                  <button
                    type="button"
                    title="Copy this query"
                    onClick={() => {
                      navigator.clipboard.writeText(row.query);
                      setCopiedKeyword(row.query);
                      setTimeout(() => setCopiedKeyword((current) => (current === row.query ? null : current)), 2000);
                    }}
                    className="shrink-0 p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-slate-800 border border-slate-800 rounded-lg cursor-pointer"
                  >
                    {copiedKeyword === row.query
                      ? <Check className="w-3.5 h-3.5 text-emerald-400" />
                      : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-wide">
            <div className="flex-1 h-px bg-slate-800" />
            <span>Or</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                Exact title <span className="text-slate-500 font-normal normal-case">— used word-for-word, never rephrased</span>
              </label>
              {/* Only shown once something's actually been queued -- an admin who has never used
                  the paste-a-list workflow shouldn't see a button that always does nothing. */}
              {questionQueueLoaded && questionQueue.length > 0 && (
                <button
                  type="button"
                  onClick={importNextQuestion}
                  disabled={generating || hasExistingContent}
                  className="shrink-0 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer disabled:opacity-50"
                >
                  Import next question ({questionQueue.length})
                </button>
              )}
            </div>
            <input
              type="text"
              value={exactTitleInput}
              onChange={(e) => {
                setExactTitleInput(e.target.value);
                setSeoKeywordHints([]);
                setOverrideSimilarWarning(false);
                setImportedQuestionId(null);
              }}
              placeholder="e.g. Buying a House With a Zinsco Panel"
              disabled={generating || hasExistingContent}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg text-white text-sm placeholder:text-slate-600 focus:outline-none disabled:opacity-60"
            />
            {importedQuestionId !== null && (
              <p className="text-[11px] text-indigo-400">
                Imported from the queue -- removed from the list once you publish. Editing this field un-tracks it.
              </p>
            )}
          </div>

          <div className="border-t border-indigo-900/60 pt-3 space-y-2.5">
            <button
              type="button"
              onClick={() => setQuestionQueueOpen((v) => !v)}
              className="text-[11px] font-bold text-slate-400 hover:text-slate-300 flex items-center gap-1 cursor-pointer"
            >
              <MessageCircleQuestion className="w-3.5 h-3.5" />
              <span>Question queue ({questionQueue.length})</span>
              {questionQueueOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {questionQueueOpen && (
              <div className="space-y-3">
                <p className="text-xs text-slate-400">
                  Paste a list of exact-title questions below, one per line. Click "Import next question" above to load them into Exact title one at a time -- each one is only removed from this list once you actually publish it, so an abandoned draft or an overwritten title never loses your place.
                </p>

                <textarea
                  value={questionQueueBulkText}
                  onChange={(e) => setQuestionQueueBulkText(e.target.value)}
                  placeholder={'One question per line, e.g.\nCan You Get a Mortgage on a House With Foundation Cracks?\nDoes a Home Warranty Cover Pre-Existing Problems?'}
                  rows={4}
                  disabled={questionQueueBusy}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg text-white text-sm placeholder:text-slate-600 focus:outline-none disabled:opacity-60 resize-y"
                />
                <button
                  type="button"
                  onClick={addQuestionsToQueue}
                  disabled={questionQueueBusy || !questionQueueBulkText.trim()}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  {questionQueueBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{questionQueueBusy ? 'Adding...' : 'Add to queue'}</span>
                </button>
                {questionQueueMessage && <p className="text-[11px] text-emerald-400">{questionQueueMessage}</p>}
                {questionQueueError && <p className="text-[11px] text-rose-400">{questionQueueError}</p>}

                {questionQueue.length > 0 && (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {questionQueue.map((q, i) => (
                      <div
                        key={q.id}
                        className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-slate-900/60 border border-slate-800 rounded-lg"
                      >
                        <span className="text-xs text-slate-300 truncate">
                          {i === 0 && <span className="text-indigo-400 font-bold mr-1.5">Next —</span>}
                          {q.questionText}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeQuestionFromQueue(q.id)}
                          title="Remove from queue"
                          className="shrink-0 text-slate-600 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Optional pre-generation step. Placed immediately above Generate because that's the
              order it's meant to be used in, and left entirely skippable -- Generate behaves
              exactly as it always did when no brief has been fetched. See serpResearch.ts for the
              two limits the copy here is careful about: this reads Google's search results, not
              the AI Overview (no API exposes that), and the retrieved set is not a verified
              rank-1/2/3 ordering. */}
          <div className="border-t border-indigo-900/60 pt-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                Research the competition first <span className="text-slate-500 font-normal normal-case">— optional</span>
              </label>
              {serpBrief && (
                <button
                  type="button"
                  onClick={clearSerpResearch}
                  className="text-[11px] text-slate-500 hover:text-slate-300 underline underline-offset-2 cursor-pointer"
                >
                  discard brief
                </button>
              )}
            </div>
            {/* Must be a wrapping arrow, not `onClick={runSerpResearch}` -- a bare handler
                reference passes React's click event as the first argument, and an event object is
                truthy, so every click would have forced a live re-run and defeated the cache
                entirely. With a brief already on screen this button means "go and look again",
                which is the one action that deliberately spends a call; with no brief it prefers
                whatever is stored and costs nothing. */}
            <button
              onClick={() => runSerpResearch(Boolean(serpBrief))}
              disabled={serpResearching || generating || hasExistingContent || !(exactTitleInput.trim() || topicInput.trim())}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              {serpResearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>{serpResearching ? 'Searching Google...' : serpBrief ? 'Re-run against live search' : 'Run live search research'}</span>
            </button>
            {!(exactTitleInput.trim() || topicInput.trim()) ? (
              <p className="text-[11px] text-slate-500">
                Fill in Exact title or Topic above first — that's the query this searches.
              </p>
            ) : (
              <p className="text-[11px] text-slate-500">
                Runs a live Google search for "{serpQueryNow.slice(0, 70)}", reads what's currently ranking, and writes a brief on how to beat it. Briefs are saved per query — researching the same thing again, or reloading this page, costs nothing. Only "Re-run against live search" spends a call.
              </p>
            )}
            {serpError && (
              <p className="text-[11px] text-rose-400">{serpError}</p>
            )}

            {serpBrief && (
              <div className={`rounded-xl border overflow-hidden ${serpBriefIsStale ? 'border-amber-800/60 bg-amber-950/25' : 'border-emerald-800/60 bg-emerald-950/30'}`}>
                <button
                  type="button"
                  onClick={() => setSerpBriefOpen((v) => !v)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left cursor-pointer"
                >
                  <span className={`text-xs font-bold flex items-center gap-1.5 ${serpBriefIsStale ? 'text-amber-200' : 'text-emerald-200'}`}>
                    {serpBriefIsStale
                      ? <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      : <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                    {serpBriefIsStale
                      ? 'Brief is out of date — still sent with Generate'
                      : serpCached
                      ? 'Saved brief loaded — no quota spent'
                      : 'Brief ready — will be sent with Generate'}
                  </span>
                  {serpBriefOpen ? <ChevronUp className="w-3.5 h-3.5 text-emerald-300 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-emerald-300 shrink-0" />}
                </button>
                {serpBriefOpen && (
                  <div className="px-3 pb-3 space-y-2.5">
                    {/* Warns rather than blocks or auto-discards. A stale brief is still mostly
                        useful after a small title edit, and throwing away a call that spent real
                        grounded-search quota would be the worse failure -- but sending it silently
                        would point the article at a different question's competitors, which is the
                        precise thing this feature exists to prevent. Showing the exact strings it
                        was researched against lets the writer judge in a glance whether the drift
                        matters. */}
                    {serpBriefIsStale && (
                      <div className="p-2.5 bg-amber-950/40 border border-amber-800/60 rounded-lg text-[11px] text-amber-200 space-y-1">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>The fields above changed since this was researched. It'll still be sent as-is — re-run it if the difference matters.</span>
                        </div>
                        <div className="pl-5 text-amber-300/70">
                          Researched: "{serpBriefQuery}"
                        </div>
                      </div>
                    )}
                    {/* Deliberately loud, and deliberately not phrased as a nitpick: without the
                        search tool actually firing, the "brief" is the model describing the web
                        from memory. That reads identically to a real one and would silently steer
                        an article using an imagined competitive landscape. */}
                    {!serpGrounded && (
                      <div className="p-2.5 bg-amber-950/40 border border-amber-800/60 rounded-lg text-[11px] text-amber-200 flex items-start gap-2">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>
                          No live search actually ran for this — the model answered from its own training data, so treat this as a guess about the SERP, not an observation of it. Re-running usually fixes it.
                        </span>
                      </div>
                    )}
                    {/* The research date, shown whenever it's known, because it is the only basis
                        anyone has for deciding whether to spend one of the day's 20 calls
                        re-running this. No expiry is enforced -- search results drift slowly and
                        unevenly, and there's no honest cutoff at which a brief stops being useful,
                        so the date goes in front of the writer instead of a rule being invented
                        for them. */}
                    {serpFetchedAt && (
                      <p className="text-[11px] text-slate-400">
                        <span className="text-slate-500">Researched:</span> {new Date(serpFetchedAt).toLocaleString()}
                        {serpCached && <span className="text-slate-500"> · loaded from saved research, no Gemini call used</span>}
                      </p>
                    )}
                    {serpQueries.length > 0 && (
                      <p className="text-[11px] text-slate-400">
                        <span className="text-slate-500">Searched:</span> {serpQueries.map((q) => `"${q}"`).join(', ')}
                      </p>
                    )}
                    {serpSourceDomains.length > 0 && (
                      <p className="text-[11px] text-slate-400">
                        <span className="text-slate-500">Pages retrieved (not a ranked 1-2-3 order):</span> {serpSourceDomains.join(', ')}
                      </p>
                    )}
                    {/* Editable on purpose: the writer may know a topic or question the live
                        search pass didn't surface (or want to fold in something from a different
                        brief) and there's no reason that has to go through Gemini to reach the
                        article prompt. Plain textarea bound straight to serpBrief -- whatever is
                        typed here is verbatim what gets sent with Generate (see the serpBrief
                        field in the generate call below), same as the fetched text always was.
                        Edits are client-side only and are not written back to the saved-brief
                        cache, so "Re-run against live search" still overwrites with a fresh fetch
                        rather than silently keeping a hand-edited version around under the same
                        cache key. */}
                    <textarea
                      value={serpBrief}
                      onChange={(e) => setSerpBrief(e.target.value)}
                      disabled={generating || hasExistingContent}
                      rows={14}
                      className="w-full text-[11px] text-slate-300 whitespace-pre-wrap font-sans leading-relaxed max-h-96 overflow-y-auto bg-slate-950/40 border border-slate-800 focus:border-emerald-600 rounded-lg p-2 resize-y focus:outline-none disabled:opacity-60"
                    />
                    <p className="text-[11px] text-slate-500">
                      Editable — add a topic or question the search missed and it's sent exactly as typed. Still strategy only: nothing in it counts as a source, no figure from these pages can be repeated and none of them can be cited, same hard rules as always.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Positioned after the research brief, not before it, so this doubles as the natural
              place to ask "does the brief leave anything out you want covered?" once there's
              something to react to. Stays visible once anything here has a value, even if the
              brief is later discarded, so a typed answer never keeps being sent while invisible
              in the UI. Additive on top of Topic or Exact title above, not an alternative to
              either -- see the additionalTopicInput/additionalTopicExact/additionalTopicContent
              comment near the top of this component and buildArticlePrompt in
              articleGenerator.ts for what each field actually changes in the prompt (verbatim
              subheading vs. model-refined SEO phrasing; pasted content as that subheading's
              factual basis). */}
          {(serpBrief || additionalTopicInput.trim() || additionalTopicContent.trim()) && (
            <div className="border-t border-indigo-900/60 pt-3 space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                Anything the brief missed? <span className="text-slate-500 font-normal normal-case">— optional, adds one subheading</span>
              </label>
              <input
                type="text"
                value={additionalTopicInput}
                onChange={(e) => {
                  setAdditionalTopicInput(e.target.value);
                  setOverrideAdditionalTopicSimilarWarning(false);
                }}
                placeholder="e.g. Does title insurance cover boundary disputes?"
                disabled={generating || hasExistingContent}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg text-white text-sm placeholder:text-slate-600 focus:outline-none disabled:opacity-60"
              />
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={additionalTopicExact}
                  onChange={(e) => setAdditionalTopicExact(e.target.checked)}
                  disabled={generating || hasExistingContent}
                  className="mt-0.5 accent-indigo-500 cursor-pointer disabled:opacity-60"
                />
                <span className="text-[11px] text-slate-400 leading-relaxed">
                  Use this exact wording as the subheading, unchanged. Unchecked: the model refines it into the best SEO-phrased subheading, the same treatment Exact title above gets for the main headline.
                </span>
              </label>
              {additionalTopicInput.trim() && (
                <p className="text-[11px] text-slate-500">
                  Adds one ## section specifically covering this. Same no-thin-content standard as the rest of the article -- the target word count widens to 1,500-2,100 to give it real room rather than squeezing the main content.
                </p>
              )}

              {/* Optional -- lets the writer paste real reference material (a quoted passage,
                  specific figures, exact wording) for the model to build that one subheading's
                  facts around, instead of leaving it to invent or generalize them. Never affects
                  the rest of the article and is never cited with a [CODE] marker, since it didn't
                  come through KNOWN_SOURCES -- see the additionalTopicReferenceBlock comment in
                  articleGenerator.ts for the exact instruction this produces. */}
              {additionalTopicInput.trim() && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                    Content to include <span className="text-slate-500 font-normal normal-case">— optional, paste reference material for that subheading</span>
                  </label>
                  <textarea
                    value={additionalTopicContent}
                    onChange={(e) => setAdditionalTopicContent(e.target.value)}
                    placeholder="Paste the specific facts, figures, or wording you want that section built around..."
                    disabled={generating || hasExistingContent}
                    rows={4}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg text-white text-xs placeholder:text-slate-600 focus:outline-none disabled:opacity-60 resize-y"
                  />
                </div>
              )}

              {/* Blocking, same severity and mechanism as the main-title similarExisting warning
                  above -- this field is a full standalone question, and typing in one that already
                  has its own article elsewhere is exactly the same duplicate-content risk. */}
              {additionalTopicSimilarExisting && !overrideAdditionalTopicSimilarWarning && (
                <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-xs text-amber-200 flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <div>
                    <span>This additional topic looks similar to an existing article: </span>
                    <button
                      type="button"
                      onClick={() => openEditor(additionalTopicSimilarExisting)}
                      className="font-bold underline underline-offset-2 hover:text-white cursor-pointer"
                    >
                      "{additionalTopicSimilarExisting.title}"
                    </button>
                    <span> ({additionalTopicSimilarExisting.status === 'published' ? 'live' : 'draft'}). Pick a narrower angle for the subheading, or </span>
                    <button
                      type="button"
                      onClick={() => setOverrideAdditionalTopicSimilarWarning(true)}
                      className="font-bold underline underline-offset-2 hover:text-white cursor-pointer"
                    >
                      it's genuinely a different angle, use it anyway
                    </button>
                    <span>.</span>
                  </div>
                </div>
              )}

              {/* Informational only, not blocking -- restating the main title isn't a site-wide
                  duplicate-content problem, just a wasted subheading, so there's nothing to "open
                  and edit instead" and no override needed to proceed. */}
              {additionalTopicRedundantWithMainTitle && !additionalTopicSimilarExisting && (
                <p className="text-[11px] text-amber-400">
                  This is very close to the article's own main title/topic -- the subheading would likely just restate the headline. Consider a narrower or more specific angle.
                </p>
              )}
            </div>
          )}

          <button
            onClick={() => generateWithAi()}
            disabled={
              generating ||
              hasExistingContent ||
              (!!similarExisting && !overrideSimilarWarning) ||
              (!!additionalTopicSimilarExisting && !overrideAdditionalTopicSimilarWarning)
            }
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{generating ? 'Writing...' : 'Generate with AI'}</span>
          </button>
          {similarExisting && !overrideSimilarWarning && !hasExistingContent && (
            <p className="text-[11px] text-amber-400">
              Blocked until you change the title above, or click "generate anyway" -- generating now would likely burn a real Gemini call writing a near-duplicate of the existing article.
            </p>
          )}
          {similarExisting && overrideSimilarWarning && !hasExistingContent && (
            <p className="text-[11px] text-slate-500">
              Proceeding despite the similar-title warning above.
            </p>
          )}
          {additionalTopicSimilarExisting && !overrideAdditionalTopicSimilarWarning && !hasExistingContent && (
            <p className="text-[11px] text-amber-400">
              Also blocked on the additional topic above until you change it or click "use it anyway."
            </p>
          )}

          {previousAttempts.length > 0 && (
            <p className="text-[11px] text-slate-500">
              {previousAttempts.length} earlier {previousAttempts.length === 1 ? 'attempt' : 'attempts'} this session will be avoided on the next generate.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Title</label>
            {/* Only the bare title itself needs a hard warning here -- the " | BeforeRegret
                Guides" suffix that ends up in the real <title> tag is added automatically only
                when it still fits under TITLE_SUFFIX_MAX_LENGTH chars (see src/utils/pageTitle.ts),
                so a title that's fine on its own is always safe regardless of the suffix. A title
                over that limit on its own is the one case that fallback can't fix, since dropping
                the suffix doesn't help -- that has to be shortened here. */}
            <span
              className={`text-xs font-mono flex items-center gap-1 ${
                draft.title.length > TITLE_SUFFIX_MAX_LENGTH ? 'text-rose-400' : 'text-slate-500'
              }`}
            >
              {draft.title.length > TITLE_SUFFIX_MAX_LENGTH && <AlertCircle className="w-3 h-3" />}
              <span>{draft.title.length}/{TITLE_SUFFIX_MAX_LENGTH}</span>
            </span>
          </div>
          <input
            type="text"
            value={draft.title}
            onChange={(e) => {
              const title = e.target.value;
              setDraft((prev) => {
                if (!prev) return prev;
                const next = { ...prev, title };
                if (!slugManuallyEdited && prev.status !== 'published') {
                  next.slug = title.trim() ? previewSlug(title) : prev.slug;
                }
                return next;
              });
            }}
            placeholder="What's this article called? Or generate with AI above and this fills in."
            disabled={generating}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl text-white text-base font-bold placeholder:text-slate-600 focus:outline-none disabled:opacity-60"
          />
          {draft.title.trim() && (() => {
            const rendered = buildPageTitle(draft.title, ' | BeforeRegret Guides');
            const suffixDropped = rendered.length === draft.title.length;
            return (
              <p className="text-[11px] text-slate-500">
                Search results will show: <span className="text-slate-300 font-medium">&ldquo;{rendered}&rdquo;</span>
                {suffixDropped && draft.title.length <= TITLE_SUFFIX_MAX_LENGTH && (
                  <span> (brand suffix dropped -- wouldn't fit under {TITLE_SUFFIX_MAX_LENGTH} chars with it)</span>
                )}
              </p>
            );
          })()}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5" />
            <span>Web address</span>
          </label>
          {draft.status === 'published' ? (
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-sm text-slate-400">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">beforeregret.com/guides/{draft.slug}/</span>
            </div>
          ) : (
            <>
              <div className="flex items-center rounded-xl border border-slate-800 focus-within:border-blue-500 bg-slate-900 overflow-hidden">
                <span className="pl-4 text-sm text-slate-500 shrink-0">beforeregret.com/guides/</span>
                <input
                  type="text"
                  value={draft.slug}
                  onChange={(e) => {
                    setSlugManuallyEdited(true);
                    setDraft({ ...draft, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') });
                  }}
                  disabled={generating}
                  className="flex-1 min-w-0 px-1.5 py-3 bg-transparent text-white text-sm focus:outline-none disabled:opacity-60"
                />
                <span className="pr-4 text-sm text-slate-500 shrink-0">/</span>
              </div>
              <p className="text-xs text-slate-500">
                Auto-fills from the title. Keep it short and specific -- this locks once you publish.
              </p>
            </>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              Short description
            </label>
            {/* 25-160 is Bing/Google's own guidance -- under 25 reads as too thin to be a real
                summary, over 160 gets truncated (or replaced outright) in the search results
                snippet. Bing Webmaster Tools flags both ends of this by name ("Meta Description
                too long or too short"), which is what caught this in production the first time --
                catching it here, before publish, is the actual fix. */}
            <span
              className={`text-xs font-mono flex items-center gap-1 ${
                draft.metaDescription.length > 160 || (draft.metaDescription.length > 0 && draft.metaDescription.length < 25)
                  ? 'text-rose-400'
                  : 'text-slate-500'
              }`}
            >
              {(draft.metaDescription.length > 160 || (draft.metaDescription.length > 0 && draft.metaDescription.length < 25)) && (
                <AlertCircle className="w-3 h-3" />
              )}
              <span>{draft.metaDescription.length}/160</span>
            </span>
          </div>
          <p className="text-xs text-slate-500">This is what shows up under the title in Google search results.</p>
          <textarea
            value={draft.metaDescription}
            onChange={(e) => setDraft({ ...draft, metaDescription: e.target.value })}
            placeholder="One or two sentences summarizing the article..."
            rows={2}
            disabled={generating}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl text-white text-sm placeholder:text-slate-600 focus:outline-none resize-none disabled:opacity-60"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
            <MessageCircleQuestion className="w-3.5 h-3.5" />
            <span>Quick answer</span>
          </label>
          <p className="text-xs text-slate-500">A short, direct answer shown right on the page -- this is what Google tends to pull into a featured snippet.</p>
          <textarea
            value={draft.quickAnswer}
            onChange={(e) => setDraft({ ...draft, quickAnswer: e.target.value })}
            placeholder="The direct 2-3 sentence answer to the article's main question..."
            rows={3}
            disabled={generating}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl text-white text-sm placeholder:text-slate-600 focus:outline-none resize-none disabled:opacity-60"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
              <MessageCircleQuestion className="w-3.5 h-3.5" />
              <span>FAQ (optional)</span>
            </label>
            <button
              type="button"
              onClick={() => setDraft({ ...draft, faqItems: [...draft.faqItems, { question: '', answer: '' }] })}
              disabled={generating}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer disabled:opacity-60"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add question</span>
            </button>
          </div>
          {/* Rendered as a visible accordion at the foot of the guide, and merged into the page's
              FAQPage schema (see GuidePageView.tsx) -- write real, fact-checked answers here.
              Google dropped the FAQ rich-result dropdown for everyone in May 2026, so this no
              longer earns a SERP snippet; it's still worth writing well because it's real content
              readers see, and because a wrong answer here is a wrong answer on the live page, not
              just an unused schema field. */}
          <p className="text-xs text-slate-500">
            Adds a visible FAQ accordion at the bottom of the guide. No SERP dropdown for it anymore (Google retired
            that in May 2026) -- this is for readers and for the page's own FAQPage schema, not a snippet lever.
          </p>
          {draft.faqItems.length > 0 && (
            <div className="space-y-3">
              {draft.faqItems.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Question {idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => setDraft({ ...draft, faqItems: draft.faqItems.filter((_, i) => i !== idx) })}
                      disabled={generating}
                      className="text-slate-500 hover:text-rose-400 cursor-pointer disabled:opacity-60"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={item.question}
                    onChange={(e) => {
                      const next = [...draft.faqItems];
                      next[idx] = { ...next[idx], question: e.target.value };
                      setDraft({ ...draft, faqItems: next });
                    }}
                    placeholder="e.g. Who pays to close out an expired permit in Austin, TX?"
                    disabled={generating}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg text-white text-sm placeholder:text-slate-600 focus:outline-none disabled:opacity-60"
                  />
                  <textarea
                    value={item.answer}
                    onChange={(e) => {
                      const next = [...draft.faqItems];
                      next[idx] = { ...next[idx], answer: e.target.value };
                      setDraft({ ...draft, faqItems: next });
                    }}
                    placeholder="A direct, fact-checked answer -- this is exactly what gets published, verify it before writing it here."
                    rows={2}
                    disabled={generating}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg text-white text-sm placeholder:text-slate-600 focus:outline-none resize-none disabled:opacity-60"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {draft.sources.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Sources cited</label>
            <div className="flex flex-wrap gap-1.5">
              {draft.sources.map((code) => {
                const source = KNOWN_SOURCES.find((s) => s.key === code);
                return (
                  <span key={code} className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300">
                    {source?.name || code}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Article</label>
          <textarea
            value={draft.bodyMarkdown}
            onChange={(e) => {
              setDraft({ ...draft, bodyMarkdown: e.target.value });
              setOverrideTruncatedWarning(false);
              setOverrideAdversarialWarning(false);
            }}
            placeholder="Write the article here, or click Generate with AI above."
            rows={20}
            disabled={generating}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl text-white text-sm leading-relaxed placeholder:text-slate-600 focus:outline-none resize-y font-mono disabled:opacity-60"
          />
        </div>

        {draft.status !== 'published' && (
          <p className="text-xs text-slate-500 pt-2">
            Nothing here is saved until you click <b>Publish now</b> above -- there's no separate draft-save step.
          </p>
        )}
        {draft.status === 'published' && (
          <div className="flex items-center gap-3 pt-2">
            <p className="text-xs text-slate-500">
              Edits here aren't live until you click <b>Update</b> above.
            </p>
            <a
              href={`/guides/${draft.slug}/`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-medium shrink-0"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>View live page</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
