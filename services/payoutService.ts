import { getDb, saveDb, syncData, Booking, Payout, Resident } from "./dbService";
import { logAudit } from "./paymentService";

export class PayoutService {
  /**
   * Complete booking and transition to Eligible For Payout.
   */
  static async completeBooking(bookingId: string, triggerBy: "system" | "admin" = "system") {
    const db = getDb();
    const booking = db.bookings?.find(b => b.id === bookingId);
    
    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.bookingStatus === "Resident No Show" || booking.bookingStatus === "Buyer No Show" || booking.bookingStatus === "Refunded") {
      throw new Error("Cannot complete a cancelled booking");
    }

    // Set Booking Status to Completed & Payout Status to Eligible
    booking.bookingStatus = "Chat Completed";
    booking.payoutStatus = "Eligible";
    booking.completedAt = new Date().toISOString();

    // Sync legacy queries
    const query = db.queries.find(q => q.id === bookingId);
    if (query) {
      query.status = "COMPLETED";
      query.payoutTimestamp = new Date().toISOString();
    }

    saveDb(db);
    syncData();

    logAudit("Booking Completion", {
      bookingId,
      triggerBy,
      bookingStatus: booking.bookingStatus,
      payoutStatus: booking.payoutStatus
    });

    return booking;
  }

  /**
   * Initiate Resident Payout
   */
  static async initiatePayout(bookingId: string) {
    const db = getDb();
    const booking = db.bookings?.find(b => b.id === bookingId);
    
    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.bookingStatus !== "Chat Completed" && booking.bookingStatus !== "Eligible For Payout" && booking.payoutStatus !== "Eligible" && booking.payoutStatus !== "Failed") {
      throw new Error(`Booking must be in Completed status to initiate payout. Current: ${booking.bookingStatus}, Payout status: ${booking.payoutStatus}`);
    }

    const resident = db.residents?.find(r => r.id === booking.residentId);
    if (!resident) {
      throw new Error("Associated Resident profile not found");
    }

    // Secure Verification Gate prior to releasing payouts
    const isPayoutsActive = resident.payoutStatus === "active";
    const isKycDone = resident.onboardingCompleted === true;
    const isBankVerified = resident.bankDetailsVerified === true;

    if (!isPayoutsActive || !isKycDone || !isBankVerified) {
      const errorMsg = `Payout Gate Failed: Incomplete verification. Active: ${isPayoutsActive}, Onboarding: ${isKycDone}, Bank Verified: ${isBankVerified}`;
      
      booking.payoutStatus = "Failed";
      const query = db.queries.find(q => q.id === bookingId);
      if (query) {
        query.payoutErrorMessage = errorMsg;
        query.status = "PAYOUT_FAILED";
      }

      saveDb(db);
      syncData();

      logAudit("Failed Payouts", {
        bookingId,
        residentId: resident.id,
        error: errorMsg
      });

      throw new Error(errorMsg);
    }

    // Change status to processing
    booking.payoutStatus = "Processing";
    booking.bookingStatus = "Payout Processing";

    const residentAmount = booking.residentAmount || db.platformSettings?.residentShare || 220;
    const payoutReference = `trf_ref_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    // Create payout record
    const newPayout: Payout = {
      id: `payout_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      bookingId,
      residentId: resident.id,
      amount: residentAmount,
      status: "Pending",
      payoutReference,
      initiatedAt: new Date().toISOString(),
      completedAt: null
    };

    if (!db.payouts) db.payouts = [];
    db.payouts.push(newPayout);

    saveDb(db);
    syncData();

    logAudit("Payout Initiation", {
      bookingId,
      residentId: resident.id,
      amount: residentAmount,
      payoutReference
    });

    // Simulate asynchronous worker release
    setTimeout(() => {
      this.completePayoutSimulation(bookingId, payoutReference).catch(console.error);
    }, 1000);

    return { booking, payout: newPayout };
  }

  /**
   * Async process payout completion simulation
   */
  private static async completePayoutSimulation(bookingId: string, payoutReference: string) {
    const db = getDb();
    const booking = db.bookings?.find(b => b.id === bookingId);
    if (!booking) return;

    booking.payoutStatus = "Paid";
    booking.bookingStatus = "Payout Completed";
    booking.completedAt = new Date().toISOString();

    const payout = db.payouts?.find(p => p.payoutReference === payoutReference);
    if (payout) {
      payout.status = "Success";
      payout.completedAt = new Date().toISOString();
    }

    const query = db.queries.find(q => q.id === bookingId);
    if (query) {
      query.status = "PAYOUT_COMPLETED";
      query.payoutTransferId = payoutReference;
      query.payoutTimestamp = new Date().toISOString();
      delete query.payoutErrorMessage;
    }

    saveDb(db);
    syncData();

    logAudit("Payout Completion", {
      bookingId,
      payoutReference,
      amount: booking.residentAmount
    });
  }

  /**
   * Retry failed payouts
   */
  static async retryPayout(bookingId: string) {
    logAudit("Payout Initiation", { bookingId, action: "RETRY" });
    return this.initiatePayout(bookingId);
  }
}
