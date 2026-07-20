# BEFORE REGRET (NEIGHBOR REVIEWS)
## Master Product Requirements Document (PRD), Information Architecture (IA) & Systems Architecture Spec
**Niche Focus:** Neighborhoods & Locality Intelligence (India)  
**Expansion Ready:** Multi-Vertical Services (Cars, Travel, Jobs, Healthcare, Education)  
**Author:** Co-Founding Product Manager, Chief Technology Officer, Lead SEO Architect & UX Strategist  

---

## 1. PRODUCT VISION

### Mission
To eradicate irreversible life decisions by giving people direct, paid, and friction-free access to hyper-local, first-person verified human truth before they commit capital, time, or emotional energy.

### Vision
To become the global search and transaction utility for first-person local truth, starting with India’s neighborhoods and expanding programmatically to verify every high-stakes life decision—from where you live and work, to what you buy, study, and trust.

### Target Audience
1. **The Migrating Tenant / Homebuyer (Buyers):** Individuals, families, and working professionals relocating to new cities, areas, or specific apartment societies in India. They want to avoid water scarcity, noise pollution, traffic congestion, unsafe streets, poor construction, and deceptive builders.
2. **The Trusted Resident (Local Experts):** Long-term residents, homeowners, and local community members with deep, authentic knowledge of their immediate neighborhood, pincode, or society. They want to monetize their localized experience safely, anonymously or publicly.
3. **Programmatic Searchers:** High-intent search engine users looking for extremely specific local queries (e.g., *"Indiranagar water supply problems"*, *"DLF Phase 3 noise levels night"*, *"Is Bandra West safe to walk at 2 AM"*).

### Value Proposition
- **For Buyers:** Unbiased, raw truth directly from someone living at the address, backed by an escrow satisfaction guarantee. Safe, fast, and high-fidelity compared to manufactured Google reviews or broker sales pitches.
- **For Experts:** A seamless, friction-free side-gig where local experience is translated into immediate income, requiring zero starting capital, zero upfront KYC (delayed monetization friction), and taking under 5 minutes per response.

### Competitive Advantage
- **Zero Aggregation Bias:** Unlike review portals where builders pay to suppress complaints, BeforeRegret is a direct person-to-person transaction. The platform cannot be bribed to delete reviews because it is a peer-to-peer consulting marketplace.
- **Asymmetrical Information Unlock:** Monetizes oral histories and unwritten local knowledge (e.g., "the sewage line breaks here every monsoon") that never makes it to real estate aggregator sites.
- **Algorithmic Search Dominance:** High-density programmatic SEO structure built on a hyper-granular geographical hierarchy.

### Product Philosophy
- **Anti-Slop UI:** Clean, ultra-high-contrast typography, generous whitespace, and absolute elimination of system telemetry or tech-clutter.
- **Frictionless Onboarding:** Registering as an expert takes 30 seconds. No initial KYC to trigger user drop-off; delayed verification occurs only when real financial value is captured.
- **Asynchronous Trust:** Escrowing of fees with a 48-hour dispute hold guarantees quality for buyers while protecting experts from bad-faith claims.

### Long-term Vision
To act as the global validation layer. The "Check Before You Regret" standard for high-stakes consumer transactions:
```
[Neighborhoods] ➔ [Jobs / Corporate Culture] ➔ [Used Cars] ➔ [Schools / Colleges] ➔ [Surgeries / Healthcare]
```

---

## 2. PRODUCT PRINCIPLES

1. **Extreme Geographical Integrity:** Never generalize. A city is not a single entity; data must be tied to specific coordinates, apartment societies, or streets.
2. **Asymmetry of Value:** A single true answer from a real resident can save a buyer ₹5,000,000 (home purchase) or ₹200,000 (rental deposit). We price the service as an absolute micro-transaction (e.g., ₹99 to ₹499) to make ordering a no-brainer.
3. **Escrow-Backed Quality:** Buyers must feel 100% safe. If an expert delivers copy-pasted generic text or fails to answer, the buyer receives a full refund instantly.
4. **Zero Pre-Value Friction:** No KYC walls on register, no long configuration panels. Bring users to their first "Aha!" moment (either posting a query or seeing their profile listed) before demanding administrative or legal overhead.
5. **Radical Typographical Clarity:** Avoid heavy elements, default shadows, or visual noise. Let typography (Inter paired with monospace data accents) define the platform’s premium authority.

