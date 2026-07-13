# BEFORE REGRET (NEIGHBOR REVIEWS)
## Master Admin Operating System (AOS) & Operations PRD
**Product Focus:** Scalable operations of India's leading hyper-local consultation marketplace.  
**Platform Architecture:** Enterprise-Grade Operational Control Panel  
**Author:** Co-Founding Chief Technology Officer, Operations Director & Principal Systems Architect  

---

## 1. STRATEGIC OS PHILOSOPHY & OBJECTIVES

To manage a platform connecting millions of high-intent buyers with thousands of Local Experts across a granular geographic hierarchy, the **Admin Operating System (AOS)** must not merely be a "CRUD database editor". The AOS is a high-performance workspace designed to minimize manual overhead, protect financial transaction integrity, and ensure that a lean operational team can run the marketplace.

### AOS Core Axioms
1. **Extreme Automation First:** Any task performed more than three times daily by a human operator must be abstracted into a software automation rule (e.g., auto-awarding Fast Responder badges, triggering SLA reminders).
2. **Absolute Visibility (Single Pane of Glass):** An administrator should be able to audit a complete transaction timeline, a buyer-expert chat, a financial settlement, or an expert’s verification history in a single, unified profile view.
3. **Immutable Audit Trails:** Every administrative action—especially those affecting financial balances, KYC approvals, content deletions, or account bans—must be irreversibly written to append-only database logs specifying the admin user and rationale.
4. **Zero-Trust Security Controls:** Granular, role-based access restricts sensitive financial data and personal identity details (e.g., Aadhaar card scans, cleartext mobile numbers) strictly to roles that require them for processing.
5. **Architectural Abstraction (Vertical-Agnostic):** Although the launch category is **Moving & Neighborhoods**, the database tables, queues, and workflows inside the AOS must treat variables as meta-attributes. This ensures the AOS can scale to support *Jobs, Cars, Education, Healthcare, and Travel* without rebuilding the core layout.

---

## 2. ROLE-BASED ACCESS CONTROL (RBAC) & PERMISSION MATRIX

To satisfy internal security audits and comply with Indian data protection laws, access to the AOS is guarded by a multi-tiered, granular permission matrix.

### Admin Roles
- **Founder / Super Admin:** Absolute database write/delete access, configures pricing, overrides financial transactions, assigns other admin roles, views all audit logs.
- **Operations Manager:** Manages geographical structures, handles escalations for disputes, updates expert pricing ranges, and reviews macro metrics.
- **Trust & Safety Officer:** Reviews fraud indicators, evaluates duplicate accounts, examines flag queues, approves KYC documentation, and processes temporary or permanent bans.
- **Support Executive (L1/L2):** Communicates with customers, opens support tickets, reads chat logs to resolve transaction queries, and requests refunds (requires L2 manager approval).
- **Finance Manager:** Reviews withdrawal queues, manually reconciles bank ledger payouts, exports TDS / GST compliance spreadsheets, and handles refund validations.
- **Content & SEO Manager:** Manages guides, FAQs, landing pages, CMS structures, meta-tags, canonical link directives, and dynamic programmatic sitemaps.

### Granular Permission Matrix

| Module / Action | Founder | Super Admin | Ops Manager | Trust & Safety | Support L2 | Finance | Content / SEO |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **View Executive Financial KPI Dashboard**| Yes | Yes | Yes | No | No | Yes | No |
| **Approve / Reject Expert KYC** | Yes | Yes | Yes | Yes | No | No | No |
| **Initiate Bank Withdrawal Payout** | Yes | Yes | No | No | No | Yes | No |
| **Override / Force Release Escrow** | Yes | Yes | Yes | No | Yes | No | No |
| **View Raw Aadhaar / Identity Scans** | Yes | Yes | No | Yes | No | No | No |
| **Edit SEO Meta / CMS Content Pages** | Yes | Yes | No | No | No | No | Yes |
| **Read Private Buyer-Expert Chats** | Yes | Yes | No | Yes | Yes | No | No |
| **Edit Geographic Society Names** | Yes | Yes | Yes | No | No | No | Yes |
| **Access Immutable System Audit Logs** | Yes | Yes | No | No | No | No | No |

---

## 3. THE EXECUTIVE DISCOVERY & METRIC DASHBOARD

The primary entrance of the AOS features a real-time, highly visual operational cockpit displaying marketplace metrics. Every parameter on the dashboard can be filtered by Date, City, Locality, Pincode, and is exportable to CSV, Excel, and PDF formats.

