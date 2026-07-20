import { BusinessConfig } from "@/config/business";

// Marketplace Pricing and Share Configuration
export const MARKETPLACE_CONFIG = {
  SESSION_PRICE: BusinessConfig.bookingPrice,       // Customer pays ₹299
  EXPERT_PAYOUT: BusinessConfig.residentShare,       // Expert receives ₹220
  PLATFORM_SHARE: BusinessConfig.platformFee,       // Platform retains ₹79
  CURRENCY: BusinessConfig.currency
};
