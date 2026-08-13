import React, { useEffect, useState } from 'react';
import {
  Plus, Loader2, FileText, Globe, Clock, ArrowLeft, Send, Undo2, Trash2, AlertCircle, Sparkles,
  Link2, Lock, MessageCircleQuestion, Gauge, ChevronDown, ChevronUp, CloudLightning, BarChart3,
  Library
} from 'lucide-react';
import { KNOWN_SOURCES } from '../../data/knownSources';
import { STOPWORDS } from '../../utils/relatedGuides';
import { buildPageTitle } from '../../utils/pageTitle';

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
}

interface GeminiUsageSummary {
  today: { tokens: number; costUsd: number | null; calls: number };
  month: { tokens: number; costUsd: number | null };
  allTime: { tokens: number; costUsd: number | null; calls: number };
  model: string;
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
  // Real search phrases sent alongside the next generate call so the article's own wording
  // reflects how people actually search this topic -- set when a keyword-list row is picked
  // (see the click handler below), cleared on manual typing so a stale list from a previous
  // topic never silently leaks into an unrelated generation.
  const [seoKeywordHints, setSeoKeywordHints] = useState<string[]>([]);
  // The overlap check below is a heuristic, and heuristics have false positives -- this is the
  // escape hatch for when it's wrong about a specific title, rather than a hard block with no way
  // through. Reset on any manual edit to Topic/Exact Title so it never silently carries over to a
  // different, unrelated title typed afterward.
  const [overrideSimilarWarning, setOverrideSimilarWarning] = useState(false);

