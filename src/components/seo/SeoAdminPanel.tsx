import React, { useEffect, useState } from 'react';
import {
  Plus, Loader2, FileText, Globe, Clock, ArrowLeft, Save, Send, Undo2, Trash2, AlertCircle
} from 'lucide-react';

interface SeoAdminPanelProps {
  onNavigate: (path: string) => void;
}

interface Article {
  id: number;
  slug: string;
  title: string;
  metaDescription: string;
  bodyMarkdown: string;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

// Real save/publish path against the Neon-backed /api/admin/articles routes (see
// src/server/articlesApi.ts). Two screens on purpose: a list you can scan at a glance, and one
// simple editor. No jargon, no keyword-volume dashboards, no fake pipeline stages -- title,
// description, body, and one Publish button that actually publishes.
export const SeoAdminPanel: React.FC<SeoAdminPanelProps> = ({ onNavigate }) => {
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Article | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

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

  const openEditor = (article: Article) => {
    setActiveId(article.id);
    setDraft(article);
    setActionError(null);
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

  return (
    <div className="bg-slate-950 text-white min-h-screen font-sans">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <button
          onClick={() => { setView('list'); setDraft(null); }}
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

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Title</label>
          <input
            type="text"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="What's this article called?"
            className="w-full px-4 py-3 bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl text-white text-base font-bold placeholder:text-slate-600 focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
            Short description
          </label>
          <p className="text-xs text-slate-500">This is what shows up under the title in Google search results.</p>
          <textarea
            value={draft.metaDescription}
            onChange={(e) => setDraft({ ...draft, metaDescription: e.target.value })}
            placeholder="One or two sentences summarizing the article..."
            rows={2}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl text-white text-sm placeholder:text-slate-600 focus:outline-none resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Article</label>
          <textarea
            value={draft.bodyMarkdown}
            onChange={(e) => setDraft({ ...draft, bodyMarkdown: e.target.value })}
            placeholder="Write the article here..."
            rows={20}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl text-white text-sm leading-relaxed placeholder:text-slate-600 focus:outline-none resize-y font-mono"
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
