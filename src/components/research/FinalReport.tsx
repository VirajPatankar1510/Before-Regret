import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { PropertyReport, PropertySearchResult } from '../../types';
import { forDeadlineDeep, type ResearchState } from './researchState';
import type { Updater } from './ui';

// The final outcome of the guided flow (owner, 2026-11-18: "the report should be the final outcome after the
// progress"): the same free report the quick path builds -- same endpoint, same server-side address gate, same
// engine -- with the visitor's own findings placed first. The findings stay on the device; the saved report is the
// standard area report.

const PropertyReportView = lazy(() => import('../PropertyReportView').then((m) => ({ default: m.PropertyReportView })));

export type BuildResult = { report: PropertyReport } | { error: string };

/** Mirrors the request App.tsx sends for the quick report. */
export async function buildFullReport(p: PropertySearchResult): Promise<BuildResult> {
  try {
    const res = await fetch('/api/property/generate-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: p.formattedAddress || p.displayName,
        city: p.city,
        state: p.state,
        zipCode: p.zipCode,
        county: p.county,
        propertyType: p.propertyType,
        declaredPropertyType: p.declaredPropertyType,
        unitNumber: p.unitNumber,
        yearBuilt: p.yearBuilt,
        usefulSourcesCount: 18,
        price: 0,
        // The assent notice sits directly under the "Get my report" button (GetReport, FinishCard).
        attestedAccurate: true,
        isPaid: false,
      }),
    });
    const json = (res.headers.get('content-type') || '').includes('application/json') ? await res.json().catch(() => null) : null;
    if (res.status === 429) return { error: json?.error || 'You’ve reached today’s report limit. You can get more reports tomorrow. Your answers are saved on this device.' };
    if (res.ok && json?.report) return { report: json.report as PropertyReport };
  } catch (e) {}
  return { error: 'We couldn’t build your report just now. Your answers are saved on this device, so try again in a minute.' };
}

export const FinalReportView: React.FC<{
  state: ResearchState;
  update: Updater;
  report: PropertyReport | null;
  setReport: (r: PropertyReport) => void;
  onReset: () => void;
  findings: React.ReactNode;
}> = ({ state, update, report, setReport, onReset, findings }) => {
  const [failed, setFailed] = useState(false);
  // The area report's timing lines fit this visitor's stage, as the research section's do.
  const shown = useMemo(() => (report ? forDeadlineDeep(report, state) : null), [report, state.stage, state.deadline, state.property.state]);

  // After a reload the report is fetched again by its id; the findings come from this device's storage.
  useEffect(() => {
    if (report || !state.finalReportId) return;
    let cancelled = false;
    fetch(`/api/insights/${encodeURIComponent(state.finalReportId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled) { if (d?.report) setReport(d.report); else setFailed(true); } })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [report, state.finalReportId, setReport]);

  const back = (
    <div className="max-w-3xl mx-auto px-4 pt-4 print:hidden">
      <button type="button" onClick={() => update({ view: 'plan' })} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900 cursor-pointer">
        <ArrowLeft className="w-4 h-4" /> Your questions
      </button>
    </div>
  );

  if (!report) {
    return (
      <div className="min-h-[60vh] bg-home-stone">
        {back}
        <div className="flex items-center justify-center gap-3 py-24 text-slate-600">
          {failed ? <p className="max-w-md text-center px-4">We couldn’t load your report. Go back to your questions and get it again.</p> : <><Loader2 className="w-5 h-5 animate-spin" /> Loading your report…</>}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50">
      {back}
      <Suspense fallback={<div className="flex justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>}>
        <PropertyReportView report={shown!} onNewSearch={onReset} researchSection={{ label: 'Your research', title: 'Your research', node: findings }} />
      </Suspense>
    </div>
  );
};
