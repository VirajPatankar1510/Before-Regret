import React, { useState } from 'react';
import { Loader2, SlidersHorizontal, AlertCircle } from 'lucide-react';
import {
  CardExtras, cardExtrasLines, sanitizeCardExtras, checkServiceSuggestions,
  MAX_SUGGESTIONS_PER_SEND, SUGGESTION_MAX_CHARS, offersEvaluation,
} from '../data/vendorCardExtras';
import { CardExtrasFields } from './CardExtrasFields';

interface ZipExtrasEditorProps {
  orderId: number;
  trade: string;
  current: CardExtras | null | undefined;
  getToken: () => Promise<string | null>;
  onSaved: () => void;
}

// My Placements: view and change a live Report Ad's optional extras. Separate from the one-time
// contact edit on purpose (see POST /api/my-ads/zip-order/:orderId/extras): changing a price or a
// phone window can't turn the ad into a different business, so it can be changed any time.
export const ZipExtrasEditor: React.FC<ZipExtrasEditorProps> = ({ orderId, trade, current, getToken, onSaved }) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<CardExtras>(current || {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>(Array(MAX_SUGGESTIONS_PER_SEND).fill(''));
  const [suggestState, setSuggestState] = useState<{ sending: boolean; message: string | null; isError: boolean }>({ sending: false, message: null, isError: false });

  const sendSuggestions = async () => {
    const check = checkServiceSuggestions(suggestions);
    if (!check.ok) return setSuggestState({ sending: false, message: check.error || 'Check what you typed.', isError: true });
    setSuggestState({ sending: true, message: null, isError: false });
    const token = await getToken();
    if (!token) return setSuggestState({ sending: false, message: 'Your session has expired -- please sign in again.', isError: true });
    try {
      const res = await fetch(`/api/my-ads/zip-order/${orderId}/suggest-service`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ suggestions: check.suggestions }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) return setSuggestState({ sending: false, message: data?.error || 'Could not send.', isError: true });
      setSuggestions(Array(MAX_SUGGESTIONS_PER_SEND).fill(''));
      setSuggestState({ sending: false, message: "Thanks. We'll read it, and if it's a service we'll add it to the list so you can tick it.", isError: false });
    } catch {
      setSuggestState({ sending: false, message: 'Could not reach the server.', isError: true });
    }
  };

  const lines = cardExtrasLines(current || undefined, trade);
  const summary = [lines.fee, lines.jobs.length ? `Does: ${lines.jobs.join(' · ')}` : '', ...lines.meta].filter(Boolean);

  const save = async () => {
    setError(null);
    const check = sanitizeCardExtras(value, trade);
    if (!check.ok) return setError(check.error || 'Check the extras.');
    setSaving(true);
    const token = await getToken();
    if (!token) {
      setError('Your session has expired -- please sign in again.');
      setSaving(false);
      return;
    }
    try {
      const res = await fetch(`/api/my-ads/zip-order/${orderId}/extras`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cardExtras: check.extras ?? null }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error || 'Could not save your changes.');
        setSaving(false);
        return;
      }
      setSaving(false);
      setOpen(false);
      onSaved();
    } catch {
      setError('Could not reach the server.');
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 text-xs">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 text-slate-600">
          <span className="font-semibold text-slate-700">Optional extras: </span>
          {summary.length > 0 ? summary.join(' · ') : 'none shown yet'}
        </div>
        {!open && (
          <button
            type="button"
            onClick={() => { setValue(current || {}); setOpen(true); }}
            className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900 shrink-0"
          >
            <SlidersHorizontal className="w-3 h-3" /><span>{summary.length > 0 ? 'Change extras' : 'Add extras'}</span>
          </button>
        )}
      </div>
      {open && (
        <div className="mt-2 space-y-2">
          <p className="text-[11px] text-slate-500">
            Applies to all ZIPs in this ad. You can change these any time; it doesn&apos;t use up your one contact edit.
          </p>
          <CardExtrasFields trade={trade} value={value} onChange={setValue} />
          {offersEvaluation(trade) && (
            <div className="px-3.5 py-3 bg-white border border-slate-200 rounded-xl space-y-2">
              <p className="font-bold text-slate-700">Don&apos;t see a job you do? Suggest it</p>
              <p className="text-[11px] text-slate-500 leading-snug">
                Just the name of the service, like &quot;Gas line pressure tests&quot;. Nothing you type here shows on your ad.
                We read each one, and if it&apos;s a service (not a license, award or claim) we add it to the list for your trade
                so you can tick it.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {suggestions.map((v, i) => (
                  <input
                    key={i}
                    type="text"
                    value={v}
                    maxLength={SUGGESTION_MAX_CHARS}
                    onChange={(e) => setSuggestions((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))}
                    aria-label={`Service ${i + 1}`}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-base sm:text-xs bg-white"
                  />
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={sendSuggestions}
                  disabled={suggestState.sending}
                  className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-60 font-semibold text-slate-700 rounded-lg"
                >
                  {suggestState.sending ? 'Sending…' : 'Send suggestion'}
                </button>
                {suggestState.message && (
                  <span role="status" className={suggestState.isError ? 'text-rose-700' : 'text-emerald-700'}>{suggestState.message}</span>
                )}
              </div>
            </div>
          )}
          {error && (
            <p role="alert" className="flex items-start gap-1.5 text-rose-700">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" /><span>{error}</span>
            </p>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-home-navy hover:bg-home-ink disabled:opacity-60 text-white font-bold rounded-lg"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
              <span>{saving ? 'Saving…' : 'Save extras'}</span>
            </button>
            <button type="button" onClick={() => setOpen(false)} className="px-3 py-2 font-semibold text-slate-500 hover:text-slate-800">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
