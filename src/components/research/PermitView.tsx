import React, { useEffect, useState } from 'react';
import { ArrowRight, Check, ExternalLink, Info, Loader2 } from 'lucide-react';
import { ContentLink } from '../home/ContentLink';
import type { PermitAuthority } from '../../data/permitRecords/authority';
import type { HistoricalSystem, SearchBy } from '../../data/permitRecords/schema';
import { answerFor, loadPermitIndex, shown, type PermitAnswer } from './permitAnswer';
import {
  GENERAL_PERMITS_GUIDE, OPEN_PERMITS_GUIDE, itemLabel, listOf, permitItems, permitMeaning,
  type OfficeSnapshot, type PermitFinding, type PermitItemKey, type ResearchState,
} from './researchState';
import { BackToPlan, SolvedBadge, btnPrimary, card, eyebrow, linkBtn, type Updater } from './ui';

// The permit question (Stage 2 of docs/plans/guided-research-tool-2026-11.md; coverage plan
// docs/plans/permit-coverage-usa-2026-11.md). Every address gets the likely office from Census boundaries;
// addresses in researched jurisdictions also get the verified portal facts, each with its status and date.

const OWNER_NOT_RESEARCHED =
  'We haven’t researched this jurisdiction yet. That doesn’t mean permit records are unavailable. Start with our general guide to finding building permits by address, which explains how to identify the responsible department and request historical records.';

function fmtChecked(iso: string | undefined): string {
  if (!iso) return '';
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const Status: React.FC<{ status: 'verified' | 'partially_verified'; checkedOn?: string; limits?: string }> = ({ status, checkedOn, limits }) => (
  <span className="block mt-1 text-[11px] text-slate-500">
    <span className={`inline-block rounded-full px-2 py-0.5 font-bold mr-1.5 ${status === 'verified' ? 'bg-home-sage text-home-moss' : 'bg-amber-50 text-amber-800'}`}>
      {status === 'verified' ? 'Verified' : 'Partly verified'}
    </span>
    {checkedOn && <>Checked by Before Regret {fmtChecked(checkedOn)}</>}
    {status === 'partially_verified' && limits && <span className="block mt-0.5">{limits}</span>}
  </span>
);

function snapshot(ans: PermitAnswer): OfficeSnapshot {
  const r = ans.record;
  const portal = shown<{ name: string }>(r, 'currentPortal');
  return {
    label: ans.officeLabel,
    department: shown<string>(r, 'buildingDepartment')?.value ?? null,
    portalName: portal?.value?.name ?? null,
    portalUrl: shown<string>(r, 'portalUrl')?.value ?? null,
    // Only a fully verified start year is repeated in the answers and the report; a partly verified one stays on the
    // "where to look" screen beside its stated limits.
    onlineFrom: (() => { const f = shown<string>(r, 'onlineRecordsFrom'); return f?.status === 'verified' ? f.value : null; })(),
    level: ans.level,
    // Only a fully verified state note travels into the answers and the report.
    outsideCityNote: ans.stateNotes?.outsideCityLimits?.status === 'verified' ? ans.stateNotes.outsideCityLimits.value : null,
    outsideCityJobNote: ans.stateNotes?.outsideCityJobs?.status === 'verified' ? ans.stateNotes.outsideCityJobs.value : null,
  };
}

export const PermitView: React.FC<{ state: ResearchState; update: Updater; onNavigate: (path: string) => void }> = ({ state, update, onNavigate }) => {
  const [answer, setAnswer] = useState<PermitAnswer | null>(null);
  const p = state.permits;
  const setPermits = (patch: Partial<ResearchState['permits']>) => update((s) => ({ permits: { ...s.permits, ...patch } }));

  // Look up the likely office once per house (cached on the device), then match it against our database.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let authority: PermitAuthority | null | undefined = p.authority;
      if (authority === undefined) {
        const { lat, lon } = state.property;
        authority = null;
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          try {
            const r = await fetch('/api/research/permit-office', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lat, lon }) });
            if (r.ok) authority = (await r.json())?.authority ?? null;
          } catch (e) {}
        }
        if (!cancelled) setPermits({ authority });
      }
      const index = await loadPermitIndex();
      if (!cancelled) setAnswer(answerFor(index, authority ?? null));
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!answer) {
    return (
      <section className="space-y-5">
        <BackToPlan update={update} />
        <div className="flex items-center gap-3 text-slate-600 py-10 justify-center"><Loader2 className="w-5 h-5 animate-spin" /> Finding who keeps the permits for this address…</div>
      </section>
    );
  }

  if (p.stage === 'solved') return <Solved state={state} update={update} setPermits={setPermits} onNavigate={onNavigate} />;
  if (p.stage === 'record') return <Record state={state} update={update} setPermits={setPermits} onNavigate={onNavigate} answer={answer} />;
  return <How state={state} update={update} setPermits={setPermits} onNavigate={onNavigate} answer={answer} />;
};

