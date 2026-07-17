export interface Neighborhood {
  id: string;
  name: string;
  city: string;
  state: string;
  pincode: string;
  society?: string;
  builder?: string;
  apartmentName?: string;
  expertCount: number;
  averageRating: number;
  waterTankerDependency?: number;
  parkingDisputes?: number;
  powerCutHistory?: number;
  bachelorPetRules?: number;
  monsoonFlooding?: number;
  noiseIndex?: number;
  landmarks?: string;
  detailedAddress?: string;
}

export interface ExpertProfile {
  id: string;
  userId: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  bio: string;
  localityId: string;
  localityName: string;
  city: string;
  avatarUrl: string; // clean modern illustrated avatar (URL or preset key)
  isCustomAvatar?: boolean;
  memberSince: string;
  questionsAnsweredCount: number;
  responseRate: number; // e.g. 98
  responseTime: string; // e.g. "Within 35 minutes"
  rating: number;
  pricingPerQuery: number; // e.g. 299 (in INR)
  active?: boolean;
  expertiseTags: string[];
  areasCovered: string[]; // e.g. ["Baner", "Balewadi", "Aundh"]
  yearsLivingThere: number; // e.g. 8
  stillLivesThere: boolean;
  repeatBuyersCount: number; // e.g. 78
  experienceLevel: 'New Local' | 'Established Local' | 'Trusted Local' | 'Neighborhood Specialist' | 'Community Favorite';
  trustScore: number; // e.g. 94
  languages: string[]; // e.g. ["Hindi", "English", "Marathi"]
  availability: string; // e.g. "Available Daily"
  availableSlots?: string[]; // e.g. ["Today 4:00 PM - 4:30 PM", "Tomorrow 10:00 AM - 10:30 AM"]
  weeklyAvailability?: DayAvailability[];
  isInstantChatEnabled?: boolean;
  upiId?: string;
  bankAccountNumber?: string;
  isLiveChatAvailable?: boolean;

  // Razorpay Route Marketplace fields
  razorpay_account_id?: string | null;
  razorpay_account_status?: string | null;
  kyc_completed?: boolean;
  bank_verified?: boolean;
  payouts_enabled?: boolean;
  onboarding_completed?: boolean;
  pan?: string | null;
  ifsc?: string | null;
  address?: string | null;
  dob?: string | null;
  businessType?: string | null;
}

export interface TimeWindow {
  start: string; // e.g. "07:00 PM"
  end: string; // e.g. "09:00 PM"
}

export interface DayAvailability {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  available: boolean;
  timeWindows: TimeWindow[];
}

export interface DirectQuery {
  id: string;
  buyerId: string;
  buyerName: string;
  expertId: string;
  expertName: string;
  localityId: string;
  localityName: string;
  queryText: string;
  responseStyle?: 'DETAILED' | 'CONCISE';
  status: 'PENDING' | 'ACCEPTED' | 'ANSWERED' | 'REFUNDED' | 'DISPUTED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'PAYOUT_PENDING' | 'PAYOUT_COMPLETED' | 'PAYOUT_FAILED';
  pricePaid: number;
  expertEarnings: number;
  createdAt: string;
  answeredAt?: string;
  answerText?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  payoutTransferId?: string;
  payoutErrorMessage?: string;
  payoutTimestamp?: string;
  holdingPeriodExpiresAt?: string;
  packageOption?: string;
  isDisputed?: boolean;
  bookedSlot?: string;
}

export interface Review {
  id: string;
  queryId: string;
  buyerName: string;
  expertId: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
}

export interface Wallet {
  expertId: string;
  availableBalance: number;
  heldBalance: number; // in 48-hour pending hold
  totalWithdrawn: number;
  transactions?: WalletTransaction[];
  upiId?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
}

export interface WalletTransaction {
  id: string;
  amount: number;
  type: 'CREDIT_PENDING' | 'CREDIT_AVAILABLE' | 'DEBIT_WITHDRAWAL';
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  description: string;
  createdAt: string;
}

export interface PricingPlan {
  id: 'QUICK' | 'BUNDLE' | 'LIVE_CHAT';
  badge: string;
  badgeStyle: string;
  title: string;
  description: string;
  price: number;
  pricePeriod: string;
  features: string[];
  cta: string;
}

