# NEIGHBOR REVIEWS (BEFORE REGRET)
## Master Trust, Reputation, Safety & Marketplace Quality Engine Spec
**Platform Core Goal:** Establish ironclad integrity, eliminate user anxiety, and build India's most trusted decision-making database.  
**Author:** Principal Trust & Safety Architect, Lead Community Moderator & Consumer Behavior Analyst  

---

## 1. STRATEGIC TRUST & REPUTATION PHILOSOPHY

When users make life-altering decisions—such as committing to a 3-year apartment lease or a ₹15,000,000 home purchase in India—the primary bottleneck is **anxiety**. Broker sites, real estate portals, and search results are heavily manipulated by developers paying to hide structural defects, water scarcity, and safety issues.

To become the source of absolute truth, Neighbor Reviews operates on an uncompromising reputation philosophy:

1. **Reputation is Earned, Not Purchased:** No expert can pay to boost their rating, highlight their card, or purge a negative, verified buyer review.
2. **Quality Over Speed, Accuracy Over Hype:** We prioritize deep, contextual, and accurate local information over superficial, rapid responses.
3. **Delayed-Friction Compliance:** Onboarding is lightweight to foster community scale, but verification and administrative friction scale progressively as real financial transactions are unlocked.
4. **Complete Accountability:** Both buyers and experts operate under transactional track records that are permanently logged in immutable ledger tables to prevent bad-faith exploitation of the marketplace.

---

## 2. THE DYNAMIC TRUST SCORE (TS) ENGINE

The backbone of platform security is our proprietary **Trust Score (TS)**. Ranging from **0 to 100**, this dynamic indicator updates in near real-time based on transactional records, user feedback, and policy compliance.

### Mathematical Score Weighted Weights

The platform matching engine calculates an expert's Trust Score using the following vector weights:

$$\text{TS} = (W_{\text{rating}} \times R) + (W_{\text{sla}} \times S) + (W_{\text{completion}} \times C) + (W_{\text{tenure}} \times T) + (W_{\text{loyalty}} \times L) - (\text{Disputes} \times 10) - (\text{Spam} \times 15)$$

Where:

| Vector | Metric Element | Weight | Calculation Method |
| :--- | :--- | :--- | :--- |
| $R$ | **Average User Rating** | **35%** | Average star rating of verified completed transactions, scaled 0 to 100. |
| $S$ | **SLA Compliance** | **25%** | Percentage of queries accepted and completed within 24 hours. |
| $C$ | **Profile Verification Density**| **20%** | GPS location confirmation (10%), Verified Identity Card (5%), Verified Bank Account (5%). |
| $T$ | **Platform Tenure & Volume** | **10%** | Months active on platform and total transaction count completed. |
| $L$ | **Repeat Buyer Ratio** | **10%** | Percentage of unique buyers who buy a second question from this expert. |

### Negative Adjustments (Demotion Penalty System)
- **Each Upheld Buyer Dispute:** $-10$ Points.
- **Each Rejected/Expired SLA Query:** $-5$ Points.
- **Spam or Phone/Email Sharing Detection (Regex Auto-Flag):** $-15$ Points + immediate account shadowban.

---

## 3. EXPERT PROGRESSION LEVELS (GAMIFIED RETENTION)

To encourage long-term participation, detailed responses, and accurate neighborhood updates, experts transition across five performance levels. Higher levels grant enhanced visibility in search results and reduced commission rates.

```
 [Level 1: New Local] ──> [Level 2: Trusted Resident] ──> [Level 3: Top Neighborhood Expert] 
                                                                   │
                                                                   ▼
 [Level 5: Legend Resident] <── [Level 4: Master Locality Specialist]
```

### Level Tiers

#### Level 1: New Local (The Starting Standard)
- **Requirements:** Account created, primary neighborhood/pincode selected.
- **Platform Perks:** Displayed in standard search lists, baseline 20% platform commission fee.

#### Level 2: Trusted Resident
- **Requirements:** 5 queries completed, >4.5 average rating, 90% SLA response speed, basic ID verification complete.
- **Platform Perks:** **"Verified Resident"** profile badge, search boost multiplier (1.05x), commission reduced to 18%.

#### Level 3: Top Neighborhood Expert
- **Requirements:** 25 queries completed, >4.7 average rating, 95% SLA response speed, active 4-star community standing.
- **Platform Perks:** **"Top Rated"** visual badge, featured positioning on Locality Hub pages, priority dispute moderation, commission reduced to 16%.

