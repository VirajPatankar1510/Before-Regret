export type PSeoPageType = 'zip_hub' | 'topic_deep' | 'city_hub' | 'state_hub' | 'guide' | 'compare';
export type TopicSlug = 'flood-risk' | 'permits' | 'noise' | 'radon' | 'broadband';

export interface PublicSourceEvidence {
  sourceId: string;
  sourceName: string;
  category: string;
  evidenceDataPoint: string;
  sourceUrl: string;
  timestamp: string;
}

export interface ZipPSeoData {
  zipCode: string;
  city: string;
  state: string;
  stateFullName: string;
  county: string;
  neighborhoodName: string;
  population: number;
  medianHomeValue: number;
  
  // Topic specific recorded facts
  floodZone: string; // e.g., 'Zone X (Low Risk)' or 'Zone AE (High Risk 100-yr)'
  floodHazardSeverityLabel?: string; // e.g. 'Low Hazard Zone X'
  floodRiskScore: number; // 1-10 scale
  floodHistory: string;
  
  radonZone: string; // Zone 1, Zone 2, Zone 3
  radonPciL: number; // e.g., 1.8 pCi/L
  
  broadbandProvidersCount: number;
  fiberCoveragePercent: number;
  maxDownloadSpeedMbps: number;
  topBroadbandIsps: string[];
  
  nearestHospitalName: string;
  nearestHospitalDistanceMiles: number;
  nearestHospitalTraumaLevel: string;
  
  permitActivityLevel: 'High' | 'Moderate' | 'Low' | 'Sparse / Missing';
  recentPermitsCount12mo: number;
  notablePermitsSummary: string;
  
  wildfireRiskIndex: 'Low' | 'Moderate' | 'High' | 'Very High';
  ambientNoiseLevelDb: number; // e.g. 48 dB
  noiseCategory: string; // e.g. 'Quiet Suburban / Residential'
  
  // Data completeness & uniqueness
  totalDataPoints: number;
  uniquenessScore: number; // 0-100
  dataCompletenessPercent: number;
  isDataSparse: boolean;
  uniquenessHoldBackReason?: string;
  
  evidenceTrail: PublicSourceEvidence[];
}

export interface SingleTopicDetail {
  topicSlug: TopicSlug;
  topicTitle: string;
  methodologyText: string;
  classificationExplanation: string;
  countyAverageComparison: string;
  historicalContext: string;
  whyItMattersLine: string;
  actionableAdvice: string[];
  faqs: Array<{ question: string; answer: string }>;
}

export interface EditorialGuide {
  slug: string; // e.g. 'moving-to-austin-tx-2026'
  title: string;
  targetKeyword: string;
  metaDescription: string;
  readTimeMinutes: number;
  publishDate: string;
  author: string;
  summary: string;
  contentMarkdown: string;
  referencedZipCodes: string[];
  faqs: Array<{ question: string; answer: string }>;
  uniquenessScore: number;
  isPublished: boolean;
  robotsDirective: 'index, follow' | 'noindex, follow';
}

export interface ZipComparisonData {
  slug: string; // e.g. '78701-vs-78704'
  zipA: string;
  zipB: string;
  city: string;
  state: string;
  comparisonPoints: Array<{
    category: string;
    zipAVal: string;
    zipBVal: string;
    winner: string;
    context: string;
  }>;
  summaryVerdict: string;
  uniquenessScore: number;
  isPublished: boolean;
  robotsDirective: 'index, follow' | 'noindex, follow';
}

export interface KeywordOpportunity {
  id: string;
  keyword: string;
  zipCode?: string;
  city: string;
  state: string;
  suggestedPageType: PSeoPageType;
  topicSlug?: TopicSlug;
  estimatedSearchVolume: number;
  competitionDifficulty: number; // 1-100 scale
  opportunityIndex: number; // volume / difficulty
  isLongTail: boolean;
  status: 'discovered' | 'brief_created' | 'drafted' | 'approved' | 'published' | 'held_back';
  uniquenessScore: number;
}

export interface ContentBrief {
  id: string;
  opportunityId: string;
  targetQuery: string;
  searchIntent: 'informational' | 'comparison' | 'transactional-adjacent';
  requiredApiDataPoints: string[];
  suggestedPageType: PSeoPageType;
  targetWordCount: number;
  targetUrl: string;
  competitorBenchmark: string;
  createdDate: string;
}

export interface FactAudit {
  claimCategory: string;
  extractedClaimText: string;
  underlyingSource: string;
  exactSourceQuery: string;
  auditValue: string;
  status: 'CONFIRMED' | 'UNCONFIRMED';
}

export interface SeoDraft {
  id: string;
  briefId: string;
  urlPath: string;
  title: string;
  metaDescription: string;
  h1: string;
  contentHtml: string;
  uniquenessScore: number;
  accuracyPassed: boolean;
  accuracyAuditLogs: string[];
  factAudits?: FactAudit[];
  dataPointsUsedCount: number;
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'held_back' | 'published';
  reviewNotes?: string;
  robotsDirective: 'index, follow' | 'noindex, follow';
}

export interface HeldBackLog {
  id: string;
  urlPath: string;
  pageType: PSeoPageType;
  zipCode?: string;
  topicSlug?: string;
  uniquenessScore: number;
  requiredThreshold: number; // e.g. 70
  holdBackReason: string;
  missingDataFields: string[];
  timestamp: string;
  recommendation: 'delay_for_data' | 'fold_into_city_hub' | 'manual_research';
}

export interface PerformanceMetric {
  urlPath: string;
  impressions: number;
  clicks: number;
  ctr: number;
  avgPosition: number;
  lastUpdated: string;
  status: 'indexed' | 'ranking' | 'underperforming' | 'deindexed';
}

export interface SitemapEntry {
  loc: string;
  lastmod: string;
  changefreq: 'daily' | 'weekly' | 'monthly';
  priority: number;
}