type SubProps = { state: ResearchState; update: Updater; setPermits: (patch: Partial<ResearchState['permits']>) => void; onNavigate: (path: string) => void };

// ---------------------------------------------------------------------------------------------------------------

const How: React.FC<SubProps & { answer: PermitAnswer }> = ({ state, update, setPermits, onNavigate, answer }) => {
  const r = answer.record;
  const dept = shown<string>(r, 'buildingDepartment');
  const portal = shown<{ name: string; platform?: string }>(r, 'currentPortal');
  const url = shown<string>(r, 'portalUrl');
  const searchBy = shown<SearchBy>(r, 'searchBy');
  const tested = shown<string>(r, 'addressSearchTested');
  const online = shown<string>(r, 'onlineRecordsFrom');
  const history = shown<HistoricalSystem[]>(r, 'historicalSystems');
  const older = shown<string>(r, 'olderRecordsRequest');
  const caveats = shown<string[]>(r, 'localCaveats');
  const servedElsewhere = answer.matched && r && answer.matched.id !== r.id;
  const sn = answer.stateNotes;
  const items = permitItems(state);
  const what = state.claims.length ? `the ${listOf(items.map((k) => itemLabel(k).toLowerCase()))}` : 'any permits on the house';
  const searchWays = searchBy?.value ? [searchBy.value.address && 'address', searchBy.value.parcel && 'parcel number', searchBy.value.permitNumber && 'permit number'].filter(Boolean) as string[] : [];

  return (
    <section className="space-y-5">
      <BackToPlan update={update} right="About 10 minutes" />
      <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight [text-wrap:balance]">Did anyone pull a permit?</h1>
      <p className="text-slate-600">A nice-looking job doesn’t tell you whether it was approved. The records do. Here’s where to look for {what}.</p>

      <div className={`${card} space-y-3`}>
        <p className={eyebrow}>Who keeps the permits</p>
        {answer.officeLabel ? (
          <>
            <p className="text-lg">This address is most likely handled by <b>{answer.officeLabel}</b>.</p>
            {servedElsewhere && dept && <p className="text-sm">Its permits are kept by <b>{dept.value}</b>.<Status status={dept.status} checkedOn={dept.checkedOn} limits={'limits' in dept ? dept.limits : undefined} /></p>}
            {!servedElsewhere && dept && <p className="text-sm">Department: <b>{dept.value}</b><Status status={dept.status} checkedOn={dept.checkedOn} limits={'limits' in dept ? dept.limits : undefined} /></p>}
            <p className="text-xs text-slate-500 flex gap-1.5"><Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              Based on U.S. Census boundaries for this address, not the mailing city. Boundaries can miss recent annexations, and some towns have the county or a private company handle permits. If the office says the address isn’t theirs, ask who handles it.
            </p>
            {(sn?.outsideCityLimits || sn?.nearCityLimits) && (
              <div className="rounded-xl bg-home-stone/60 border border-home-linen p-3.5 space-y-2 text-sm">
                <p className="font-bold">How it works outside city limits in {sn.stateName}</p>
                {sn.outsideCityLimits && <p>{sn.outsideCityLimits.value}<Status status={sn.outsideCityLimits.status} checkedOn={sn.outsideCityLimits.checkedOn} limits={'limits' in sn.outsideCityLimits ? sn.outsideCityLimits.limits : undefined} /></p>}
                {sn.nearCityLimits && <p>{sn.nearCityLimits.value}<Status status={sn.nearCityLimits.status} checkedOn={sn.nearCityLimits.checkedOn} limits={'limits' in sn.nearCityLimits ? sn.nearCityLimits.limits : undefined} /></p>}
                {(sn.outsideCityLimits?.note || sn.nearCityLimits?.note) && <p className="text-xs text-slate-500">Source: {[sn.outsideCityLimits?.note, sn.nearCityLimits?.note].filter(Boolean).join(' ')}</p>}
              </div>
            )}
          </>
        ) : (
          <p>We couldn’t look up the boundaries for this address just now. Usually it’s the city if the house is inside city limits, and the county if it isn’t. The county’s website can tell you which.</p>
        )}
      </div>

      {url ? (
        <div className={`${card} space-y-4`}>
          <p className={eyebrow}>Where to search</p>
          <div>
            <a href={url.value} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-lg font-bold text-home-ink underline underline-offset-4 decoration-home-oak">
              {portal?.value.name || 'Permit search'} <ExternalLink className="w-4 h-4" />
            </a>
            <Status status={url.status} checkedOn={url.checkedOn} limits={'limits' in url ? url.limits : undefined} />
          </div>
          {searchWays.length > 0 && (
            <div className="text-sm">
              <b>Search by:</b> {searchWays.join(', ')}.
              {searchBy?.value.quirks?.length ? <ul className="list-disc pl-5 mt-1.5 space-y-1 text-slate-600">{searchBy.value.quirks.map((q) => <li key={q}>{q}</li>)}</ul> : null}
            </div>
          )}
          {tested && <p className="text-sm"><b>Our test:</b> {tested.value}<Status status={tested.status} checkedOn={tested.checkedOn} limits={'limits' in tested ? tested.limits : undefined} /></p>}
          {online && <p className="text-sm"><b>Online records start:</b> {online.value}<Status status={online.status} checkedOn={online.checkedOn} limits={'limits' in online ? online.limits : undefined} /></p>}
          {!tested && <p className="text-sm text-slate-600">We’ve checked the link but haven’t run an address search here yet. Try the street address first, then just the street name.</p>}
        </div>
      ) : (
        <div className={`${card} space-y-3`}>
          <p className={eyebrow}>Where to search</p>
          {answer.level === 'general' && <p className="text-sm text-slate-600">{OWNER_NOT_RESEARCHED}</p>}
          <ol className="list-decimal pl-5 space-y-2 text-sm">
            <li>Search the web for <b>“{answer.officeLabel ? `${answer.officeLabel.replace(/^the /, '')} building permit search` : 'your county building permit search'}”</b> and open the result on the government’s own website.</li>
            <li>Search by the street address. If nothing comes up, try just the street name, or the parcel number from the county assessor’s record.</li>
            <li>No online search, or nothing found? Call or email the building department and ask for the permit history for the address, including any open or expired permits.</li>
          </ol>
          <ContentLink href={GENERAL_PERMITS_GUIDE} onNavigate={onNavigate} className={linkBtn}>Our guide to finding building permits by address</ContentLink>
        </div>
      )}

      {(caveats || history || older || sn?.olderRecordsLaw) && (
        <details className={card}>
          <summary className="cursor-pointer font-bold">Before you decide a permit is missing</summary>
          <div className="mt-3 space-y-3 text-sm">
            {caveats && <div><ul className="list-disc pl-5 space-y-1">{caveats.value.map((c) => <li key={c}>{c}</li>)}</ul><Status status={caveats.status} checkedOn={caveats.checkedOn} limits={'limits' in caveats ? caveats.limits : undefined} /></div>}
            {history && <div><b>Older records:</b><ul className="list-disc pl-5 mt-1 space-y-1">{history.value.map((h) => <li key={h.name}>{h.name} ({h.covers})</li>)}</ul><Status status={history.status} checkedOn={history.checkedOn} limits={'limits' in history ? history.limits : undefined} /></div>}
            {older && <p><b>How to get them:</b> {older.value}<Status status={older.status} checkedOn={older.checkedOn} limits={'limits' in older ? older.limits : undefined} /></p>}
            {sn?.olderRecordsLaw && <p><b>Your right to ask in {sn.stateName}:</b> {sn.olderRecordsLaw.value}<Status status={sn.olderRecordsLaw.status} checkedOn={sn.olderRecordsLaw.checkedOn} limits={'limits' in sn.olderRecordsLaw ? sn.olderRecordsLaw.limits : undefined} /></p>}
          </div>
        </details>
      )}

      <button type="button" className={btnPrimary} onClick={() => setPermits({ stage: 'record', office: snapshot(answer) })}>
        I’ve looked. Here’s what I found <ArrowRight className="w-4 h-4" />
      </button>
      <div className="text-center">
        <button type="button" className={linkBtn} onClick={() => { const ans: Partial<Record<PermitItemKey, PermitFinding>> = {}; for (const k of items) ans[k] = { found: 'cant' }; setPermits({ stage: 'record', office: snapshot(answer), ans }); }}>
          I can’t search right now
        </button>
      </div>
    </section>
  );
};