---

## 3. USER TYPES & PERMISSION MATRIX

| User Type | Core Responsibility | Capabilities | Restrictions |
| :--- | :--- | :--- | :--- |
| **Visitor** | Anonymous browser exploring local pages. | Search, read public sanitized questions, view expert cards, view city/area catalogs, view landing pages. | Cannot contact experts, view full-length private answers, or request withdrawals. |
| **Buyer** | High-intent customer seeking truth. | Ask direct questions, choose expert, customize query parameters, make payments via Secure Payment Gateway, review/dispute answers, write ratings/reviews. | Cannot register as an expert on the same account (must toggle/upgrade), cannot withdraw funds. |
| **Local Expert** | Verified local resident delivering insights. | Define coverage areas (pincodes/societies), set pricing, accept/reject questions, submit answers, manage wallet, request withdrawals, complete KYC. | Cannot answer questions outside designated coverage areas, cannot self-review, cannot access other experts' wallets. |
| **Moderator** | Human editor protecting platform safety. | Review flagged content, inspect reported messages, check buyer disputes, approve or reject basic KYC requests. | Cannot access raw database secrets, initiate payment refunds directly without admin approval, or view admin logs. |
| **Administrator** | Overall system owner and business operator. | Full marketplace overview, trigger manual payouts, alter system parameters, edit fee margins, perform deep database operations, review audit logs. | Access is locked under strict multi-factor authentication and tracked in immutable audit tables. |
| **Support** | Customer service representative. | Answer support tickets, read historical transaction timelines, initiate user contact, reset failed states. | Cannot view clear-text user credentials, edit system commissions, or modify financial ledger entries. |

---

## 4. END-TO-END USER JOURNEYS

### A. The Buyer Journey
1. **Discovery:** Lands on an organic programmatic page via Google Search (e.g., *“Water problems in Prestige Shantiniketan Whitefield”*).
2. **Evaluation:** Reads the public summary card. Notices three active Local Experts living in Prestige Shantiniketan with a 4.9 average rating.
3. **Configuration:** Clicks "Ask Resident". Enters their specific concerns: *“Is the block B water pipeline still leaking? How noisy is the nearby railway track on higher floors at night?”*
4. **Checkout:** Selects response detail level (Detailed vs Concise), views transparent pricing Breakdown (e.g., ₹299), and pays seamlessly through Secure Payment Gateway.
5. **Waiting State:** Receives SMS/Email notification that Expert Rohan has accepted the question.
6. **Delivery & Escrow:** Rohan submits the response within 12 hours. Buyer reads the highly specific, hyper-local answer.
7. **Confirmation & Review:** Buyer approves the answer, leaves a 5-star rating, and writes a review. The 48-hour release countdown begins.

### B. The Local Expert Journey
1. **Onboarding:** Registers with Google OAuth / Phone OTP. Selects city (Bengaluru), neighborhood (Koramangala 4th Block), and pincode (560034).
2. **Profile Setup:** Inputs brief bio: *“Lived in Koramangala for 8 years, active cyclist, knows every water and landlord issue here.”* Sets query price (₹199). Profile is instantly active!
3. **Lead Acquisition:** Receives a WhatsApp notification: *“New paid query received from Amit for Koramangala 4th Block. Earn ₹159 upon answering.”*
4. **Acceptance Threshold:** Clicks the link, views the query. Since this is their first transaction, a minimal KYC prompt triggers: *“To accept this paid query, please take 30 seconds to upload your Aadhaar/Rent Agreement or verify local GPS coordinates.”*
5. **Resolution:** Expert uploads document. State changes to "Pending Verification", but the system *allows* them to write the answer immediately to prevent delivery friction.
6. **Execution:** Expert types the detailed answer and attaches an optional real-time photo of the area. Submits.
7. **Wallet Credit:** Funds are credited to "Pending Balance" in their wallet. After 48 hours, the balance transitions to "Available Balance".
8. **Payout:** Expert enters bank details/UPI ID, requests withdrawal, and receives funds in their bank account within 24 hours.

