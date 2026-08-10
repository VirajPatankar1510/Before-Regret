import React, { useEffect, useState } from 'react';
import {
  Plus, Loader2, FileText, Globe, Clock, ArrowLeft, Save, Send, Undo2, Trash2, AlertCircle, Sparkles,
  Link2, Lock, MessageCircleQuestion, Gauge, ChevronDown, ChevronUp
} from 'lucide-react';
import { KNOWN_SOURCES } from '../../data/knownSources';
import { titleSimilarity, STOPWORDS } from '../../utils/relatedGuides';

interface SeoAdminPanelProps {
  onNavigate: (path: string) => void;
}

interface Article {
  id: number;
  slug: string;
  title: string;
  metaDescription: string;
  bodyMarkdown: string;
  quickAnswer: string;
  sources: string[];
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

// Shape returned by GET /api/admin/gemini-usage (see src/server/articlesApi.ts). costUsd is
// null, not 0, whenever GEMINI_MODEL has no verified pricing entry in geminiUsageTracker.ts --
// the UI renders that as "cost unknown" rather than a fabricated "$0.00".
interface GeminiUsageSummary {
  today: { tokens: number; costUsd: number | null; calls: number };
  month: { tokens: number; costUsd: number | null };
  allTime: { tokens: number; costUsd: number | null; calls: number };
  model: string;
  recent: Array<{ created_at: string; source: string; model: string; total_tokens: number; estimated_cost_usd: number | null }>;
}

// titleSimilarity (imported above, from src/utils/relatedGuides.ts) flags a title that clearly
// overlaps with an existing article the moment you type it, before you even click Generate -- not
// a semantic/embedding comparison, just shared significant words as a fraction of the shorter
// title's word count. The server-side duplicate guard (existing titles fed into the Gemini
// prompt, see src/server/articleGenerator.ts) is the one actually steering what gets written; this
// is just an instant heads-up in the UI. The same function also ranks "Related Guides" links on
// each published guide page (see GuidePageView.tsx and scripts/prerender-guides.tsx) -- one
// implementation, two different uses of the same "how much title vocabulary overlaps" signal.

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
  const [savedNotice, setSavedNotice] = useState(false);
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

  // Gemini token/cost counter (see src/server/geminiUsageTracker.ts). "Real time" here means
  // polled every 20s while this screen is open, not a websocket push -- a cost dashboard doesn't
  // need sub-second latency, and polling is the whole mechanism, not a placeholder for something
  // fancier later.
  const [geminiUsage, setGeminiUsage] = useState<GeminiUsageSummary | null>(null);
  const [geminiUsageError, setGeminiUsageError] = useState<string | null>(null);
  const [usageDetailOpen, setUsageDetailOpen] = useState(false);

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

  const generateWithAi = async () => {
    if (!draft || generating) return;
    const trimmedExactTitle = exactTitleInput.trim();
    const trimmedTopic = topicInput.trim();
    setGenerating(true);
    setActionError(null);
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

  const saveDraft = async () => {
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
          slug: draft.slug,
        }),
      });
      const data = await res.json();
      if (data?.success) {
        setDraft(data.article);
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 2000);
      } else {
        setActionError(data?.error || 'Could not save your changes.');
      }
    } catch {
      setActionError('Could not reach the server.');
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async () => {
    if (!draft) return;
    setSaving(true);
    setActionError(null);
    const endpoint = draft.status === 'published' ? 'unpublish' : 'publish';
    try {
      const res = await fetch(`/api/admin/articles/${draft.id}/${endpoint}`, { method: 'POST' });
      const data = await res.json();
      if (data?.success) {
        setDraft(data.article);
        loadArticles();
      } else {
        setActionError(data?.error || 'Could not update the article status.');
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
    a.sources.length === 0;

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
                            {r.source === 'report_generation' ? 'Property report' : r.source === 'article_generation' ? 'Article (admin)' : 'Batch draft'}
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

  // Exact title wins over the saved draft title for this check too, same precedence as
  // generation itself -- otherwise typing a duplicate into "Exact title" shows no warning at all
  // until after Generate has already run and overwritten draft.title.
  const titleToCheckForDuplicates = exactTitleInput.trim() || draft.title.trim();
  const similarExisting = titleToCheckForDuplicates && articles
    ? articles.find((a) => a.id !== draft.id && titleSimilarity(a.title, titleToCheckForDuplicates) > 0.5)
    : undefined;

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
              <button
                onClick={togglePublish}
                disabled={saving}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg transition-all cursor-pointer disabled:opacity-50"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Unpublish</span>
              </button>
            ) : (
              <button
                onClick={togglePublish}
                disabled={saving}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
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

        {similarExisting && (
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
              <span> ({similarExisting.status === 'published' ? 'live' : 'draft'}). Consider a different angle, or open it to edit instead.</span>
            </div>
          </div>
        )}

        <div className="p-4 bg-indigo-950/40 border border-indigo-800/60 rounded-2xl space-y-3">
          <div className="text-sm font-bold text-white flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Write a first draft with AI</span>
          </div>
          <p className="text-xs text-slate-400">
            Fill in one of the two fields below, not both -- exact title wins if you do.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              Topic <span className="text-slate-500 font-normal normal-case">— AI picks the best SEO title</span>
            </label>
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="e.g. Zinsco electrical panels — leave blank for a pillar-based suggestion"
              disabled={generating}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg text-white text-sm placeholder:text-slate-600 focus:outline-none disabled:opacity-60"
            />
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
              onChange={(e) => setExactTitleInput(e.target.value)}
              placeholder="e.g. Buying a House With a Zinsco Panel"
              disabled={generating}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg text-white text-sm placeholder:text-slate-600 focus:outline-none disabled:opacity-60"
            />
          </div>

          <button
            onClick={generateWithAi}
            disabled={generating}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{generating ? 'Writing...' : 'Generate with AI'}</span>
          </button>

          {previousAttempts.length > 0 && (
            <p className="text-[11px] text-slate-500">
              {previousAttempts.length} earlier {previousAttempts.length === 1 ? 'attempt' : 'attempts'} this session will be avoided on the next generate.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Title</label>
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
            onChange={(e) => setDraft({ ...draft, bodyMarkdown: e.target.value })}
            placeholder="Write the article here, or click Generate with AI above."
            rows={20}
            disabled={generating}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl text-white text-sm leading-relaxed placeholder:text-slate-600 focus:outline-none resize-y font-mono disabled:opacity-60"
          />
        </div>

        <div className="flex items-center gap-3 pt-2 sticky bottom-4">
          <button
            onClick={saveDraft}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-lg"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{savedNotice ? 'Saved' : 'Save'}</span>
          </button>
          {draft.status === 'published' && (
            <a
              href={`/guides/${draft.slug}/`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-medium"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>View live page</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
