import React, { useState, useEffect } from 'react';
import {
  Loader2, AlertCircle, Plus, ExternalLink, Trash2, Copy, Check, ArrowLeft, Link2, Sparkles,
} from 'lucide-react';

// Queue for the guerilla backlink workflow -- see src/server/backlinksApi.ts. Deliberately not a
// self-running scanner: Reddit blocks both search indexing and direct navigation outright, and
// the forums that are reachable (City-Data, Bogleheads) still block automated page-fetching, so
// finding a real thread stays a request made in chat, not a button here. This page is where the
// results of that land -- a queue to track status and store a drafted reply, which is always
// posted by a human, never automatically.

interface Lead {
  id: number;
  source: string;
  title: string;
  url: string;
  topicSnippet: string;
  status: 'new' | 'drafted' | 'posted' | 'dismissed';
  draftAnswer: string;
  countySlug: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_STYLES: Record<Lead['status'], string> = {
  new: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  drafted: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  posted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  dismissed: 'bg-slate-800 text-slate-500 border-slate-700',
};

const inputClass =
  'w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg text-white text-sm placeholder:text-slate-600 focus:outline-none';

// Must match NEW_GUIDE_URL_PLACEHOLDER in src/server/backlinkReplyGenerator.ts.
const NEW_GUIDE_URL_PLACEHOLDER = '[[NEW_GUIDE_URL]]';

interface BacklinksAdminPanelProps {
  onNavigate: (path: string) => void;
}

export const BacklinksAdminPanel: React.FC<BacklinksAdminPanelProps> = ({ onNavigate }) => {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [threadText, setThreadText] = useState('');
  const [countyDataUsed, setCountyDataUsed] = useState<boolean | null>(null);
  const [suggestedGuideTitle, setSuggestedGuideTitle] = useState<string | null>(null);
  const [titleCopied, setTitleCopied] = useState(false);
  const [newGuideUrlInput, setNewGuideUrlInput] = useState('');

  const [newLead, setNewLead] = useState({ source: '', title: '', url: '', topicSnippet: '', countySlug: '' });
  const [editDraft, setEditDraft] = useState({ status: 'new' as Lead['status'], draftAnswer: '' });

  const loadLeads = () => {
    setLoadError(null);
    fetch('/api/admin/backlink-leads')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) setLeads(data.leads);
        else setLoadError(data?.error || 'Could not load leads.');
      })
      .catch(() => setLoadError('Could not reach the server.'));
  };

  useEffect(() => { loadLeads(); }, []);

  const editingLead = editingId != null ? (leads || []).find((l) => l.id === editingId) || null : null;

  const openLead = (lead: Lead) => {
    setEditingId(lead.id);
    setEditDraft({ status: lead.status, draftAnswer: lead.draftAnswer });
    setActionError(null);
    setCopied(false);
    setThreadText('');
    setCountyDataUsed(null);
    setSuggestedGuideTitle(null);
    setTitleCopied(false);
    setNewGuideUrlInput('');
    setView('edit');
  };

  const hasPlaceholder = editDraft.draftAnswer.includes(NEW_GUIDE_URL_PLACEHOLDER);

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.source.trim() || !newLead.title.trim() || !newLead.url.trim()) {
      setActionError('A lead needs at least a source, title, and URL.');
      return;
    }
    setActionError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/admin/backlink-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLead),
      });
      const data = await res.json();
      if (data?.success) {
        setNewLead({ source: '', title: '', url: '', topicSnippet: '', countySlug: '' });
        setShowAddForm(false);
        loadLeads();
      } else {
        setActionError(data?.error || 'Could not save the lead.');
      }
    } catch {
      setActionError('Could not reach the server.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateLead = async () => {
    if (!editingLead) return;
    setActionError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/backlink-leads/${editingLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editDraft),
      });
      const data = await res.json();
      if (data?.success) {
        loadLeads();
        setView('list');
        setEditingId(null);
      } else {
        setActionError(data?.error || 'Could not update the lead.');
      }
    } catch {
      setActionError('Could not reach the server.');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateReply = async () => {
    if (!editingLead || !threadText.trim()) return;
    setActionError(null);
    setGenerating(true);
    try {
      const res = await fetch(`/api/admin/backlink-leads/${editingLead.id}/generate-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadText }),
      });
      const data = await res.json();
      if (data?.success) {
        setEditDraft((prev) => ({ ...prev, draftAnswer: data.draftAnswer }));
        setCountyDataUsed(data.countyDataUsed);
        setSuggestedGuideTitle(data.suggestedGuideTitle ?? null);
        setTitleCopied(false);
        setNewGuideUrlInput('');
      } else {
        setActionError(data?.error || 'Could not generate a reply.');
      }
    } catch {
      setActionError('Could not reach the server.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteLead = async (id: number) => {
    setSaving(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/backlink-leads/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data?.success) {
        loadLeads();
        setView('list');
        setEditingId(null);
      } else {
        setActionError(data?.error || 'Could not delete the lead.');
      }
    } catch {
      setActionError('Could not reach the server.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyDraft = () => {
    if (!editingLead || hasPlaceholder) return;
    navigator.clipboard.writeText(editDraft.draftAnswer).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleCopyTitle = () => {
    if (!suggestedGuideTitle) return;
    navigator.clipboard.writeText(suggestedGuideTitle).then(() => {
      setTitleCopied(true);
      setTimeout(() => setTitleCopied(false), 2000);
    });
  };

  // Client-side only -- swaps the placeholder token for a real URL once the admin has actually
  // published the suggested guide. No Gemini call involved, so it's free and instant.
  const handleInsertGuideUrl = () => {
    const url = newGuideUrlInput.trim();
    if (!url) return;
    setEditDraft((prev) => ({
      ...prev,
      draftAnswer: prev.draftAnswer.split(NEW_GUIDE_URL_PLACEHOLDER).join(url),
    }));
    setNewGuideUrlInput('');
  };

  return (
    <div className="bg-slate-950 text-white min-h-screen font-sans">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Link2 className="w-5 h-5 text-blue-400" />
              Backlink Leads
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Candidate threads from City-Data, Bogleheads, and similar forums. Ask in chat to run a
              search &mdash; results land here. Nothing on this page ever posts anywhere; drafts are
              copied and posted by hand.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <button
              onClick={() => onNavigate('/admin/media-requests')}
              className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              Media requests &rarr;
            </button>
            <button
              onClick={() => onNavigate('/admin/seo')}
              className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              SEO admin &rarr;
            </button>
          </div>
        </div>

        {view === 'list' && (
          <>
            {!showAddForm ? (
              <button
                onClick={() => { setShowAddForm(true); setActionError(null); }}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add lead
              </button>
            ) : (
              <form onSubmit={handleAddLead} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className={inputClass}
                    placeholder="Source (e.g. City-Data)"
                    value={newLead.source}
                    onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                  />
                  <input
                    className={inputClass}
                    placeholder="County slug (optional)"
                    value={newLead.countySlug}
                    onChange={(e) => setNewLead({ ...newLead, countySlug: e.target.value })}
                  />
                </div>
                <input
                  className={inputClass}
                  placeholder="Thread title"
                  value={newLead.title}
                  onChange={(e) => setNewLead({ ...newLead, title: e.target.value })}
                />
                <input
                  className={inputClass}
                  placeholder="URL"
                  value={newLead.url}
                  onChange={(e) => setNewLead({ ...newLead, url: e.target.value })}
                />
                <textarea
                  className={`${inputClass} min-h-[70px] resize-y`}
                  placeholder="Topic snippet / why it's relevant"
                  value={newLead.topicSnippet}
                  onChange={(e) => setNewLead({ ...newLead, topicSnippet: e.target.value })}
                />
                {actionError && (
                  <p className="text-xs text-rose-400 font-medium flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{actionError}</span>
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save lead
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAddForm(false); setActionError(null); }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {loadError && (
              <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-xl text-sm text-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loadError}</span>
              </div>
            )}

            {leads === null && !loadError && (
              <div className="py-16 flex justify-center">
                <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
              </div>
            )}

            {leads !== null && leads.length === 0 && (
              <div className="py-16 text-center text-sm text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                No leads yet. Ask in chat to run a search, or add one manually above.
              </div>
            )}

            {leads !== null && leads.length > 0 && (
              <div className="space-y-2">
                {leads.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => openLead(lead)}
                    className="w-full text-left flex items-start justify-between gap-3 p-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all cursor-pointer"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{lead.source}</span>
                        {lead.countySlug && (
                          <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{lead.countySlug}</span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-white truncate">{lead.title}</p>
                      {lead.topicSnippet && (
                        <p className="text-xs text-slate-500 line-clamp-2">{lead.topicSnippet}</p>
                      )}
                    </div>
                    <span className={`shrink-0 text-[11px] font-bold px-2 py-1 rounded-full border ${STATUS_STYLES[lead.status]}`}>
                      {lead.status}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {view === 'edit' && editingLead && (
          <div className="space-y-4">
            <button
              onClick={() => { setView('list'); setEditingId(null); }}
              className="text-sm text-slate-400 hover:text-slate-200 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to leads
            </button>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{editingLead.source}</span>
                {editingLead.countySlug && (
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{editingLead.countySlug}</span>
                )}
              </div>
              <p className="text-base font-semibold text-white">{editingLead.title}</p>
              <a
                href={editingLead.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1.5 break-all"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                {editingLead.url}
              </a>
              {editingLead.topicSnippet && (
                <p className="text-sm text-slate-400 border-t border-slate-800 pt-3">{editingLead.topicSnippet}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">Status</label>
              <select
                value={editDraft.status}
                onChange={(e) => setEditDraft({ ...editDraft, status: e.target.value as Lead['status'] })}
                className={inputClass}
              >
                <option value="new">New</option>
                <option value="drafted">Drafted</option>
                <option value="posted">Posted</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                Real thread text <span className="text-slate-500 font-normal">(open the URL above, copy the actual post -- the AI only drafts from what's genuinely there, never from the title alone)</span>
              </label>
              <textarea
                value={threadText}
                onChange={(e) => setThreadText(e.target.value)}
                className={`${inputClass} min-h-[120px] resize-y`}
                placeholder="Paste the original poster's actual message here..."
              />
              <button
                onClick={handleGenerateReply}
                disabled={generating || !threadText.trim()}
                className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {generating ? 'Drafting…' : 'Generate reply'}
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                Drafted reply <span className="text-slate-500 font-normal">(generated above, or write it yourself -- review before saving, nothing here ever posts on its own)</span>
              </label>
              {countyDataUsed === false && (
                <p className="text-xs text-amber-400 flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>No county data was attached to this lead, so the draft below doesn't cite any real FEMA/NOAA/EPA numbers -- check it's not vaguer than it needs to be.</span>
                </p>
              )}
              <textarea
                value={editDraft.draftAnswer}
                onChange={(e) => setEditDraft({ ...editDraft, draftAnswer: e.target.value })}
                className={`${inputClass} min-h-[180px] resize-y font-mono`}
                placeholder="No draft yet."
              />
            </div>

            {hasPlaceholder && (
              <div className="p-4 bg-violet-950/40 border border-violet-800 rounded-xl space-y-3">
                <p className="text-sm text-violet-200 flex items-start gap-1.5">
                  <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-violet-400" />
                  <span>
                    This reply points to a guide that doesn&apos;t exist yet &mdash; the draft above
                    has a placeholder (<code className="text-violet-300">{NEW_GUIDE_URL_PLACEHOLDER}</code>)
                    where the link goes. Don&apos;t post it as-is.
                  </span>
                </p>

                {suggestedGuideTitle && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-violet-300">
                      Suggested title &mdash; paste into /admin/seo&apos;s &quot;Exact title&quot; field
                    </label>
                    <div className="flex gap-2">
                      <input readOnly value={suggestedGuideTitle} className={`${inputClass} flex-1`} />
                      <button
                        onClick={handleCopyTitle}
                        className="px-3 py-2 bg-violet-800 hover:bg-violet-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        {titleCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {titleCopied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <button
                      onClick={() => onNavigate('/admin/seo')}
                      className="text-xs text-violet-400 hover:text-violet-300 cursor-pointer"
                    >
                      Open /admin/seo, publish with this title, then come back &rarr;
                    </button>
                  </div>
                )}

                <div className="space-y-1.5 border-t border-violet-800/60 pt-3">
                  <label className="block text-xs font-bold text-violet-300">
                    Once published, paste the real guide URL here
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={newGuideUrlInput}
                      onChange={(e) => setNewGuideUrlInput(e.target.value)}
                      placeholder="https://www.beforeregret.com/guides/..."
                      className={`${inputClass} flex-1`}
                    />
                    <button
                      onClick={handleInsertGuideUrl}
                      disabled={!newGuideUrlInput.trim()}
                      className="px-3 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-bold rounded-lg cursor-pointer shrink-0"
                    >
                      Insert link
                    </button>
                  </div>
                  <p className="text-[11px] text-violet-400/80">
                    Swaps the placeholder for this URL right in the draft above &mdash; no AI call, free.
                  </p>
                </div>
              </div>
            )}

            {actionError && (
              <p className="text-xs text-rose-400 font-medium flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{actionError}</span>
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleUpdateLead}
                disabled={saving}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save
              </button>
              <button
                onClick={handleCopyDraft}
                disabled={!editDraft.draftAnswer || hasPlaceholder}
                title={hasPlaceholder ? "Insert the real guide URL above before copying -- the placeholder isn't a real link." : undefined}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy draft'}
              </button>
              <button
                onClick={() => handleDeleteLead(editingLead.id)}
                disabled={saving}
                className="px-4 py-2.5 bg-rose-950/60 hover:bg-rose-950 border border-rose-800 disabled:opacity-40 text-rose-300 text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