```
 +-----------------------------------------------------------------------------------+
 |  AOS COCKPIT: [ TODAY'S REVENUE: ₹4,82,500 ]   [ COMPLETED ORDERS: 2,412 ]        |
 |               [ ACTIVE EXPERTS: 8,490 ]        [ CURRENT DISPUTE RATE: 1.12% ]    |
 |-----------------------------------------------------------------------------------|
 |  Real-Time Operational Alerts Queue:                                              |
 |  [ALERT] - 3 Disputes Opened in HSR Sector 2 (Possible Local Water Contamination) |
 |  [ALERT] - Razorpay Webhook SLA Latency spike detected (Mumbai Edge)              |
 +-----------------------------------------------------------------------------------+
```

### Dashboard Key Performance Indicators (KPIs)

#### 1. Transactional Volumes
- **Gross Merchandise Value (GMV):** Cumulative total value of questions bought (INR).
- **Net Revenue:** The platform's 20% commission slice plus any additional service/priority package fees.
- **Order Count:** Hourly, daily, and monthly volume of processed queries.
- **Average Order Value (AOV):** Tracks if buyers are opting for single question models (₹99) versus detailed package models (₹199+).

#### 2. Liquidity & SLA Metrics
- **Average Speed of Response (ASR):** Average hours taken for an expert to answer a query (target < 8 hours).
- **SLA Breach Ratio:** Percentage of orders that hit the 48-hour deadline without response, triggering auto-refunds.
- **Question Acceptance Ratio:** Percentage of questions accepted by experts upon alert.

#### 3. Growth & Discovery Metrics
- **SEO Organic Sessions:** Real-time integration with Google Search Console API tracking impressions, organic clicks, and index coverage.
- **Search-to-Checkout Conversion Rate:** Percentage of users who execute a locality search and progress to buy a question.
- **Inactive Locality Traffic:** Identifies locations receiving high organic traffic that contain zero listed resident experts (directly feeds the marketing recruitment queue).

---

## 4. UNIFIED USER & ACCOUNT MANAGEMENT ENGINE

Every visitor, buyer, and expert profile is mapped to a unified, centralized **User Master File**. This eliminates data siloing and gives operators a comprehensive view of any account's lifecycle.

```
 +-----------------------------------------------------------------------------------+
 |  USER MASTER: Amit Kumar (UID-948193)  [Status: Active]  [BHM: 98]  [Expert: Yes]  |
 |-----------------------------------------------------------------------------------|
 |  Timeline Log:                                                                    |
 |  - 2026-07-10 14:32: Purchased Question for HSR Sector 2 (Order ID: Q-8491)        |
 |  - 2026-07-11 09:12: Verified UPI payout ID (amitk@okaxis)                       |
 |  - 2026-07-11 12:00: Expert KYC Document uploaded (Aadhaar Card)                  |
 |  - [Support Note]: Amit called to verify if business accounts receive GST invoices.|
 +-----------------------------------------------------------------------------------+
```

### Profile View Components
- **The Central Timeline View:** A chronological, scrollable feed of all interactions—including logins, queries posted, answers written, payments made, support tickets opened, and feedback submitted.
- **Buyer Health Metric (BHM):** Evaluates buyer behavior. High chargeback rates, abusive chats, or excessive dispute frequencies deduct points. Accounts dropping below 50 BHM are flagged for restriction.
- **Internal Operator Notes Log:** Allows support agents to leave internal annotations (e.g., *“Customer had issues with Razorpay UPI, prefers direct card checkout”*) visible only to admins.
- **Multi-Account Linker (Fuzzy Identity Match):** Checks matching IP addresses, browser fingerprints, and mobile numbers. If an expert attempts to open a separate "Buyer Profile" to rate themselves, the system links the profiles and flags them for collusion review.

---

## 5. LOCAL EXPERT ONBOARDING & COACHING PIPELINE

The AOS provides a pipeline interface to move local residents from registration to trusted, revenue-generating community leaders.

```
 +-----------------------------------------------------------------------------------+
 |  EXPERT PIPELINE: [Register: 142] ➔ [KYC Pending: 42] ➔ [Top Rated Queue: 12]     |
 |-----------------------------------------------------------------------------------|
 |  Action Table:                                                                    |
 |  [Name]           [Locality]            [Rating]   [Trust Score]  [Action]        |
 |  Rohan Sharma     Koramangala 4 Block   4.91       96             [Feature/Award] |
 |  Sneha Patil      DLF Phase 3           4.20       65             [Coach Expert]  |
 +-----------------------------------------------------------------------------------+
```

