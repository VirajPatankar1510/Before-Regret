export type ViewState = 
  | 'HOME' 
  | 'RESEARCHING' 
  | 'SUMMARY' 
  | 'REPORT';

export type ConfidenceLevel = 'Verified Record' | 'Era Expectation' | 'Needs Verification';

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
  propertyType: 'Single Family Home' | 'Condo / Townhouse' | 'Apartment Complex' | 'Commercial / Mixed' | 'Residential Land';
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
export interface ThreePartFinding {
  id: string;
  title: string;
  confidence: ConfidenceLevel;
  whatWeFound: string;         // 1. What we found (distinct public record fact)
  whyItMatters: string;        // 2. Why it matters (distinct objective importance)
  suggestedNextStep: string;   // 3. Suggested next step (neutral action with professional or seller)
  category?: string;
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

export interface PropertyReport {
  id: string;
  generatedAt: string;
  readingTimeMinutes: number;
  reportVersion: string;
  headerInfo: {
    address: string;
    yearBuilt: number;
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
    yearBuilt: number;
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

  // Section 1: Executive Overview
  atAGlance: {
    cards: AtAGlanceStatusCard[];
    mostImportantToVerify: {
      title: string;
      description: string;
    };
  };
  whatWeFound: ThreeColumnFinding;
  topPriorities: ThreePartFinding[]; // Top 3 priority verification items

  // Section 2: Neighborhood & Local Environment
  environmentalTopics: ThreePartFinding[];

  // Section 3: Property Records & Building Analysis
  propertyRecordsSplit: PropertyRecordsSplit;

  // Section 4: Walkthrough & Seller Guidance
  sellerQuestions: SellerQuestionCard[];
  visitChecklist: VisitChecklistItem[];

  // Section 5: Verified Sources & Report Summary
  sourceReferences: SourceReference[];
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
