import type { InspectionPriority } from './engine/inspectionPriorities';

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

export interface CanonicalFinding {
  id: string;
  subject: string;
  category: 'Property Records' | 'Environment' | 'Neighborhood';
  status: CanonicalStatus;
  summaryText: string;
  whatWeFound: string;
  whyItMatters: string;
  suggestedNextStep: string;
  actionItem?: ActionItem;
  lastUpdated?: string;
  sourceAgency?: string;
  // Set server-side, jurisdiction-aware (see attachFindingSourceUrls in server.ts). Replaces the
  // old approach of a single hardcoded 21-item "Source Registry" table that pointed every report
  // nationwide at Austin/Travis County portals regardless of the actual address, and that listed
  // most of its own entries as "NOT QUERIED" -- padding that made a thin report look thinner, not
  // fuller. Each finding now carries its own real, correct link instead.
  sourceUrl?: string;
  // Set server-side when a real, paying vendor matches this finding's trade category for this
  // ZIP (see FINDING_TRADE_CATEGORY in sponsoredVendors.ts). Replaces the old single
  // report-level sponsoredVendor slot -- each finding gets its own contextual match instead of
  // one generic slot for the whole report, which is what let paying vendors 2-20 in a ZIP never
  // actually appear anywhere.
  sponsoredVendor?: SponsoredVendor | null;
}

// The engine (engine/inspectionPriorities.ts) is deliberately vendor-agnostic -- it's building-
// science judgment, not a monetization concern. Vendor matching is applied on top, server-side,
// same pattern as CanonicalFinding.sponsoredVendor above (see PRIORITY_TRADE_CATEGORY in
// sponsoredVendors.ts).
export interface InspectionPriorityWithVendor extends InspectionPriority {
  sponsoredVendor?: SponsoredVendor | null;
}

export interface InspectionPrioritiesReportData {
  yearBuilt: number;
  eraLabel: string;
  regionLabel: string;
  priorities: InspectionPriorityWithVendor[];
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
  propertyType: 'Single Family Home' | 'Condo / Townhouse' | 'Apartment Complex' | 'Commercial / Mixed' | 'Residential Land' | 'Residential Society / Complex' | 'Condo / Townhouse Complex' | 'Apartment / Condo Complex' | 'Single Family Residential';
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

export interface PropertyRecordItem {
  id: string;
  label: string;
  value: string;
  confidence: ConfidenceLevel;
  detail?: string;
}

export interface PropertyRecordsSplit {
  confirmed?: PropertyRecordItem[];
  verified?: PropertyRecordItem[];
  unknown: PropertyRecordItem[];
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

export interface PermitLifespanItem {
  id: string;
  system: string;
  standardLifespanYears?: string;
  permitStatus: string;
  eraExpectation?: string;
  confidence: ConfidenceLevel;
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
  tagline?: string; // short one-liner the vendor writes about themselves
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
  propertyRecordsSplit?: PropertyRecordsSplit;
  recordsDataFreshness?: string;
  permitLifespanMatrix?: PermitLifespanItem[];
  insuranceConsiderations?: InsuranceConsiderationItem[];
  insuranceDataFreshness?: string;
  sellerQuestions?: SellerQuestionCard[];
  visitChecklist?: VisitChecklistItem[];
  disclosureLevers?: DisclosureLeverItem[];
  leadWidgets?: LeadWidget[];
  sourceReferences?: SourceReference[];
  directSourceLinks?: DirectSourceLink[];
}

// Compatibility stubs for clean build resolution
export interface StructuredQA { [key: string]: any }
export interface TopicKnowledge { [key: string]: any }
export interface ResidentKnowledgeProfile { [key: string]: any }
export interface Society { [key: string]: any }
export interface UnlockedPurchase { [key: string]: any }
export interface ContributorQuestion { [key: string]: any }
export interface Neighborhood { [key: string]: any }
export interface DayAvailability { [key: string]: any }
export interface ExpertProfile { [key: string]: any }
export interface DirectQuery { [key: string]: any }
export interface Review { [key: string]: any }
export interface Wallet { [key: string]: any }
export interface PricingPlan { [key: string]: any }
