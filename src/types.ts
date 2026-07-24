export type ViewState = 
  | 'HOME' 
  | 'SOCIETY' 
  | 'RESIDENT_PROFILE' 
  | 'CONTRIBUTOR_FLOW' 
  | 'LIBRARY'
  | 'TERMS'
  | 'PRIVACY'
  | 'REFUND'
  | 'DISCLAIMER'
  | 'CONTACT'
  | 'ADMIN';

export interface StructuredQA {
  questionId: string;
  question: string;
  answer: string;
  badge?: string;
  options?: string[];
}

export interface TopicKnowledge {
  id: string; // e.g. 'parking', 'water', 'internet', 'noise', 'security', 'electricity', 'maintenance', 'amenities', 'committee', 'hidden-costs', 'wish-i-knew'
  title: string;
  category: string;
  iconName: string;
  readingTime: string; // e.g. "2 min read"
  lastUpdated: string; // e.g. "12 Days Ago"
  freshnessStatus: 'Current' | 'Needs Review' | 'Stale';
  summary: string;
  singlePrice: number; // 129
  structuredQA: StructuredQA[];
}

export interface ResidentKnowledgeProfile {
  id: string;
  societyId: string;
  societyName: string;
  city: string;
  locality: string;
  livingSince: string; // e.g. "2019"
  yearsLiving: number; // e.g. 6
  helpedBuyersCount: number; // e.g. 186
  rating: number; // e.g. 4.9
  verifiedResident: boolean;
  residentType: 'Owner' | 'Tenant';
  topicsAnsweredCount: number; // e.g. 11
  lastUpdated: string; // e.g. "12 Days Ago"
  freshnessStatus: 'Current' | 'Updated Recently' | 'Stale';
  unlockSinglePrice: number; // 129
  unlockAllPrice: number; // 399
  topics: TopicKnowledge[];
}

export interface Society {
  id: string; // UUID primary key
  name: string; // Display Name (e.g. "Lodha Splendor")
  normalizedName?: string; // e.g. "LODHA SPLENDOR"
  city: string; // e.g. "Thane, Mumbai MMR"
  locality: string; // Locality/Area
  state?: string; // e.g. "Maharashtra"
  pincode?: string;
  landmark?: string; // Nearest Landmark
  builder?: string;
  verificationStatus?: 'Verified' | 'Pending' | 'Archived';
  aliases?: string[]; // Synonym search strings
  createdAt?: string;
  updatedAt?: string;
  history?: Array<{ timestamp: string; action: string; details: string }>;
  residentProfilesCount: number;
  totalTopicsAvailable: number;
  lastUpdated: string;
  featured?: boolean;
  image?: string;
  description?: string;
  profiles: ResidentKnowledgeProfile[];
}

export interface UnlockedPurchase {
  id: string;
  type: 'SINGLE_TOPIC' | 'FULL_PROFILE';
  societyId: string;
  societyName: string;
  profileId: string;
  topicId?: string;
  unlockedAt: string;
  pricePaid: number;
}

export interface ContributorQuestion {
  id: string;
  topicId: string;
  topicTitle: string;
  questionText: string;
  options: string[];
}

export interface ContributorDraft {
  firstName: string;
  lastName: string;
  publicDisplayName: string;
  societyId: string;
  societyName: string;
  locality: string;
  city: string;
  state?: string;
  pincode?: string;
  landmark?: string;
  yearsLiving: number;
  residentType: 'Owner' | 'Tenant';
  selectedTopicIds: string[];
  answers: Record<string, string>; // questionId -> chosen option
  generatedSummaries: Record<string, string>; // topicId -> generated text
  declaredTruthful: boolean;
}

// Legacy compatibility types
export interface Neighborhood {
  id: string;
  name: string;
  city: string;
  state?: string;
  pincode: string;
  society?: string;
  apartmentName?: string;
  builder?: string;
  expertCount?: number;
  averageRating?: number;
  landmarks?: string;
  detailedAddress?: string;
  waterTankerDependency?: string | number;
  parkingDisputes?: string | number | boolean;
  powerCutHistory?: string | number | boolean;
  bachelorPetRules?: string | number | boolean;
  monsoonFlooding?: string | number | boolean;
  noiseIndex?: string | number;
  [key: string]: any;
}

export interface DayAvailability {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  available: boolean;
  timeWindows: { start: string; end: string }[];
}

export interface ExpertProfile {
  id: string;
  userId?: string;
  fullName: string;
  bio: string;
  listingHeadline?: string;
  localityId: string;
  localityName: string;
  city: string;
  avatarUrl?: string;
  memberSince?: string;
  questionsAnsweredCount?: number;
  responseRate?: number;
  responseTime?: string;
  rating?: number;
  balance?: number;
  pricingPerQuery?: number;
  active?: boolean;
  expertiseTags?: string[];
  areasCovered?: string[];
  yearsLivingThere: number;
  stillLivesThere?: boolean;
  ownerOrTenant?: 'Owner' | 'Tenant';
  workFromHome?: boolean;
  familyType?: string;
  hasPets?: boolean;
  hasVehicle?: boolean;
  repeatBuyersCount?: number;
  experienceLevel?: string;
  trustScore?: number;
  languages: string[];
  availability?: string;
  upiId?: string;
  isLiveChatAvailable?: boolean;
  weeklyAvailability?: DayAvailability[];
  isInstantChatEnabled?: boolean;
  availableSlots?: string[];
}

export interface DirectQuery {
  id: string;
  expertId: string;
  expertName?: string;
  localityId?: string;
  localityName?: string;
  buyerId?: string;
  buyerName?: string;
  pricePaid?: number;
  expertEarnings?: number;
  packageOption?: string;
  bookedSlot?: string;
  queryText?: string;
  status?: string;
  createdAt?: string;
}

export interface Review {
  id: string;
  expertId: string;
  buyerName: string;
  rating: number;
  comment: string;
  queryId?: string;
  createdAt?: string;
}

export interface Wallet {
  balance?: number;
  availableBalance?: number;
  heldBalance?: number;
  totalWithdrawn?: number;
  expertId?: string;
  upiId?: string;
  transactions?: any[];
}

export interface PricingPlan {
  id: string;
  title: string;
  price: number;
  badge?: string;
  badgeStyle?: string;
  description?: string;
  pricePeriod?: string;
  features?: string[];
  cta?: string;
}

