import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Building, ArrowRight } from 'lucide-react';
import { PropertyReport, CanonicalFinding } from '../types';
import { LeadMarketplaceWidget } from './LeadMarketplaceWidget';
import { SourceRegistryModal } from './SourceRegistryModal';
import { OFFICIAL_SOURCE_REGISTRY } from '../data/sourceRegistry';
import { ErrorReportingModal } from './ErrorReportingModal';
import { SponsoredVendorCards } from './SponsoredVendorCard';
import { InspectionPriorities } from './InspectionPriorities';
import { SellerQuestions } from './SellerQuestions';

interface PropertyReportViewProps {
  report: PropertyReport;
  onNewSearch: () => void;
  /**
   * Guided research tool (unpublished): the visitor's own findings, shown first. They live on the visitor's
   * device and are never part of the saved report, so a shared /insights/ link shows the area report only.
   */
  researchSection?: { label: string; title: string; node: React.ReactNode };
}

// Column span for the last tile of the 2-column (phone) / 4-column (sm and up) metrics grid, so the row it ends is full.
const LAST_TILE_SPAN_SM: Record<number, string> = { 0: '', 1: 'sm:col-span-4', 2: 'sm:col-span-3', 3: 'sm:col-span-2' };
function lastTileSpan(count: number): string {
  const phone = count % 2 === 1 ? 'col-span-2' : '';
  const sm = LAST_TILE_SPAN_SM[count % 4];
  // A phone-width span of 2 must not leak into the 4-column layout when the sm row is already full.
  return [phone, sm || (phone ? 'sm:col-span-1' : '')].filter(Boolean).join(' ');
}

