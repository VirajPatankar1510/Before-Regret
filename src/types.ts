export type ViewState = 
  | 'HOME' 
  | 'RESEARCHING' 
  | 'SUMMARY' 
  | 'REPORT';

export type ConfidenceLevel = 'Verified Record' | 'No Record Found';

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
  verified: PropertyRecordItem[];
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
  status: 'Verified Available' | 'Data Found' | 'No Active Hazards' | 'Records Clean';
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

  // Executive Snapshot Dashboard
  executiveSnapshot?: ExecutiveSnapshotItem[];

  // Bottom Line Synthesis
  bottomLine?: BottomLineSection;

  // Section 1: Executive Overview
  atAGlance: {
    cards: AtAGlanceStatusCard[];
    dataFreshness?: string;
    mostImportantToVerify: {
      title: string;
      description: string;
    };
  };
  whatWeFound: ThreeColumnFinding;
  topPriorities: ThreePartFinding[]; // Top 3 priority verification items

  // Section 2: Neighborhood & Local Environment
  environmentalTopics: ThreePartFinding[];
  environmentalDataFreshness?: string;
  nearbyEssentials?: NearbyEssentialsSection;

  // Section 3: Property Records & Building Analysis
  propertyRecordsSplit: PropertyRecordsSplit;
  recordsDataFreshness?: string;
  permitLifespanMatrix?: PermitLifespanItem[];

  // Section 4: Insurance Considerations
  insuranceConsiderations?: InsuranceConsiderationItem[];
  insuranceDataFreshness?: string;

  // Section 5: Walkthrough & Seller Guidance
  sellerQuestions: SellerQuestionCard[];
  visitChecklist: VisitChecklistItem[];
  disclosureLevers?: DisclosureLeverItem[];

  // Section 6: Source Appendix with Direct Links & Verified References
  leadWidgets?: LeadWidget[];
  sourceReferences: SourceReference[];
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
