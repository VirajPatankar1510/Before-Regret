import type { InspectionPriority } from './engine/inspectionPriorities';
import type { SellerQuestion } from './engine/sellerQuestions';

// A published guide's title + real URL -- shared by any generator that needs to cite an actual
// BeforeRegret guide by name (countyEventGenerator.ts, defectReferenceGenerator.ts) rather than
// invent one.
export interface GuideReference {
  title: string;
  url: string;
}

export type ViewState =
  | 'HOME'
  | 'RESEARCHING'
  | 'SUMMARY'
  | 'REPORT';

export type ConfidenceLevel = 'CONFIRMED RECORD' | 'NO RECORD FOUND' | 'Confirmed Record' | 'No Record Found' | 'NOT YET VERIFIED';
export type CanonicalStatus = 'CONFIRMED RECORD' | 'NO RECORD FOUND' | 'NOT YET VERIFIED';

export interface ActionItem {
  type: 'sellerQuestion' | 'walkthroughItem' | 'disclosureLever';
  title: string;
  description: string;
  why: string;
}

/**
 * A single scannable data point on a finding card. Optional -- a finding that has no clean
 * numeric breakdown simply omits it and renders as prose only.
 *
 * Exists because the neighborhood finding was emitting seven distinct comparisons as one
 * ~130-word run-on paragraph. Everything in it was genuinely useful, but a reader scanning a
 * report they paid for shouldn't have to parse prose to find "what does this cost per month."
 * `value` is the headline number; `comparison` is the part that makes it a finding rather than
 * a statistic (e.g. "$1,151 above county median").
 */
export interface FindingMetric {
  label: string;
  value: string;
  comparison?: string;
}

export interface CanonicalFinding {
  id: string;
  subject: string;
  category: 'Property Records' | 'Environment' | 'Neighborhood';
  status: CanonicalStatus;
  summaryText: string;
  whatWeFound: string;
  whyItMatters: string;
  suggestedNextStep: string;
  /** Scannable numeric breakdown rendered as a grid above the prose. See FindingMetric. */
  metrics?: FindingMetric[];
  actionItem?: ActionItem;
  lastUpdated?: string;
  sourceAgency?: string;
  // Set server-side, jurisdiction-aware (see attachFindingSourceUrls in server.ts). Replaces the
  // old approach of a single hardcoded 21-item "Source Registry" table that pointed every report
  // nationwide at Austin/Travis County portals regardless of the actual address, and that listed
  // most of its own entries as "NOT QUERIED" -- padding that made a thin report look thinner, not
  // fuller. Each finding now carries its own real, correct link instead.
  sourceUrl?: string;
  // Set server-side when real, paying vendors match this finding's trade category for this ZIP
  // (see FINDING_TRADE_CATEGORY in sponsoredVendors.ts). Up to MAX_SLOTS_PER_ZIP_TRADE (2), not
  // just the single earliest buyer -- the second vendor for a (zip, trade) pair used to pay the
  // same $29 as the first and never appear anywhere, silently, for as long as the first stayed
  // active. Attached at most once per trade category per report, at whichever finding or
  // inspection-priority item matches it first in reading order (see attachSponsoredVendors in
  // server.ts) -- a category that matches several items in one report (e.g. Home Inspector via
  // three separate inspection priorities on an old house) used to show the same vendor's card
  // repeatedly instead of once.
  sponsoredVendors?: SponsoredVendor[];
}

// The engine (engine/inspectionPriorities.ts) is deliberately vendor-agnostic -- it's building-
// science judgment, not a monetization concern. Vendor matching is applied on top, server-side,
// same pattern and same dedup-across-the-report reasoning as CanonicalFinding.sponsoredVendors
// above (see PRIORITY_TRADE_CATEGORY in sponsoredVendors.ts).
export interface InspectionPriorityWithVendor extends InspectionPriority {
  sponsoredVendors?: SponsoredVendor[];
}

export interface InspectionPrioritiesReportData {
  yearBuilt: number;
  eraLabel: string;
  regionLabel: string;
  priorities: InspectionPriorityWithVendor[];
  insuranceRedFlags: string[];
}

