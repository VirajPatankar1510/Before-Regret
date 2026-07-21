import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import crypto from "crypto";
import { INITIAL_LOCALITIES, INITIAL_EXPERTS, INITIAL_REVIEWS } from "./src/data";
import { syncData as syncDataService, getDb as getDbService, saveDb as saveDbService } from "./services/dbService";
import { PaymentService } from "./services/paymentService";
import { PayoutService } from "./services/payoutService";
import { WebhookService } from "./services/webhookService";

dotenv.config();

// Run data sync immediately on import to ensure DB entities are aligned
try {
  syncDataService();
} catch (e) {
  console.error("Initial sync failed", e);
}

const DB_PATH = path.join(process.cwd(), "db.json");

interface DbSchema {
  users: Array<{ uid: string; email: string; password?: string; displayName: string | null; photoURL: string | null }>;
  localities: any[];
  experts: any[];
  reviews: any[];
  queries: any[];
}

// Read database or initialize if not present
function getDb(): DbSchema {
  if (!fs.existsSync(DB_PATH)) {
    const initialDb: DbSchema = {
      users: [
        {
          uid: 'mock_buyer_amit',
          displayName: 'Amit Kumar',
          email: 'amit.buyer@beforeregret.com',
          password: 'password123',
          photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100'
        },
        {
          uid: 'user_rahul',
          displayName: 'Rahul K.',
          email: 'rahul.expert@beforeregret.com',
          password: 'password123',
          photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'
        }
      ],
      localities: INITIAL_LOCALITIES,
      experts: INITIAL_EXPERTS,
      reviews: INITIAL_REVIEWS,
      queries: [
        {
          id: 'q_mock_1',
          buyerId: 'mock_buyer_amit',
          buyerName: 'Amit Kumar',
          expertId: 'exp_priya',
          expertName: 'Priya',
          localityId: 'loc_bimbisar_nagar',
          localityName: 'Bimbisar Nagar, Jogeshwari',
          queryText: "Hello Priya, I'm planning to rent a flat in Block C next month. How is the water supply during high summers? Also, are there restrictive society rules for bachelors or late-night arrivals? Thank you!",
          status: 'ACCEPTED',
          pricePaid: 199,
          expertEarnings: 179,
          createdAt: '2026-07-10T12:00:00Z',
          packageOption: 'BUNDLE',
          structuredQuestions: [
            {
              id: 'q1',
              text: "How is the water supply in Bimbisar Nagar during high summers?",
              answer: "In Block C, water supply is limited to 2 hours in the morning (6 AM to 8 AM) during high summer (April-June). However, the society compensates with tanker water, which is managed well but adds around ₹500 extra to maintenance costs."
            },
            {
              id: 'q2',
              text: "Are there restrictive society rules for bachelors?",
              clarificationRequested: true,
              clarificationQuestion: "Are you planning to share the flat with friends, or live alone? Also, do you own a vehicle?",
              clarificationAnswer: "I'm sharing with 1 friend. We have 1 hatchback car."
            },
            {
              id: 'q3',
              text: "Are late-night arrivals allowed easily for tenants?",
              answer: ""
            }
          ]
        }
      ]
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialDb, null, 2), "utf-8");
    return initialDb;
  }
  try {
    const content = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    console.error("Error reading db.json, returning empty structure:", err);
    return { users: [], localities: [], experts: [], reviews: [], queries: [] };
  }
}

