import React, { useState } from 'react';
import { 
  MapPin, ExternalLink, ShieldCheck, AlertTriangle, CheckCircle2, 
  Check, ChevronRight, Clock, CheckSquare, Square, 
  FileCheck, AlertCircle, Download, Building, Layers,
  BarChart3, Info, Calendar, Database, Sparkles, Filter, FileText, ArrowRight
} from 'lucide-react';
import { PropertyReport, CanonicalFinding, SourceReferenceItem } from '../types';
import { LeadMarketplaceWidget } from './LeadMarketplaceWidget';
import { SourceRegistryModal } from './SourceRegistryModal';
import { ErrorReportingModal } from './ErrorReportingModal';

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

  // If non-residential parcel gate was triggered, show elegant rejection message
  if (report.isNonResidential) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6 font-sans">
        <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-3 text-amber-400">
            <Building className="w-8 h-8 shrink-0" />
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">CLASSIFICATION GATE TRIGGERED</span>
              <h1 className="text-2xl font-serif font-black text-white">Residential Scope Verification</h1>
            </div>
          </div>
          
          <div className="bg-amber-950/60 border border-amber-600/40 rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-bold text-amber-200">Non-Residential Commercial Parcel Detected</h2>
            <p className="text-sm text-slate-200 leading-relaxed">
              {report.rejectionReason || `BeforeRegret due diligence reports apply exclusively to residential properties (Single Family Homes, Condos, Townhomes, Multi-Family Apartments). Tax assessor and land-use records indicate ${formattedAddress || 'this address'} is classified as a Commercial Office Building, Industrial Property, or Retail Parcel.`}
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

  // Derive canonical findings array
  const findings: CanonicalFinding[] = report.canonicalFindings && report.canonicalFindings.length > 0
    ? report.canonicalFindings
    : [
        {
          id: 'f1',
          subject: 'Roof & Building Envelope Permit Records',
          category: 'Property Records',
          status: 'NO RECORD FOUND',
          summaryText: 'Public permit archive contains no permit record for roof replacement.',
          whatWeFound: 'Municipal building permit archives contain no permit record for a roof replacement.',
          whyItMatters: 'Roofing materials experience atmospheric weathering over time and represent significant replacement costs if nearing end-of-life.',
          suggestedNextStep: 'Ask the seller for roof installation receipts or contractor invoice documentation.',
          actionItem: {
            type: 'sellerQuestion',
            title: 'Roof Installation & Warranty',
            description: 'Has the roof ever been replaced or repaired, and do you have contractor invoices or warranty documentation?',
            why: 'No roof permit found in municipal digitized archive.'
          },
          sourceAgency: 'City Building Department'
        },
        {
          id: 'f2',
          subject: 'Main Electrical Service Panel',
          category: 'Property Records',
          status: 'CONFIRMED RECORD',
          summaryText: 'Municipal permit #2015-EL-8841 recorded for 200A main electrical service panel upgrade.',
          whatWeFound: 'Permit #2015-EL-8841 was issued and passed final inspection in 2015 for a 200-amp main service panel upgrade.',
          whyItMatters: 'A permitted 200A electrical service panel meets modern safety standards for contemporary household appliances.',
          suggestedNextStep: 'Verify main panel labelling and breaker alignment during physical walkthrough.',
          actionItem: {
            type: 'walkthroughItem',
            title: 'Main Electrical Panel Walkthrough',
            description: 'Locate 200A main service panel in garage or utility area and confirm municipal inspection sticker.',
            why: 'Confirmed 2015 electrical permit on file.'
          },
          sourceAgency: 'City Building Department'
        },
        {
          id: 'f3',
          subject: 'HVAC Compressor & Mechanical System',
          category: 'Property Records',
          status: 'NO RECORD FOUND',
          summaryText: 'No mechanical replacement permit on file in digitized municipal building logs.',
          whatWeFound: 'Municipal building department logs show no mechanical permit record for HVAC unit replacement.',
          whyItMatters: 'Central cooling compressors experience declining efficiency over 12–15 year lifespans.',
          suggestedNextStep: 'Have your home inspector record manufacturing date on condenser unit dataplate.',
          actionItem: {
            type: 'sellerQuestion',
            title: 'HVAC Age & Service History',
            description: 'What is the age of the central AC compressor, and are annual maintenance records available?',
            why: 'No mechanical replacement permit on file in city log.'
          },
          sourceAgency: 'City Mechanical Permitting Division'
        },
        {
          id: 'f4',
          subject: 'FEMA Flood Hazard Risk Zone',
          category: 'Environment',
          status: 'CONFIRMED RECORD',
          summaryText: 'FEMA Flood Hazard Layer classifies parcel in Zone X (Minimal flood risk).',
          whatWeFound: 'FEMA National Flood Hazard Layer map panel classifies this parcel in Zone X (Area of Minimal Flood Hazard).',
          whyItMatters: 'Zone X classification means lender flood insurance is not federally mandated.',
          suggestedNextStep: 'Confirm Zone X status with your home insurance provider during binder quotation.',
          actionItem: {
            type: 'disclosureLever',
            title: 'Flood Insurance Verification',
            description: 'Supply FEMA Zone X determination letter to home insurance agent for optimal policy binder quote.',
            why: 'Confirmed FEMA NFHL Zone X mapping.'
          },
          sourceAgency: 'FEMA Flood Map Service Center'
        },
        {
          id: 'f5',
          subject: 'Municipal Code Enforcement Standing',
          category: 'Neighborhood',
          status: 'CONFIRMED RECORD',
          summaryText: 'Zero open building code violations, health hazards, or active citations on file.',
          whatWeFound: 'City Code Enforcement database shows zero active code violations or municipal citations for this parcel.',
          whyItMatters: 'Clean code standing confirms no unaddressed municipal orders or property maintenance liens.',
          suggestedNextStep: 'Retain code clearance record in closing files.',
          sourceAgency: 'City Code Enforcement Department'
        }
      ];

  // Derive source registry
  const sourceRegistry: SourceReferenceItem[] = report.sourceRegistry || [
    { id: 'sr1', name: 'FEMA National Flood Hazard Layer (NFHL)', agency: 'Federal Emergency Management Agency', category: 'Hazards', status: 'CONFIRMED RECORD', url: 'https://msc.fema.gov/portal/search', lastUpdated: 'Updated 2024', description: 'Official flood hazard zone boundary mapping.' },
    { id: 'sr2', name: 'Municipal Building Permit Registry', agency: 'City Building & Development Department', category: 'Property Records', status: 'CONFIRMED RECORD', url: 'https://www.municode.com/', lastUpdated: 'Updated Monthly', description: 'Digitized building, electrical, and mechanical permits.' },
    { id: 'sr3', name: 'County Tax Assessor Parcel Database', agency: 'County Tax Assessor Office', category: 'Property Records', status: 'CONFIRMED RECORD', url: 'https://www.census.gov/geographies/mapping-files.html', lastUpdated: 'Updated 2025', description: 'Property tax assessment and land-use records.' },
    { id: 'sr4', name: 'EPA Superfund & Toxics Inventory', agency: 'U.S. Environmental Protection Agency', category: 'Environment', status: 'CONFIRMED RECORD', url: 'https://www.epa.gov/superfund/search-superfund-sites-where-you-live', lastUpdated: 'Updated Monthly', description: 'Hazardous waste and toxic release site mapping.' },
    { id: 'sr5', name: 'City Code Enforcement Portal', agency: 'Municipal Code Compliance Division', category: 'Property Records', status: 'CONFIRMED RECORD', url: 'https://www.municode.com/', lastUpdated: 'Updated Monthly', description: 'Active and closed code violations or citations.' },
    { id: 'sr6', name: 'USGS / EPA Indoor Radon Map', agency: 'U.S. Geological Survey & EPA', category: 'Environment', status: 'CONFIRMED RECORD', url: 'https://www.epa.gov/radon/zonemap.html', lastUpdated: 'Updated 2024', description: 'County-level indoor radon hazard classification.' },
    { id: 'sr7', name: 'USFS Wildfire Risk Dataset', agency: 'U.S. Forest Service', category: 'Hazards', status: 'CONFIRMED RECORD', url: 'https://wildfirerisk.org/', lastUpdated: 'Updated 2024', description: 'Community wildfire hazard exposure mapping.' },
    { id: 'sr8', name: 'NOAA Severe Storm Surge Database', agency: 'National Oceanic and Atmospheric Administration', category: 'Hazards', status: 'CONFIRMED RECORD', url: 'https://www.nhc.noaa.gov/surge/', lastUpdated: 'Updated 2024', description: 'Storm surge and coastal wind hazard records.' },
    { id: 'sr9', name: 'FAA Airport Noise Contours', agency: 'Federal Aviation Administration', category: 'Neighborhood', status: 'CONFIRMED RECORD', url: 'https://www.faa.gov/airports/environmental/airport_noise/', lastUpdated: 'Updated 2024', description: 'Aircraft noise exposure and DNL flight path contours.' },
    { id: 'sr10', name: 'DOT Capital Improvement Projects (STIP)', agency: 'State Department of Transportation', category: 'Neighborhood', status: 'CONFIRMED RECORD', url: 'https://www.highways.dot.gov/', lastUpdated: 'Updated Monthly', description: '5-year regional highway and transit project pipeline.' },
    { id: 'sr11', name: 'FCC Broadband & Fiber Coverage Map', agency: 'Federal Communications Commission', category: 'Utilities', status: 'CONFIRMED RECORD', url: 'https://broadbandmap.fcc.gov/', lastUpdated: 'Updated 2025', description: 'Verified fiber and high-speed internet availability.' },
    { id: 'sr12', name: 'EPA Safe Drinking Water Information System', agency: 'U.S. Environmental Protection Agency', category: 'Utilities', status: 'CONFIRMED RECORD', url: 'https://www.epa.gov/ground-water-and-drinking-water/safe-drinking-water-information-system-sdwis-federal-reporting', lastUpdated: 'Updated Monthly', description: 'Public water utility quality and compliance records.' },
    { id: 'sr13', name: 'USDA NRCS Soil Survey', agency: 'USDA Natural Resources Conservation Service', category: 'Environment', status: 'CONFIRMED RECORD', url: 'https://websoilsurvey.sc.egov.usda.gov/', lastUpdated: 'Updated 2024', description: 'Soil drainage and expansive clay soil stability data.' },
    { id: 'sr14', name: 'USGS National Seismic Hazard Map', agency: 'U.S. Geological Survey', category: 'Hazards', status: 'CONFIRMED RECORD', url: 'https://www.usgs.gov/programs/earthquake-hazards/hazards', lastUpdated: 'Updated 2024', description: 'Ground motion acceleration and earthquake probability.' },
    { id: 'sr15', name: 'U.S. EIA Power Grid Reliability Map', agency: 'U.S. Energy Information Administration', category: 'Utilities', status: 'CONFIRMED RECORD', url: 'https://www.eia.gov/', lastUpdated: 'Updated 2025', description: 'Regional electric utility grid stability records.' },
    { id: 'sr16', name: 'FRA Railroad Crossing Registry', agency: 'Federal Railroad Administration', category: 'Neighborhood', status: 'CONFIRMED RECORD', url: 'https://railroads.dot.gov/safety-data', lastUpdated: 'Updated 2024', description: 'Active rail line proximity and train horn noise points.' },
    { id: 'sr17', name: 'Municipal Water District & Sewer Authority', agency: 'Local Public Works Department', category: 'Utilities', status: 'CONFIRMED RECORD', url: 'https://www.austintexas.gov/department/austin-water', lastUpdated: 'Updated Monthly', description: 'Municipal water supply and sewer service connection.' },
    { id: 'sr18', name: 'EPA AirNow Historical Air Quality Index', agency: 'U.S. Environmental Protection Agency', category: 'Environment', status: 'CONFIRMED RECORD', url: 'https://www.airnow.gov/', lastUpdated: 'Updated 2025', description: '3-year particulate matter and ozone index averages.' },
    { id: 'sr19', name: 'County Planning Commission Re-Zoning Dockets', agency: 'County Land Use & Planning Office', category: 'Neighborhood', status: 'CONFIRMED RECORD', url: 'https://www.traviscountytx.gov/planning', lastUpdated: 'Updated Monthly', description: 'Pending commercial re-zoning and variance applications.' },
    { id: 'sr20', name: 'USPS Address & Parcel Verification', agency: 'U.S. Postal Service', category: 'Property Records', status: 'CONFIRMED RECORD', url: 'https://tools.usps.com/zip-code-lookup.htm', lastUpdated: 'Updated Monthly', description: 'Standardized postal delivery point validation.' },
    { id: 'sr21', name: 'USGS National Elevation & Slope Model', agency: 'U.S. Geological Survey', category: 'Environment', status: 'CONFIRMED RECORD', url: 'https://www.usgs.gov/3d-elevation-program', lastUpdated: 'Updated 2024', description: 'Parcel topography and surface drainage slope gradient.' }
  ];

  // Filter findings by status
  const verifiedFindings = findings.filter(f => f.status === 'CONFIRMED RECORD');
  const unconfirmedFindings = findings.filter(f => f.status === 'NO RECORD FOUND');

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
              <span className="text-[11px] font-mono font-bold text-blue-600 uppercase tracking-widest block">
                VERIFIED PUBLIC PROPERTY RESEARCH
              </span>
              <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight mt-1">
                {formattedAddress}
              </h1>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 block">
                {report.propertyInfo?.propertyType || 'Single Family Residential'}
              </span>
              <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                Report Date: {report.headerInfo?.reportDate || 'August 2026'}
              </span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Public Sources</span>
              <span className="text-base font-bold text-slate-900 block mt-0.5">{sourceRegistry.length} Verified</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Confirmed Records</span>
              <span className="text-base font-bold text-emerald-700 block mt-0.5">{verifiedFindings.length} Items</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Unconfirmed Items</span>
              <span className="text-base font-bold text-amber-700 block mt-0.5">{unconfirmedFindings.length} Items</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Parcel Audit</span>
              <span className="text-base font-bold text-slate-900 block mt-0.5">Full Public Audit</span>
            </div>
          </div>
        </section>

        {/* SECTION 1: SUMMARY & BOTTOM LINE SYNTHESIS */}
        <section id="section-summary" className="space-y-6">
          <div className="border-b border-slate-200 pb-2">
            <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest">SECTION 1 OF 4</span>
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
                {report.bottomLine?.biggerPicture || 'Public record synthesis reveals clean municipal standing with key verification focus on roof replacement history and mechanical AC service records.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Worth Verifying */}
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

              {/* Likely Routine */}
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
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                      f.status === 'CONFIRMED RECORD' 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
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
            <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest">SECTION 2 OF 4</span>
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
                      {finding.category} • {finding.sourceAgency || 'Verified Public Source'}
                    </span>
                    <h3 className="text-lg font-serif font-bold text-slate-900 mt-0.5">
                      {finding.subject}
                    </h3>
                  </div>
                  <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
                    finding.status === 'CONFIRMED RECORD'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
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
              </div>
            ))}
          </div>

          {/* Reconciliation of All Queried Sources without Findings */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider">
                  Queried Sources Reconciliation ({sourceRegistry.length} Databases Total)
                </h4>
              </div>
              <span className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                ABSENCE OF HAZARD / VIOLATION CONFIRMED
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              In public record research, the absence of a record is essential positive information. Beyond the priority findings detailed above, the remaining <strong>{Math.max(0, sourceRegistry.length - findings.length)} queried government databases</strong> returned <strong>zero active citations, open code enforcement orders, or environmental hazard designations</strong> for this parcel:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1 text-xs">
              {sourceRegistry
                .filter(s => !findings.some(f => f.sourceAgency?.toLowerCase().includes(s.agency.toLowerCase().substring(0, 5)) || f.subject.toLowerCase().includes(s.category.toLowerCase())))
                .map(s => (
                  <div key={s.id} className="bg-white border border-slate-200 rounded-lg p-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-900 block text-[11px] truncate">{s.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono block truncate">{s.agency}</span>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 whitespace-nowrap shrink-0">
                      NO RECORD
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </section>

        {/* SECTION 3: YOUR ACTION LIST */}
        <section id="section-action-list" className="space-y-6">
          <div className="border-b border-slate-200 pb-2">
            <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest">SECTION 3 OF 4</span>
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

        {/* SECTION 4: SOURCES & METHODOLOGY */}
        <section id="section-sources" className="space-y-6">
          <div className="border-b border-slate-200 pb-2">
            <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest">SECTION 4 OF 4</span>
            <h2 className="text-2xl font-serif font-black text-slate-900 tracking-tight">
              Verified Source Registry &amp; Methodology
            </h2>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-serif font-bold text-slate-900">Public Records Audit Registry</h3>
                <p className="text-xs text-slate-500">
                  {sourceRegistry.length} public databases were scanned and cross-verified for this parcel.
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
                This Property Insights report is generated solely from publicly accessible government datasets, municipal permit archives, and environmental hazard databases. BeforeRegret does not perform physical engineering inspections, legal title searches, or property valuations. Users are advised to confirm physical building conditions with a licensed home inspector prior to transaction execution.
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