### Operational Workflows
- **The Coverage Configurator:** Allows admins to manually override or expand an expert's operating parameters (pincodes, specific societies, languages spoken) based on verified local credentials.
- **Badging & Achievement Panel:** Allows manual assignment of special operational badges (e.g., *“Early Pioneer”*, *“Community Choice”*) or removal of badges if quality metrics drop.
- **Expert Performance Coaching Console:** Automatically triggers a custom guidance email if an expert’s rating drops below 4.3 or average response time crosses 24 hours. The console suggests templates for writing detailed neighborhood reviews.
- **Dynamic Commission Override Panel:** Enables operators to adjust commission rates for specific premium experts or entire cities (e.g., *“0% Platform Commission for newly launched Pune societies during July”*) to stimulate supply.

---

## 6. END-TO-END QUESTION LIFECYCLE MONITORING

Operators can view and filter every question active in the system, organized by its current state in the lifecycle.

```
 [Pending Payment] ➔ [Paid (Awaiting SLA)] ➔ [Accepted (Active Chat)] ➔ [Answered (48h Hold)] ➔ [Settled]
```

### Transition & Intervention Rules

#### 1. SLA Breach Escalation
- If a question remains in `PAID` (waiting for expert acceptance) for more than 18 hours, the system fires an automated SMS/WhatsApp warning to the expert.
- At 24 hours, the system alerts support operators to either manually re-assign the question to another active expert in that pincode or trigger a proactive refund with a ₹50 platform apology credit.

#### 2. Answer Quality Gate
- All answers are processed through an inline character length and semantic check.
- If an expert submits an answer with fewer than 50 words, or if semantic analysis flags copied website guides, the AOS places the transaction in `OPERATOR_REVIEW` and prompts the expert to expand their response before the buyer is notified.

#### 3. Manual Escrow Release Override
- In cases where a buyer receives a highly helpful answer but forgets to click "Approve", support agents can inspect the delivery, confirm quality, and manually release the funds from `held_balance` to `available_balance` before the 48-hour auto-release timer expires.

---

## 7. FINANCIAL OPERATIONS & BANK RECONCILIATION

The Finance console is built for absolute transactional accountability. It acts as the system of record for all marketplace payments, GST compliance, platform commissions, and platform bank reconciliations.

```
 +-----------------------------------------------------------------------------------+
 |  FINANCE CONSOLE: [ RAZORPAY SETTLEMENTS ]   [ GST COMPLIANCE ]   [ MANUAL VERIFY]|
 |-----------------------------------------------------------------------------------|
 |  Ledger Entry Example:                                                            |
 |  Transaction ID: TX-84920193                                                      |
 |  Total Paid: ₹500.00                                                              |
 |  - Razorpay Gateway Fee (2%): ₹10.00                                              |
 |  - Platform Commission (20%): ₹100.00 (GST Collected @18%: ₹18.00)                 |
 |  - Expert Earnings Allocation (80%): ₹390.00                                      |
 +-----------------------------------------------------------------------------------+
```

### Financial System Modules
- **Dynamic Ledger Reconciliation:** Cross-references the active database transaction database table against Razorpay's daily webhook reports. Any discrepancy triggers a high-priority system alert.
- **GST Invoice Generator:** Generates automated, tax-compliant B2C GST invoices for buyers (charging 18% GST on the platform commission portion of the fee) and B2B payout slips for experts.
- **Automated Payout Scheduler:** Integrates with Razorpay Route or direct bank APIs to execute payouts daily at 6 AM, batch-releasing all expert balances that have successfully transitioned from `Held` to `Available` status.
- **Negative Balance Ledger:** In cases where a payout is processed, but a buyer successfully files a credit card dispute/chargeback later, the expert’s wallet balance is adjusted downwards. If the balance goes negative, future earnings auto-reconcile to clear the debt.

---

## 8. PROGRESSIVE KYC OPERATIONS WORKFLOW

To eliminate friction, experts sign up with zero verification. We enforce verification progressively only as real financial thresholds are crossed.

```
 [Register] ➔ [Earn first ₹500] ➔ [KYC Alert Triggered] ➔ [Admin OCR Document Approve] ➔ [Allow Withdrawal]
```

### KYC Operational Panel
- **OCR Identity Verification Engine:** Automatically parses uploaded Aadhaar, Voter IDs, or Rental Agreements. The system cross-references the matching name against the expert's bank ledger and confirms that the address matches the covered operating pincodes.
- **GPS Location Validator Map:** Displays a map indicating where the expert clicked "Verify Coordinates" alongside the physical polygon coordinates of the target apartment society. Matches are graded:
  - **Green (Perfect Match):** Coordinates are within the society boundary. Auto-approves the location badge.
  - **Yellow (Adjoining Match):** Within 100 meters. Places in moderator queue for review.
  - **Red (Mismatched Coordinates):** Mismatch >500 meters. Auto-rejects and alerts the moderation team.