// Same vendor-attachment pattern as InspectionPriorityWithVendor above, for the one seller
// question (septic_seller) that has a real trade match -- see SELLER_QUESTION_TRADE_CATEGORY in
// sponsoredVendors.ts. Every other question in the script has no corresponding licensed trade, so
// sponsoredVendors is simply absent on those.
export interface SellerQuestionWithVendor extends SellerQuestion {
  sponsoredVendors?: SponsoredVendor[];
}

// Computed server-side from the same (year built, county, state) triple as
// InspectionPrioritiesReportData, plus the requester-declared property type (see
// engine/sellerQuestions.ts).
export interface SellerQuestionsReportData {
  yearBuilt: number;
  eraLabel: string;
  regionLabel: string;
  questions: SellerQuestionWithVendor[];
}


export interface PropertySearchResult {
  placeId: string;
  formattedAddress: string;
  streetNumber?: string;
  streetName?: string;
  city: string;
  state: string;
  zipCode: string;
  county?: string;
  country: string;
  lat: number;
  lon: number;
  propertyType: 'Single Family Home' | 'Condo / Townhouse' | 'Apartment Complex' | 'Commercial / Mixed' | 'Residential Land' | 'Multi-Unit Residential Complex' | 'Condo / Townhouse Complex' | 'Apartment / Condo Complex' | 'Single Family Residential';
  displayName: string;
  isPublicFacility?: boolean;
  facilityCategory?: string;
  // Layer 3 (see geoValidationGate.ts): the requester's own declaration of property type, since
  // BeforeRegret has no real assessor data source to verify it against. Carried through from
  // selection all the way to report generation so the gate doesn't need to be re-declared, and
  // so the report can honestly label this as self-reported, not independently verified.
  declaredPropertyType?: 'single_family' | 'condo_or_multifamily' | 'other' | null;
  unitNumber?: string;
  // Also requester-declared, for the same reason declaredPropertyType is: there is no assessor
  // connection to verify a year built against. Drives the era-based inspection priorities
  // (see engine/inspectionPriorities.ts) and must always surface labeled as self-reported.
  yearBuilt?: number | null;
}

export interface PublicDataSourceStatus {
  id: string;
  name: string;
  category: 'Environmental' | 'Hazards' | 'Public Records' | 'Zoning & Planning' | 'Infrastructure' | 'Transit & Noise' | 'Utilities';
  foundInfo: boolean;
  itemCount: number;
  details: string;
  sourceUrl?: string;
}

export interface ResearchSummaryData {
  address: PropertySearchResult;
  totalSourcesSearched: number;
  usefulSourcesFound: number;
  estimatedPages: string;
  price: number;
  priceRationale: string;
  includedCategories: string[];
  publicSourcesList: PublicDataSourceStatus[];
}

export interface AtAGlanceStatusCard {
  id: string;
  status: 'green' | 'yellow' | 'blue';
  title: string;
  confidence: ConfidenceLevel;
}

export interface ThreeColumnFinding {
  verified: string[];
  needsVerification: string[];
  worthAskingAbout: string[];
}

// Clean 3-Part Finding Structure
export interface MapLayerOverlay {
  layerName: string;
  layerSource: string;
  lat?: number;
  lon?: number;
  boundaryType?: 'flood' | 'noise' | 'facility' | 'zoning' | 'seismic';
  radiusMiles?: number;
  detailsText?: string;
}

export interface ThreePartFinding {
  id: string;
  title: string;
  confidence: ConfidenceLevel;
  whatWeFound: string;         // 1. What we found (distinct public record fact)
  whyItMatters: string;        // 2. Why it matters (distinct objective importance)
  suggestedNextStep: string;   // 3. Suggested next step (neutral action with professional or seller)
  category?: string;
  baselineComparison?: string; // Factual comparison to typical neighborhood/metro average
  mapOverlay?: MapLayerOverlay; // Spatial map overlay visualization
  dataFreshness?: string;      // Data freshness indicator notation
}