### C. The Admin/Moderator Journey
1. **KYC Queue:** Log in to Admin Console, view list of newly submitted Expert documents sorted by freshness.
2. **Verification Check:** Cross-verify matching name on Aadhaar with banking ledger and local address. Approves with one click.
3. **Dispute Queue:** Notified of a buyer dispute: *“Expert provided generic copy-pasted info.”* Opens the dispute detail view, reads the question, reads the expert’s answer.
4. **Resolution:** Determines the answer is genuinely helpful but concise. Rejects dispute and releases escrow funds, or accepts dispute, refunds buyer, and flags expert profile.

---

## 5. COMPLETE WEBSITE INFORMATION ARCHITECTURE (IA)

```
[HOMEPAGE]
   ├── [SEARCH ARCHITECTURE]
   ├── [HIERARCHICAL GEOGRAPHY HUBS]
   │     ├── [CITY PAGES] (e.g., /city/bengaluru)
   │     │     └── [AREA PAGES] (e.g., /locality/indiranagar)
   │     │           └── [PINCODE PAGES] (e.g., /pincode/560038)
   │     │                 ├── [SOCIETY PAGES] (e.g., /society/prestige-lh)
   │     │                 └── [EXPERT PROFILES] (e.g., /expert/rohan-sharma)
   ├── [HOW IT WORKS] (Instructional Landing Page)
   ├── [BECOME A LOCAL EXPERT] (Conversion-focused lander)
   ├── [BUYER DASHBOARD]
   │     ├── [MY ACTIVE QUERIES]
   │     └── [HISTORICAL REPORTS]
   ├── [EXPERT DASHBOARD]
   │     ├── [INBOX / ACTIVE REQUESTS]
   │     ├── [COVERAGE CONFIGURATOR]
   │     └── [WALLET & PAYOUTS]
   └── [LEGAL & SYSTEM PAGES] (/privacy, /terms, /blog, /support)
```

### Detailed Page Specs

#### 1. Homepage (`/`)
- **Purpose:** Primary brand credibility, category introduction, immediate search discovery.
- **Primary CTA:** Auto-focus Search Bar.
- **Internal Links:** Dynamic links to Top Cities, Latest Answered Queries, Top Rated Experts.
- **SEO Value:** Directs domain authority to deep geographic pages using high-intent contextual anchors.

#### 2. Search Page (`/search`)
- **Purpose:** Handle dynamic queries, apply multi-dimensional filters, display local search density.
- **Primary CTA:** Filter and select Expert.
- **Internal Links:** Expert profile links, Breadcrumbs back to City.
- **SEO Value:** Serves as a catch-all indexer for long-tail multi-keyword queries.

#### 3. City Hub Page (`/city/[city-slug]`)
- **Purpose:** Directory of all active neighborhoods, societies, and pincodes within a specific metropolitan city.
- **Primary CTA:** Explore Localities.
- **Internal Links:** Complete lists of Areas, Pincodes, Top Builders in that City.
- **SEO Value:** Targets high-volume head keywords (e.g., *“Local experts in Bangalore”*, *“Kolkata area reviews”*).

#### 4. Area/Locality Page (`/locality/[locality-slug]`)
- **Purpose:** Highlight local experts, average rating of the area, answered local FAQs.
- **Primary CTA:** Ask a Local Resident.
- **Internal Links:** Pincode pages, local societies, specific apartments, builder profiles within this area.
- **SEO Value:** Targets mid-funnel location research queries (e.g., *“Is HSR Layout Bangalore a good place to live?”*).

#### 5. Society/Project Page (`/society/[society-slug]`)
- **Purpose:** Hyper-specific visual and technical directory of a modern apartment complex or housing estate.
- **Primary CTA:** Speak with a Resident of [Society Name].
- **Internal Links:** Locality Hub, Pincode Hub, Creator Builder Profile.
- **SEO Value:** Captures transactional search intent when people are looking at specific properties on Magicbricks, NoBroker, or Housing.com (e.g., *“Prestige Lakeside Habitat honest resident reviews”*).

