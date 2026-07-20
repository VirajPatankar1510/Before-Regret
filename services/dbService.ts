import fs from "fs";
import path from "path";
import { BusinessConfig } from "../config/business";

const DB_PATH = path.join(process.cwd(), "db.json");

export interface PlatformSettings {
  bookingPrice: number;
  platformFee: number;
  residentShare: number;
  currency: string;
  updatedAt: string;
}

export interface Resident {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  payoutAccountId: string | null;
  payoutStatus: "created" | "active" | "suspended" | string;
  onboardingCompleted: boolean;
  bankDetailsVerified: boolean;
  createdAt: string;
}

export interface Booking {
  id: string;
  residentId: string;
  customerId: string;
  amount: number;
  platformFee: number;
  residentAmount: number;
  paymentStatus: "Pending" | "Successful" | "Refunded";
  bookingStatus:
    | "Pending Payment"
    | "Payment Successful"
    | "Resident Accepted"
    | "Chat Scheduled"
    | "Chat Started"
    | "Chat Completed"
    | "Eligible For Payout"
    | "Payout Processing"
    | "Payout Completed"
    | "Resident No Show"
    | "Buyer No Show"
    | "Refund Requested"
    | "Under Review"
    | "Approved"
    | "Rejected"
    | "Refunded";
  payoutStatus: "None" | "Eligible" | "Processing" | "Paid" | "Failed";
  paymentReference: string | null;
  orderReference: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface Payment {
  id: string;
  bookingId: string;
  orderReference: string;
  paymentReference: string;
  amount: number;
  status: "Pending" | "Successful" | "Refunded";
  webhookVerified: boolean;
  createdAt: string;
}

export interface Payout {
  id: string;
  bookingId: string;
  residentId: string;
  amount: number;
  status: "Pending" | "Success" | "Failed";
  payoutReference: string;
  initiatedAt: string;
  completedAt: string | null;
}

export interface DbSchema {
  users: any[];
  localities: any[];
  experts: any[];
  reviews: any[];
  queries: any[];
  residents?: Resident[];
  bookings?: Booking[];
  payments?: Payment[];
  payouts?: Payout[];
  platformSettings?: PlatformSettings;
}

export function getDb(): DbSchema {
  if (!fs.existsSync(DB_PATH)) {
    return {
      users: [],
      localities: [],
      experts: [],
      reviews: [],
      queries: [],
      platformSettings: {
        bookingPrice: BusinessConfig.bookingPrice,
        platformFee: BusinessConfig.platformFee,
        residentShare: BusinessConfig.residentShare,
        currency: BusinessConfig.currency,
        updatedAt: new Date().toISOString()
      }
    };
  }
  try {
    const content = fs.readFileSync(DB_PATH, "utf-8");
    const data = JSON.parse(content);
    if (!data.residents) data.residents = [];
    if (!data.bookings) data.bookings = [];
    if (!data.payments) data.payments = [];
    if (!data.payouts) data.payouts = [];
    if (!data.platformSettings) {
      data.platformSettings = {
        bookingPrice: BusinessConfig.bookingPrice,
        platformFee: BusinessConfig.platformFee,
        residentShare: BusinessConfig.residentShare,
        currency: BusinessConfig.currency,
        updatedAt: new Date().toISOString()
      };
    }
    return data;
  } catch (err) {
    console.error("Error reading db.json in dbService:", err);
    return {
      users: [],
      localities: [],
      experts: [],
      reviews: [],
      queries: [],
      residents: [],
      bookings: [],
      payments: [],
      payouts: [],
      platformSettings: {
        bookingPrice: BusinessConfig.bookingPrice,
        platformFee: BusinessConfig.platformFee,
        residentShare: BusinessConfig.residentShare,
        currency: BusinessConfig.currency,
        updatedAt: new Date().toISOString()
      }
    };
  }
}

export function saveDb(db: DbSchema) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing db.json in dbService:", err);
  }
}

// Map Booking status to Legacy Query status
export function mapBookingStatusToLegacy(bookingStatus: Booking["bookingStatus"]): string {
  switch (bookingStatus) {
    case "Pending Payment":
      return "PENDING";
    case "Payment Successful":
      return "CONFIRMED";
    case "Resident Accepted":
      return "ACCEPTED";
    case "Chat Scheduled":
    case "Chat Started":
      return "ACCEPTED";
    case "Chat Completed":
      return "COMPLETED";
    case "Eligible For Payout":
    case "Payout Processing":
      return "PAYOUT_PENDING";
    case "Payout Completed":
      return "PAYOUT_COMPLETED";
    case "Resident No Show":
    case "Buyer No Show":
      return "CANCELLED";
    case "Refund Requested":
    case "Under Review":
      return "DISPUTED";
    case "Approved":
    case "Refunded":
      return "REFUNDED";
    case "Rejected":
      return "ACCEPTED";
    default:
      return "PENDING";
  }
}

