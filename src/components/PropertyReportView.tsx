import React, { useState } from 'react';
import {
  ExternalLink, Download, Building, Database, ArrowRight, Users, FileSearch,
} from 'lucide-react';
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
}

export const PropertyReportView: React.FC<PropertyReportViewProps> = ({ report, onNewSearch }) => {
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

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
        <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-3 text-amber-400">
            <Building className="w-8 h-8 shrink-0" />
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">VALIDATION GATE</span>
              <h1 className="text-2xl font-serif font-black text-white">Residential Scope Verification</h1>
            </div>
          </div>

          <div className="bg-amber-950/60 border border-amber-600/40 rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-bold text-amber-200">{headline}</h2>
            <p className="text-sm text-slate-200 leading-relaxed">
              {report.rejectionReason || `Before Regret insight reports apply exclusively to residential properties. ${formattedAddress || 'This address'} could not be verified as a residential property.`}
            </p>
          </div>

          <div className="pt-4 flex flex-wrap gap-4 items-center justify-between border-t border-slate-800">
            <p className="text-xs text-slate-400 font-medium">
              Need research for a residential property instead?
            </p>
            <button
              onClick={onNewSearch}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md"
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

  // REDESIGN 2026-10-10 (owner: "more professional and uncluttered", ads "highlighted and do not
  // get hidden/camouflaged"). What changed and why:
  //   - One reading column (max-w-3xl) and one card per section with the same header pattern, in
  //     place of an uppercase eyebrow + large serif heading + intro on every block.
  //   - A summary line and jump links under the address: the report runs to several screens.
  //   - "Your Action List" is gone: it repeated every inspection priority's howToCheck word for word.
  //     Those priorities now carry the checkboxes themselves (InspectionPriorities.tsx).
  //   - Sponsored cards have their own amber treatment (SponsoredVendorCard.tsx), so an ad can't be
  //     read as a finding and a vendor can see their placement at a glance. Unsold slots still
  //     render nothing: a homebuyer's report never carries an "advertise here" pitch.
  const PROPERTY_TYPE_LABEL: Record<string, string> = {
    single_family: 'Single-family home', condo: 'Condo', townhouse: 'Townhouse',
    multi_family: 'Multi-family', manufactured: 'Manufactured home', mobile_home: 'Manufactured home',
  };
  const rawType = report.propertyInfo?.propertyType || '';
  const typeLabel = PROPERTY_TYPE_LABEL[rawType] || (rawType ? rawType.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()) : '');
  // The declared year travels with the era engine's output rather than propertyInfo on most reports.
  const yearBuilt = report.propertyInfo?.yearBuilt || report.headerInfo?.yearBuilt
    || report.inspectionPriorities?.yearBuilt || report.sellerQuestionsScript?.yearBuilt;
  const county = report.propertyInfo?.county;
  const summaryBits = [
    typeLabel,
    yearBuilt ? `built ${yearBuilt} (as entered)` : '',
    county ? (/\b(county|parish|borough)\b/i.test(county) ? county : `${county} County`) : '',
  ].filter(Boolean);

  const sections = [
    resolvedFindings.length > 0 && { id: 'section-findings', label: 'Neighborhood' },
    priorityCount > 0 && { id: 'section-inspection-priorities', label: `Inspection priorities (${priorityCount})` },
    questionCount > 0 && { id: 'section-seller-questions', label: `Seller questions (${questionCount})` },
    pendingFindings.length > 0 && { id: 'section-needs-verification', label: `Records to pull (${pendingFindings.length})` },
  ].filter(Boolean) as Array<{ id: string; label: string }>;

  const statusLabel = (status: string): string | null =>
    status === 'NO RECORD FOUND' ? 'No record found' : null;

  const renderFindingCard = (finding: (typeof resolvedFindings)[number]) => (
    <div key={finding.id} data-print-block className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-900">{finding.subject}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{finding.sourceAgency || 'Public source'}</p>
        </div>
        {statusLabel(finding.status) && (
          <span className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full border bg-slate-50 text-slate-600 border-slate-200">
            {statusLabel(finding.status)}
          </span>
        )}
      </div>

      <p className="text-sm text-slate-800 leading-relaxed">{finding.whatWeFound}</p>

      {finding.metrics && finding.metrics.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-200 border border-slate-200 rounded-xl overflow-hidden">
          {finding.metrics.map((m) => (
            <div key={m.label} className="bg-white px-3 py-3">
              <div className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold leading-tight">{m.label}</div>
              <div className="text-base font-bold text-slate-900 mt-1 leading-tight tabular-nums">{m.value}</div>
              {m.comparison && <div className="text-[11px] text-slate-500 leading-snug mt-0.5">{m.comparison}</div>}
            </div>
          ))}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-xs font-semibold text-slate-900">Why it matters</div>
          <p className="text-slate-600 leading-relaxed mt-0.5">{finding.whyItMatters}</p>
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-900">What to do next</div>
          <p className="text-slate-600 leading-relaxed mt-0.5">
            {finding.suggestedNextStep}
            {finding.sourceUrl && (
              <>
                {' '}
                <a href={finding.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold hover:underline">
                  <span>Official record</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </>
            )}
          </p>
        </div>
      </div>

      <SponsoredVendorCards vendors={finding.sponsoredVendors} />
    </div>
  );

  const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; intro?: React.ReactNode }> = ({ icon, title, intro }) => (
    <div className="space-y-1.5 mb-6">
      <div className="flex items-center gap-2 text-slate-900">
        {icon}
        <h2 className="text-xl font-serif font-bold tracking-tight">{title}</h2>
      </div>
      {intro && <p className="text-sm text-slate-500 leading-relaxed">{intro}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      {/* Toolbar. Just a label, not a second brand lockup -- the global Navbar above already
          carries the logo. */}
      <header className="bg-white/95 backdrop-blur border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <span className="hidden sm:inline text-xs font-semibold text-slate-500 uppercase tracking-wide">Property report</span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setIsSourceModalOpen(true)}
              className="px-3 py-1.5 whitespace-nowrap text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Sources ({sourceCount})</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 whitespace-nowrap bg-slate-900 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save PDF</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Document header */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500">Property report</span>
            <span className="text-xs text-slate-400">{report.headerInfo?.reportDate}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight mt-2 leading-tight">
            {formattedAddress}
          </h1>
          {summaryBits.length > 0 && (
            <p className="text-sm text-slate-500 mt-2">{summaryBits.join(' · ')}</p>
          )}
          {sections.length > 1 && (
            <nav aria-label="Report sections" className="quick-jump-bar flex flex-wrap gap-2 mt-6 pt-5 border-t border-slate-100">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full px-3 py-1.5 transition-colors"
                >
                  {s.label}
                </a>
              ))}
            </nav>
          )}
        </section>

        {/* Moving Company is the one trade category not tied to any specific finding or inspection
            topic (see PropertyReport.movingCompanyVendors in types.ts), so it gets a fixed slot right
            below the address. Renders nothing when no vendor has bought it. */}
        <SponsoredVendorCards vendors={report.movingCompanyVendors} />

        {/* Neighborhood: the live lookup(s). Hidden when nothing was checked live (2026-10-06): a
            lookup can fail, and a heading over an empty space reads as a broken report. */}
        {resolvedFindings.length > 0 && (
          <section id="section-findings" className="scroll-mt-20 bg-white border border-slate-200 rounded-2xl p-5 sm:p-7">
            <div data-print-block>
              <SectionHeader
                icon={<Users className="w-5 h-5 text-blue-600 shrink-0" />}
                title="The neighborhood"
                intro="Checked live for this address against public data."
              />
            </div>
            <div className="space-y-8 divide-y divide-slate-100 [&>*+*]:pt-8">
              {resolvedFindings.map(renderFindingCard)}
            </div>
          </section>
        )}

        {/* Inspection priorities and seller questions own their full card and heading (see
            InspectionPriorities.tsx / SellerQuestions.tsx). Each renders nothing when no rule set
            covers this (year built, county) pair. */}
        {report.inspectionPriorities && (
          <section id="section-inspection-priorities" className="scroll-mt-20">
            <InspectionPriorities precomputed={report.inspectionPriorities} />
          </section>
        )}

        {report.sellerQuestionsScript && (
          <section id="section-seller-questions" className="scroll-mt-20">
            <SellerQuestions precomputed={report.sellerQuestionsScript} />
          </section>
        )}

        {/* Records still to pull -- deliberately last of the content sections: the priorities and
            seller questions are what a buyer most needs, and five "look this up yourself" items
            used to lead the report. Still listed in full, still honestly labeled. */}
        {pendingFindings.length > 0 && (
          <section id="section-needs-verification" className="scroll-mt-20 bg-white border border-slate-200 rounded-2xl p-5 sm:p-7">
            <div data-print-block>
              <SectionHeader
                icon={<FileSearch className="w-5 h-5 text-blue-600 shrink-0" />}
                title="Records to pull yourself"
                intro={`These ${pendingFindings.length} records were not checked for this address. Each links to the official source for this area, so you can look it up before you sign.`}
              />
            </div>
            <ul className="divide-y divide-slate-100">
              {pendingFindings.map((finding) => (
                <li key={finding.id} data-print-block className="py-4 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="text-sm font-semibold text-slate-900 min-w-0">{finding.subject}</h3>
                    {finding.sourceUrl && (
                      <a
                        href={finding.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                      >
                        {/* Where this county has no known portal the link is the USA.gov local-office
                            directory, so it must not be labelled as if it were the record office. */}
                        <span>{/usa\.gov\/local-governments/.test(finding.sourceUrl) ? 'Find your local office' : (finding.sourceAgency || 'Check record')}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{finding.suggestedNextStep}</p>
                  <SponsoredVendorCards vendors={finding.sponsoredVendors} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="print:hidden text-xs text-slate-500 leading-relaxed px-1">
          Want every public source behind this report, and which were checked live?{' '}
          <button
            onClick={() => setIsSourceModalOpen(true)}
            className="text-blue-600 hover:text-blue-800 font-semibold hover:underline cursor-pointer"
          >
            Open the source list
          </button>.
        </p>

        {/* Disclaimer -- short and at the bottom, but the substance (no physical inspection, no title
            search, no valuation, verify at source) has to stay on every report. */}
        <div data-print-block className="border-t border-slate-200 pt-5 text-[11px] text-slate-500 leading-relaxed px-1">
          <span className="font-semibold text-slate-700">Disclaimer. </span>
          Before Regret links you to official public sources; it does not perform physical engineering inspections, legal title
          searches, or property valuations. Records under <strong>Records to pull yourself</strong> were not checked for this
          address: look each one up with the office that holds it before relying on it. Results under <strong>The neighborhood</strong> come
          from a query run against a government API for this address when the report was generated. The value was returned by the
          agency, not a verification of your property's condition, and agencies update their data. Sponsored listings are paid
          placements whose details we do not verify. Confirm physical building conditions with a licensed home inspector before closing.
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