#### 6. Expert Profile Page (`/expert/[expert-slug]`)
- **Purpose:** Establish the credibility, performance history, local coverage, and pricing of an individual expert.
- **Primary CTA:** Book direct query (₹XXX).
- **Internal Links:** Pincode, Society, City landing pages, Public answered queries.
- **SEO Value:** Targets name queries, authority profiles, and provides Schema.org structured data for `Person` and `ProfessionalService`.

---

## 6. NAVIGATION ARCHITECTURE

### Desktop Navigation
```
[Logo: BeforeRegret] -> [Search Bar (Elastic)] -> [How It Works] -> [Become an Expert] -> [Buyer/Expert Dashboard Toggle] -> [User Profile Dropdown (Wallet/Settings)]
```
- **Execution:** Sticky header, blur backdrop, ultra-clean layout. No massive multi-level dropdowns. Simple and direct.

### Mobile Navigation
- **Top Bar:** Brand logo + Wallet balance icon + Quick search trigger.
- **Bottom Navigation Bar (Touch Optimized):**
  ```
  [Icon: Home] | [Icon: Search] | [Icon: My Queries] | [Icon: Wallet] | [Icon: Profile]
  ```

### Footer Structure
```
BeforeRegret - India's #1 Locality Transparency Marketplace.
--------------------------------------------------------------------------------------
Cities: Bengaluru | Mumbai | Gurugram | Pune | Hyderabad | Chennai | Delhi-NCR
Categories: Neighborhoods | Office Spaces (Future) | College Campus Verification (Future)
Company: About Us | How it Works | Security | Blog | Press
Legal: Privacy Policy | Terms of Service | Grievance Officer | Refund Rules
```

### Breadcrumbs Pattern
Universal schema-validated breadcrumbs on all geographical pages:
```
Home / India / Karnataka / Bengaluru / HSR Layout / Sector 2 / Sobha Daisy Apartment
```

---

## 7. GEOGRAPHIC INFORMATION HIERARCHY
Our data follows a strict parent-child relationship to maximize user search flow and programmatic indexing depth:

```
                  [Country: India]
                         │
                  [State: Karnataka]
                         │
                 [City: Bengaluru]
                         │
             [Area/Locality: Whitefield]
                         │
             [Pincode/Postal Code: 560066]
                         │
             [Society/Project: Prestige Shantiniketan]
                         │
             [Apartment/Block: Tower B3]
                         │
             [Verified Resident (Local Expert)]
```

### Strategic Advantage
1. **User Trust:** Mimics how Indians naturally think of locations (e.g., "I live in Whitefield, in 560066, inside Prestige Shantiniketan, Tower B3").
2. **SEO Siloing:** Forces Google crawlers to easily navigate deep down the architectural silo, passing authority down the path and indexing highly specific pages instantly.

---

## 8. MARKETPLACE ARCHITECTURE & SYSTEMS WORKFLOW

```
 [Buyer: Enter Query] ──> [Secure Payment Gateway Checkout] ──> [Escrow State: Locked]
                                                           │
                                                           ▼
 [Expert: Payout Bank/UPI] <── [escrow release] <── [Expert Answers]
```

### A. The End-to-End Marketplace Lifecycle
1. **Initiation:** Buyer visits an Expert profile, types their query, and chooses a package (Basic: 3 questions, Premium: 5 questions + Follow-up).
2. **Payment Processing:** Secure Payment Gateway modal triggers. Funds are collected by the BeforeRegret current account.
3. **Escrow Allocation:** System updates the `DirectQuery` status to `PAID`. The amount is logged under `WalletTransaction` as `CREDIT_PENDING` for the expert.
4. **SLA Notification Loop:** System triggers WhatsApp, SMS, and Email alert to the expert. The 48-hour response clock starts.
5. **Acceptance Phase:** Expert logs in, clicks "Accept". If they fail to accept within 24 hours, the system triggers reminders. If they reject or let it expire (48 hours), the transaction auto-refunds the buyer.
6. **Answering & Proof:** Expert submits the answer. The buyer is notified immediately.
7. **The 48-Hour Escrow Window:** The buyer has 48 hours to click "Approve" or trigger a dispute.
    - **Scenario A (Approval):** Buyer clicks "Approve". Funds are immediately unlocked and moved to the expert’s `Available Balance`.
    - **Scenario B (Auto-Approval):** If the buyer does nothing for 48 hours, the system auto-completes the order, releasing the funds.
    - **Scenario C (Dispute):** Buyer flags the response. The transaction is locked, the dispute team is notified, and funds remain frozen in escrow.

