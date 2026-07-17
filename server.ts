import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { INITIAL_LOCALITIES, INITIAL_EXPERTS, INITIAL_REVIEWS } from "./src/data";
import Razorpay from "razorpay";
import crypto from "crypto";

dotenv.config();

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
          packageOption: 'BUNDLE'
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
      const index = dbData.experts.findIndex(e => e.id === expert.id || (expert.userId && e.userId === expert.userId));
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

  // --- RAZORPAY PAYMENT GATEWAY ENDPOINTS ---
  let razorpayInstance: any = null;

  function getRazorpayInstance() {
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return null;
    }

    if (!razorpayInstance) {
      razorpayInstance = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
    }
    return razorpayInstance;
  }

  // Unified Order Creation Logic
  const handleCreateOrder = async (req: any, res: any, isAmountInPaise: boolean) => {
    const { amount, currency = "INR", receipt } = req.body;

    if (amount === undefined || amount === null) {
      return res.status(400).json({ error: "Amount is required" });
    }

    // Convert to paise if the endpoint expects rupees
    const amountInPaise = isAmountInPaise ? Number(amount) : Math.round(Number(amount) * 100);

    // Minimum amount: 100 paise
    if (isNaN(amountInPaise) || amountInPaise < 100) {
      return res.status(400).json({ error: "Amount must be a valid number and at least 100 paise" });
    }

    try {
      const rzp = getRazorpayInstance();
      if (!rzp) {
        console.warn("[Razorpay] Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in environment. Operating in sandbox fallback mode.");
        const mockOrderId = `order_mock_${Math.random().toString(36).substr(2, 9)}`;
        return res.json({
          id: mockOrderId,
          order_id: mockOrderId,
          amount: amountInPaise,
          currency,
          isSandbox: true,
          keyId: process.env.VITE_RAZORPAY_KEY_ID || "rzp_test_mock_keys_not_set"
        });
      }

      const options = {
        amount: amountInPaise,
        currency,
        receipt: receipt || `rcpt_${Date.now()}`
      };

      const order = await rzp.orders.create(options);
      res.json({
        id: order.id,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        isSandbox: false,
        keyId: process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID
      });
    } catch (err: any) {
      console.error("[Razorpay] Error creating order:", err);
      // Handle authentication failures with a 401 status code
      if (err.statusCode === 401 || (err.message && err.message.toLowerCase().includes("auth"))) {
        return res.status(401).json({ error: "Razorpay authentication failed. Please check your API keys." });
      }
      res.status(500).json({ error: err.message || "Failed to create Razorpay order" });
    }
  };

  // Standard Standard Web Checkout Endpoint (amount in paise)
  app.post("/api/create-order", (req, res) => {
    handleCreateOrder(req, res, true);
  });

  // Client-Friendly ESCROW Consultations Endpoint (amount in rupees)
  app.post("/api/payments/create-order", (req, res) => {
    handleCreateOrder(req, res, false);
  });

  // Unified Verification Logic
  const handleVerifyPayment = async (req: any, res: any) => {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      isSandbox
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing required verification fields (razorpay_order_id, razorpay_payment_id, razorpay_signature)" });
    }

    try {
      if (isSandbox || razorpay_order_id?.startsWith("order_mock_")) {
        console.log("[Razorpay] Verifying simulated payment in sandbox mode");
        return res.json({ success: true, message: "Simulated payment verified successfully!" });
      }

      const rzp = getRazorpayInstance();
      if (!rzp) {
        return res.status(400).json({ error: "Razorpay instance is not initialized. Keys are missing." });
      }

      const keySecret = process.env.RAZORPAY_KEY_SECRET!;
      const hmac = crypto.createHmac("sha256", keySecret);
      hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
      const generatedSignature = hmac.digest("hex");

      if (generatedSignature !== razorpay_signature) {
        console.warn("[Razorpay] Cryptographic signature verification failed");
        return res.status(400).json({ error: "Invalid payment signature verification failed" });
      }

      console.log("[Razorpay] Cryptographic signature verified successfully!");
      res.json({ success: true, message: "Payment verified successfully!" });
    } catch (err: any) {
      console.error("[Razorpay] Error verifying signature:", err);
      res.status(500).json({ error: err.message || "Failed to verify Razorpay signature" });
    }
  };

  // Standard Signature Verification Endpoints
  app.post("/api/verify-payment", handleVerifyPayment);
  app.post("/api/payments/verify-payment", handleVerifyPayment);

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