  // Same escape-hatch pattern as overrideSimilarWarning above, for a different real bug: a
  // generation stream that errors out mid-response (or gets published while still streaming --
  // see the generating-disabled wiring on the Publish/Update buttons below) leaves a real,
  // finished-looking draft that actually ends mid-sentence. Confirmed live: a published Clark
  // County guide ends "...City of North Las Vegas: Maintains" with nothing after it -- 317 words
  // against a 1,200-1,800 word target, no closing section, no punctuation at all on the last
  // line. Reset whenever the body is edited so a genuine fix (or a new generation) re-evaluates
  // cleanly instead of carrying a stale override forward.
  const [overrideTruncatedWarning, setOverrideTruncatedWarning] = useState(false);

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
  const [countyEventChecking, setCountyEventChecking] = useState(false);
  const [countyEventResult, setCountyEventResult] = useState<{
    declarationsChecked: number; coveredCountyMatches: number; alreadyProcessed: number; draftsCreated: number; errors: string[]; lookbackDays: number;
  } | null>(null);
  const [countyEventError, setCountyEventError] = useState<string | null>(null);
  // Defaults to the same 14-day window the daily cron uses. Widening it is the actual way to test
  // this against real historical declarations instead of waiting for a live one to land inside a
  // 31-county footprint -- capped server-side at 400 days regardless of what's entered here.
  const [countyEventLookbackDays, setCountyEventLookbackDays] = useState('14');

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
    loadDefectLibraryStatus();
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
    setPreviousAttempts([]);
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
    const sourcesMatch = headerBlock.match(/^SOURCES:\s*(.+)$/m);
    const knownKeys = new Set(KNOWN_SOURCES.map((s) => s.key));
    const sources = sourcesMatch
      ? sourcesMatch[1].split(',').map((s) => s.trim().toUpperCase()).filter((s) => knownKeys.has(s))
      : [];
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
              Checks OpenFEMA for new disaster declarations in counties this site already covers, and drafts an article for each new match -- same as the daily automatic check (which always uses 14 days). Widen the lookback above to test against real past declarations instead of waiting for a live one -- coverage is broader now (60 counties across 22 states) but a match inside 14 days is still not guaranteed. Drafts land below like any other article; nothing publishes on its own.
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
                  {countyEventResult.draftsCreated > 0 ? (
                    <span className="text-emerald-400 font-semibold">{countyEventResult.draftsCreated} new draft{countyEventResult.draftsCreated === 1 ? '' : 's'} created.</span>
                  ) : (
                    <span className="text-slate-500">No new drafts -- {countyEventResult.alreadyProcessed} already processed.</span>
                  )}
                </p>
                {countyEventResult.errors.length > 0 && (
                  <p className="text-amber-400">{countyEventResult.errors.length} failed: {countyEventResult.errors.join('; ')}</p>
                )}
              </div>
            )}
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
                <span>Gemini usage{geminiUsage?.model ? ` (${geminiUsage.model})` : ''}</span>
              </div>
              {geminiUsage && (
                <button
                  onClick={() => setUsageDetailOpen((v) => !v)}
                  className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>Recent calls</span>
                  {usageDetailOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
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
  const titleToCheckForDuplicates = exactTitleInput.trim() || topicInput.trim() || draft.title.trim();
  const otherArticles = articles ? articles.filter((a) => a.id !== draft.id) : [];
  const titleOverlap = titleToCheckForDuplicates
    ? bestTitleOverlap(titleToCheckForDuplicates, otherArticles.map((a) => a.title))
    : undefined;
  const similarExisting = titleOverlap && titleOverlap.score > 0.5
    ? otherArticles[titleOverlap.matchIndex]
    : undefined;

  // A complete article body always ends in sentence-terminating punctuation (the generation
  // prompt asks it to close with a concrete next step, not a dangling list item or table row) --
  // a stream cut off mid-word leaves the last line with no terminal punctuation at all, which is
  // the actual, confirmed signature of the truncated-publish bug above. Empty bodies are handled
  // by hasExistingContent elsewhere, not flagged here as "truncated."
  const bodyTrimmed = draft.bodyMarkdown.trim();
  const looksTruncated = bodyTrimmed.length > 0 && !/[.!?]["')\]]?\s*$/.test(bodyTrimmed);

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
                  disabled={saving || generating || (looksTruncated && !overrideTruncatedWarning)}
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
                disabled={saving || generating || (looksTruncated && !overrideTruncatedWarning)}
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
                Not connected yet -- set BING_WEBMASTER_API_KEY to enable this (reports real search interest even for topics this site hasn't covered yet, unlike Search Console).
              </p>
            )}
            {keywordError && <p className="text-[11px] text-rose-400">{keywordError}</p>}
            {keywordConfigured && keywordResults.length === 0 && !keywordLoading && !keywordError && (
              <p className="text-[11px] text-slate-500">No real queries found for this yet -- try a broader term, or this may just be a new angle.</p>
            )}
            {keywordResults.length > 0 && (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {keywordResults.map((row) => (
                  <button
                    key={row.query}
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
                      setSeoKeywordHints(hints);
                    }}
                    className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 rounded-lg text-left cursor-pointer disabled:opacity-50"
                  >
                    <span className="text-xs text-slate-300 truncate">{row.query}</span>
                    <span className="text-[10px] font-mono text-slate-500 shrink-0">
                      {row.impressions} impr{row.position != null ? ` · pos ${row.position.toFixed(1)}` : ''}
                    </span>
                  </button>
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
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              Exact title <span className="text-slate-500 font-normal normal-case">— used word-for-word, never rephrased</span>
            </label>
            <input
              type="text"
              value={exactTitleInput}
              onChange={(e) => {
                setExactTitleInput(e.target.value);
                setSeoKeywordHints([]);
                setOverrideSimilarWarning(false);
              }}
              placeholder="e.g. Buying a House With a Zinsco Panel"
              disabled={generating || hasExistingContent}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg text-white text-sm placeholder:text-slate-600 focus:outline-none disabled:opacity-60"
            />
          </div>

          <button
            onClick={() => generateWithAi()}
            disabled={generating || hasExistingContent || (!!similarExisting && !overrideSimilarWarning)}
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
                when it still fits under 70 chars (see src/utils/pageTitle.ts), so a title that's
                fine on its own is always safe regardless of the suffix. A title over 70 on its
                own is the one case that fallback can't fix, since dropping the suffix doesn't
                help -- that has to be shortened here. */}
            <span
              className={`text-xs font-mono flex items-center gap-1 ${
                draft.title.length > 70 ? 'text-rose-400' : 'text-slate-500'
              }`}
            >
              {draft.title.length > 70 && <AlertCircle className="w-3 h-3" />}
              <span>{draft.title.length}/70</span>
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
                {suffixDropped && draft.title.length <= 70 && (
                  <span> (brand suffix dropped -- wouldn't fit under 70 chars with it)</span>
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