### B. Dispute Management Rules
- Disputes must contain a clear reason (e.g., *“Insufficient detail”*, *“Deceptive/Incorrect local info”*).
- An expert is given 24 hours to provide a follow-up clarification if requested.
- If a dispute is resolved in favor of the buyer, a full refund (including platform commission) is returned to the original payment source.

### C. Financial Calculations
- **Transaction Flow Example:**
  - Buyer Pays: **₹500**
  - GST on Platform Commission (18% of Commission): **₹18**
  - Platform Commission (20% of Transaction value): **₹100**
  - Expert Earnings (80% of Transaction value): **₹400**
  - Secure Payment Gateway Gateway Fee (Approx 2%): **₹10** (absorbed by platform)

---

## 9. DETAILED DATABASE SCHEMA (RELATIONAL & NOSQL BLUEPRINTS)

### Table: `users`
| Column Name | Data Type | Constraints | Purpose |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(64) | PRIMARY KEY | Unique user ID (Auth reference). |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | User's email. |
| `phone_number` | VARCHAR(20) | UNIQUE | Verified Indian mobile phone number. |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Date of registration. |
| `is_expert` | BOOLEAN | DEFAULT FALSE | Flag specifying if expert profile exists. |

### Table: `expert_profiles`
| Column Name | Data Type | Constraints | Purpose |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(64) | PRIMARY KEY | Unique expert ID. |
| `user_id` | VARCHAR(64) | FOREIGN KEY (users.id) | Link to core user profile. |
| `full_name` | VARCHAR(255) | NOT NULL | Display name. |
| `bio` | TEXT | | Short professional background description. |
| `base_locality_id`| VARCHAR(64) | FOREIGN KEY (localities.id) | Primary operating locality. |
| `pricing_per_query`| INT | NOT NULL DEFAULT 199 | Consultation price in INR. |
| `verified` | BOOLEAN | DEFAULT FALSE | Trust badge state. |
| `kyc_status` | VARCHAR(32) | CHECK IN ('NOT_STARTED', 'PENDING', 'VERIFIED', 'REJECTED') | Delayed compliance status tracking. |
| `response_rate` | DECIMAL(5,2) | DEFAULT 100.00 | Performance metric. |
| `average_rating` | DECIMAL(3,2) | DEFAULT 5.00 | Real-time score indicator. |

### Table: `localities`
| Column Name | Data Type | Constraints | Purpose |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(64) | PRIMARY KEY | Unique geographic hash. |
| `name` | VARCHAR(255) | NOT NULL | e.g. "Indiranagar". |
| `city` | VARCHAR(255) | NOT NULL | e.g. "Bengaluru". |
| `state` | VARCHAR(255) | NOT NULL | e.g. "Karnataka". |
| `pincode` | VARCHAR(10) | NOT NULL | e.g. "560038". |
| `slug` | VARCHAR(255) | UNIQUE, NOT NULL | Clean path for URL routers. |

### Table: `direct_queries`
| Column Name | Data Type | Constraints | Purpose |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(64) | PRIMARY KEY | Order ID. |
| `buyer_id` | VARCHAR(64) | FOREIGN KEY (users.id) | ID of the paying buyer. |
| `expert_id` | VARCHAR(64) | FOREIGN KEY (expert_profiles.id)| Targeted resident expert. |
| `query_text` | TEXT | NOT NULL | The user’s questions. |
| `status` | VARCHAR(32) | CHECK IN ('PENDING_PAYMENT', 'PAID', 'WAITING_FOR_EXPERT', 'ACCEPTED', 'ANSWERED', 'COMPLETED', 'DISPUTED', 'REFUNDED') | State Machine monitor. |
| `price_paid` | INT | NOT NULL | Total transactional value (INR). |
| `expert_earnings` | INT | NOT NULL | Amount allocated for the expert (80%). |
| `answer_text` | TEXT | | Written response of the expert. |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Epoch tracker. |
| `answered_at` | TIMESTAMP | | Time the answer was delivered. |