// ---------------------------------------------------------------------------------------------------------------

const Choice: React.FC<{ on: boolean; onClick: () => void; children: React.ReactNode }> = ({ on, onClick, children }) => (
  <button type="button" aria-pressed={on} onClick={onClick}
    className={`rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${on ? 'border-home-moss bg-home-sage' : 'border-home-linen bg-white hover:border-home-oak'}`}>
    {children}
  </button>
);

const Record: React.FC<SubProps & { answer: PermitAnswer }> = ({ state, update, setPermits, onNavigate }) => {
  const items = permitItems(state);
  const ans = state.permits.ans;
  const set = (k: PermitItemKey, f: PermitFinding) => setPermits({ ans: { ...ans, [k]: f } });
  const done = items.every((k) => permitMeaning(k, ans[k], state.permits.office));

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => setPermits({ stage: 'how' })} className="text-sm font-semibold text-slate-600 hover:text-home-ink cursor-pointer">← Where to look</button>
        <span className="text-sm text-slate-500">{items.filter((k) => permitMeaning(k, ans[k], state.permits.office)).length} of {items.length}</span>
      </div>
      <h1 className="font-serif text-3xl font-semibold leading-tight">What did you find?</h1>
      {items.map((k) => {
        const a = ans[k] || {};
        const m = permitMeaning(k, a, state.permits.office);
        return (
          <div key={k} className={`${card} space-y-3`}>
            <h2 id={`pq-${k}`} className="font-bold text-lg">{k === 'any' ? 'Any permits on record?' : `${itemLabel(k)}: did you find a permit?`}</h2>
            <div className="flex flex-wrap gap-2" role="group" aria-labelledby={`pq-${k}`}>
              <Choice on={a.found === 'yes'} onClick={() => set(k, { found: 'yes' })}>Yes, found one</Choice>
              <Choice on={a.found === 'no'} onClick={() => set(k, { found: 'no' })}>Nothing came up</Choice>
              <Choice on={a.found === 'cant'} onClick={() => set(k, { found: 'cant' })}>Couldn’t search</Choice>
            </div>
            {a.found === 'yes' && (
              <div className="space-y-2">
                <p id={`pf-${k}`} className="text-sm font-semibold">Is it finaled? <span className="font-normal text-slate-500">(Also shown as closed, completed or signed off.)</span></p>
                <div className="flex flex-wrap gap-2" role="group" aria-labelledby={`pf-${k}`}>
                  <Choice on={a.fin === 'yes'} onClick={() => set(k, { found: 'yes', fin: 'yes' })}>Yes</Choice>
                  <Choice on={a.fin === 'no'} onClick={() => set(k, { found: 'yes', fin: 'no' })}>No, still open</Choice>
                  <Choice on={a.fin === 'unsure'} onClick={() => set(k, { found: 'yes', fin: 'unsure' })}>Not sure</Choice>
                </div>
              </div>
            )}
            {m && (
              <div className={`rounded-xl p-3 text-sm ${m.tone === 'good' ? 'bg-home-sage/60' : m.tone === 'ask' ? 'bg-amber-50' : 'bg-home-stone'}`}>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">What this means</span>
                {m.text}
                {m.openPermitsLink && <> <ContentLink href={OPEN_PERMITS_GUIDE} onNavigate={onNavigate} className="font-semibold underline">How open permits get resolved</ContentLink>.</>}
              </div>
            )}
          </div>
        );
      })}
      <button type="button" className={btnPrimary} disabled={!done} onClick={() => setPermits({ stage: 'solved' })}>
        Add to my report <ArrowRight className="w-4 h-4" />
      </button>
      {!done && <p className="text-center text-sm text-slate-500">Answer each one to finish. “Couldn’t search” counts.</p>}
    </section>
  );
};