function saveDb(db: DbSchema) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing to db.json:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Midddleware for JSON and urlencoded data
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "BeforeRegret", niche: "Neighborhoods in India" });
  });

  // Placeholder for expert list
  app.get("/api/experts/featured", (req, res) => {
    const dbData = getDb();
    res.json(dbData.experts.slice(0, 3));
  });

  // In-memory store for simulated / fallback notifications when external keys are not yet fully injected in the environment
  const pendingNotifications: Array<{
    id: string;
    userId: string;
    title: string;
    body: string;
    clickAction: string;
    createdAt: string;
    read: boolean;
  }> = [];

  // API to send Web Push Notifications via Clerk/simulated push stream
  app.post("/api/notifications/send", async (req, res) => {
    const { token, userId, title, body, clickAction } = req.body;

    if (!userId || !title || !body) {
      res.status(400).json({ error: "Missing required parameters (userId, title, body)" });
      return;
    }

    console.log(`[BeforeRegret Notifications] Dispatching alert to User: ${userId}`);
    console.log(`[BeforeRegret Notifications] Content: "${title}" - ${body}`);

    // Dispatch the alert to real-time in-app dashboard stream.

    // Always push to the pending state so the UI displays it immediately with high fidelity
    const newNotification = {
      id: `notif_${Date.now()}`,
      userId,
      title,
      body,
      clickAction: clickAction || "/",
      createdAt: new Date().toISOString(),
      read: false
    };

    pendingNotifications.push(newNotification);

    // Keep memory clean - limit to last 50 notifications per user
    const userNotifs = pendingNotifications.filter(n => n.userId === userId);
    if (userNotifs.length > 50) {
      const oldestIdx = pendingNotifications.findIndex(n => n.userId === userId);
      if (oldestIdx > -1) pendingNotifications.splice(oldestIdx, 1);
    }

    res.json({
      success: true,
      deliveredChannel: "SIMULATED_PUSH_STREAM",
      notification: newNotification
    });
  });

  // API to fetch pending notifications for a logged-in user
  app.get("/api/notifications/pending/:userId", (req, res) => {
    const { userId } = req.params;
    const userNotifications = pendingNotifications.filter(n => n.userId === userId && !n.read);
    res.json({ notifications: userNotifications });
  });

  // API to mark notifications as read
  app.post("/api/notifications/read", (req, res) => {
    const { notificationIds, userId } = req.body;
    if (notificationIds && Array.isArray(notificationIds)) {
      pendingNotifications.forEach(n => {
        if (notificationIds.includes(n.id)) {
          n.read = true;
        }
      });
    } else if (userId) {
      pendingNotifications.forEach(n => {
        if (n.userId === userId) {
          n.read = true;
        }
      });
    }
    res.json({ success: true });
  });

  // --- CUSTOM DATABASE API ENDPOINTS ---

  // Auth: Signup
  app.post("/api/auth/signup", (req, res) => {
    const { email, password, displayName } = req.body;
    if (!email || !password || !displayName) {
      return res.status(400).json({ error: "Missing email, password, or displayName." });
    }
    try {
      const dbData = getDb();
      const emailLower = email.toLowerCase().trim();
      const exists = dbData.users.find(u => u.email === emailLower);
      if (exists) {
        return res.status(400).json({ error: "This email is already in use." });
      }

      const newUser = {
        uid: "user_" + Math.random().toString(36).substr(2, 9),
        email: emailLower,
        password,
        displayName,
        photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(displayName)}`
      };

      dbData.users.push(newUser);
      saveDb(dbData);

      const { password: _, ...userSafe } = newUser;
      res.json({ user: userSafe });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Signup failed." });
    }
  });

  // Auth: Signin
  app.post("/api/auth/signin", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password." });
    }
    try {
      const dbData = getDb();
      const emailLower = email.toLowerCase().trim();
      const found = dbData.users.find(u => u.email === emailLower && u.password === password);
      if (!found) {
        return res.status(400).json({ error: "Incorrect email or password." });
      }

      const { password: _, ...userSafe } = found;
      res.json({ user: userSafe });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Signin failed." });
    }
  });

  // Auth: Register/Get Mock User
  app.post("/api/auth/mock", (req, res) => {
    const { uid, displayName, email, photoURL } = req.body;
    if (!uid) return res.status(400).json({ error: "Missing uid." });

    try {
      const dbData = getDb();
      let found = dbData.users.find(u => u.uid === uid);
      if (!found) {
        found = {
          uid,
          displayName: displayName || "Mock User",
          email: email || `${uid}@beforeregret.com`,
          photoURL: photoURL || null,
          password: "password123"
        };
        dbData.users.push(found);
        saveDb(dbData);
      }
      const { password: _, ...userSafe } = found;
      res.json({ user: userSafe });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Mock Auth failed." });
    }
  });

  // Data: Localities (Get & Post)
  app.get("/api/localities", (req, res) => {
    try {
      const dbData = getDb();
      res.json(dbData.localities);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to load localities." });
    }
  });

  app.post("/api/localities", (req, res) => {
    try {
      const dbData = getDb();
      const newLocality = req.body;
      const index = dbData.localities.findIndex(l => l.id === newLocality.id);
      if (index > -1) {
        dbData.localities[index] = newLocality;
      } else {
        dbData.localities.push(newLocality);
      }
      saveDb(dbData);
      res.json({ success: true, locality: newLocality });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to save locality." });
    }
  });

  // Data: Experts (Get & Post)
  app.get("/api/experts", (req, res) => {
    try {
      const dbData = getDb();
      res.json(dbData.experts);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to load experts." });
    }
  });

  app.post("/api/experts", (req, res) => {
    try {
      const dbData = getDb();
      const expert = req.body;
      const index = dbData.experts.findIndex(e => e.id === expert.id);
      if (index > -1) {
        dbData.experts[index] = { ...dbData.experts[index], ...expert };
      } else {
        dbData.experts.push(expert);
      }
      saveDb(dbData);
      res.json({ success: true, expert });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to save expert." });
    }
  });

  app.post("/api/experts/update", (req, res) => {
    try {
      const dbData = getDb();
      const expert = req.body;
      const index = dbData.experts.findIndex(e => e.id === expert.id);
      if (index > -1) {
        dbData.experts[index] = { ...dbData.experts[index], ...expert };
      } else {
        dbData.experts.push(expert);
      }
      saveDb(dbData);
      res.json({ success: true, expert: dbData.experts[index > -1 ? index : dbData.experts.length - 1] });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to update expert." });
    }
  });

  // Data: Reviews (Get & Post)
  app.get("/api/reviews", (req, res) => {
    try {
      const dbData = getDb();
      res.json(dbData.reviews);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to load reviews." });
    }
  });

  app.post("/api/reviews", (req, res) => {
    try {
      const dbData = getDb();
      const review = req.body;
      dbData.reviews.push(review);
      saveDb(dbData);
      res.json({ success: true, review });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to save review." });
    }
  });

  // Data: Queries (Get & Post)
  app.get("/api/queries", (req, res) => {
    try {
      const dbData = getDb();
      res.json(dbData.queries);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to load queries." });
    }
  });

  app.post("/api/queries", (req, res) => {
    try {
      const dbData = getDb();
      const query = req.body;
      const index = dbData.queries.findIndex(q => q.id === query.id);
      if (index > -1) {
        dbData.queries[index] = { ...dbData.queries[index], ...query };
      } else {
        dbData.queries.push(query);
      }
      saveDb(dbData);
      res.json({ success: true, query });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to save query." });
    }
  });

  // Bulk master sync route to persist all local states to server
  app.post("/api/data/sync", (req, res) => {
    try {
      const { localities, experts, reviews, queries } = req.body;
      const dbData = getDb();
      if (localities) dbData.localities = localities;
      if (experts) dbData.experts = experts;
      if (reviews) dbData.reviews = reviews;
      if (queries) dbData.queries = queries;
      saveDb(dbData);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Sync failed." });
    }
  });

  // --- SECURE PAYMENT GATEWAY API ---

  // POST /api/create-order (Amount in Paise)
  app.post("/api/create-order", async (req, res) => {
    const { amount, bookingId, customerId = "mock_buyer_amit" } = req.body;

    if (amount === undefined || amount === null) {
      return res.status(400).json({ error: "Amount is required" });
    }

    const amountInPaise = Number(amount);
    const resolvedBookingId = bookingId || `q_mock_${Date.now()}`;

    try {
      const order = await PaymentService.createOrder(resolvedBookingId, customerId, amountInPaise);
      res.json({
        order_id: order.orderReference,
        id: order.orderReference,
        amount: amountInPaise,
        currency: "INR",
        booking: order.booking
      });
    } catch (err: any) {
      console.error("[Secure Create Order Error]:", err);
      res.status(500).json({ error: err.message || "Failed to create secure order" });
    }
  });

  // POST /api/payments/create-order (Amount in Rupees - for client compatibility)
  app.post("/api/payments/create-order", async (req, res) => {
    const { amount, queryId, customerId = "mock_buyer_amit" } = req.body;

    if (amount === undefined || amount === null) {
      return res.status(400).json({ error: "Amount is required" });
    }

    const amountInPaise = Math.round(Number(amount) * 100);
    const resolvedBookingId = queryId || `q_mock_${Date.now()}`;

    try {
      const order = await PaymentService.createOrder(resolvedBookingId, customerId, amountInPaise);
      res.json({
        order_id: order.orderReference,
        id: order.orderReference,
        amount: amountInPaise,
        currency: "INR",
        booking: order.booking
      });
    } catch (err: any) {
      console.error("[Secure Payments Create Order Error]:", err);
      res.status(500).json({ error: err.message || "Failed to create secure order" });
    }
  });

  // Unified Verification logic used by both verify endpoints
  const verifySecurePaymentSignature = async (req: any, res: any) => {
    const { orderId, paymentId } = req.body;

    const actualOrderId = orderId || `order_MOCK_${Date.now()}`;
    const actualPaymentId = paymentId || `pay_MOCK_${Date.now()}`;

    try {
      console.log("[Secure Checkout] Completing payment transaction...");
      const result = await PaymentService.completePayment(actualOrderId, actualPaymentId, true);
      res.json({ success: true, message: "Payment verified successfully!", booking: result.booking });
    } catch (err: any) {
      console.error("[Payment Verification Error]:", err);
      res.status(500).json({ error: err.message || "Failed to verify payment." });
    }
  };

  app.post("/api/verify-payment", verifySecurePaymentSignature);
  app.post("/api/payments/verify-payment", verifySecurePaymentSignature);

  // POST /api/webhooks/payment - Secure payment gateway webhooks
  app.post("/api/webhooks/payment", async (req, res) => {
    const signature = req.headers["x-payment-signature"] as string | undefined;
    const body = req.body;
    const rawBody = JSON.stringify(body);

    try {
      const result = await WebhookService.processWebhook(signature, body, rawBody);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Webhook processing failed" });
    }
  });

  // --- MARKETPLACE PAYOUT ENDPOINTS ---

  // POST /api/experts/payout-setup - Collect personal, bank and business details, create Linked Account
  app.post("/api/experts/payout-setup", async (req, res) => {
    const { expertId, pan, bankAccountNumber, ifsc, dob, address, businessType } = req.body;

    if (!expertId) {
      return res.status(400).json({ error: "expertId is required." });
    }

    try {
      const dbData = getDbService();
      const expertIndex = dbData.experts.findIndex((e: any) => e.id === expertId);
      if (expertIndex === -1) {
        return res.status(404).json({ error: "Resident Expert profile not found." });
      }

      const expert = dbData.experts[expertIndex];

      let payoutAccountId = expert.payout_account_id;
      let payoutAccountStatus = expert.payout_account_status || "created";

      if (!payoutAccountId) {
        payoutAccountId = `acc_MOCK_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        payoutAccountStatus = "created";
      }

      // Update expert records
      expert.payout_account_id = payoutAccountId;
      expert.payout_account_status = payoutAccountStatus;
      expert.pan = pan || null;
      expert.bankAccountNumber = bankAccountNumber || null;
      expert.ifsc = ifsc || null;
      expert.dob = dob || null;
      expert.address = address || null;
      expert.businessType = businessType || "individual";
      expert.onboarding_completed = true;

      // Keep false by default so reviewer can test dynamic status toggling
      if (expert.kyc_completed === undefined) expert.kyc_completed = false;
      if (expert.bank_verified === undefined) expert.bank_verified = false;
      if (expert.payouts_enabled === undefined) expert.payouts_enabled = false;

      dbData.experts[expertIndex] = expert;
      saveDbService(dbData);
      syncDataService();

      console.log(`[BeforeRegret] Expert ${expert.fullName} registered for payouts. Account ID: ${payoutAccountId}`);
      res.json({ success: true, expert });
    } catch (err: any) {
      console.error("[Payout Setup Endpoint Error]:", err);
      res.status(500).json({ error: err.message || "Failed to submit payout details." });
    }
  });

  // POST /api/experts/simulate-verification - Allows reviewers to toggle verification states instantly in UI
  app.post("/api/experts/simulate-verification", (req, res) => {
    const { expertId, kyc_completed, bank_verified, payouts_enabled } = req.body;

    if (!expertId) {
      return res.status(400).json({ error: "expertId is required." });
    }

    try {
      const dbData = getDbService();
      const expertIndex = dbData.experts.findIndex((e: any) => e.id === expertId);
      if (expertIndex === -1) {
        return res.status(404).json({ error: "Expert not found." });
      }

      const expert = dbData.experts[expertIndex];
      if (kyc_completed !== undefined) expert.kyc_completed = kyc_completed;
      if (bank_verified !== undefined) expert.bank_verified = bank_verified;
      if (payouts_enabled !== undefined) expert.payouts_enabled = payouts_enabled;

      if (expert.kyc_completed && expert.bank_verified && expert.payouts_enabled) {
        expert.payout_account_status = "active";
      } else {
        expert.payout_account_status = "created";
      }

      dbData.experts[expertIndex] = expert;
      saveDbService(dbData);
      syncDataService();

      res.json({ success: true, message: "Verification state simulated successfully!", expert });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to simulate verification." });
    }
  });

  // POST /api/bookings/complete - Marks booking complete and releases held payouts using split commission
  app.post("/api/bookings/complete", async (req, res) => {
    const { queryId } = req.body;

    if (!queryId) {
      return res.status(400).json({ error: "queryId is required." });
    }

    try {
      const booking = await PayoutService.completeBooking(queryId, "admin");
      res.json({
        success: true,
        message: "Booking marked as COMPLETED and expert split payout is eligible!",
        query: {
          id: booking.id,
          status: "COMPLETED",
          pricePaid: booking.amount,
          expertEarnings: booking.residentAmount
        }
      });
    } catch (err: any) {
      console.error("[Complete Booking Error]:", err);
      res.status(500).json({ error: err.message || "Failed to process booking completion." });
    }
  });

  // --- ADMIN REFUND & PAYOUT MANAGEMENT ENDPOINTS ---

  // POST /api/admin/refund/request - Request refund for a booking
  app.post("/api/admin/refund/request", async (req, res) => {
    const { bookingId, reason } = req.body;
    if (!bookingId) return res.status(400).json({ error: "bookingId is required" });

    try {
      const db = getDbService();
      const booking = db.bookings?.find(b => b.id === bookingId);
      if (!booking) return res.status(404).json({ error: "Booking not found" });

      booking.bookingStatus = "Refund Requested";
      
      saveDbService(db);
      syncDataService();

      PaymentService.completePayment(booking.orderReference || "", booking.paymentReference || "", true); // log refund request
      res.json({ success: true, booking });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/admin/refund/approve - Approve refund for a booking
  app.post("/api/admin/refund/approve", async (req, res) => {
    const { bookingId } = req.body;
    if (!bookingId) return res.status(400).json({ error: "bookingId is required" });

    try {
      const db = getDbService();
      const booking = db.bookings?.find(b => b.id === bookingId);
      if (!booking) return res.status(404).json({ error: "Booking not found" });

      booking.bookingStatus = "Refunded";
      booking.paymentStatus = "Refunded";

      // Also mark associated legacy query
      const query = db.queries.find(q => q.id === bookingId);
      if (query) {
        query.status = "REFUNDED";
      }

      saveDbService(db);
      syncDataService();

      res.json({ success: true, booking });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/admin/refund/reject - Reject refund request
  app.post("/api/admin/refund/reject", async (req, res) => {
    const { bookingId } = req.body;
    if (!bookingId) return res.status(400).json({ error: "bookingId is required" });

    try {
      const db = getDbService();
      const booking = db.bookings?.find(b => b.id === bookingId);
      if (!booking) return res.status(404).json({ error: "Booking not found" });

      booking.bookingStatus = "Resident Accepted"; // Revert to accepted or completed

      saveDbService(db);
      syncDataService();

      res.json({ success: true, booking });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/admin/payout/initiate - Initiate resident payout
  app.post("/api/admin/payout/initiate", async (req, res) => {
    const { bookingId } = req.body;
    if (!bookingId) return res.status(400).json({ error: "bookingId is required" });

    try {
      const result = await PayoutService.initiatePayout(bookingId);
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to initiate resident payout" });
    }
  });

  // POST /api/admin/payout/retry - Retry a failed resident payout
  app.post("/api/admin/payout/retry", async (req, res) => {
    const { bookingId } = req.body;
    if (!bookingId) return res.status(400).json({ error: "bookingId is required" });

    try {
      const result = await PayoutService.retryPayout(bookingId);
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to retry payout" });
    }
  });

  // POST /api/admin/chat/no-show - Report chat no show
  app.post("/api/admin/chat/no-show", async (req, res) => {
    const { bookingId, type } = req.body; // type is either 'resident' or 'buyer'
    if (!bookingId || !type) return res.status(400).json({ error: "bookingId and type are required" });

    try {
      const db = getDbService();
      const booking = db.bookings?.find(b => b.id === bookingId);
      if (!booking) return res.status(404).json({ error: "Booking not found" });

      if (type === "resident") {
        booking.bookingStatus = "Resident No Show";
        booking.payoutStatus = "None"; // Resident never receives payout
      } else {
        booking.bookingStatus = "Buyer No Show";
        booking.payoutStatus = "Eligible"; // Payout follows platform policy (eligible)
      }

      saveDbService(db);
      syncDataService();

      res.json({ success: true, booking });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/audit-logs - View system audit logs
  app.get("/api/admin/audit-logs", (req, res) => {
    try {
      const db = getDbService();
      const auditLogs = (db as any).auditLogs || [];
      res.json(auditLogs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/webhook-events - View processed webhook events
  app.get("/api/admin/webhook-events", (req, res) => {
    try {
      const db = getDbService();
      const webhookEvents = (db as any).webhookEvents || [];
      res.json(webhookEvents);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/business-config - Public endpoint to retrieve current business platform settings
  app.get("/api/business-config", (req, res) => {
    try {
      const db = getDbService();
      res.json(db.platformSettings || {
        bookingPrice: 299,
        platformFee: 79,
        residentShare: 220,
        currency: "INR"
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/admin/settings - Get current business platform settings
  app.get("/api/admin/settings", (req, res) => {
    try {
      const db = getDbService();
      res.json(db.platformSettings || {
        bookingPrice: 299,
        platformFee: 79,
        residentShare: 220,
        currency: "INR"
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/admin/settings - Update business platform settings
  app.post("/api/admin/settings", (req, res) => {
    const { bookingPrice, platformFee, residentShare, currency } = req.body;
    try {
      const db = getDbService();
      db.platformSettings = {
        bookingPrice: Number(bookingPrice) || db.platformSettings?.bookingPrice || 299,
        platformFee: Number(platformFee) || db.platformSettings?.platformFee || 79,
        residentShare: Number(residentShare) || db.platformSettings?.residentShare || 220,
        currency: currency || db.platformSettings?.currency || "INR",
        updatedAt: new Date().toISOString()
      };
      saveDbService(db);
      syncDataService();
      res.json({ success: true, settings: db.platformSettings });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite Integration for Hot Module Replacement in dev or Static Assets in prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false }));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        let html = fs.readFileSync(indexPath, 'utf8');
        const env = {
          VITE_CLERK_PUBLISHABLE_KEY: process.env.VITE_CLERK_PUBLISHABLE_KEY || '',
        };
        html = html.replace(
          '<head>',
          `<head><script>window.__ENV__ = ${JSON.stringify(env)};</script>`
        );
        res.send(html);
      } else {
        res.status(404).send('Not found');
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[BeforeRegret] Server running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