#### Level 4: Master Locality Specialist
- **Requirements:** 100 queries completed, >4.85 average rating, GPS location verified at targeted apartment complex/neighborhood.
- **Platform Perks:** Early access to corporate/developer intelligence queries, dedicated account support agent, commission reduced to 14%.

#### Level 5: Legend Resident (Elite Status)
- **Requirements:** 500+ queries completed, >4.92 average rating, 0 unresolved disputes.
- **Platform Perks:** Custom branded landing profile, invitation to the BeforeRegret Local Advisory Council, commission reduced to 12%.

---

## 4. CONTEXTUAL VISUAL BADGES (TRUST SIGNALS)

Badges provide buyers with instant, highly legible micro-signals of expert credibility during search and checkout.

| Badge Graphic Name | Earning Threshold Criterion | Visual Execution style |
| :--- | :--- | :--- |
| **Certified Resident** | Verified local GPS coordinates + ID proof matching targeted locality. | Solid Gold Shield Icon |
| **Fast Responder** | Average query response time is under 4 hours. | Indigo Lightning Bolt |
| **Buyer Favorite** | Expert has received repeat queries from 3+ unique buyers. | Warm Rose Heart Icon |
| **Highly Detailed** | Average answer word count exceeds 250 words of verified local detail. | Slate Book Icon |
| **Early Pioneer** | Registered as an expert within the first 30 days of locality launch. | Classic Star Icon |

---

## 5. REVOLUTIONARY VERIFIED-BUYER-ONLY REVIEW SYSTEM

To eliminate the "Review Manipulation" plague that ruins traditional property search platforms, our review system enforces transactional proof-of-work.

```
 [Buyer Checkout] ──> [Query Answered] ──> [Review Form Unlocked] ──> [Post Review]
                                                                            │
                                                                            ▼
                                                                  [Write Expert Response]
```

### Core Integrity Protocols
1. **No Transaction, No Voice:** It is impossible to submit a rating or a review for an expert without a completed, paid, and closed query transaction.
2. **Double-Blind Submission:** Review details and ratings are submitted by the buyer. The expert can see the review only *after* they either respond or after a 48-hour window closes, preventing retaliatory answer quality drops.
3. **Public vs Private Feedback Split:** Buyers submit:
  - **Public Review:** General feedback, public rating (1-5 stars), and written comments.
  - **Private Feedback (To Platform Admins):** Direct report on quality, truthfulness, and accuracy. Used exclusively to adjust the expert's hidden Trust Score.
4. **The Expert Reply Loop:** Experts can reply to public reviews once. Replies must comply with the Community Guidelines; advertising or phone sharing is blocked.

---

## 6. BUYER TRANSACTIONAL INTEGRITY & REPUTATION

Experts must also be protected from malicious, abusive, or unreasonable buyers. We introduce a robust **Buyer Health Metric (BHM)** tracking system:

- **Abusive Dispute Limit:** Any buyer who triggers disputes on more than 3 consecutive completed orders is immediately flagged for automated system fraud review.
- **Anti-Feedback Blackmail:** If a buyer threatens an expert with a 1-star review in chat to extort additional uncontracted work, the expert can click **"Report Feedback Extortion"**. This freezes the rating capabilities of the buyer for that transaction and triggers manual support review.
- **The "Trusted Buyer" Badge:** Awarded to users who have successfully completed 3+ paid queries without initiating frivolous disputes, giving experts confidence to accept their long-tail custom requests instantly.

---

## 7. THE SECURE FRAUD DETECTION & ANTI-COLUSION SUITE

Our platform incorporates real-time analytics to safeguard marketplace financial flows from manipulation:

### Fraud Category Protections
- **Collusion & Self-Dealing Detection:** Tracks IP address matches, device fingerprint profiles, and Secure Payment Gateway payment card signatures between buyers and experts. If an expert attempts to buy their own advice from a fake buyer profile to inflate ratings, both accounts are permanently banned, and funds are seized.
- **Disintermediation / Off-Platform Leakage Prevention:** High-performance regex keyword matching scans active chats for strings resembling phone numbers, WhatsApp links, UPI handles (e.g., `@upi`, `@paytm`), or emails.
  - **First Offense:** System blocks transmission of the message and displays a soft modal warning: *“To remain protected by our 48-Hour Escrow Satisfaction Guarantee, all communication and payments must stay inside the platform.”*
  - **Second Offense:** Immediate temporary suspension of messaging capabilities.