// Bi-directional synchronization to ensure 100% backward compatibility
export function syncData() {
  const db = getDb();
  let modified = false;

  // Initialize new arrays if empty
  if (!db.residents) { db.residents = []; modified = true; }
  if (!db.bookings) { db.bookings = []; modified = true; }
  if (!db.payments) { db.payments = []; modified = true; }
  if (!db.payouts) { db.payouts = []; modified = true; }

  // 1. Sync experts to residents
  db.experts.forEach((expert) => {
    let resident = db.residents!.find((r) => r.id === expert.id);
    if (!resident) {
      resident = {
        id: expert.id,
        fullName: expert.fullName,
        email: expert.email || `${expert.id}@beforeregret.com`,
        phone: expert.phone || "9999999999",
        payoutAccountId: expert.payout_account_id || null,
        payoutStatus: expert.payout_account_status || "created",
        onboardingCompleted: expert.onboarding_completed || false,
        bankDetailsVerified: expert.bank_verified || false,
        createdAt: expert.memberSince || new Date().toISOString(),
      };
      db.residents!.push(resident);
      modified = true;
    } else {
      // Sync fields that might update
      if (resident.fullName !== expert.fullName) { resident.fullName = expert.fullName; modified = true; }
      if (resident.payoutAccountId !== expert.payout_account_id) { resident.payoutAccountId = expert.payout_account_id; modified = true; }
      if (resident.payoutStatus !== expert.payout_account_status) { resident.payoutStatus = expert.payout_account_status || "created"; modified = true; }
      if (resident.onboardingCompleted !== expert.onboarding_completed) { resident.onboardingCompleted = expert.onboarding_completed || false; modified = true; }
      if (resident.bankDetailsVerified !== expert.bank_verified) { resident.bankDetailsVerified = expert.bank_verified || false; modified = true; }
    }
  });

  // 2. Sync residents back to experts
  db.residents!.forEach((resident) => {
    const expert = db.experts.find((e) => e.id === resident.id);
    if (expert) {
      if (expert.payout_account_id !== resident.payoutAccountId) { expert.payout_account_id = resident.payoutAccountId; modified = true; }
      if (expert.payout_account_status !== resident.payoutStatus) { expert.payout_account_status = resident.payoutStatus; modified = true; }
      if (expert.onboarding_completed !== resident.onboardingCompleted) { expert.onboarding_completed = resident.onboardingCompleted; modified = true; }
      if (expert.bank_verified !== resident.bankDetailsVerified) { expert.bank_verified = resident.bankDetailsVerified; modified = true; }
    }
  });

  // 3. Sync queries to bookings
  db.queries.forEach((query) => {
    let booking = db.bookings!.find((b) => b.id === query.id);
    const amount = query.pricePaid || (db.platformSettings?.bookingPrice || 299);
    const platformFee = db.platformSettings?.platformFee || 79;
    const residentAmount = db.platformSettings?.residentShare || 220;

    if (!booking) {
      // Map query status back to Booking status
      let bookingStatus: Booking["bookingStatus"] = "Pending Payment";
      if (query.status === "CONFIRMED") bookingStatus = "Payment Successful";
      else if (query.status === "ACCEPTED") bookingStatus = "Resident Accepted";
      else if (query.status === "COMPLETED") bookingStatus = "Chat Completed";
      else if (query.status === "PAYOUT_PENDING") bookingStatus = "Eligible For Payout";
      else if (query.status === "PAYOUT_COMPLETED") bookingStatus = "Payout Completed";
      else if (query.status === "PAYOUT_FAILED") bookingStatus = "Eligible For Payout";
      else if (query.status === "CANCELLED") bookingStatus = "Resident No Show";
      else if (query.status === "DISPUTED") bookingStatus = "Refund Requested";
      else if (query.status === "REFUNDED") bookingStatus = "Refunded";

      booking = {
        id: query.id,
        residentId: query.expertId,
        customerId: query.buyerId,
        amount,
        platformFee,
        residentAmount,
        paymentStatus: (query.status === "CONFIRMED" || query.status === "ACCEPTED" || query.status === "COMPLETED" || query.status === "PAYOUT_PENDING" || query.status === "PAYOUT_COMPLETED") ? "Successful" : "Pending",
        bookingStatus,
        payoutStatus: query.status === "PAYOUT_COMPLETED" ? "Paid" : (query.status === "PAYOUT_PENDING" ? "Processing" : "None"),
        paymentReference: query.paymentId || null,
        orderReference: query.orderId || null,
        createdAt: query.createdAt || new Date().toISOString(),
        completedAt: query.status === "COMPLETED" || query.status === "PAYOUT_COMPLETED" ? (query.payoutTimestamp || new Date().toISOString()) : null,
      };
      db.bookings!.push(booking);
      modified = true;
    } else {
      // Sync values that can change
      const legacyStatus = mapBookingStatusToLegacy(booking.bookingStatus);
      if (query.status !== legacyStatus) {
        // If query was updated outside, sync it here
        if (query.status === "CONFIRMED") booking.bookingStatus = "Payment Successful";
        else if (query.status === "ACCEPTED") booking.bookingStatus = "Resident Accepted";
        else if (query.status === "COMPLETED") booking.bookingStatus = "Chat Completed";
        else if (query.status === "PAYOUT_PENDING") booking.bookingStatus = "Eligible For Payout";
        else if (query.status === "PAYOUT_COMPLETED") booking.bookingStatus = "Payout Completed";
        else if (query.status === "CANCELLED") booking.bookingStatus = "Resident No Show";
        else if (query.status === "DISPUTED") booking.bookingStatus = "Refund Requested";
        else if (query.status === "REFUNDED") booking.bookingStatus = "Refunded";
        modified = true;
      }
      
      if (booking.paymentReference !== query.paymentId) { booking.paymentReference = query.paymentId || null; modified = true; }
      if (booking.orderReference !== query.orderId) { booking.orderReference = query.orderId || null; modified = true; }
    }
  });

  // 4. Sync bookings back to queries
  db.bookings!.forEach((booking) => {
    const query = db.queries.find((q) => q.id === booking.id);
    if (query) {
      const legacyStatus = mapBookingStatusToLegacy(booking.bookingStatus);
      if (query.status !== legacyStatus) {
        query.status = legacyStatus;
        modified = true;
      }
      if (query.paymentId !== booking.paymentReference) { query.paymentId = booking.paymentReference || undefined; modified = true; }
      if (query.orderId !== booking.orderReference) { query.orderId = booking.orderReference || undefined; modified = true; }
    }
  });

  if (modified) {
    saveDb(db);
  }
}
