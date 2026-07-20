import { getDb, saveDb, syncData, Booking, Payment } from "./dbService";
import crypto from "crypto";

// Audit log helper
export function logAudit(action: string, metadata: any) {
  const timestamp = new Date().toISOString();
  console.log(`[AUDIT LOG] [${timestamp}] Action: ${action} | Data:`, JSON.stringify(metadata));
  try {
    const db = getDb();
    if (!db.users) db.users = []; // guarantee basic db fields
    // We can save to a dedicated auditLogs array
    const auditLogs = (db as any).auditLogs || [];
    auditLogs.push({
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      action,
      timestamp,
      metadata
    });
    (db as any).auditLogs = auditLogs;
    saveDb(db);
  } catch (err) {
    console.error("Failed to persist audit log:", err);
  }
}

export class PaymentService {
  /**
   * Step 1: Create payment order in a generic, provider-agnostic way.
   */
  static async createOrder(bookingId: string, customerId: string, amount: number) {
    const db = getDb();
    const orderReference = `ord_ref_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    // Check if Booking already exists or create/update it
    let booking = db.bookings?.find((b) => b.id === bookingId);
    const platformFee = db.platformSettings?.platformFee || 79;
    const residentShare = db.platformSettings?.residentShare || 220;

    if (!booking) {
      // Find query to copy details if any
      const query = db.queries.find(q => q.id === bookingId);
      booking = {
        id: bookingId,
        residentId: query ? query.expertId : "unknown_resident",
        customerId: customerId,
        amount,
        platformFee,
        residentAmount: residentShare,
        paymentStatus: "Pending",
        bookingStatus: "Pending Payment",
        payoutStatus: "None",
        paymentReference: null,
        orderReference: orderReference,
        createdAt: new Date().toISOString(),
        completedAt: null
      };
      db.bookings?.push(booking);
    } else {
      booking.orderReference = orderReference;
      booking.amount = amount;
    }

    // Create Payment entity in DB
    const newPayment: Payment = {
      id: `pay_ent_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      bookingId,
      orderReference,
      paymentReference: "",
      amount,
      status: "Pending",
      webhookVerified: false,
      createdAt: new Date().toISOString()
    };

    if (!db.payments) db.payments = [];
    db.payments.push(newPayment);

    saveDb(db);
    syncData();

    logAudit("Order Creation", {
      bookingId,
      customerId,
      amount,
      orderReference,
      paymentId: newPayment.id
    });

    return {
      orderReference,
      paymentId: newPayment.id,
      booking
    };
  }

  /**
   * Complete payment after signature validation/webhook.
   */
  static async completePayment(orderReference: string, paymentReference: string, webhookVerified: boolean = false) {
    const db = getDb();
    
    // Find payment record
    const payment = db.payments?.find(p => p.orderReference === orderReference);
    if (payment) {
      payment.status = "Successful";
      payment.paymentReference = paymentReference;
      payment.webhookVerified = webhookVerified;
    }

    // Find booking
    const booking = db.bookings?.find(b => b.orderReference === orderReference || b.id === (payment?.bookingId));
    if (booking) {
      booking.paymentStatus = "Successful";
      booking.bookingStatus = "Payment Successful";
      booking.paymentReference = paymentReference;
      
      // Update associated legacy query if it exists
      const query = db.queries.find(q => q.id === booking.id);
      if (query) {
        query.status = "CONFIRMED";
        query.paymentId = paymentReference;
        query.orderId = orderReference;
        
        // Escrow holding expires in 48 hours
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 48);
        query.holdingPeriodExpiresAt = expiresAt.toISOString();
      }
    }

    saveDb(db);
    syncData();

    logAudit("Payment Success", {
      orderReference,
      paymentReference,
      webhookVerified,
      bookingId: booking?.id
    });

    return { success: true, booking };
  }
}
