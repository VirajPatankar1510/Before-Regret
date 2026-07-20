# BEFORE REGRET (NEIGHBOR REVIEWS)
## Master Analytics, Business Intelligence, Experimentation & Decision Platform Spec
**Platform Core Goal:** Establish a data-driven, experimentation-first operating system that drives capital-efficient marketplace growth and operational integrity.  
**Platform Architecture:** Modern Data Stack (Snowflake/BigQuery, dbt, Segment, Amplitude, and Optimizely abstraction)  
**Author:** Chief Data Officer, Lead Data Scientist, Growth Product Analyst & Founding Economist  

---

## 1. STRATEGIC ANALYTICS PHILOSOPHY

Many startups struggle and fail not due to a lack of effort, but because they run their operations on vanity metrics and gut instincts. On BeforeRegret, we operate on a fundamental truth: **If you cannot measure it, you cannot optimize it, and you cannot scale it.**

Every product modification, supply recruitment campaign, marketing spend, and support process must be validated through real, reliable transactional and behavioral data. We treat analytics as a core product feature that informs decisions rather than just generating static graphs.

```
 [Operational Behavior Logged] ➔ [Segment Schema Normalization] ➔ [dbt Analytical Models]
                                                                            │
                                                                            ▼
 [Actionable Strategy Output] <── [A/B Experiment Verification] <── [Founder KPI Dashboards]
```

### Core Performance Metrics

#### The North Star Metric (NSM): Paid Query Answer Completion Rate (PQACR)
We do not use generic metrics like signups, page views, or active sessions as our primary measure of success. The single metric that represents real value creation for both sides of our marketplace is **Completed Paid Queries**.
- **Definition:** The percentage of paid buyer queries that are accepted, answered with high resident quality, and successfully settled in a week.
- **Why it matters:** It aligns our product goals. It proves that a buyer received life-changing local advice and that a resident expert earned revenue, strengthening both retention and marketplace liquidity.

#### Leading Indicators (Predictive Metrics)
- **Supply Liquidity Density (SLD):** The percentage of active neighborhood societies containing $\ge 3$ verified, active experts.
- **First-Answer Velocity (FAV):** The median duration between a buyer placing a paid query and receiving their answer.
- **Search-to-Checkout Conversion Rate (S2C):** The percentage of search sessions that progress to a paid query purchase.
- **Expert Answering Capacity Utilization:** The percentage of registered experts with active queries who are currently under their capacity limits.

#### Lagging Indicators (Retrospective Outcomes)
- **Gross Merchandise Value (GMV):** Cumulative total value of questions bought (INR).
- **Net Revenue / Platform Take Rate:** The platform's 20% commission slice.
- **Buyer 90-day Repeat Purchase Rate:** The percentage of buyers who purchase a second question within 90 days.
- **Expert Churn Rate:** The percentage of experts who do not log in or answer a query for 45 consecutive days.

---

## 2. THE FOUNDERS' EXECUTIVE KPI DASHBOARD

The primary visual panel of our Analytics Operating System (AOS) is the **Founders' Executive KPI Dashboard**. Built for high-level visibility, it aggregates real-time marketplace health metrics, supports dynamic filters (by Date, City, Locality, Pincode), and allows immediate exports to CSV, Excel, and PDF formats.

```
 +-----------------------------------------------------------------------------------+
 |  FOUNDERS' COCKPIT: [ TODAY'S GMV: ₹12,40,500 ]  [ NET MARGINS: 20% (₹2,48,100) ]  |
 |                     [ TOTAL COMPLETED ORDERS: 6,202 ]  [ CSAT RATING: 97.4% ]      |
 |-----------------------------------------------------------------------------------|
 |  Filters: [ Date: Last 30 Days ]  [ City: Bengaluru ]  [ Locality: HSR Layout ]    |
 |  Export Options: [ Download CSV ]  [ Download PDF Executive Summary ]             |
 +-----------------------------------------------------------------------------------+
```

### Core Metric Visualizers

#### 1. Financial KPIs
- **Gross Merchandise Value (GMV):** Cumulative value of questions bought in INR.
- **Net Revenue:** The platform's 20% commission slice plus any additional service/priority package fees.
- **Customer Acquisition Cost (CAC):** Total sales/marketing spend divided by new customer volume.
- **Customer Lifetime Value (LTV):** Calculated across a rolling 12-month cohort analysis.

#### 2. Liquidity & SLA Status
- **Average Speed of Response (ASR):** Median hours taken for an expert to answer a query.
- **Dispute Rate:** Percentage of orders that result in a buyer dispute.
- **Refund Rate:** Percentage of orders returned to buyers due to SLA breaches or quality failures.

