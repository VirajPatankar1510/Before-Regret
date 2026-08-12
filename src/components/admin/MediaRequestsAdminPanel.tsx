import React, { useState, useEffect } from 'react';
import {
  Loader2, AlertCircle, Plus, Trash2, Copy, Check, ArrowLeft, Newspaper, Sparkles, Clock,
} from 'lucide-react';

// Queue for journalist source requests (Connectively/Qwoted/Featured) -- see
// src/server/mediaRequestsApi.ts. These platforms require a real account to even see a query, so
// finding one stays a manual step: sign up, watch for relevant requests, paste the real query text
// in here. This page tracks status and stores a drafted response, which is always reviewed and
// submitted by a human, never automatically.

interface MediaRequest {
  id: number;
  platform: string;
  outletName: string;
  queryText: string;
  topicSnippet: string;
  deadline: string | null;
  status: 'new' | 'drafted' | 'submitted' | 'expired' | 'dismissed';
  draftResponse: string;
  countySlug: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_STYLES: Record<MediaRequest['status'], string> = {
  new: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  drafted: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  submitted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  expired: 'bg-slate-800 text-slate-500 border-slate-700',
  dismissed: 'bg-slate-800 text-slate-500 border-slate-700',
};

const inputClass =
  'w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg text-white text-sm placeholder:text-slate-600 focus:outline-none';

const PLATFORMS = ['Connectively', 'Qwoted', 'Featured', 'Other'];

/** Short, human deadline label with urgency color -- these queries expire in hours, not days. */
function deadlineBadge(deadline: string | null): { label: string; className: string } | null {
  if (!deadline) return null;
  const ms = new Date(deadline).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  if (ms <= 0) return { label: 'Deadline passed', className: 'text-slate-500' };
  const hours = ms / (1000 * 60 * 60);
  if (hours < 6) return { label: `${Math.round(hours)}h left`, className: 'text-rose-400' };
  if (hours < 24) return { label: `${Math.round(hours)}h left`, className: 'text-amber-400' };
  return { label: `${Math.round(hours / 24)}d left`, className: 'text-slate-400' };
}

interface MediaRequestsAdminPanelProps {
  onNavigate: (path: string) => void;
}

export const MediaRequestsAdminPanel: React.FC<MediaRequestsAdminPanelProps> = ({ onNavigate }) => {
  const [requests, setRequests] = useState<MediaRequest[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [queryText, setQueryText] = useState('');
  const [countyDataUsed, setCountyDataUsed] = useState<boolean | null>(null);

  const [newRequest, setNewRequest] = useState({
    platform: PLATFORMS[0], outletName: '', topicSnippet: '', deadline: '', countySlug: '',
  });
  const [editDraft, setEditDraft] = useState({ status: 'new' as MediaRequest['status'], draftResponse: '' });

  const loadRequests = () => {
    setLoadError(null);
    fetch('/api/admin/media-requests')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) setRequests(data.requests);
        else setLoadError(data?.error || 'Could not load media requests.');
      })
      .catch(() => setLoadError('Could not reach the server.'));
  };

  useEffect(() => { loadRequests(); }, []);

  const editingRequest = editingId != null ? (requests || []).find((r) => r.id === editingId) || null : null;

  const openRequest = (request: MediaRequest) => {
    setEditingId(request.id);
    setEditDraft({ status: request.status, draftResponse: request.draftResponse });
    setActionError(null);
    setCopied(false);
    setQueryText('');
    setCountyDataUsed(null);
    setView('edit');
  };

  const handleAddRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequest.platform.trim()) {
      setActionError('A media request needs at least a platform.');
      return;
    }
    setActionError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/admin/media-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newRequest,
          deadline: newRequest.deadline ? new Date(newRequest.deadline).toISOString() : null,
        }),
      });
      const data = await res.json();
      if (data?.success) {
        setNewRequest({ platform: PLATFORMS[0], outletName: '', topicSnippet: '', deadline: '', countySlug: '' });
        setShowAddForm(false);
        loadRequests();
      } else {
        setActionError(data?.error || 'Could not save the media request.');
      }
    } catch {
      setActionError('Could not reach the server.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRequest = async () => {
    if (!editingRequest) return;
    setActionError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/media-requests/${editingRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editDraft),
      });
      const data = await res.json();
      if (data?.success) {
        loadRequests();
        setView('list');
        setEditingId(null);
      } else {
        setActionError(data?.error || 'Could not update the request.');
      }
    } catch {
      setActionError('Could not reach the server.');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateResponse = async () => {
    if (!editingRequest || !queryText.trim()) return;
    setActionError(null);
    setGenerating(true);
    try {
      const res = await fetch(`/api/admin/media-requests/${editingRequest.id}/generate-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryText }),
      });
      const data = await res.json();
      if (data?.success) {
        setEditDraft((prev) => ({ ...prev, draftResponse: data.draftResponse }));
        setCountyDataUsed(data.countyDataUsed);
      } else {
        setActionError(data?.error || 'Could not generate a response.');
      }
    } catch {
      setActionError('Could not reach the server.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteRequest = async (id: number) => {
    setSaving(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/media-requests/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data?.success) {
        loadRequests();
        setView('list');
        setEditingId(null);
      } else {
        setActionError(data?.error || 'Could not delete the request.');
      }
    } catch {
      setActionError('Could not reach the server.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyDraft = () => {
    if (!editingRequest) return;
    navigator.clipboard.writeText(editDraft.draftResponse).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-slate-950 text-white min-h-screen font-sans">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-blue-400" />
              Media Requests
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Journalist source requests from Connectively, Qwoted, and Featured. These platforms
              require a real account, so finding a query is manual &mdash; paste one in below.
              Nothing here ever submits anywhere; drafts are copied and submitted by hand.
            </p>
          </div>
          <button
            onClick={() => onNavigate('/admin/backlinks')}
            className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer shrink-0"
          >
            Backlinks &rarr;
          </button>
        </div>

        {view === 'list' && (
          <>
            {!showAddForm ? (
              <button
                onClick={() => { setShowAddForm(true); setActionError(null); }}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add request
              </button>
            ) : (
              <form onSubmit={handleAddRequest} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <select
                    className={inputClass}
                    value={newRequest.platform}
                    onChange={(e) => setNewRequest({ ...newRequest, platform: e.target.value })}
                  >
                    {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <input
                    className={inputClass}
                    placeholder="County slug (optional)"
                    value={newRequest.countySlug}
                    onChange={(e) => setNewRequest({ ...newRequest, countySlug: e.target.value })}
                  />
                </div>
                <input
                  className={inputClass}
                  placeholder="Outlet name (e.g. a local news site, if given)"
                  value={newRequest.outletName}
                  onChange={(e) => setNewRequest({ ...newRequest, outletName: e.target.value })}
                />
                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-500">Deadline (optional, but these expire fast)</label>
                  <input
                    type="datetime-local"
                    className={inputClass}
                    value={newRequest.deadline}
                    onChange={(e) => setNewRequest({ ...newRequest, deadline: e.target.value })}
                  />
                </div>
                <textarea
                  className={`${inputClass} min-h-[70px] resize-y`}
                  placeholder="Topic snippet / why it's relevant"
                  value={newRequest.topicSnippet}
                  onChange={(e) => setNewRequest({ ...newRequest, topicSnippet: e.target.value })}
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
                    Save request
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

            {requests === null && !loadError && (
              <div className="py-16 flex justify-center">
                <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
              </div>
            )}

            {requests !== null && requests.length === 0 && (
              <div className="py-16 text-center text-sm text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                No media requests yet. Sign up on Connectively, Qwoted, or Featured, and add one when a relevant query shows up.
              </div>
            )}

            {requests !== null && requests.length > 0 && (
              <div className="space-y-2">
                {requests.map((request) => {
                  const badge = deadlineBadge(request.deadline);
                  return (
                    <button
                      key={request.id}
                      onClick={() => openRequest(request)}
                      className="w-full text-left flex items-start justify-between gap-3 p-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all cursor-pointer"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{request.platform}</span>
                          {request.countySlug && (
                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{request.countySlug}</span>
                          )}
                          {badge && (
                            <span className={`text-[11px] font-bold flex items-center gap-1 ${badge.className}`}>
                              <Clock className="w-3 h-3" />
                              {badge.label}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-white truncate">{request.outletName || '(outlet not given)'}</p>
                        {request.topicSnippet && (
                          <p className="text-xs text-slate-500 line-clamp-2">{request.topicSnippet}</p>
                        )}
                      </div>
                      <span className={`shrink-0 text-[11px] font-bold px-2 py-1 rounded-full border ${STATUS_STYLES[request.status]}`}>
                        {request.status}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {view === 'edit' && editingRequest && (
          <div className="space-y-4">
            <button
              onClick={() => { setView('list'); setEditingId(null); }}
              className="text-sm text-slate-400 hover:text-slate-200 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to requests
            </button>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{editingRequest.platform}</span>
                {editingRequest.countySlug && (
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{editingRequest.countySlug}</span>
                )}
                {(() => {
                  const badge = deadlineBadge(editingRequest.deadline);
                  return badge && (
                    <span className={`text-[11px] font-bold flex items-center gap-1 ${badge.className}`}>
                      <Clock className="w-3 h-3" />
                      {badge.label}
                    </span>
                  );
                })()}
              </div>
              <p className="text-base font-semibold text-white">{editingRequest.outletName || '(outlet not given)'}</p>
              {editingRequest.topicSnippet && (
                <p className="text-sm text-slate-400 border-t border-slate-800 pt-3">{editingRequest.topicSnippet}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">Status</label>
              <select
                value={editDraft.status}
                onChange={(e) => setEditDraft({ ...editDraft, status: e.target.value as MediaRequest['status'] })}
                className={inputClass}
              >
                <option value="new">New</option>
                <option value="drafted">Drafted</option>
                <option value="submitted">Submitted</option>
                <option value="expired">Expired</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                Real query text <span className="text-slate-500 font-normal">(paste the journalist's actual request from the platform &mdash; the AI only drafts from what's genuinely asked, never from the outlet name alone)</span>
              </label>
              <textarea
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                className={`${inputClass} min-h-[120px] resize-y`}
                placeholder="Paste the journalist's actual query here..."
              />
              <button
                onClick={handleGenerateResponse}
                disabled={generating || !queryText.trim()}
                className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {generating ? 'Drafting…' : 'Generate response'}
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                Drafted response <span className="text-slate-500 font-normal">(generated above, or write it yourself &mdash; review before saving, nothing here ever submits on its own)</span>
              </label>
              {countyDataUsed === false && (
                <p className="text-xs text-amber-400 flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>No county data was attached to this request, so the draft below doesn't cite any real FEMA/NOAA/EPA numbers &mdash; check it's not vaguer than it needs to be.</span>
                </p>
              )}
              <textarea
                value={editDraft.draftResponse}
                onChange={(e) => setEditDraft({ ...editDraft, draftResponse: e.target.value })}
                className={`${inputClass} min-h-[180px] resize-y font-mono`}
                placeholder="No draft yet."
              />
            </div>

            {actionError && (
              <p className="text-xs text-rose-400 font-medium flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{actionError}</span>
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleUpdateRequest}
                disabled={saving}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save
              </button>
              <button
                onClick={handleCopyDraft}
                disabled={!editDraft.draftResponse}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy draft'}
              </button>
              <button
                onClick={() => handleDeleteRequest(editingRequest.id)}
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
