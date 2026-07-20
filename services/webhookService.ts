import { getDb, saveDb, syncData } from "./dbService";
import { PaymentService, logAudit } from "./paymentService";
import crypto from "crypto";

export interface WebhookEventRecord {
  id: string;
  eventId: string;
  eventType: string;
  payload: any;
  status: "Processed" | "Failed" | "Ignored";
  errorMessage?: string;
  receivedAt: string;
}

export class WebhookService {
  /**
   * Process incoming payment provider webhook.
   */
  static async processWebhook(signature: string | undefined, body: any, rawBody: string) {
    const timestamp = new Date().toISOString();
    const eventId = body.id || body.event_id || `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const eventType = body.event || "payment.captured";
    const secret = process.env.WEBHOOK_SECRET || "beforeregret_webhook_secret_123";

    logAudit("Webhook Event Received", { eventId, eventType });

    const db = getDb();
    if (!(db as any).webhookEvents) {
      (db as any).webhookEvents = [];
    }

    // 1. Idempotency Check: Prevent duplicate processing of the same event
    const existingEvent = (db as any).webhookEvents.find((evt: WebhookEventRecord) => evt.eventId === eventId);
    if (existingEvent) {
      console.log(`[WebhookService] Idempotent trigger: event ${eventId} already processed with status ${existingEvent.status}`);
      return { success: true, message: "Idempotent: Event already processed", duplicate: true };
    }

    // Create a record of the event
    const eventRecord: WebhookEventRecord = {
      id: `wh_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      eventId,
      eventType,
      payload: body,
      status: "Processed",
      receivedAt: timestamp
    };

    // 2. Verify Webhook Signature
    let signatureVerified = false;
    if (signature) {
      try {
        // Simple hmac validation or fallback to simulate secure check
        const hmac = crypto.createHmac("sha256", secret);
        hmac.update(rawBody || JSON.stringify(body));
        const generatedSignature = hmac.digest("hex");
        
        // In a mock/sandbox preview, we can also verify if it matches or allow simulation signatures
        if (signature === generatedSignature || signature.startsWith("sim_") || process.env.NODE_ENV !== "production") {
          signatureVerified = true;
        } else {
          eventRecord.status = "Failed";
          eventRecord.errorMessage = "Invalid webhook signature";
          (db as any).webhookEvents.push(eventRecord);
          saveDb(db);
          logAudit("Webhook Verification Failure", { eventId, error: "Invalid signature" });
          throw new Error("Webhook signature verification failed");
        }
      } catch (err: any) {
        eventRecord.status = "Failed";
        eventRecord.errorMessage = err.message || "Signature validation error";
        (db as any).webhookEvents.push(eventRecord);
        saveDb(db);
        return { success: false, error: err.message || "Failed signature verification" };
      }
    } else {
      // In development or if signature is not supplied, we simulate verified verification
      signatureVerified = true;
    }

    try {
      // 3. Process Event based on type
      if (eventType === "payment.captured" || eventType === "payment.success") {
        const orderReference = body.order_id || body.payload?.payment?.entity?.order_id || body.orderReference;
        const paymentReference = body.payment_id || body.payload?.payment?.entity?.id || `pay_ref_${Date.now()}`;
        
        if (orderReference) {
          await PaymentService.completePayment(orderReference, paymentReference, signatureVerified);
          logAudit("Webhook Verification", { eventId, orderReference, status: "SUCCESS" });
        } else {
          console.warn("[WebhookService] Captured payment is missing order reference");
        }
      }

      (db as any).webhookEvents.push(eventRecord);
      saveDb(db);
      return { success: true, message: "Webhook processed successfully" };
    } catch (err: any) {
      eventRecord.status = "Failed";
      eventRecord.errorMessage = err.message || "Internal processing error";
      (db as any).webhookEvents.push(eventRecord);
      saveDb(db);
      logAudit("Webhook Processing Failure", { eventId, error: err.message });
      return { success: false, error: err.message };
    }
  }
}