#### 3. Traffic & Conversions
- **Organic Sessions:** Unique visits arriving through non-paid channels.
- **Conversion Funnel Breakdown:** Visual representation of user progress from organic landing page ➔ search focus ➔ profile view ➔ checkout ➔ payment completion.

---

## 3. MULTI-SIDED MARKETPLACE ANALYTICS

To balance buyer demand and resident supply across thousands of distinct physical locations, the operations team monitors hyper-local marketplace liquidity.

```
                 [Liquidity Health Monitor]
                             │
       ┌─────────────────────┴─────────────────────┐
       ▼                                           ▼
 [Supply Constraints]                      [Demand Spikes]
 - Societies with 0 Experts                - Locality searches vs purchases
 - Active capacity limits                  - Unanswered questions queues
```

### Supply-Demand Imbalance Trackers
- **Ghost Towns Identifier:** Flags high-traffic societies that contain zero active local experts. This feed automatically updates the marketing recruitment pipeline.
- **Supply Capacity Constraints:** Identifies active experts who have reached their capacity limits (3 active unanswered queries), which reduces the visibility of their profiles in search to prevent SLA delays.
- **Liquidity Health Score (LHS):** Calculated for each locality $L$:
  $$\text{LHS}_L = \frac{\text{Active Experts in } L \times \text{Average Rating of Experts in } L}{\text{Searches for } L \text{ over last } 7 \text{ days}}$$
  Localities with LHS values below a set threshold are automatically flagged for targeted local supply acquisition campaigns.

---

## 4. BEHAVIORAL USER ANALYTICS

We track buyer behavioral patterns to optimize the onboarding experience, improve conversion rates, and build long-term retention.

- **Friction Map Tracking:** Tracks click patterns and scroll depths on society landing pages to identify where users drop out. For example, if users drop out before clicking "View Expert Profiles," the layout is automatically queued for optimization.
- **Session Replay Logs:** Logs user navigation flows to identify usability issues (e.g., users struggling to locate checkout fields on smaller mobile screens).
- **Buyer Retention Curves:** Tracks cohort-based buyer return rates. We analyze which user actions (such as saving a locality watch list or asking a follow-up question) lead to higher long-term lifetime value.

---

## 5. EXPERT PERFORMANCE & CAPACITY ANALYTICS

The platform monitors expert contributions to reward high-performing residents and manage active capacity across our supply base.

- **Expert Conversion Rate:** Tracks the percentage of profile visitors who go on to buy a question from that expert. This helps identify which profile elements (e.g., resident bio detail, verification badges) drive the highest trust.
- **Response Velocity Tracker:** Logs the exact duration between query assignment and answer publication. This is used to calculate the expert's **Fast Responder** badge status.
- **Capacity Utilization Factor (CUF):** Tracks how busy our expert supply is:
  $$\text{CUF} = \frac{\text{Active Unanswered Queries in Hand}}{\text{Max Allowed Daily Capacity (3)}}$$
  High CUF values trigger alerts to invite secondary backup experts in the same pincode to accept incoming queries.

---

## 6. PROGRAMMATIC SEO & ORGANIC METRICS

Because organic search is our primary acquisition engine, the marketing team monitors programmatic landing page performance directly from the AOS.

```
 Google Search Console API ➔ Logs Impressions & Clicks ➔ Tracks Page Quality Scores
```

- **Indexation Health Tracker:** Monitors the percentage of our millions of programmatic society, builder, and category pages that are fully indexed by Google Search Console.
- **Search Intent Keyword Analysis:** Maps organic queries landing on BeforeRegret to localized categories (e.g., *“Is Kaveri water available in HSR?”* is categorized under `Infrastructure -> Water Supply`). This informs our content creation priorities.
- **Topical Authority Rank:** Tracks our search ranking position for competitive hyper-local keywords against traditional real estate directory platforms.

---

## 7. SEARCH & EXPLORATION ANALYTICS

To make search predictive, easy, and fast, the search engineering team monitors autocomplete behavior and query performance.

- **Failed Search Logs:** Logs all search strings that yield zero database matches. This allows our operations team to clean up location names, merge duplicates, or add missing builder profiles.
- **Faceted Filter Usage:** Tracks which filters (e.g., Pet Friendly, Water Supply, Families) are used most frequently. This data is used to optimize filter visibility and order in search menus.
- **Search-to-Selection Latency:** Tracks the duration between a user focusing the search bar and selecting an expert profile. Our product goal is a median of under 12 seconds.