- **Rejection/Retrial Console:** If a document is blurry or rejected, operators can choose a structured rejection reason from a dropdown (e.g., *“Name mismatch”*, *“Document address is outside pincode”*). This triggers an inline notification to the expert's mobile app with upload retry links.

---

## 9. THE TRUST & SAFETY ENGINE CONSOLE

This module manages system protection, protecting BeforeRegret from fraud, bad-faith review manipulation, spam, and transaction leakage.

```
 +-----------------------------------------------------------------------------------+
 |  TRUST & SAFETY CONSOLE: [ FRAUD ALERTS ]   [ CHAT REVIEW ]   [ SUSPENSION QUEUE] |
 |-----------------------------------------------------------------------------------|
 |  Suspect Behavior Table:                                                          |
 |  [Account ID]      [Flag Reason]         [Score]  [System Recommendation]         |
 |  UID-8491          Fuzzy Identity Match  92%      Merge & Collusion Flag          |
 |  UID-9321          Off-Platform Keywords 88%      Restrict chat, alert Moderator  |
 +-----------------------------------------------------------------------------------+
```

### Investigation Modules
- **The Collusion Detector:** Automatically logs instances where the same bank account or UPI ID receives payouts from multiple expert profiles, or where multiple profiles share identical browser footprints.
- **Regex Chat Monitor Queue:** Automatically flags conversations containing strings that look like phone numbers, WhatsApp links, or direct bank transfer keywords. Moderators can read the contextual chat snippets and decide to issue a warning, temporarily mute, or permanently suspend the account.
- **Unified Case Management Workspace:** If a dispute is raised, the investigator has a side-by-side split screen view showing the buyer's query, the expert's answer, and previous chat exchanges. One click processes the resolution: either refunding the buyer, releasing the escrow balance, or flagging the expert for Quality Control.

---

## 10. GEOGRAPHIC DIRECTORY & LOCATION MANAGEMENT (GOS)

This module acts as the source of geographical truth for India’s complex locality structures.

```
 State ➔ City ➔ Locality/Area ➔ Pincode ➔ Builder ➔ Society ➔ Block/Tower
```

### Directory Capabilities
- **Fuzzy Naming Merger:** Solves the common Indian data problem of multiple names referring to the same society (e.g., *“Prestige Lkside”*, *“PLS Habitat”*, *“Prestige Lakeside Habitat Varthur”*). Operators can merge duplicate records, clean up geographic lists, and redirect old SEO URLs to the clean canonical path.
- **Bulk Import CSV Engine:** Enables geographic operations teams to upload thousands of newly launched apartment projects, societies, and pincode lists directly from local zoning boards or municipal registries.
- **The Landmark Linker:** Allows operators to pin important municipal boundaries, local tech parks, or metro stations to societies to enrich programmatic SEO metadata arrays.

---

## 11. SEO OPERATIONS & CMS PLATFORM

To maintain organic search dominance without developer intervention, the marketing team uses the SEO Operations Console.

```
 +-----------------------------------------------------------------------------------+
 |  SEO CONSOLE: [ DYNAMIC SITEMAP ]   [ CANONICAL RULES ]   [ REDIRECT MANAGER ]    |
 |-----------------------------------------------------------------------------------|
 |  Schema Injection Panel:                                                          |
 |  Target Page: /society/prestige-lakeside-habitat                                 |
 |  Inject FAQ Schema:                                                               |
 |  Q: Is the water safe? A: Yes, it is processed through a dual filtration system. |
 +-----------------------------------------------------------------------------------+
```

### Technical SEO Controls
- **Programmatic Sitemap Generator:** Dynamic sitemaps update automatically in real-time as new expert profiles are verified, societies added, or questions answered, pinging search consoles.
- **Faceted Canonical Rule Editor:** Prevents duplicate indexing issues on search pages. Enforces canonical links on search filter pages back to the clean parent city, area, or society path.
- **Visual Schema Injector:** Allows editors to map schema components (e.g., `FAQPage`, `LocalBusiness`, `Product`, `AggregateRating`) to programmatic fields with a visual UI, requiring no custom JSON-LD coding.
- **CMS Content Editor:** Features a Markdown authoring tool for moving checklists, local survival guides, and city comparisons. Features an inline SEO preview window simulating exact Google desktop and mobile SERP views.