export interface ExecutiveSnapshotItem {
  id: string;
  category: string;
  statusLabel: string;
  badgeColor?: 'emerald' | 'amber' | 'blue' | 'slate';
  source: string;
  lastUpdated?: string;
}

export interface InsuranceConsiderationItem {
  id: string;
  findingTopic: string;
  publicFact: string;
  insuranceFactor: string; // Factual statement hedged with "may affect", "commonly requires", "varies by carrier"
  guidanceNote: string;   // Always directs to confirm with a licensed insurance agent
  source: string;
  dataFreshness?: string;
}

export interface DirectSourceLink {
  id: string;
  title: string;
  agency: string;
  category: string;
  directUrl: string;
  lastUpdatedPeriod: string;
  description: string;
}



export interface SellerQuestionCard {
  id: string;
  ask: string;
  why: string;
  confidence: ConfidenceLevel;
}

export interface VisitChecklistItem {
  id: string;
  task: string;
  detail?: string;
  category?: string;
  checked?: boolean;
}

export interface SourceReference {
  id: string;
  name: string;
  agency: string;
  category: string;
  status: 'Confirmed Available' | 'Data Found' | 'No Active Hazards' | 'Records Clean';
  url: string;
  description: string;
}


export interface DisclosureLeverItem {
  id: string;
  findingTitle: string;
  publicFact: string;
  requestedDocument: string;
  recommendedDisclosureLine: string;
}

export interface VendorPartner {
  name: string;
  phone?: string;
  rating: number;
  reviewsCount?: number;
  tradeCategory: string;
}

export interface LeadWidget {
  id: string;
  findingId: string;
  tradeCategory: string;
  title: string;
  identifiedGap: string;
  zipCode: string;
  propertyEra: string;
  vendors: VendorPartner[];
  consentStatement: string;
  status?: 'ACTIVE' | 'SUBMITTED' | 'UNMASKED';
}

// A single paying, ZIP-exclusive vendor placement -- visibility, not a lead-unlock transaction
// (see VendorPartner/LeadWidget/MaskedLeadAsset above, none of which are wired into the actual
// report; this is a deliberately simpler, separate model). At most one active sponsor per ZIP.
export interface SponsoredVendor {
  id: string;
  zipCode: string;
  businessName: string;
  tradeCategory: string; // e.g. "Home Inspector", "Roofing Contractor", "Electrician"
  phone: string;
  website?: string;
  // Supplied by the advertiser at checkout and republished verbatim. Required for every trade
  // category except the licence-exempt one (see requiresLicenceNumber in data/sponsoredVendors.ts).
  // Optional on this type rather than required because pre-existing placements have no value for it
  // and the exempt category never will -- so every render site must handle its absence rather than
  // assume it. Never verified against a licensing board; every surface that prints it says so.
  licenceNumber?: string;
  active: boolean;
}

export interface MaskedLeadAsset {
  leadId: string;
  zipCode: string;
  propertyEra: string;
  identifiedGap: string;
  tradeCategory: string;
  timeline: string;
  smsVerificationStatus: 'OTP Verified' | 'Pending';
  unlockFee: number; // e.g. 35 ($35)
  maskedName: string; // "J*** D***"
  maskedPhone: string; // "(512) ***-4829"
  maskedAddress: string; // "78701 Area, Austin TX"
  unmaskedDetails?: {
    fullName: string;
    phone: string;
    address: string;
    email: string;
    notes?: string;
  };
}

export interface BottomLineItem {
  title: string;
  detail: string;
}

export interface BottomLineSection {
  worthVerifying: BottomLineItem[];
  likelyRoutine: BottomLineItem[];
  biggerPicture: string;
}

export interface NearbyItem {
  id: string;
  category: 'Hospital & Healthcare' | 'Zoning & Planning Dockets' | 'Scheduled Infrastructure';
  title: string;
  finding: string;
  implication: string;
  source: string;
  confidence: ConfidenceLevel;
  dataFreshness?: string;
}