### Table: `wallets`
| Column Name | Data Type | Constraints | Purpose |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(64) | PRIMARY KEY | Wallet identifier. |
| `expert_id` | VARCHAR(64) | UNIQUE, FOREIGN KEY | Owner link. |
| `available_balance`| INT | DEFAULT 0 | Funds eligible for direct withdrawal. |
| `held_balance` | INT | DEFAULT 0 | Funds undergoing 48-hour escrow review. |
| `total_withdrawn` | INT | DEFAULT 0 | Cumulative lifetime payouts. |

### Table: `wallet_transactions`
| Column Name | Data Type | Constraints | Purpose |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(64) | PRIMARY KEY | Tx ID. |
| `wallet_id` | VARCHAR(64) | FOREIGN KEY (wallets.id) | target wallet. |
| `amount` | INT | NOT NULL | Amount in INR. |
| `type` | VARCHAR(32) | CHECK IN ('CREDIT_PENDING', 'CREDIT_AVAILABLE', 'DEBIT_WITHDRAWAL') | Transaction category. |
| `status` | VARCHAR(32) | CHECK IN ('PENDING', 'COMPLETED', 'FAILED') | Settlement state. |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Timestamp. |

---

## 10. SYSTEM STATE MACHINE: THE QUESTION LIFECYCLE

```
 [PENDING_PAYMENT] ──(Secure Payment Gateway Success)──> [PAID] ──(Expert Accepts)──> [ACCEPTED]
        │                                    │                              │
        ├──(Secure Payment Gateway Fail/Cancel)            ├──(Reject/Timeout)            ├──(48h SLA Breach)
        │                                    │                              │
        ▼                                    ▼                              ▼
    [CANCELLED]                         [REFUNDED]                     [REFUNDED]
                                                                            │
                                   [COMPLETED] <──(Approved/48h Pass)── [ANSWERED] <──(Expert Submits)
```

### Transition Logic:
- **`PENDING_PAYMENT` ➔ `PAID`:** Triggered strictly on Secure Payment Gateway `payment.captured` Webhook.
- **`PAID` ➔ `REFUNDED`:** Triggered if Expert rejects or if 48 hours pass without acceptance. Automated script schedules instant refund.
- **`ACCEPTED` ➔ `ANSWERED`:** Expert enters content in their input field and clicks "Publish".
- **`ANSWERED` ➔ `COMPLETED`:** Buyer clicks "Approve" OR 48 hours lapse with no open dispute flags. Trigger: Moving funds from `held_balance` to `available_balance`.

---

## 11. DELAYED KYC COMPLIANCE PIPELINE
We design onboarding to maximize growth loops and eliminate friction:

```
 Expert Onboarding (0 Friction) ──> Set Pincodes ──> Display in Search ──> Accept Query
                                                                                  │
                                                                                  ▼
                                                                        [Trigger KYC Gateway]
                                                                                  │
                                                                                  ▼
 Payout / Bank Withdrawal <── Approve Document <── Submit Aadhaar/Address Verification
```

### Business Rules:
- **KYC Requirement Trigger:** Expert profile can receive and accept queries without KYC. However, they cannot *submit their first answer* or *request their first withdrawal* until KYC is submitted and approved.
- **Standard Document Requirements:** Aadhaar Card Number (with OTP Verification) OR Electricity Bill/Rent Agreement indicating residence in the targeted pincode.
- **Security Guard:** If an expert’s KYC is rejected, the profile is blacklisted, and pending balances are returned to affected buyers.

---

## 12. SEARCH SYSTEM & EXPERT RANKING ENGINE

To ensure buyers find highly competent, active local residents, we implement a dynamic heuristic search ranking algorithm.

### The Expert Ranking Score (ERS)
Every active expert in a searched location is evaluated using the following formula:

$$\text{ERS} = (W_1 \times \text{Rating}) + (W_2 \times \text{CompletionRate}) + (W_3 \times \text{Freshness}) + (W_4 \times \text{Distance}) + (W_5 \times \text{RepeatBuyers})$$