- **GPS Spoofing Defense:** To earn the "Certified Resident" coordinates badge, experts must click "Verify GPS" on our mobile web interface. The system compares the returned latitude/longitude with known geographical polygon limits of the apartment complex or sector. Spoofed positions (e.g., using desktop developer options) trigger verification failure.

---

## 8. DELAYED KYC INTEGRITY FLOWS (GROWTH OPTIMIZED)

To reduce barriers to entry during initial launch, experts can sign up, select locations, and show up in search directories without submitting any legal documents. We gate monetization milestones progressively:

```
  Step 1: Sign Up (Zero Friction) ➔ Set Pincode ➔ Display in Directory
  Step 2: Accept 1st Paid Query   ➔ Delayed-Friction Aadhaar / GPS check
  Step 3: First Bank Withdrawal   ➔ Full KYC & Pan Card Bank Ledger Match
```

### Verification States and Gates:
- **`NOT_STARTED`:** Zero friction. Profile active.
- **`PENDING` (The Quality Gate):** Triggered when an expert receives their first paid query or crosses ₹500 in pending earnings. The platform prompts: *“Upload Aadhaar Card or Rent Agreement to unlock answering capabilities.”* Document verification takes under 15 minutes via automated OCR check.
- **`VERIFIED` (The Financial Gate):** Enforced before any bank withdrawal or UPI payout. Requires PAN Card details to match the withdrawal bank account name, ensuring compliance with Indian TDS (Tax Deducted at Source) guidelines.

---

## 9. EXHAUSTIVE DISPUTE RESOLUTION PROTOCOLS

When a buyer alleges that an expert’s answer is low-effort, incorrect, or copied, the system initiates a structured resolution flow:

```
 Buyer Flags Dispute ➔ Freeze Funds in Escrow ➔ System Requests Expert Defense (24h)
                                                                 │
                                                                 ▼
 Refund Issued <── Admin Panel Verdict <── Evidence Package Compiled
```

### Dispute Rules:
1. **The 24-Hour SLA Defense Window:** Upon dispute initiation, the expert is notified via WhatsApp. They have 24 hours to post a clarification or defend their original answer.
2. **Automated Evidence Compilation:** The system compiles the Buyer’s original query, chosen package, the expert’s submitted answer text, any attached photos, and complete transaction timelines into a secure **Dispute Bundle**.
3. **Admin Verdict Matrix:** Support moderators review the bundle using clear quality standards:
  - **If the answer is <50 words and generic:** Dispute resolved in favor of the buyer. Immediate 100% refund processed, expert Trust Score debited.
  - **If the answer is highly specific but concise:** Dispute rejected, funds released to expert, buyer feedback capability locked for this order to prevent retaliatory ratings.

---

## 10. SYSTEM MODERATION & WORKSPACE TOOLS

We equip moderators with an elite administrative control panel to maintain clean, professional interactions.

- **Content Filters:** Block profane keywords, hate speech, political propaganda, or real estate marketing spam from being posted as neighborhood reviews or expert bio statements.
- **One-Click Suspension Panel:** Allows temporary suspensions (24 hours, 7 days) or permanent lifetime bans. Banned accounts instantly lose directory placement, and any active wallet balance is placed under legal holds.
- **The Audit Ledger:** Every moderator action (e.g., approving a KYC document, resolving a dispute, deleting a toxic review) is logged in an immutable, append-only security log file (`admin_audit_logs`) specifying the moderator ID, timestamp, and justification.

---

## 11. STRATEGIC EMERGENCY AND PRIVACY SAFETY

1. **Anti-Harassment Protocols:** Buyers and experts communicate asynchronously through the question-and-answer board. No direct phone calls or open, unmonitored chat channels exist until a transaction is active. Users can block an abrasive user with a single click.
2. **Absolute Data Anonymization:** Buyers’ names are completely anonymized in public reviews and directories (e.g., *“Review by Amit K. – Verified Buyer”*). No phone numbers or precise floor/door numbers of apartments are ever exposed.
3. **Emergency Escalation Gate:** If an expert or buyer receives threats of physical violence, extortion, or stalker-like behavior, they can trigger an emergency red flag button. The system instantly freezes both profiles, saves active logs, and alerts the legal compliance officer for immediate local police coordination.