---

## 12. INTEGRATED CUSTOMER SUPPORT CONSOLE (TICKETING)

Neighbor Reviews features an in-app ticketing dashboard to manage questions, complaints, and user feedback.

```
 +-----------------------------------------------------------------------------------+
 |  SUPPORT CONSOLE: [ Active Tickets: 14 ]   [ Avg Resolve Time: 12m ]  [ CSAT: 96%]|
 |-----------------------------------------------------------------------------------|
 |  Open Ticket #1948 - Amit Kumar                                                   |
 |  Issue: "Razorpay payment says successful but order is still pending payment."   |
 |  [Check Payment API]  ➔  [Manual Match & Force Paid]  ➔  [Apply Saved Macro]      |
 +-----------------------------------------------------------------------------------+
```

### Support Features
- **Integrated Customer Timelines:** Operators viewing a ticket can see the user's active transaction status, payment history, and account tier side-by-side, avoiding copy-paste work.
- **Transactional One-Click Commands:** Support agents can execute actions—such as checking the status of a payment via API, manually updating an order to `Paid`, or changing an active query to another expert—directly from the support workspace.
- **SLA Alert Engine:** Tickets are colored based on aging: Green (<30 minutes), Orange (30–60 minutes), and Red (>60 minutes). Red tickets trigger SMS escalations to the Support Manager.

---

## 13. NOTIFICATION TEMPLATE MANAGER

This console handles communication templates used for transaction alerts, reminders, and marketing campaigns.

- **Multi-Channel Delivery Loops:** Supports managing notifications across Email (SendGrid), WhatsApp (Twilio/Meta API), and SMS (Gujarati/Indian local SMS gateways).
- **Dynamic Variable Injections:** Provides dynamic variable replacement tags (e.g., `{{buyer_first_name}}`, `{{expert_earning}}`, `{{sla_hours_left}}`) to ensure consistent, clear messaging.
- **Delivery Log Auditor:** Displays historical logs showing if a WhatsApp or email alert failed, bounced, or was read, helping debug notification issues for experts who claim they did not receive transaction alerts.

---

## 14. THE AOS AUTOMATION SYSTEM (RULES ENGINE)

The AOS reduces manual operational work through an automated event-driven rules engine.

```
 IF  [Expert Completes 5 Queries]  AND  [Average Rating > 4.85]
 THEN  [Auto-Award Badge: "Top Local"]  AND  [Reduce Commission: 18%]
```

### Pre-configured Automated Rules
1. **Auto-Refund SLA Breach:** If a question is not answered by the expert within the 48-hour window, the engine auto-cancels the query, processes a 100% refund, debits the expert's Trust Score by 5 points, and fires a WhatsApp alert.
2. **Auto-Award Badges:**
  - **Fast Responder:** Automatically awarded if the average query response time over the last 10 completed orders is under 4 hours.
  - **Buyer Favorite:** Automatically awarded if 3+ unique buyers return to purchase another question from the expert.
3. **Inactive Expert Pruning:** If an expert has not logged in or responded to alerts for 45 days, their profile is set to `INACTIVE`. This removes them from search results, protecting search quality from stale listings.

---

## 15. MUTABLE DATA ARCHITECTURE & FUTURE EXPANSION

To support future categories (e.g., Cars, Jobs, Healthcare, Education, Travel) without redesigning the user interface or database schemas, the AOS isolates operational entities using metadata schemas.

```
                 [Core Relational Tables (AOS Engine)]
               (users, wallets, queries, locations, payments)
                                    │
                                    ▼
                     [Multi-Category Metadata Silos]
        ┌───────────────────┬───────┴───────────┬───────────────────┐
        ▼                   ▼                   ▼                   ▼
  [Neighborhoods]      [Used Cars]            [Jobs]           [Education]
  - Locality ID        - Car VIN            - Company ID       - College ID
  - Pincode            - Make & Model       - Industry         - Specialization
  - Society            - Manufacture Year   - Job Title        - Year of Grad
```

### Strategic Abstraction Rules
- **Taxonomy Independence:** The database treats fields like "Locality" or "Society" as generic `EntityNode` elements. In the **Used Cars** category, an `EntityNode` maps to a Car VIN or Model. In **Jobs**, it represents a Company name.
- **Generic Workflows:** The underlying payment settlement, delayed KYC verification queue, and dispute resolution logic remain unchanged. The only adjustments are the questions asked in forms and the profile layouts, allowing BeforeRegret to scale into any consulting category with ease.