export const PropertyReportView: React.FC<PropertyReportViewProps> = ({ report, onNewSearch, researchSection }) => {
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  // Chapter switcher state. Declared here, above the blocked-address early return, so the hook order never
  // changes between renders. The switcher follows whichever [data-chapter] section has reached the bar.
  const [activeChapter, setActiveChapter] = useState('section-overview');
  const [titleHidden, setTitleHidden] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const onScroll = () => {
      let cur = 'section-overview';
      document.querySelectorAll<HTMLElement>('[data-chapter]').forEach((el) => {
        if (el.getBoundingClientRect().top < 150) cur = el.id;
      });
      setActiveChapter(cur);
      const t = titleRef.current;
      if (t) setTitleHidden(t.getBoundingClientRect().bottom < 110);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Address formatting helper ensuring proper spacing after commas
  const formattedAddress = (report.headerInfo?.address || report.propertyInfo?.address || '')
    .replace(/,/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();

  // If the address validation gate blocked this address, show why -- headline varies by which
  // layer blocked it (bad address format / government facility / unsupported jurisdiction).
  if (report.isNonResidential) {
    const layerHeadline: Record<number, string> = {
      1: 'Address Could Not Be Verified',
      2: 'Government Facility Detected',
      3: 'Area Not Yet Supported',
    };
    // A blocked layer is not the same as a finding, and the headline used to conflate them. The
    // gate fails closed when one of its four external facility datasets errors or times out, and
    // that lands on layer 2 -- so a homeowner whose check merely did not complete was shown
    // "Government Facility Detected" above a message saying verification was temporarily
    // unavailable. The heading asserted a detection the system had explicitly not made, about
    // someone's house. Reported by a reader who saw it on an ordinary residential address.
    //
    // Only blockedAtLayer and the message reach this component (see server.ts), not the gate's
    // own result code, so the message is what distinguishes the two cases.
    const reason = report.rejectionReason || '';
    const didNotComplete = /temporarily unavailable|try again|unreadable response|returned an error/i.test(reason);
    const headline = didNotComplete
      ? 'Verification Did Not Complete'
      : layerHeadline[report.blockedAtLayer as number] || 'Residential Address Required';

    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6 font-sans">
        <div className="bg-white text-home-ink rounded-3xl p-8 space-y-6">
          <div className="flex items-center gap-3 text-amber-700">
            <Building className="w-8 h-8 shrink-0" />
            <div>
              <span className="text-sm font-semibold text-amber-700">Address check</span>
              <h1 className="text-2xl font-serif font-black text-home-ink">Residential Scope Verification</h1>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-bold text-amber-900">{headline}</h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              {report.rejectionReason || `Before Regret insight reports apply exclusively to residential properties. ${formattedAddress || 'This address'} could not be verified as a residential property.`}
            </p>
          </div>

          <div className="pt-4 flex flex-wrap gap-4 items-center justify-between border-t border-slate-200">
            <p className="text-xs text-slate-500 font-medium">
              Need research for a residential property instead?
            </p>
            <button
              onClick={onNewSearch}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-full transition-all flex items-center gap-2 cursor-pointer shadow-md"
            >
              <span>Search Residential Address</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Derive canonical findings array. report.canonicalFindings is always populated by the time
  // this component renders -- App.tsx guarantees a report via createFallbackReport
  // (reportFallback.ts) even when the server call fails -- so this is a defensive empty-array
  // fallback, not a second copy of fabricated content.
  //
  // The USGS seismic design category finding was removed 2026-10-10 (owner: "I don't think it's
  // useful"). New reports no longer carry it; reports saved before that date still do in their
  // stored JSON, so it is filtered here too and a reopened permalink matches a fresh report.
  const findings: CanonicalFinding[] = (report.canonicalFindings || []).filter(
    (f) => f.id !== 'f_seismic' && !/seismic/i.test(f.subject || '')
  );

  // Source count shown in the header comes from the same honest registry the modal renders
  // (src/data/sourceRegistry.ts) -- BeforeRegret queries the same fixed set of public sources for
  // every address.
  const sourceCount = OFFICIAL_SOURCE_REGISTRY.length;

  const pendingFindings = findings.filter(f => f.status === 'NOT YET VERIFIED');
  // Findings whose status is a real outcome -- a live source answered either way -- get a full
  // card. 'NOT YET VERIFIED' ones are the compact "Records to pull" list instead.
  const resolvedFindings = findings.filter(f => f.status !== 'NOT YET VERIFIED');

  const priorityCount = report.inspectionPriorities?.priorities?.length || 0;
  const questionCount = report.sellerQuestionsScript?.questions?.length || 0;

  // REDESIGN 2026-11-23 (owner: "if Apple made our report", mock-up docs/mockups/apple-report-mockup-2026-11.html,
  // approved with "go"). Same content, same order of sponsored slots, new presentation:
  //   - A cover (big address, one plain line about what the report is), then summary tiles that jump to each chapter.
  //   - A sticky chapter switcher (Overview / Inspect / Ask / Records / Area) in place of the row of tags.
  //   - The neighborhood moved to the end ("Area"): what to inspect and ask is what a buyer needs first.
  //   - Sources listed at the foot of the report, like footnotes, instead of only behind a button.
  //   - "Share" and "Save PDF" as plain blue text in the bar.
  // Earlier rules that still hold: sponsored cards keep their own highlighted treatment and are never folded away;
  // unsold slots render nothing; every collapsed text stays in the DOM for print.
  const PROPERTY_TYPE_LABEL: Record<string, string> = {
    single_family: 'Single-family home', condo: 'Condo', townhouse: 'Townhouse',
    multi_family: 'Multi-family', manufactured: 'Manufactured home', mobile_home: 'Manufactured home',
  };
  const rawType = report.propertyInfo?.propertyType || '';
  const typeLabel = PROPERTY_TYPE_LABEL[rawType] || (/^single[\s_-]?family/i.test(rawType) ? 'Single-family home' : '') || (rawType ? rawType.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()) : '');
  // The declared year travels with the era engine's output rather than propertyInfo on most reports.
  const yearBuilt = report.propertyInfo?.yearBuilt || report.headerInfo?.yearBuilt
    || report.inspectionPriorities?.yearBuilt || report.sellerQuestionsScript?.yearBuilt;
  const county = report.propertyInfo?.county;
  const summaryBits = [
    typeLabel,
    yearBuilt ? `Built ${yearBuilt}` : '',
    county ? (/\b(county|parish|borough)\b/i.test(county) ? county : `${county} County`) : '',
  ].filter(Boolean);

  // Street on the first line, the rest in gray on the second.
  const commaAt = formattedAddress.indexOf(',');
  const addressLine1 = commaAt > 0 ? formattedAddress.slice(0, commaAt) : formattedAddress;
  const addressLine2 = commaAt > 0 ? formattedAddress.slice(commaAt + 1).trim() : '';

  // Typical year built nearby, read from the neighborhood finding's own metric (never computed here).
  const typicalYear = (() => {
    for (const f of resolvedFindings) {
      const m = f.metrics?.find((x) => /typical nearby/i.test(x.label));
      const y = m?.value.match(/\b(1[6-9]\d\d|20\d\d)\b/);
      if (y) return { typical: Number(y[1]), county: Number(m?.comparison?.match(/\b(1[6-9]\d\d|20\d\d)\b/)?.[1]) || null, findingId: f.id };
    }
    return null;
  })();

  const sections = [
    researchSection && { id: 'section-your-research', label: researchSection.label },
    priorityCount > 0 && { id: 'section-inspection-priorities', label: 'Inspect' },
    questionCount > 0 && { id: 'section-seller-questions', label: 'Ask' },
    pendingFindings.length > 0 && { id: 'section-needs-verification', label: 'Records' },
    resolvedFindings.length > 0 && { id: 'section-findings', label: 'Area' },
  ].filter(Boolean) as Array<{ id: string; label: string }>;
  const chapters = [{ id: 'section-overview', label: 'Overview' }, ...sections];

  const tiles = [
    priorityCount > 0 && { href: '#section-inspection-priorities', big: String(priorityCount), label: priorityCount === 1 ? 'thing to inspect' : 'things to inspect', go: 'Inspect' },
    questionCount > 0 && { href: '#section-seller-questions', big: String(questionCount), label: questionCount === 1 ? 'question for the seller' : 'questions for the seller', go: 'Ask' },
    pendingFindings.length > 0 && { href: '#section-needs-verification', big: String(pendingFindings.length), label: pendingFindings.length === 1 ? 'record to pull yourself' : 'records to pull yourself', go: 'Records' },
    typicalYear && { href: '#section-findings', big: String(typicalYear.typical), label: 'typical year built nearby', go: 'Area' },
  ].filter(Boolean) as Array<{ href: string; big: string; label: string; go: string }>;

  // A saved report's own permalink, so a link shared from inside the research tool still opens the area report.
  const shareUrl = report.id && /^rep_/.test(report.id) ? `${window.location.origin}/insights/${report.id}` : window.location.href;
  const handleShare = async () => {
    const title = `Property report: ${formattedAddress}`;
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title, url: shareUrl });
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      setShareNote('Link copied');
    } catch {
      // The visitor closed the share sheet, or the clipboard is blocked: nothing to report.
      return;
    }
    setTimeout(() => setShareNote(null), 2000);
  };

  const statusLabel = (status: string): string | null =>
    status === 'NO RECORD FOUND' ? 'No record found' : null;

  // When-built timeline (this home / typical nearby / county median), only when all three years are known.
  const renderYearTimeline = () => {
    if (!typicalYear || !typicalYear.county || !yearBuilt) return null;
    const home = Number(yearBuilt);
    const years = [home, typicalYear.typical, typicalYear.county];
    // Round tick marks: a start on a decade and a step of whole decades, so the axis reads 1840 / 1880 / 1920 ...
    const lo = Math.floor((Math.min(...years) - 5) / 10) * 10;
    const step = Math.max(10, Math.ceil((Math.max(...years) + 5 - lo) / 4 / 10) * 10);
    const hi = lo + step * 4;
    const pos = (y: number) => `${((y - lo) / (hi - lo)) * 100}%`;
    const ticks = [0, 1, 2, 3, 4].map((i) => Math.round(lo + ((hi - lo) * i) / 4));
    const marks = [
      { y: home, cls: 'bg-blue-600', label: 'This home (as you entered it)' },
      { y: typicalYear.typical, cls: 'bg-slate-500', label: 'Typical nearby' },
      { y: typicalYear.county, cls: 'bg-slate-300', label: 'County median' },
    ];
    return (
      <div
        data-print-block
        role="img"
        aria-label={`Year built: this home ${home} as you entered it, typical nearby home around ${typicalYear.typical}, county median around ${typicalYear.county}.`}
        className="rounded-[18px] bg-home-mist px-4 pt-9 pb-4"
      >
        <div className="relative mx-2 h-1.5 rounded-full bg-slate-200">
          {marks.map((m) => (
            <React.Fragment key={m.label}>
              <span className="absolute -top-7 -translate-x-1/2 text-[13px] font-medium text-slate-900 tabular-nums" style={{ left: pos(m.y) }}>{m.y}</span>
              <span className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-[3px] border-home-mist ${m.cls}`} style={{ left: pos(m.y) }} />
            </React.Fragment>
          ))}
        </div>
        <div className="mx-2 mt-3 flex justify-between text-xs text-slate-400 tabular-nums">
          {ticks.map((t) => <span key={t}>{t}</span>)}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-slate-600">
          {marks.map((m) => (
            <span key={m.label} className="inline-flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${m.cls}`} />{m.label}</span>
          ))}
        </div>
      </div>
    );
  };

  const renderFindingCard = (finding: (typeof resolvedFindings)[number]) => (
    <div key={finding.id} data-print-block className="rounded-3xl bg-white p-5 sm:p-7 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-[19px] font-semibold text-slate-900 leading-snug">{finding.subject}</h3>
          <p className="text-sm text-slate-500 mt-0.5">{finding.sourceAgency || 'Public source'}</p>
        </div>
        {statusLabel(finding.status) && (
          <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-home-mist text-slate-600">
            {statusLabel(finding.status)}
          </span>
        )}
      </div>

      <p className="text-[17px] text-slate-800 leading-relaxed">{finding.whatWeFound}</p>

      {typicalYear?.findingId === finding.id && renderYearTimeline()}

      {finding.metrics && finding.metrics.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {finding.metrics.map((m, i, all) => (
            // The last tile stretches to fill its row, so an odd count never leaves a gap (owner, 2026-11-14).
            <div key={m.label} className={`rounded-2xl bg-home-mist px-4 py-3.5 ${i === all.length - 1 ? lastTileSpan(all.length) : ''}`}>
              <div className="text-[13px] text-slate-500 leading-tight">{m.label}</div>
              <div className="text-xl font-semibold text-slate-900 mt-1 leading-tight tracking-[-0.01em] tabular-nums">{m.value}</div>
              {m.comparison && <div className="text-[13px] text-slate-500 leading-snug mt-0.5">{m.comparison}</div>}
            </div>
          ))}
        </div>
      )}

      {finding.metricsNote && <p className="text-[13px] text-slate-500 leading-snug -mt-1">{finding.metricsNote}</p>}

      {/* Either block may be empty (the neighborhood finding has no "Why it matters" since 2026-11-14), so each
          renders only with content, and the two-column layout applies only when both do. */}
      {(finding.whyItMatters || finding.suggestedNextStep || finding.sourceUrl) && (
      <div className={`grid gap-5 text-[15px] ${finding.whyItMatters && (finding.suggestedNextStep || finding.sourceUrl) ? 'sm:grid-cols-2' : ''}`}>
        {finding.whyItMatters && (
        <div>
          <div className="font-semibold text-slate-900">Why it matters</div>
          <p className="text-slate-600 leading-relaxed mt-1">{finding.whyItMatters}</p>
        </div>
        )}
        {(finding.suggestedNextStep || finding.sourceUrl) && (
        <div>
          <div className="font-semibold text-slate-900">What to do next</div>
          <p className="text-slate-600 leading-relaxed mt-1">
            {finding.suggestedNextStep}
            {finding.sourceUrl && (
              <>
                {' '}
                <a href={finding.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-blue-600 hover:underline underline-offset-2">
                  <span>Official record</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </>
            )}
          </p>
        </div>
        )}
      </div>
      )}

      <SponsoredVendorCards vendors={finding.sponsoredVendors} />
    </div>
  );

  const ChapterHeader: React.FC<{ title: string; intro?: React.ReactNode }> = ({ title, intro }) => (
    <div data-print-block className="mb-6">
      <h2 className="font-serif text-[28px] sm:text-[32px] font-bold leading-tight tracking-[-0.025em] text-slate-900">{title}</h2>
      {intro && <p className="mt-2 text-[17px] text-slate-500 leading-relaxed">{intro}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-home-mist print:bg-white text-slate-900 font-sans pb-24">
      {/* Bar: the address slides in once the big title has scrolled away; Share and Save PDF as plain blue
          text; the chapter switcher underneath. A <header>, so print hides all of it (index.css). */}
      <header className="sticky top-0 z-30 bg-home-mist/80 backdrop-blur-xl backdrop-saturate-150 border-b border-slate-300/50">
        <div className="max-w-3xl mx-auto px-4 h-12 flex items-center gap-3">
          <span
            aria-hidden={!titleHidden}
            className={`min-w-0 flex-1 truncate text-[15px] font-semibold text-slate-900 transition-opacity duration-200 ${titleHidden ? 'opacity-100' : 'opacity-0'}`}
          >
            {addressLine1}
          </span>
          <div className="shrink-0 flex items-center gap-5 text-[15px]">
            <button type="button" onClick={handleShare} className="text-blue-600 hover:underline underline-offset-2 cursor-pointer whitespace-nowrap">
              {shareNote || 'Share'}
            </button>
            <button type="button" onClick={() => window.print()} className="text-blue-600 hover:underline underline-offset-2 cursor-pointer whitespace-nowrap">
              Save PDF
            </button>
          </div>
        </div>
        {chapters.length > 2 && (
          <nav aria-label="Report chapters" className="quick-jump-bar max-w-3xl mx-auto px-4 pb-2.5">
            <div className="no-scrollbar flex overflow-x-auto rounded-[10px] bg-slate-200/80 p-0.5">
              {chapters.map((c) => (
                <a
                  key={c.id}
                  href={`#${c.id}`}
                  aria-current={activeChapter === c.id ? 'true' : undefined}
                  className={`flex-1 min-w-fit px-3 py-1.5 text-center text-[13px] rounded-lg whitespace-nowrap transition-colors ${activeChapter === c.id ? 'bg-white font-semibold text-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.12)]' : 'font-medium text-slate-700 hover:text-slate-900'}`}
                >
                  {c.label}
                </a>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main className="max-w-3xl mx-auto px-4">
        {/* Cover */}
        <section id="section-overview" data-chapter className="scroll-mt-32 pt-10 sm:pt-14">
          <p className="text-sm text-slate-500">Property report{report.headerInfo?.reportDate ? ` · ${report.headerInfo.reportDate}` : ''}</p>
          <h1 ref={titleRef} className="mt-2.5 font-serif text-[34px] sm:text-5xl font-bold leading-[1.06] tracking-[-0.03em] text-slate-900 [overflow-wrap:anywhere]">
            {addressLine1}
            {addressLine2 && <span className="block font-semibold text-slate-500">{addressLine2}</span>}
          </h1>
          {summaryBits.length > 0 && (
            <p className="mt-3.5 text-[17px] text-slate-500">{summaryBits.join(' · ')}</p>
          )}
          {/* Describes the area, never the house: reports are area-based (owner rule). */}
          <p className="mt-4 text-xl sm:text-[21px] leading-snug tracking-[-0.015em] text-slate-900">
            {yearBuilt ? 'What to check, ask and look up for a home of this age in this area.' : 'What to check, ask and look up for a home in this area.'}
          </p>

          {tiles.length > 0 && (
            <div className={`print:hidden mt-7 grid grid-cols-2 gap-3 ${tiles.length === 4 ? 'sm:grid-cols-4' : tiles.length === 3 ? 'sm:grid-cols-3' : ''}`}>
              {tiles.map((t) => (
                <a key={t.href} href={t.href} className="group flex flex-col gap-1 rounded-2xl bg-white p-4 sm:p-5 hover:bg-white/70 transition-colors">
                  <span className="font-serif text-[40px] leading-none font-bold tracking-[-0.03em] text-slate-900 tabular-nums">{t.big}</span>
                  <span className="text-[15px] leading-snug text-slate-500">{t.label}</span>
                  <span className="mt-auto pt-2.5 text-[15px] text-blue-600 group-hover:underline underline-offset-2">{t.go} ›</span>
                </a>
              ))}
            </div>
          )}
        </section>

        {researchSection && (
          <section id="section-your-research" data-chapter className="scroll-mt-32 pt-14">
            <ChapterHeader title={researchSection.title} />
            <div className="rounded-3xl bg-white p-5 sm:p-7">{researchSection.node}</div>
          </section>
        )}

        {/* Moving Company is the one trade category not tied to any specific finding or inspection
            topic (see PropertyReport.movingCompanyVendors in types.ts), so it gets a fixed slot right
            below the cover. Renders nothing when no vendor has bought it. */}
        {report.movingCompanyVendors && report.movingCompanyVendors.length > 0 && (
          <div className="pt-8"><SponsoredVendorCards vendors={report.movingCompanyVendors} /></div>
        )}

        {/* Inspection priorities and seller questions own their chapter heading (see InspectionPriorities.tsx /
            SellerQuestions.tsx). Each renders nothing when no rule set covers this (year built, county) pair. */}
        {report.inspectionPriorities && (
          <section id="section-inspection-priorities" data-chapter className="scroll-mt-32 pt-14">
            <InspectionPriorities precomputed={report.inspectionPriorities} />
          </section>
        )}

        {/* Home Inspector: a fixed slot on every report in the inspector's ZIPs (2026-11-22, see
            PropertyReport.homeInspectorVendors in types.ts), right after "what to check", where the buyer
            is about to book the inspection. Renders nothing when unsold. */}
        {report.homeInspectorVendors && report.homeInspectorVendors.length > 0 && (
          <div className="pt-6"><SponsoredVendorCards vendors={report.homeInspectorVendors} /></div>
        )}

        {report.sellerQuestionsScript && (
          <section id="section-seller-questions" data-chapter className="scroll-mt-32 pt-14">
            <SellerQuestions precomputed={report.sellerQuestionsScript} />
          </section>
        )}

        {/* Real Estate Agent: a fixed slot on every report in the agent's ZIPs (see
            PropertyReport.realEstateAgentVendors in types.ts), placed right after the seller questions,
            where the buyer needs someone to put them to the seller. Renders nothing when unsold. */}
        {report.realEstateAgentVendors && report.realEstateAgentVendors.length > 0 && (
          <div className="pt-6"><SponsoredVendorCards vendors={report.realEstateAgentVendors} /></div>
        )}

        {/* Records still to pull. Still listed in full, still honestly labeled. */}
        {pendingFindings.length > 0 && (
          <section id="section-needs-verification" data-chapter className="scroll-mt-32 pt-14">
            <ChapterHeader
              title="Records to pull yourself"
              intro={`These ${pendingFindings.length} records were not checked for this address. Each links to the official source for this area, so you can look it up before you sign.`}
            />
            <ul className="rounded-3xl bg-white divide-y divide-slate-200/70">
              {pendingFindings.map((finding) => (
                <li key={finding.id} data-print-block className="px-5 py-4 sm:px-6 space-y-1.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="text-[17px] font-semibold text-slate-900 min-w-0">{finding.subject}</h3>
                    {finding.sourceUrl && (
                      <a
                        href={finding.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 inline-flex items-center gap-0.5 text-[15px] text-blue-600 hover:underline underline-offset-2"
                      >
                        {/* Where this county has no known portal the link is the USA.gov local-office
                            directory, so it must not be labelled as if it were the record office. */}
                        <span>{/usa\.gov\/local-governments/.test(finding.sourceUrl) ? 'Find your local office' : (finding.sourceAgency || 'Check record')}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                  <p className="text-[15px] text-slate-600 leading-relaxed">{finding.suggestedNextStep}</p>
                  <SponsoredVendorCards vendors={finding.sponsoredVendors} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Interior Designer: a fixed box on every report in the designer's ZIPs (see
            PropertyReport.interiorDesignerVendors in types.ts), after the records -- the point where the
            report turns from checking the house to living in it. Renders nothing when unsold. */}
        {report.interiorDesignerVendors && report.interiorDesignerVendors.length > 0 && (
          <div className="pt-6"><SponsoredVendorCards vendors={report.interiorDesignerVendors} /></div>
        )}

        {/* Area: the live lookup(s), last. Hidden when nothing was checked live (2026-10-06): a lookup can fail,
            and a heading over an empty space reads as a broken report. */}
        {resolvedFindings.length > 0 && (
          <section id="section-findings" data-chapter className="scroll-mt-32 pt-14">
            <ChapterHeader title="The neighborhood" intro="Checked live for this address against public data." />
            <div className="space-y-4">
              {resolvedFindings.map(renderFindingCard)}
            </div>
          </section>
        )}

        {/* Sources, like footnotes at the foot of the report: the same fixed registry the source list shows. A <div>, not
            <footer>: print hides every header and footer (index.css), and the disclaimer must be in the PDF. */}
        <div className="report-sources mt-16 pt-5 border-t border-slate-300 text-xs leading-relaxed text-slate-500">
          <p className="font-semibold text-slate-700">Sources</p>
          <ol className="mt-2 list-decimal pl-5 space-y-1">
            {OFFICIAL_SOURCE_REGISTRY.map((s) => (
              <li key={s.id}>
                <a href={s.officialUrl} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-900 hover:underline underline-offset-2">{s.name}</a>
                {', '}{s.agency}{s.isLive ? ' · checked live for every address' : ''}
              </li>
            ))}
          </ol>
          <p className="print:hidden mt-3">
            <button
              type="button"
              onClick={() => setIsSourceModalOpen(true)}
              className="text-blue-600 hover:underline underline-offset-2 cursor-pointer"
            >
              What each of the {sourceCount} sources is used for
            </button>
          </p>

          {/* Disclaimer -- short and at the bottom, but the substance (no physical inspection, no title
              search, no valuation, verify at source) has to stay on every report. */}
          <p data-print-block className="mt-5">
            <span className="font-semibold text-slate-700">Disclaimer. </span>
            Before Regret links you to official public sources; it does not perform physical engineering inspections, legal title
            searches, or property valuations. Records under <strong>Records to pull yourself</strong> were not checked for this
            address: look each one up with the office that holds it before relying on it. Results under <strong>The neighborhood</strong> come
            from a query run against a government API for this address when the report was generated. The value was returned by the
            agency, not a verification of your property's condition, and agencies update their data. Sponsored listings are paid
            placements whose details we do not verify. Confirm physical building conditions with a licensed home inspector before closing.
          </p>
        </div>
      </main>

      {/* Source Modal */}
      {isSourceModalOpen && (
        <SourceRegistryModal
          onClose={() => setIsSourceModalOpen(false)}
        />
      )}

      {/* Error Reporting Modal */}
      {isErrorModalOpen && (
        <ErrorReportingModal
          sourceType="report"
          sourceRef={report.id}
          sourceLabel={report.headerInfo?.address || 'this report'}
          onClose={() => setIsErrorModalOpen(false)}
        />
      )}
    </div>
  );
};