export interface NearbyEssentialsSection {
  items: NearbyItem[];
  dataFreshness?: string;
}

export interface PropertyReport {
  id: string;
  isNonResidential?: boolean;
  rejectionReason?: string;
  blockedAtLayer?: 1 | 2 | 3 | null;
  generatedAt: string;
  readingTimeMinutes: number;
  reportVersion: string;
  headerInfo: {
    address: string;
    yearBuilt?: number;
    reportDate: string;
    reportVersion: string;
  };
  propertyInfo: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    county: string;
    lat: number;
    lon: number;
    propertyType: string;
    yearBuilt?: number;
    estimatedSqFt: number;
    lotSizeAcres?: string;
    zoningCode?: string;
    parcelId?: string;
  };
  pricing: {
    amount: number;
    usefulSourcesCount: number;
    totalSourcesCount: number;
  };

  // Single Source of Truth
  canonicalFindings: CanonicalFinding[];

  // Era-based inspection budget priorities (see engine/inspectionPriorities.ts), computed
  // server-side from the requester-declared year built + county so vendor matches can be
  // attached per item. Null/absent whenever no rule set covers this (year built, county) pair --
  // renders nothing rather than generic filler, same as everywhere else this is used.
  inspectionPriorities?: InspectionPrioritiesReportData | null;

  // Seller-question script (see engine/sellerQuestions.ts), computed the same way and same
  // timing as inspectionPriorities above. Distinct from the older, unused `sellerQuestions`
  // Gemini-authored field below -- that one asks the model to invent questions from nothing;
  // this one is deterministic and grounded in the same era/region/property-type rules as the
  // Inspection Priorities section.
  sellerQuestionsScript?: SellerQuestionsReportData | null;

  // Fixed, always-checked report slot for Moving Company vendors -- unlike every other trade
  // category, Moving Company isn't tied to any specific finding or inspection topic (see the
  // comment above SELLER_QUESTION_TRADE_CATEGORY in sponsoredVendors.ts for why), so it doesn't
  // go through attachSponsoredVendors' per-item matching at all. Rendered once, near the top of
  // the report (see PropertyReportView.tsx), and only when non-empty -- absent or empty renders
  // nothing, never a placeholder.
  movingCompanyVendors?: SponsoredVendor[];

  // Bottom Line Synthesis
  bottomLine: {
    worthVerifyingSummary: string[];
    likelyRoutineSummary: string[];
    biggerPicture: string;
    worthVerifying?: BottomLineItem[];
    likelyRoutine?: BottomLineItem[];
  };

  // Optional legacy fields for backward compatibility if needed
  executiveSnapshot?: ExecutiveSnapshotItem[];
  atAGlance?: {
    cards: AtAGlanceStatusCard[];
    dataFreshness?: string;
    mostImportantToVerify: {
      title: string;
      description: string;
    };
  };
  whatWeFound?: ThreeColumnFinding;
  topPriorities?: ThreePartFinding[];
  environmentalTopics?: ThreePartFinding[];
  environmentalDataFreshness?: string;
  nearbyEssentials?: NearbyEssentialsSection;
  // propertyRecordsSplit / recordsDataFreshness / permitLifespanMatrix removed -- see the REMOVED
  // note in server.ts's generateStructuredPropertyReport. They only ever carried hardcoded
  // 'Verified Record' assertions (active parcel, final CO, on-file panel, zero code violations)
  // against record systems this app has no integration with, and nothing rendered them. Kept out of
  // this interface deliberately: while they were declared here, any new records UI could have bound
  // to them and published those claims for real without anyone writing a false statement.
  insuranceConsiderations?: InsuranceConsiderationItem[];
  insuranceDataFreshness?: string;
  sellerQuestions?: SellerQuestionCard[];
  visitChecklist?: VisitChecklistItem[];
  disclosureLevers?: DisclosureLeverItem[];
  leadWidgets?: LeadWidget[];
  sourceReferences?: SourceReference[];
  directSourceLinks?: DirectSourceLink[];
}