Where:
- **Rating (Weight 40%):** Weighted average rating (1.0 to 5.0).
- **Completion Rate (Weight 25%):** Percentage of accepted questions successfully resolved without dispute.
- **Freshness (Weight 15%):** Number of days since last answer was posted (favors active community members).
- **Distance Match (Weight 15%):** Direct physical or hierarchy match (e.g., Exact Society Match = 100 points, Area Match = 50 points, City-only Match = 10 points).
- **Repeat Buyers (Weight 5%):** Count of clients who purchased advice multiple times.

---

## 13. PROGRAMMATIC SEO & GOOGLE DISCOVERY ARCHITECTURE

Our primary user acquisition engine is organic search. We dominate real-estate long-tail queries.

### A. Dynamic URL Schemas
- **City Landing Pages:** `https://beforeregret.com/city/bengaluru`
- **Locality Landing Pages:** `https://beforeregret.com/locality/indiranagar`
- **Pincode Specific Hubs:** `https://beforeregret.com/pincode/560038`
- **Society Intelligence Portals:** `https://beforeregret.com/society/prestige-lakeside-habitat`
- **Expert Portfolios:** `https://beforeregret.com/expert/rohan-sharma-hsr-expert`

### B. Meta Title & Description Generator Patterns
```
Locality: [Locality Name], [City Name] Resident Reviews & Local Experts
Title: Is [Locality Name] Good to Live? Ask Real Residents | BeforeRegret
Meta Description: Skip biased broker guides! Pay ₹99 to ask verified residents of [Locality Name], [City] about water shortages, traffic congestion, power cuts, safety & noise.
```

```
Society: Prestige Lakeside Habitat, Varthur Bengaluru Reviews
Title: Prestige Lakeside Habitat Reviews | Ask Actual Apartment Residents
Meta Description: Thinking of renting or buying in Prestige Lakeside Habitat? Speak directly to current tower residents about water, maintenance charges, and builder secrets.
```

### C. Rich Schema Markup Injection
Every page dynamically injects rich structured JSON-LD data:
- **BreadcrumbList Schema:** To display clean search result paths on Google.
- **FAQPage Schema:** Converts community answers into immediate Google SERP accordion answers.
- **Product & Offer Schema:** On expert profiles to drive reviews and pricing rich snippets directly in Google search results.

---

## 14. TRUST, MODERATION & FRAUD PREVENTION

1. **Collusion Protection:** Experts are forbidden from reviewing themselves. Buyers can only review an expert after a completed Secure Payment Gateway transaction.
2. **Chat Safety Filter:** Automated regex algorithms filter phone numbers, emails, and external payment links in private conversations to prevent transaction disintermediation.
3. **Geo-Location Check:** Experts can prove residence by clicking a "Verify GPS Location" button inside their dashboard while sitting inside the targeted apartment complex/locality. This awards a "Certified Geolocation" trust badge.

---

## 15. PERFORMANCE, SECURITY & SCALABILITY

### Caching Strategy
- Use Redis to cache the dynamic Geographic hierarchy tables and highly visited static landing pages.
- Set a TTL of 24 hours on geographic counts and expert lists, with invalidation triggers when a new expert registers.

### CDN and Edge Computing
- Serve all assets and core static components through Cloudflare Edge nodes inside India (Mumbai, Bengaluru, Chennai edge networks) to reduce TTFB (Time to First Byte) under 100ms.

### Rate Limiting and WAF Rules
- Restrict search queries to 60 per minute per IP address.
- Block scrapers attempting to extract the directory list of Indian apartment complex names using advanced Cloudflare WAF bot rules.

---

## 16. HORIZONTAL EXPANSION FRAMEWORK (FUTURE CATEGORIES)

The database, search system, and user architecture are structurally abstract, allowing the platform to branch into any category where human advice protects against "Regret":

```
                                  [BeforeRegret Platform Core]
                                               │
             ┌───────────────────┬─────────────┴─────┬───────────────────┐
             ▼                   ▼                   ▼                   ▼
    [Neighborhoods]           [Used Cars]          [Jobs]           [Education]
    - Locality ID             - Car Vin No         - Company Name   - University ID
    - Pincode                 - Make & Model       - Job Title      - College Major
    - Society                 - Year               - Department     - Intake Year
```

To roll out a new category, we simply define a new metadata taxonomy without modifying the core `users`, `wallets`, `queries`, or `payments` engines. The platform is architecturally infinite.