---

## 8. END-TO-END TRANSACTION FUNNEL ANALYTICS

Every step of the marketplace funnel is tracked to isolate and resolve drop-off points.

```
 [Visitor] ──(92%)──> [Search] ──(65%)──> [Profile View] ──(25%)──> [Checkout]
                                                                        │
                                                                        ▼
 [Repeat Purchase] <──(15%) <── [Completed QA] <──(95%) <── [Payment Success]
```

### Funnel Drop-off Auditing
- **Checkout to Payment Drop-offs:** Automatically flags instances where a user clicks "Ask Question" but does not complete the Secure Payment Gateway transaction. This triggers an automated abandonment SMS or WhatsApp reminder 30 minutes later.
- **Expert Acceptance to Delivery:** Monitors how quickly accepted questions are delivered. If drop-offs occur during drafting, the system suggests answer templates to help experts complete their responses.

---

## 9. RETENTION & MULTI-DIMENSIONAL COHORT ANALYSIS

We group users into cohorts based on signup dates, acquisition channels, and operating geographies to measure long-term value and engagement.

### Cohort Dimensions

#### 1. Acquisition Channel Cohorts
- Compares the LTV and retention of organic search visitors (PSEO) against referral-program invitees.
- Identifies which channels drive high-trust, repeat buyers.

#### 2. Geographical Cohorts
- Group users by city and locality (e.g., *“Bengaluru HSR Layout Cohort”*).
- Allows operations teams to monitor local marketplace health and identify which regions are scaling cleanly.

#### 3. Seasonal Relocation Cohorts
- Tracks moving trends across different seasons. For example, we analyze relocation spikes during annual corporate transfer seasons (June–July in India) to balance supply and demand proactively.

---

## 10. REAL-TIME MARKETPLACE HEALTH SCORE (MHS)

We calculate a unified **Marketplace Health Score (MHS)** for active regions, combining several liquidity and quality indicators.

$$\text{MHS} = (S_{\text{liquidity}} \times 0.30) + (Q_{\text{answers}} \times 0.30) + (C_{\text{retention}} \times 0.20) + (D_{\text{disputes}} \times 0.20)$$

Where:

| Metric Indicator | Base Calculation | Target Benchmark |
| :--- | :--- | :--- |
| $S_{\text{liquidity}}$ | Percentage of active queries answered in under 8 hours. | $> 90\%$ SLA speed |
| $Q_{\text{answers}}$ | Average buyer rating of completed transactions. | $> 4.7$ Stars |
| $C_{\text{retention}}$ | Percentage of experts who remain active weekly. | $> 85\%$ Weekly Active Experts |
| $D_{\text{disputes}}$ | Percentage of transactions resolved without buyer disputes. | $< 1.5\%$ Dispute Rate |

---

## 11. FINANCIAL INTELLIGENCE & TRANSACTION LEDGERS

The financial operating system provides clear, audit-compliant records of all cash flows, commissions, and tax allocations.

- **Platform Margin Tracking:** Logs platform net revenues after gateway fees (2% Secure Payment Gateway fee), platform commissions (20%), and expert payouts (80%).
- **GST Allocation Audit Logs:** Tracks GST collections (18% GST charged on our platform commission slice) to simplify quarterly financial filings.
- **Reserve & Escrow Balances:** Tracks funds currently held in escrow (queries that are answered but are within the 48-hour buyer review window) to maintain platform financial stability.

---

## 12. ENTERPRISE-GRADE EXPERIMENTATION PLATFORM (A/B TESTING)

To ensure product changes are driven by data, BeforeRegret uses an in-house **A/B Experimentation Framework**. This system allows product teams to test pricing models, button placements, and ranking algorithms safely.

```
 [User Session] ➔ [Assigned Experiment ID (SHA256 Hash)] ➔ [Renders Variant A or B]
                                                                        │
                                                                        ▼
 [Calculates Significance via Wald Test] <── [Segment Behavioral Tracker Logs]
```

### Experimentation Guardrails
- **Deterministic Assignment:** Users are assigned to a test group using a SHA-256 hash of their User ID. This ensures they see the same layout consistently across devices.
- **Minimum Sample Size Calculations:** Prevents experiments from being stopped prematurely due to temporary fluctuations. The system calculates the required sample size based on statistical power before any change is rolled out.
- **Primary Experiment Targets:**
  - **Pricing Models:** Testing ₹99 versus ₹149 baseline question tiers to find the sweet spot for average order value (AOV).
  - **Ranking Algorithms:** Testing our standard scoring formula against alternative weights to optimize query response times.

