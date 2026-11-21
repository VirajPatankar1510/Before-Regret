import React, { useState } from 'react';
import { Loader2, SlidersHorizontal, AlertCircle } from 'lucide-react';
import { CardExtras, cardExtrasLines, sanitizeCardExtras } from '../data/vendorCardExtras';
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

  const lines = cardExtrasLines(current || undefined);
  const summary = [lines.fee, ...lines.meta].filter(Boolean);

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