// ---------------------------------------------------------------------------------------------------------------

const Solved: React.FC<SubProps> = ({ state, update, setPermits }) => {
  const items = permitItems(state);
  const office = state.permits.office;
  const rows = items.map((k) => ({ k, m: permitMeaning(k, state.permits.ans[k], office) })).filter((r) => r.m);
  const toAsk = rows.filter((r) => r.m!.seller).length;
  return (
    <section className="space-y-6">
      <SolvedBadge />
      <p className="text-center text-slate-600 text-lg">You know where this house’s permits are kept and what to ask about them.</p>
      <div className={`${card} space-y-4`}>
        {[
          ['What you checked', rows.map((r) => `${itemLabel(r.k)}: ${r.m!.found.toLowerCase()}`).join('. ') + '.'],
          ['Where', [office?.label && `Most likely ${office.label}`, office?.portalName].filter(Boolean).join(', ') || 'The local building department'],
          ['What to do with it', toAsk ? `${toAsk} question${toAsk === 1 ? '' : 's'} for the seller, ready in your report.` : 'Nothing to chase. Keep the permit numbers with your files.'],
        ].map(([label, text]) => (
          <div key={label} className="flex gap-3">
            <Check className="w-5 h-5 text-home-moss shrink-0 mt-0.5" />
            <div><span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</span><p>{text}</p></div>
          </div>
        ))}
      </div>
      <button type="button" className={btnPrimary} onClick={() => update({ view: 'plan' })}>On to the next one <ArrowRight className="w-4 h-4" /></button>
      <div className="text-center"><button type="button" className={linkBtn} onClick={() => setPermits({ stage: 'record' })}>Change my answers</button></div>
    </section>
  );
};
