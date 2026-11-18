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

// Each step is its own screen (the tool remounts <main> per screen for the fade-in), so the answer is kept per house
// here: later steps render at once instead of flashing the "Finding who keeps the permits" loader.
const answerCache = new Map<string, PermitAnswer>();

export const PermitView: React.FC<{ state: ResearchState; update: Updater; onNavigate: (path: string) => void }> = ({ state, update, onNavigate }) => {
  const houseKey = `${state.property.lat},${state.property.lon}`;
  const [answer, setAnswer] = useState<PermitAnswer | null>(() => answerCache.get(houseKey) ?? null);
  const p = state.permits;
  const setPermits = (patch: Partial<ResearchState['permits']>) => update((s) => ({ permits: { ...s.permits, ...patch } }));

  // Look up the likely office once per house (cached on the device), then match it against our database.
  useEffect(() => {
    if (answerCache.has(houseKey)) return;
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
      const a = answerFor(index, authority ?? null);
      answerCache.set(houseKey, a);
      if (!cancelled) setAnswer(a);
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
// Step by step (owner, 2026-11-18: the permit question "feels overwhelming, make it step by step"): 1 who keeps the
// permits, 2 where to search, 3 what you found, one job per screen. permits.step holds the screen within a stage.

const Steps: React.FC<{ n: 1 | 2 | 3; label: string }> = ({ n, label }) => (
  <div className="space-y-2">
    <div className="flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={3} aria-valuenow={n} aria-label="Progress">
      {[1, 2, 3].map((i) => <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= n ? 'bg-home-moss' : 'bg-home-linen'}`} />)}
    </div>
    <p className={eyebrow}>Step {n} of 3 · {label}</p>
  </div>
);

const BackRow: React.FC<{ label: string; onClick: () => void; right?: string }> = ({ label, onClick, right }) => (
  <div className="flex items-center justify-between">
    <button type="button" onClick={onClick} className="text-sm font-semibold text-slate-600 hover:text-home-ink cursor-pointer">← {label}</button>
    {right && <span className="text-sm text-slate-500">{right}</span>}
  </div>
);

const How: React.FC<SubProps & { answer: PermitAnswer }> = (props) =>
  (props.state.permits.step ?? 0) === 0 ? <Who {...props} /> : <Where {...props} />;

const Who: React.FC<SubProps & { answer: PermitAnswer }> = ({ update, setPermits, answer }) => {
  const [why, setWhy] = useState(false);
  const r = answer.record;
  const dept = shown<string>(r, 'buildingDepartment');
  const servedElsewhere = answer.matched && r && answer.matched.id !== r.id;
  const sn = answer.stateNotes;
  return (
    <section className="space-y-5">
      <BackToPlan update={update} right="About 10 minutes" />
      <Steps n={1} label="Who keeps the permits" />
      <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight [text-wrap:balance]">Did anyone pull a permit?</h1>
      <p className="text-slate-600">A nice-looking job doesn’t tell you whether it was approved. The records do. First, who keeps them.</p>

      <div className={`${card} space-y-3`}>
        {answer.officeLabel ? (
          <>
            <p className="text-lg">This address is most likely handled by <b>{answer.officeLabel}</b>.</p>
            {dept && <p className="text-sm">{servedElsewhere ? 'Its permits are kept by ' : 'Department: '}<b>{dept.value}</b>{servedElsewhere ? '.' : ''}<Status status={dept.status} checkedOn={dept.checkedOn} limits={'limits' in dept ? dept.limits : undefined} /></p>}
            {why ? (
              <p className="text-xs text-slate-500 flex gap-1.5"><Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                Based on U.S. Census boundaries for this address, not the mailing city. Boundaries can miss recent annexations, and some towns have the county or a private company handle permits. If the office says the address isn’t theirs, ask who handles it.
              </p>
            ) : (
              <button type="button" className={linkBtn} onClick={() => setWhy(true)}>How do we know?</button>
            )}
          </>
        ) : (
          <p>We couldn’t look up the boundaries for this address just now. Usually it’s the city if the house is inside city limits, and the county if it isn’t. The county’s website can tell you which.</p>
        )}
      </div>

      {(sn?.outsideCityLimits || sn?.nearCityLimits) && (
        <div className="rounded-2xl bg-home-stone/60 border border-home-linen p-4 space-y-2 text-sm">
          <p className="font-bold">Good to know in {sn.stateName}</p>
          {sn.outsideCityLimits && <p>{sn.outsideCityLimits.value}<Status status={sn.outsideCityLimits.status} checkedOn={sn.outsideCityLimits.checkedOn} limits={'limits' in sn.outsideCityLimits ? sn.outsideCityLimits.limits : undefined} /></p>}
          {sn.nearCityLimits && <p>{sn.nearCityLimits.value}<Status status={sn.nearCityLimits.status} checkedOn={sn.nearCityLimits.checkedOn} limits={'limits' in sn.nearCityLimits ? sn.nearCityLimits.limits : undefined} /></p>}
          {(sn.outsideCityLimits?.note || sn.nearCityLimits?.note) && <p className="text-xs text-slate-500">Source: {[sn.outsideCityLimits?.note, sn.nearCityLimits?.note].filter(Boolean).join(' ')}</p>}
        </div>
      )}

      <button type="button" className={btnPrimary} onClick={() => setPermits({ step: 1 })}>
        Next: where to search <ArrowRight className="w-4 h-4" />
      </button>
    </section>
  );
};

const Where: React.FC<SubProps & { answer: PermitAnswer }> = ({ state, setPermits, onNavigate, answer }) => {
  const r = answer.record;
  const portal = shown<{ name: string; platform?: string }>(r, 'currentPortal');
  const url = shown<string>(r, 'portalUrl');
  const searchBy = shown<SearchBy>(r, 'searchBy');
  const tested = shown<string>(r, 'addressSearchTested');
  const online = shown<string>(r, 'onlineRecordsFrom');
  const history = shown<HistoricalSystem[]>(r, 'historicalSystems');
  const older = shown<string>(r, 'olderRecordsRequest');
  const caveats = shown<string[]>(r, 'localCaveats');
  const sn = answer.stateNotes;
  const items = permitItems(state);
  const what = state.claims.length ? `the ${listOf(items.map((k) => itemLabel(k).toLowerCase()))}` : 'any permits on the house';
  const searchWays = searchBy?.value ? [searchBy.value.address && 'address', searchBy.value.parcel && 'parcel number', searchBy.value.permitNumber && 'permit number'].filter(Boolean) as string[] : [];
  const toRecord = (ans?: Partial<Record<PermitItemKey, PermitFinding>>) =>
    setPermits({ stage: 'record', step: 0, office: snapshot(answer), ...(ans ? { ans } : {}) });

  return (
    <section className="space-y-5">
      <BackRow label="Who keeps them" onClick={() => setPermits({ step: 0 })} />
      <Steps n={2} label="Where to search" />
      <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight [text-wrap:balance]">Look up {what}</h1>

      {url ? (
        <>
          <div>
            <a href={url.value} target="_blank" rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-home-ink bg-white text-home-ink font-bold text-base px-5 py-4 hover:bg-home-stone transition-colors">
              Open {portal?.value.name || 'the permit search'} <ExternalLink className="w-4 h-4" />
            </a>
            <Status status={url.status} checkedOn={url.checkedOn} limits={'limits' in url ? url.limits : undefined} />
          </div>
          <div className={`${card} space-y-3`}>
            <p className="font-bold">How to search</p>
            <ol className="space-y-3">
              {[
                searchWays.length > 0 ? <>Search by {searchWays.length > 1 ? `${searchWays.slice(0, -1).join(', ')} or ${searchWays[searchWays.length - 1]}` : searchWays[0]}.{searchBy?.value.quirks?.length ? <ul className="list-disc pl-5 mt-1.5 space-y-1 text-sm text-slate-600">{searchBy.value.quirks.map((q) => <li key={q}>{q}</li>)}</ul> : null}</> : <>Search by the street address. If nothing comes up, try just the street name.</>,
                <>Look for {what}. Note the permit number, and whether it says finaled, closed or completed.</>,
              ].map((body, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-6 h-6 shrink-0 rounded-full bg-home-stone text-home-brass text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <div className="min-w-0">{body}</div>
                </li>
              ))}
            </ol>
            {tested && <p className="text-sm text-slate-600"><b>When we tried it:</b> {tested.value}<Status status={tested.status} checkedOn={tested.checkedOn} limits={'limits' in tested ? tested.limits : undefined} /></p>}
            {online && <p className="text-sm text-slate-600"><b>Online records start:</b> {online.value}<Status status={online.status} checkedOn={online.checkedOn} limits={'limits' in online ? online.limits : undefined} /></p>}
            {!tested && <p className="text-sm text-slate-600">We’ve checked the link but haven’t run an address search here yet.</p>}
          </div>
        </>
      ) : (
        <div className={`${card} space-y-3`}>
          {answer.level === 'general' && <p className="text-sm text-slate-600">{OWNER_NOT_RESEARCHED}</p>}
          <ol className="space-y-3">
            {[
              <>Search the web for <b>“{answer.officeLabel ? `${answer.officeLabel.replace(/^the /, '')} building permit search` : 'your county building permit search'}”</b> and open the result on the government’s own website.</>,
              <>Search by the street address. If nothing comes up, try just the street name, or the parcel number from the county assessor’s record.</>,
              <>No online search, or nothing found? Call or email the building department and ask for the permit history for the address, including any open or expired permits.</>,
            ].map((body, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-6 h-6 shrink-0 rounded-full bg-home-stone text-home-brass text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <div className="min-w-0">{body}</div>
              </li>
            ))}
          </ol>
          <ContentLink href={GENERAL_PERMITS_GUIDE} onNavigate={onNavigate} className={linkBtn}>Our guide to finding building permits by address</ContentLink>
        </div>
      )}

      {(caveats || history || older || sn?.olderRecordsLaw) && (
        <details className="rounded-2xl border border-home-linen bg-white px-4 py-3">
          <summary className="cursor-pointer font-semibold text-sm">Nothing came up? Read this first</summary>
          <div className="mt-3 space-y-3 text-sm">
            {caveats && <div><ul className="list-disc pl-5 space-y-1">{caveats.value.map((c) => <li key={c}>{c}</li>)}</ul><Status status={caveats.status} checkedOn={caveats.checkedOn} limits={'limits' in caveats ? caveats.limits : undefined} /></div>}
            {history && <div><b>Older records:</b><ul className="list-disc pl-5 mt-1 space-y-1">{history.value.map((h) => <li key={h.name}>{h.name} ({h.covers})</li>)}</ul><Status status={history.status} checkedOn={history.checkedOn} limits={'limits' in history ? history.limits : undefined} /></div>}
            {older && <p><b>How to get them:</b> {older.value}<Status status={older.status} checkedOn={older.checkedOn} limits={'limits' in older ? older.limits : undefined} /></p>}
            {sn?.olderRecordsLaw && <p><b>Your right to ask in {sn.stateName}:</b> {sn.olderRecordsLaw.value}<Status status={sn.olderRecordsLaw.status} checkedOn={sn.olderRecordsLaw.checkedOn} limits={'limits' in sn.olderRecordsLaw ? sn.olderRecordsLaw.limits : undefined} /></p>}
          </div>
        </details>
      )}

      <button type="button" className={btnPrimary} onClick={() => toRecord()}>
        I’ve looked. Next: what I found <ArrowRight className="w-4 h-4" />
      </button>
      <div className="text-center">
        <button type="button" className={linkBtn} onClick={() => { const ans: Partial<Record<PermitItemKey, PermitFinding>> = {}; for (const k of items) ans[k] = { found: 'cant' }; toRecord(ans); }}>
          I can’t search right now
        </button>
      </div>
    </section>
  );
};

// ---------------------------------------------------------------------------------------------------------------

const Choice: React.FC<{ on: boolean; onClick: () => void; children: React.ReactNode }> = ({ on, onClick, children }) => (
  <button type="button" aria-pressed={on} onClick={onClick}
    className={`w-full flex items-center gap-3 text-left rounded-2xl border px-4 py-3.5 font-semibold transition-colors cursor-pointer ${on ? 'border-home-moss bg-home-sage' : 'border-home-linen bg-white hover:border-home-oak'}`}>
    <span className={`w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center ${on ? 'border-home-moss bg-home-moss' : 'border-slate-300'}`}>
      {on && <span className="w-2 h-2 rounded-full bg-white" />}
    </span>
    {children}
  </button>
);

const Record: React.FC<SubProps & { answer: PermitAnswer }> = ({ state, setPermits, onNavigate }) => {
  const items = permitItems(state);
  const ans = state.permits.ans;
  const i = Math.min(state.permits.step ?? 0, items.length - 1);
  const k = items[i];
  const a = ans[k] || {};
  const m = permitMeaning(k, a, state.permits.office);
  const set = (f: PermitFinding) => setPermits({ ans: { ...ans, [k]: f } });
  const last = i === items.length - 1;

  return (
    <section className="space-y-5">
      <BackRow label={i > 0 ? 'Previous' : 'Where to search'} onClick={() => setPermits(i > 0 ? { step: i - 1 } : { stage: 'how', step: 1 })}
        right={items.length > 1 ? `${i + 1} of ${items.length}` : undefined} />
      <Steps n={3} label="What you found" />
      <h1 id={`pq-${k}`} className="font-serif text-3xl sm:text-4xl font-semibold leading-tight [text-wrap:balance]">
        {k === 'any' ? 'Did you find any permits on record?' : `${itemLabel(k)}: did you find a permit?`}
      </h1>
      <div className="space-y-2.5" role="group" aria-labelledby={`pq-${k}`}>
        <Choice on={a.found === 'yes'} onClick={() => set({ found: 'yes', fin: a.fin })}>Yes, I found one</Choice>
        <Choice on={a.found === 'no'} onClick={() => set({ found: 'no' })}>Nothing came up</Choice>
        <Choice on={a.found === 'cant'} onClick={() => set({ found: 'cant' })}>I couldn’t search</Choice>
      </div>
      {a.found === 'yes' && (
        <div className={`${card} space-y-3`}>
          <p id={`pf-${k}`} className="font-bold">Is it finaled? <span className="block font-normal text-sm text-slate-500">It may say closed, completed or signed off.</span></p>
          <div className="space-y-2.5" role="group" aria-labelledby={`pf-${k}`}>
            <Choice on={a.fin === 'yes'} onClick={() => set({ found: 'yes', fin: 'yes' })}>Yes</Choice>
            <Choice on={a.fin === 'no'} onClick={() => set({ found: 'yes', fin: 'no' })}>No, it’s still open</Choice>
            <Choice on={a.fin === 'unsure'} onClick={() => set({ found: 'yes', fin: 'unsure' })}>Not sure</Choice>
          </div>
        </div>
      )}
      {m && (
        <div className={`rounded-2xl p-4 ${m.tone === 'good' ? 'bg-home-sage/60' : m.tone === 'ask' ? 'bg-amber-50' : 'bg-home-stone'}`}>
          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">What this means</span>
          {m.text}
          {m.openPermitsLink && <> <ContentLink href={OPEN_PERMITS_GUIDE} onNavigate={onNavigate} className="font-semibold underline">How open permits get resolved</ContentLink>.</>}
        </div>
      )}
      <button type="button" className={btnPrimary} disabled={!m} onClick={() => setPermits(last ? { stage: 'solved' } : { step: i + 1 })}>
        {last ? 'Add to my report' : 'Next'} <ArrowRight className="w-4 h-4" />
      </button>
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
      <div className="text-center"><button type="button" className={linkBtn} onClick={() => setPermits({ stage: 'record', step: 0 })}>Change my answers</button></div>
    </section>
  );
};
