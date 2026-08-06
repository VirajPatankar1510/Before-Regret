import React, { useState } from 'react';
import { 
  MapPin, ExternalLink, AlertTriangle, CheckCircle2,
  Check, ChevronRight, Clock, CheckSquare, Square, 
  FileCheck, AlertCircle, Download, Building, Layers,
  BarChart3, Info, Calendar, Database, Sparkles, Filter, FileText, ArrowRight
} from 'lucide-react';
import { PropertyReport, CanonicalFinding, SourceReferenceItem } from '../types';
import { LeadMarketplaceWidget } from './LeadMarketplaceWidget';
import { SourceRegistryModal } from './SourceRegistryModal';
import { ErrorReportingModal } from './ErrorReportingModal';
import { SponsoredVendorCard } from './SponsoredVendorCard';
import { InspectionPriorities } from './InspectionPriorities';

interface PropertyReportViewProps {
  report: PropertyReport;
  onNewSearch: () => void;
}

export const PropertyReportView: React.FC<PropertyReportViewProps> = ({ report, onNewSearch }) => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

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
    const headline = layerHeadline[report.blockedAtLayer as number] || 'Residential Address Required';

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
              {report.rejectionReason || `BeforeRegret insight reports apply exclusively to residential properties. ${formattedAddress || 'This address'} could not be verified as a residential property.`}
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

  // Derive canonical findings array.
  // NOTE: BeforeRegret has no live data connection to any government record source yet, so the
  // fallback below must never assert a specific "CONFIRMED RECORD" (a permit date, a flood
  // zone, etc.) -- every entry here is honestly labeled 'NOT YET VERIFIED'.
  const findings: CanonicalFinding[] = report.canonicalFindings && report.canonicalFindings.length > 0
    ? report.canonicalFindings
    : [
        {
          id: 'f1',
          subject: 'Roof & Building Envelope Permit Records',
          category: 'Property Records',
          status: 'NOT YET VERIFIED',
          summaryText: 'BeforeRegret does not yet have a live, verified connection to municipal roof permit records for this address.',
          whatWeFound: 'No live data connection to this jurisdiction\'s permit archive exists yet.',
          whyItMatters: 'Roofing materials experience atmospheric weathering over time and represent significant replacement costs if nearing end-of-life.',
          suggestedNextStep: 'Ask the seller for roof installation receipts or contractor invoice documentation, and check the municipal permit portal directly.',
          actionItem: {
            type: 'sellerQuestion',
            title: 'Roof Installation & Warranty',
            description: 'Has the roof ever been replaced or repaired, and do you have contractor invoices or warranty documentation?',
            why: 'BeforeRegret has not yet independently verified permit records for this address.'
          },
          sourceAgency: 'City Building Department (not yet queried)'
        },
        {
          id: 'f2',
          subject: 'Main Electrical Service Panel',
          category: 'Property Records',
          status: 'NOT YET VERIFIED',
          summaryText: 'BeforeRegret does not yet have a live, verified connection to municipal electrical permit records for this address.',
          whatWeFound: 'No live data connection to this jurisdiction\'s permit archive exists yet.',
          whyItMatters: 'A permitted electrical service panel meets modern safety standards for contemporary household appliances.',
          suggestedNextStep: 'Verify main panel labelling and breaker alignment during physical walkthrough, and check the municipal permit portal directly.',
          actionItem: {
            type: 'walkthroughItem',
            title: 'Main Electrical Panel Walkthrough',
            description: 'Locate the main service panel in garage or utility area and confirm municipal inspection sticker.',
            why: 'BeforeRegret has not yet independently verified permit records for this address.'
          },
          sourceAgency: 'City Building Department (not yet queried)'
        },
        {
          id: 'f3',
          subject: 'HVAC Compressor & Mechanical System',
          category: 'Property Records',
          status: 'NOT YET VERIFIED',
          summaryText: 'BeforeRegret does not yet have a live, verified connection to municipal mechanical permit records for this address.',
          whatWeFound: 'No live data connection to this jurisdiction\'s permit archive exists yet.',
          whyItMatters: 'Central cooling compressors experience declining efficiency over 12-15 year lifespans.',
          suggestedNextStep: 'Have your home inspector record manufacturing date on condenser unit dataplate.',
          actionItem: {
            type: 'sellerQuestion',
            title: 'HVAC Age & Service History',
            description: 'What is the age of the central AC compressor, and are annual maintenance records available?',
            why: 'BeforeRegret has not yet independently verified permit records for this address.'
          },
          sourceAgency: 'City Mechanical Permitting Division (not yet queried)'
        },
        {
          id: 'f4',
          subject: 'FEMA Flood Hazard Risk Zone',
          category: 'Environment',
          status: 'NOT YET VERIFIED',
          summaryText: 'BeforeRegret does not yet have a live, verified connection to the FEMA National Flood Hazard Layer for this address.',
          whatWeFound: 'No live data connection to FEMA NFHL exists yet for this address.',
          whyItMatters: 'Flood zone classification affects whether mortgage lenders require flood insurance.',
          suggestedNextStep: 'Look up the official flood zone yourself at the FEMA Flood Map Service Center before making assumptions about insurance requirements.',
          actionItem: {
            type: 'disclosureLever',
            title: 'Flood Insurance Verification',
            description: 'Ask your insurance agent to pull the official FEMA flood zone determination for this address.',
            why: 'BeforeRegret has not yet independently verified FEMA flood zone data for this address.'
          },
          sourceAgency: 'FEMA Flood Map Service Center (not yet queried)'
        },
        {
          id: 'f5',
          subject: 'Municipal Code Enforcement Standing',
          category: 'Neighborhood',
          status: 'NOT YET VERIFIED',
          summaryText: 'BeforeRegret does not yet have a live, verified connection to municipal code enforcement records for this address.',
          whatWeFound: 'No live data connection to this jurisdiction\'s code enforcement system exists yet.',
          whyItMatters: 'Open code violations or municipal orders can affect closing and future liability.',
          suggestedNextStep: 'Check the municipal code enforcement portal directly before closing.',
          sourceAgency: 'City Code Enforcement Department (not yet queried)'
        }
      ];

  // Derive source registry. sr14 (USGS seismic) mirrors whatever the Findings section actually
  // shows for f_seismic -- otherwise this static list would still say "NOT YET VERIFIED" for
  // USGS even on a report where the seismic finding was genuinely live-queried and confirmed,
  // contradicting the Findings section on the same page.
  const seismicConfirmed = findings.some(f => f.id === 'f_seismic' && f.status === 'CONFIRMED RECORD');
  const sourceRegistry: SourceReferenceItem[] = report.sourceRegistry || [
    { id: 'sr1', name: 'FEMA National Flood Hazard Layer (NFHL)', agency: 'Federal Emergency Management Agency', category: 'Hazards', status: 'NOT YET VERIFIED', url: 'https://msc.fema.gov/portal/search', lastUpdated: 'Updated 2024', description: 'Official flood hazard zone boundary mapping.' },
    { id: 'sr2', name: 'Municipal Building Permit Registry', agency: 'City Building & Development Department', category: 'Property Records', status: 'NOT YET VERIFIED', url: 'https://abc.austintexas.gov/web/user/guest/interactive-citizen-search', lastUpdated: 'Updated Monthly', description: 'Digitized building, electrical, and mechanical permits.' },
    { id: 'sr3', name: 'County Tax Assessor Parcel Database', agency: 'County Tax Assessor Office', category: 'Property Records', status: 'NOT YET VERIFIED', url: 'https://traviscad.org/propertysearch', lastUpdated: 'Updated 2025', description: 'Property tax assessment and land-use records.' },
    { id: 'sr4', name: 'EPA Superfund & Toxics Inventory', agency: 'U.S. Environmental Protection Agency', category: 'Environment', status: 'NOT YET VERIFIED', url: 'https://enviro.epa.gov', lastUpdated: 'Updated Monthly', description: 'Hazardous waste and toxic release site mapping.' },
    { id: 'sr5', name: 'City Code Enforcement Portal', agency: 'Municipal Code Compliance Division', category: 'Property Records', status: 'NOT YET VERIFIED', url: 'https://abc.austintexas.gov/web/user/guest/interactive-citizen-search', lastUpdated: 'Updated Monthly', description: 'Active and closed code violations or citations.' },
    { id: 'sr6', name: 'USGS / EPA Indoor Radon Map', agency: 'U.S. Geological Survey & EPA', category: 'Environment', status: 'NOT YET VERIFIED', url: 'https://www.epa.gov/radon/find-information-about-local-radon-zones-and-radon-programs', lastUpdated: 'Updated 2024', description: 'County-level indoor radon hazard classification.' },
    { id: 'sr7', name: 'USFS Wildfire Risk Dataset', agency: 'U.S. Forest Service', category: 'Hazards', status: 'NOT YET VERIFIED', url: 'https://www.wildfirerisk.org', lastUpdated: 'Updated 2024', description: 'Community wildfire hazard exposure mapping.' },
    { id: 'sr8', name: 'NOAA Severe Storm Surge Database', agency: 'National Oceanic and Atmospheric Administration', category: 'Hazards', status: 'NOT YET VERIFIED', url: 'https://www.ncdc.noaa.gov/stormevents/', lastUpdated: 'Updated 2024', description: 'Storm surge and coastal wind hazard records.' },
    { id: 'sr9', name: 'FAA Airport Noise Contours', agency: 'Federal Aviation Administration', category: 'Neighborhood', status: 'NOT YET VERIFIED', url: 'https://www.faa.gov/regulations_policies/policy_guidance/noise', lastUpdated: 'Updated 2024', description: 'Aircraft noise exposure and DNL flight path contours.' },
    { id: 'sr10', name: 'DOT Capital Improvement Projects (STIP)', agency: 'State Department of Transportation', category: 'Neighborhood', status: 'NOT YET VERIFIED', url: 'https://www.fhwa.dot.gov/stip/', lastUpdated: 'Updated Monthly', description: '5-year regional highway and transit project pipeline.' },
    { id: 'sr11', name: 'FCC Broadband & Fiber Coverage Map', agency: 'Federal Communications Commission', category: 'Utilities', status: 'NOT YET VERIFIED', url: 'https://broadbandmap.fcc.gov', lastUpdated: 'Updated 2025', description: 'Verified fiber and high-speed internet availability.' },
    { id: 'sr12', name: 'EPA Safe Drinking Water Information System', agency: 'U.S. Environmental Protection Agency', category: 'Utilities', status: 'NOT YET VERIFIED', url: 'https://www.epa.gov/ground-water-and-drinking-water/safe-drinking-water-information-system-sdwis-federal-reporting', lastUpdated: 'Updated Monthly', description: 'Public water utility quality and compliance records.' },
    { id: 'sr13', name: 'USDA NRCS Soil Survey', agency: 'USDA Natural Resources Conservation Service', category: 'Environment', status: 'NOT YET VERIFIED', url: 'https://websoilsurvey.nrcs.usda.gov', lastUpdated: 'Updated 2024', description: 'Soil drainage and expansive clay soil stability data.' },
    { id: 'sr14', name: 'USGS National Seismic Hazard Map', agency: 'U.S. Geological Survey', category: 'Hazards', status: seismicConfirmed ? 'CONFIRMED RECORD' : 'NOT YET VERIFIED', url: 'https://earthquake.usgs.gov/hazards/hazmaps/', lastUpdated: seismicConfirmed ? 'Live-queried (ASCE 7-22)' : 'Updated 2024', description: 'Ground motion acceleration and earthquake probability.' },
    { id: 'sr15', name: 'U.S. EIA Power Grid Reliability Map', agency: 'U.S. Energy Information Administration', category: 'Utilities', status: 'NOT YET VERIFIED', url: 'https://www.eia.gov/electricity/gridmonitor/', lastUpdated: 'Updated 2025', description: 'Regional electric utility grid stability records.' },
    { id: 'sr16', name: 'FRA Railroad Crossing Registry', agency: 'Federal Railroad Administration', category: 'Neighborhood', status: 'NOT YET VERIFIED', url: 'https://railroads.dot.gov/railroad-safety/accident-incident-reporting/emergency-notification-system-ens/ens', lastUpdated: 'Updated 2024', description: 'Active rail line proximity and train horn noise points.' },
    { id: 'sr17', name: 'Municipal Water District & Sewer Authority', agency: 'Local Public Works Department', category: 'Utilities', status: 'NOT YET VERIFIED', url: 'https://www.austintexas.gov/department/austin-water', lastUpdated: 'Updated Monthly', description: 'Municipal water supply and sewer service connection.' },
    { id: 'sr18', name: 'EPA AirNow Historical Air Quality Index', agency: 'U.S. Environmental Protection Agency', category: 'Environment', status: 'NOT YET VERIFIED', url: 'https://www.airnow.gov', lastUpdated: 'Updated 2025', description: '3-year particulate matter and ozone index averages.' },
    { id: 'sr19', name: 'County Planning Commission Re-Zoning Dockets', agency: 'County Land Use & Planning Office', category: 'Neighborhood', status: 'NOT YET VERIFIED', url: 'https://www.austintexas.gov/department/development-services', lastUpdated: 'Updated Monthly', description: 'Pending commercial re-zoning and variance applications.' },
    { id: 'sr20', name: 'USPS Address & Parcel Verification', agency: 'U.S. Postal Service', category: 'Property Records', status: 'NOT YET VERIFIED', url: 'https://tools.usps.com/zip-code-lookup.htm', lastUpdated: 'Updated Monthly', description: 'Standardized postal delivery point validation.' },
    { id: 'sr21', name: 'USGS National Elevation & Slope Model', agency: 'U.S. Geological Survey', category: 'Environment', status: 'NOT YET VERIFIED', url: 'https://apps.nationalmap.gov/elevation/', lastUpdated: 'Updated 2024', description: 'Parcel topography and surface drainage slope gradient.' }
  ];

  // Filter findings by status. Most findings today are 'NOT YET VERIFIED' because BeforeRegret
  // has no live data connection yet -- this stays generic so it renders correctly once real
  // 'CONFIRMED RECORD' / 'NO RECORD FOUND' data exists for a jurisdiction.
  const verifiedFindings = findings.filter(f => f.status === 'CONFIRMED RECORD');
  const unconfirmedFindings = findings.filter(f => f.status === 'NO RECORD FOUND');
  const pendingFindings = findings.filter(f => f.status === 'NOT YET VERIFIED');
  // This used to only flip to the confident "VERIFIED PUBLIC PROPERTY RESEARCH" / "Full Public
  // Audit" label when *every* finding was unverified. Once USGS seismic became a genuinely live
  // finding queried for every address, that meant a single real source out of ~21 permanently
  // flipped every report to the confident label -- 1-for-21 is not an audit. Require verified
  // findings to be a real majority before making that claim; short of that, stay in the honest
  // reference-checklist framing regardless of exactly how many sources are still pending.
  const mostlyUnverified = findings.length === 0 || verifiedFindings.length < findings.length / 2;

  const statusBadgeClasses = (status: string) => {
    if (status === 'CONFIRMED RECORD') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (status === 'NO RECORD FOUND') return 'bg-amber-50 text-amber-800 border-amber-200';
    return 'bg-slate-100 text-slate-600 border-slate-300';
  };

  // Toggle checklist checkbox
  const toggleCheck = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Copy helper
  const copyText = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      {/* Print / PDF Print Styles */}
      <style>{`
        @media print {
          header { display: none !important; }
          body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important; color: #0f172a !important; background: #ffffff !important; }
          main { max-width: 100% !important; padding: 0 !important; }
          section { page-break-inside: avoid; margin-bottom: 24px !important; }
          h1, h2, h3, h4 { word-spacing: normal !important; letter-spacing: normal !important; }
          .shadow-xs, .shadow-md, .shadow-xl { box-shadow: none !important; }
          a { text-decoration: underline !important; color: #2563eb !important; }
        }
      `}</style>

      {/* Header Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-sm">
              BR
            </div>
            <div>
              <span className="font-serif font-black text-slate-900 text-base tracking-tight block">BeforeRegret</span>
              <span className="text-[10px] font-mono text-slate-500 block uppercase tracking-wider">Property Insights</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSourceModalOpen(true)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Source Registry</span> ({sourceRegistry.length})
            </button>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-10">

        {/* Document Header Panel */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <span className={`text-[11px] font-mono font-bold uppercase tracking-widest block ${mostlyUnverified ? 'text-slate-500' : 'text-blue-600'}`}>
                {mostlyUnverified ? 'RECORDS REFERENCE — NOT YET INDEPENDENTLY VERIFIED' : 'VERIFIED PUBLIC PROPERTY RESEARCH'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight mt-1">
                {formattedAddress}
              </h1>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-400 block">
                Report Date: {report.headerInfo?.reportDate || 'August 2026'}
              </span>
            </div>
          </div>

          {mostlyUnverified && (
            <div className="bg-slate-100 border border-slate-300 rounded-xl p-4 text-xs text-slate-700 leading-relaxed">
              <span className="font-bold block text-slate-900 mb-1">BeforeRegret does not yet have a live, verified data connection for this address.</span>
              This page links directly to the official public sources below so you can check each record yourself before closing. Nothing on this page should be treated as a confirmed finding until you verify it at the source.
            </div>
          )}

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Public Sources</span>
              <span className="text-base font-bold text-slate-900 block mt-0.5">{sourceRegistry.length} Linked</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Confirmed Records</span>
              <span className="text-base font-bold text-emerald-700 block mt-0.5">{verifiedFindings.length} Items</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Not Yet Verified</span>
              <span className="text-base font-bold text-slate-600 block mt-0.5">{pendingFindings.length} Items</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Research Type</span>
              <span className="text-base font-bold text-slate-900 block mt-0.5">{mostlyUnverified ? 'Reference Checklist' : 'Full Public Audit'}</span>
            </div>
          </div>
        </section>

        {/* SECTION 1: SUMMARY & BOTTOM LINE SYNTHESIS */}
        <section id="section-summary" className="space-y-6">
          <div className="border-b border-slate-200 pb-2">
            <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest">SECTION 1 OF {report.inspectionPriorities ? 5 : 4}</span>
            <h2 className="text-2xl font-serif font-black text-slate-900 tracking-tight">
              Executive Summary &amp; Bottom Line Synthesis
            </h2>
          </div>

          {/* Single Dark Card for Bottom Line Synthesis */}
          <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-md">
            <div>
              <span className="text-xs font-mono font-extrabold text-amber-400 uppercase tracking-widest block">
                BUYER DECISION SYNTHESIS
              </span>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-white mt-1">
                Bottom Line Guidance
              </h3>
              <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                {report.bottomLine?.biggerPicture || 'BeforeRegret does not yet have a live, verified data connection to government records for this address. This checklist links you directly to the official public sources so you can verify each item yourself before closing.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Not Yet Verified */}
              {pendingFindings.length > 0 && (
                <div className={`bg-slate-800/80 border border-slate-700 rounded-xl p-5 space-y-3 ${unconfirmedFindings.length === 0 && verifiedFindings.length === 0 ? 'md:col-span-2' : ''}`}>
                  <div className="flex items-center gap-2 text-slate-300 font-extrabold text-xs uppercase tracking-wider font-mono">
                    <Info className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Not Yet Verified — Check These Yourself</span>
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {pendingFindings.map((item, idx) => (
                      <li key={`pd-${idx}`} className="bg-slate-900/90 border border-slate-700 rounded-lg p-3 text-xs space-y-1">
                        <span className="font-bold text-slate-200 block">{item.subject}</span>
                        <span className="text-slate-400 leading-relaxed block text-[11px]">{item.summaryText}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Worth Verifying */}
              {unconfirmedFindings.length > 0 && (
                <div className="bg-amber-950/60 border border-amber-600/40 rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider font-mono">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Worth Verifying (Priority Items)</span>
                  </div>
                  <ul className="space-y-2 pt-1">
                    {unconfirmedFindings.map((item, idx) => (
                      <li key={`wv-${idx}`} className="bg-slate-900/90 border border-amber-900/60 rounded-lg p-3 text-xs space-y-1">
                        <span className="font-bold text-amber-300 block">{item.subject}</span>
                        <span className="text-slate-200 leading-relaxed block text-[11px]">{item.summaryText}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Likely Routine */}
              {verifiedFindings.length > 0 && (
                <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-blue-400 font-extrabold text-xs uppercase tracking-wider font-mono">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Likely Routine (Confirmed Status)</span>
                  </div>
                  <ul className="space-y-2 pt-1">
                    {verifiedFindings.map((item, idx) => (
                      <li key={`lr-${idx}`} className="bg-slate-900/90 border border-slate-700 rounded-lg p-3 text-xs space-y-1">
                        <span className="font-bold text-blue-300 block">{item.subject}</span>
                        <span className="text-slate-200 leading-relaxed block text-[11px]">{item.summaryText}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Status Overview Grid */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
            <h3 className="text-lg font-serif font-bold text-slate-900">Findings At a Glance</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {findings.map((f) => (
                <div key={f.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">{f.category}</span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${statusBadgeClasses(f.status)}`}>
                      {f.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{f.subject}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2">{f.summaryText}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 2: DETAILED FINDINGS */}
        <section id="section-findings" className="space-y-6">
          <div className="border-b border-slate-200 pb-2">
            <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest">SECTION 2 OF {report.inspectionPriorities ? 5 : 4}</span>
            <h2 className="text-2xl font-serif font-black text-slate-900 tracking-tight">
              Detailed Public Record Findings
            </h2>
          </div>

          <div className="space-y-4">
            {findings.map((finding) => (
              <div key={finding.id} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs hover:border-slate-300 transition-all">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                      {finding.category} • {finding.sourceAgency || 'Public Source (not yet queried)'}
                    </span>
                    <h3 className="text-lg font-serif font-bold text-slate-900 mt-0.5">
                      {finding.subject}
                    </h3>
                  </div>
                  <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${statusBadgeClasses(finding.status)}`}>
                    {finding.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1">
                    <span className="font-mono font-bold text-slate-500 uppercase text-[10px] block">1. What We Found</span>
                    <p className="text-slate-800 font-medium leading-relaxed">{finding.whatWeFound}</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1">
                    <span className="font-mono font-bold text-slate-500 uppercase text-[10px] block">2. Why It Matters</span>
                    <p className="text-slate-800 font-medium leading-relaxed">{finding.whyItMatters}</p>
                  </div>

                  <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 space-y-1">
                    <span className="font-mono font-bold text-blue-600 uppercase text-[10px] block">3. Suggested Next Step</span>
                    <p className="text-blue-950 font-semibold leading-relaxed">{finding.suggestedNextStep}</p>
                  </div>
                </div>

                {/* Contextual vendor match for this specific finding's trade category, if a real
                    vendor has paid for it in this ZIP -- renders nothing otherwise. */}
                {finding.sponsoredVendor && (
                  <SponsoredVendorCard vendor={finding.sponsoredVendor} />
                )}
              </div>
            ))}
          </div>

          {/* Remaining linked sources not covered by a specific finding above */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-slate-500" />
                <h4 className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider">
                  Other Linked Public Sources ({sourceRegistry.length} Total)
                </h4>
              </div>
              <span className="text-[10px] font-mono font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-300">
                NOT YET QUERIED
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              BeforeRegret has not yet independently queried these sources for this address. They are provided as direct links to the official portals so you can check them yourself:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1 text-xs">
              {sourceRegistry
                .filter(s => !findings.some(f => f.sourceAgency?.toLowerCase().includes(s.agency.toLowerCase().substring(0, 5)) || f.subject.toLowerCase().includes(s.category.toLowerCase())))
                .map(s => (
                  <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" className="bg-white border border-slate-200 rounded-lg p-2.5 flex items-center justify-between gap-2 hover:border-blue-300 transition-all">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-900 block text-[11px] truncate">{s.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono block truncate">{s.agency}</span>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300 whitespace-nowrap shrink-0">
                      NOT QUERIED
                    </span>
                  </a>
                ))}
            </div>
          </div>
        </section>

        {/* SECTION 3: INSPECTION BUDGET PRIORITIES -- renders nothing when no rule set covers
            this (year built, county) pair, same as the free summary version. */}
        {report.inspectionPriorities && (
          <section id="section-inspection-priorities" className="space-y-6">
            <div className="border-b border-slate-200 pb-2">
              <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest">SECTION 3 OF 5</span>
              <h2 className="text-2xl font-serif font-black text-slate-900 tracking-tight">
                Inspection Budget Priorities
              </h2>
            </div>
            <InspectionPriorities precomputed={report.inspectionPriorities} />
          </section>
        )}

        {/* SECTION 4: YOUR ACTION LIST */}
        <section id="section-action-list" className="space-y-6">
          <div className="border-b border-slate-200 pb-2">
            <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest">SECTION {report.inspectionPriorities ? 4 : 3} OF {report.inspectionPriorities ? 5 : 4}</span>
            <h2 className="text-2xl font-serif font-black text-slate-900 tracking-tight">
              Your Action List
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Seller Questions */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-serif font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span>Questions for Seller / Agent</span>
                </h3>
                <button
                  onClick={() => copyText(
                    findings.filter(f => f.actionItem?.type === 'sellerQuestion').map(f => f.actionItem?.description).join('\n\n'),
                    'seller-questions'
                  )}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 cursor-pointer"
                >
                  {copiedSection === 'seller-questions' ? 'Copied!' : 'Copy Questions'}
                </button>
              </div>

              <div className="space-y-3">
                {findings.filter(f => f.actionItem?.type === 'sellerQuestion').map((f, idx) => (
                  <div key={`sq-${idx}`} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1 text-xs">
                    <span className="font-bold text-slate-900 block">{f.actionItem?.title || f.subject}</span>
                    <p className="text-slate-700 leading-relaxed font-medium">"{f.actionItem?.description}"</p>
                    <span className="text-[10px] text-slate-400 font-mono block pt-1">Reason: {f.actionItem?.why}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Walkthrough Checklist */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-lg font-serif font-bold text-slate-900 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-blue-600" />
                  <span>Walkthrough Checklist</span>
                </h3>
              </div>

              <div className="space-y-3">
                {findings.filter(f => f.actionItem?.type === 'walkthroughItem').map((f, idx) => {
                  const checkId = `wt-${idx}`;
                  const isChecked = checkedItems[checkId] || false;
                  return (
                    <div
                      key={checkId}
                      onClick={() => toggleCheck(checkId)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 text-xs ${
                        isChecked 
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' 
                          : 'bg-slate-50 border-slate-200 text-slate-900 hover:border-slate-300'
                      }`}
                    >
                      <button className="mt-0.5 text-blue-600 shrink-0">
                        {isChecked ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                      </button>
                      <div className="space-y-0.5">
                        <span className={`font-bold block ${isChecked ? 'line-through text-emerald-900' : 'text-slate-900'}`}>
                          {f.actionItem?.title || f.subject}
                        </span>
                        <p className="text-slate-600 leading-relaxed">{f.actionItem?.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5 (or 4 without inspection priorities): SOURCES & METHODOLOGY */}
        <section id="section-sources" className="space-y-6">
          <div className="border-b border-slate-200 pb-2">
            <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest">SECTION {report.inspectionPriorities ? 5 : 4} OF {report.inspectionPriorities ? 5 : 4}</span>
            <h2 className="text-2xl font-serif font-black text-slate-900 tracking-tight">
              Source Registry &amp; Methodology
            </h2>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-serif font-bold text-slate-900">Public Records Reference Registry</h3>
                <p className="text-xs text-slate-500">
                  {sourceRegistry.length} official public sources are linked below for your own reference. BeforeRegret has not yet independently queried these for this address.
                </p>
              </div>
              <button
                onClick={() => setIsSourceModalOpen(true)}
                className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Registry Details</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-mono text-slate-500 uppercase bg-slate-50">
                    <th className="p-3">Source Name</th>
                    <th className="p-3">Agency</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Last Updated</th>
                    <th className="p-3">Direct Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sourceRegistry.map((src) => {
                    const portalUrl = src.url || (src as any).officialUrl || 'https://msc.fema.gov/portal/search';
                    return (
                      <tr key={src.id} className="hover:bg-slate-50/80 transition-all">
                        <td className="p-3 font-bold text-slate-900">{src.name}</td>
                        <td className="p-3 text-slate-600">{src.agency}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono rounded border border-slate-200">
                            {src.category}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[10px] text-slate-500">{src.lastUpdated || 'Active'}</td>
                        <td className="p-3">
                          <a
                            href={portalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 hover:underline"
                          >
                            <span>Open Record</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Non-Diagnostic Disclaimer */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-[11px] text-slate-500 leading-relaxed space-y-1">
              <span className="font-bold text-slate-700 block uppercase font-mono tracking-wider">METHODOLOGY &amp; LEGAL DISCLAIMER</span>
              <p>
                BeforeRegret does not yet have a live, verified data connection to government datasets, municipal permit archives, or environmental hazard databases for this address. This page links to the official public sources so you can check them yourself. BeforeRegret does not perform physical engineering inspections, legal title searches, or property valuations, and nothing on this page should be treated as a confirmed record until you verify it directly with the source agency. Users are advised to confirm physical building conditions with a licensed home inspector prior to transaction execution.
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* Source Modal */}
      {isSourceModalOpen && (
        <SourceRegistryModal
          sources={sourceRegistry}
          onClose={() => setIsSourceModalOpen(false)}
        />
      )}

      {/* Error Reporting Modal */}
      {isErrorModalOpen && (
        <ErrorReportingModal
          reportId={report.id}
          address={report.headerInfo?.address || ''}
          onClose={() => setIsErrorModalOpen(false)}
        />
      )}
    </div>
  );
};