---

## 13. PREDICTIVE MARKETPLACE OPERATIONS

We apply predictive analysis to anticipate local supply constraints and fraud patterns before they disrupt the marketplace.

- **Demand Forecasting:** Analyzes historical search volumes to forecast relocation demand spikes in specific sub-cities (e.g., forecasting HSR Layout demand spikes before corporate hiring seasons).
- **Proactive Expert Shortage Alerts:** Predicts local expert shortages by comparing search growth against the active capacity limits of currently registered residents.
- **Fraud Pattern Detection:** Automatically flags accounts showing signs of collusion or self-dealing (e.g., matches in IP addresses, device fingerprints, or credit cards between a buyer and an expert).

---

## 14. REAL-TIME MONITORS & ALERTS ENGINE

The platform features an automated alerts system that notifies relevant teams when operational metrics stray from established baselines.

- **Slow Response Times Alert:** Triggers a Slack/WhatsApp alert to support teams if the average response speed in a locality falls below 12 hours.
- **Failed Searches Spike:** Alert triggers if search queries for a specific city fail $\ge 50$ times in an hour.
- **SEO Traffic Drops:** Monitors Google Search Console APIs daily, firing high-priority alerts to SEO managers if organic impressions on top-tier landing pages drop by over 15% in 48 hours.

---

## 15. TAILORED OPERATIONAL REPORTING

The AOS schedules and delivers customized performance reports to various departments daily and weekly.

- **Executive Reports:** A high-level PDF summary of GMV, take rates, active user growth, and customer satisfaction (CSAT) scores sent to founders every Monday morning.
- **Finance Reports:** CSV and Excel files detailing completed transactions, platform commissions, GST collected, and pending expert payouts.
- **Trust & Safety Audits:** Summaries of flagged chats, unresolved buyer disputes, identity verification backlogs, and recent account suspensions.

---

## 16. PRIVACY, DATA GOVERNANCE & COMPLIANCE

We build trust with our users by enforcing strict data security protocols that comply with modern privacy standards (such as GDPR and India’s DPDP Act).

```
 [Segment Tracking API] ➔ [PII Redaction Layer] ➔ [Scrubbed Data Warehoused]
                                                            │
                                                            ▼
 [Read-Only Analytical Queries] <── [Role-Based Access Restricted]
```

- **Absolute Anonymization of Sensitive Data:** All personally identifiable details (PII)—including real user names, mobile phone numbers, email addresses, and payment signatures—are scrubbed or hashed before data is exported to the data warehouse.
- **Granular Database Access Controls:** Read-only access to our analytics warehouse is restricted to authorized employees. Raw financial data and unmasked user identities are accessible only to Super Admins.
- **Immutable System Log files:** Every administrative action—especially those affecting wallets, KYC approvals, content deletions, or account bans—is permanently logged in append-only security audits to ensure operational transparency.

---

## 17. CATEGORY-AGNOSTIC DATA ARCHITECTURE

To ensure BeforeRegret can expand into future consulting categories (e.g., *Jobs, Cars, Education, Healthcare, Travel*) without rebuilding our core databases, the analytics platform isolates operational variables using abstract entities.

```
                  [Relational Tables (AOS Engine)]
            (users, wallets, queries, locations, analytics)
                                 │
                                 ▼
                     [Taxonomy Metadata Mesh]
     ┌───────────────────┬───────┴───────────┬───────────────────┐
     ▼                   ▼                   ▼                   ▼
[Neighborhoods]     [Used Cars]            [Jobs]           [Education]
- Locality ID       - Car VIN              - Company ID     - College ID
- Pincode           - Make & Model         - Industry       - Degree / Major
- Society           - Manufacture Year     - Job Title      - Intake Year
```

### Strategic Abstraction Rules
- **Taxonomy Independence:** The database treats fields like "Locality" or "Society" as generic `EntityNode` elements. In the **Used Cars** category, an `EntityNode` maps to a Car VIN or Model. In **Jobs**, it represents a Company name.
- **Consistent Operations:** The underlying payment settlement, delayed KYC verification queue, and dispute resolution logic remain unchanged. The only adjustments are the questions asked in forms and the profile layouts, allowing BeforeRegret to scale into any consulting category with ease.
- **Normalized Conversions:** Core KPIs (such as Conversion Rate, First-Answer Velocity, and Repeat Purchase Rate) remain normalized across categories. This allows founders to compare health metrics across diverse business units using a single, unified analytics dashboard.
