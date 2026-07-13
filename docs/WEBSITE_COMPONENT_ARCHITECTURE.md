# BEFORE REGRET (NEIGHBOR REVIEWS)
## Master Website Structure, Page Templates, Reusable Components & Feature Architecture Spec
**Platform Goal:** Standardize every layout, component, workflow, and navigation node to construct India’s most responsive and trusted consultation marketplace.  
**System Taxonomy:** Modular, Polymorphic, and SEO-Prioritized  
**Author:** VP of Product, Chief Information Architect, Principal UX Designer & Lead Web Engineer  

---

## 1. WEBSITE INFORMATION ARCHITECTURE (IA)

BeforeRegret’s information architecture is built to eliminate dead-ends, maximize crawlability, and route users efficiently to verified Local Experts. Every single page template serves a dual purpose: ranking for high-intent search terms on Google and converting visitors to paid queries.

```
                                      [Homepage]
                                          │
         ┌───────────────────┬────────────┴────────────┬───────────────────┐
         ▼                   ▼                         ▼                   ▼
   [Geographic Hubs]   [Search Results]        [User Dashboards]     [Editorial Hub]
   - State Index       - Lists & Maps          - Buyer Dashboard     - Moving Guides
   - City Nodes        - Autocomplete          - Expert Dashboard    - Survival FAQs
   - Locality & Pin    - Dynamic Filters       - Wallet & Messages   - Comparisons
   - Society Profile   - Recommendations       - Settings / KYC      - Support Wiki
```

### Navigational Node Taxonomy
- **The Core Shell:** Homepage, Pricing Portal, Become an Expert Onboarding, About, Contact, Terms, Privacy, and Refund Policies.
- **The Directory Hierarchy:** State Index ➔ City Hubs ➔ Locality Clusters ➔ Pincodes ➔ Builder Portfolios ➔ Society & Apartment Profiles.
- **The Search & Match Interface:** Autocomplete Modal, Faceted List View, Active Map Splits, Saved Searches, and Related Locations chips.
- **The Expert Profile Card:** Profile Bio, Verified Badges, Coverage Zones, Trust Score Breakdown, QA History Feed, and Star Review Lists.
- **The Transactional Workspaces:** Buyer Control Panel (Inquiries, Chat), Expert Workstation (Pending tasks, Payout Queue), and Unified Wallet (Ledger, Withdrawals).
- **The SEO & Editorial Engine:** Moving Guides, Locality Comparison Pages, FAQ Schemas, and Reusable Content Modules.
- **The Operational Cockpit:** L1/L2 Support Ticketing, Admin Control Panels, KYC Verification queues, and Moderation interfaces.

---

## 2. STANDARDIZED PAGE TEMPLATE SPECIFICATION METHODOLOGY

Every page template drafted within this document is defined using a standard set of parameters to eliminate operational ambiguity for developers, designers, and systems:

- **Purpose:** The core human problem this template resolves.
- **Primary User:** The target demographic interacting with this layout.
- **Business Goal:** The transactional target metric (e.g., Conversion Rate, Signups).
- **SEO Goal:** Target Google search queries and indexing standards.
- **Primary CTA:** The absolute loudest button or form action on the page.
- **Secondary CTA:** Fallback engagement paths (e.g., saving searches, sharing).
- **Required Data Arrays:** Dynamic database tables required to render the layout.
- **Embedded Components:** Reusable system components required on the screen.
- **Internal Linking:** Direct inbound and outbound links (Zero-Orphan-Policy).
- **Empty & Error States:** Dynamic recovery layouts for null or failed queries.
- **Responsive Adaptations:** Key differences between Desktop and Mobile.
- **Accessibility & Performance:** Focus states, keyboard navigation, and Core Web Vitals targets.

---

## 3. THE HOMEPAGE TEMPLATE

The primary entrance to BeforeRegret is designed to build trust immediately and direct users to our core search interface within seconds.

```
 +-----------------------------------------------------------------------------------+
 |  NAV: [Logo: BeforeRegret]           [Discover]  [Become Expert]  [Sign In]       |
 |-----------------------------------------------------------------------------------|
 |  HERO:   "Don't Move to Your New Home with Regret."                               |
 |          [ Search Bar: Enter Locality, Society, or Pincode... ]                   |
 |          (Trending: HSR Sector 2, Prestige Lakeside, Gachibowli)                  |
 |-----------------------------------------------------------------------------------|
 |  STEPS: How It Works:                                                             |
 |  1. Find Resident Expert ➔ 2. Ask Paid Questions ➔ 3. Relocate with Confidence     |
 |-----------------------------------------------------------------------------------|
 |  TRUST:  "98.4% of relocations verified since launch." (Quotes / Reviews)          |
 |-----------------------------------------------------------------------------------|
 |  FOOTER: Directory Links | Trust & Safety Center | Legal | Help Center            |
 +-----------------------------------------------------------------------------------+
```

### Homepage Page Blueprint

- **Purpose:** Introduce BeforeRegret's unique value proposition and provide an instant path to find local experts.
- **Primary User:** Homebuyers, renters, and families planning a move.
- **Business Goal:** Direct at least 70% of unique visitors to search results or expert profiles.
- **SEO Goal:** Rank for terms like *“Before renting review,” “honest apartment reviews,” “neighborhood feedback India.”*
- **Primary CTA:** Interactive central Search Input Field.
- **Secondary CTA:** **“Become a Local Expert”** button in the header.
- **Required Data Arrays:** 3 trending location nodes, 4 highly rated expert cards, and 3 recent customer reviews.
- **Embedded Components:** `HeaderShell`, `SearchBar`, `ExpertGrid`, `ReviewCarousel`, `FooterShell`.
- **Internal Linking:** 
  - **Inbound:** Canonical home path (`/`).
  - **Outbound:** Links to dynamic city directories, help center, and expert onboarding.
- **Empty & Error States:** If trending data fails to load, render fallback static links for Delhi, Mumbai, and Bengaluru.
- **Responsive Adaptations:**
  - **Desktop:** Features a spacious hero section, horizontal step cards, and full footer menus.
  - **Mobile:** Centered, thumb-friendly search bar, vertical step layout, and collapsable footer menus.
- **Accessibility & Performance:** Uses strict heading levels (H1, H2, H3), sets high-contrast focus states on search elements, and targets an LCP of under $1.0\text{ s}$.

---

## 4. THE SEARCH RESULTS TEMPLATE

Our search results view helps buyers find, filter, and compare verified local experts matching their specific requirements.

```
 +-----------------------------------------------------------------------------------+
 |  SEARCH: [ Prestige Lakeside Habitat              ]  [FILTERS: Budget | Pet | Water]|
 |-----------------------------------------------------------------------------------|
 |  MAP VIEW (Right Panel Split)     |  LIST VIEW (Left Panel)                       |
 |  +-----------------------------+  |  - Rohan S. (6 yrs Resident) [Trust Score: 98]|
 |  | [Pins]                      |  |    "Ask me about Tower C noise & water cards"  |
 |  |                             |  |    Price: ₹199 | SLA: <4h  [Ask Question]    |
 |  |                             |  |  - Sneha P. (3 yrs Resident) [Trust Score: 94]|
 |  +-----------------------------+  |    Price: ₹149 | SLA: <12h [Ask Question]    |
 +-----------------------------------------------------------------------------------+
```

### Search Results Page Blueprint

- **Purpose:** Display matching experts for a searched city, pincode, or society alongside filtering tools.
- **Primary User:** High-intent buyers or renters comparing active local profiles.
- **Business Goal:** Encourage users to progress to checkout and place a paid query (Target $15\%$ conversion).
- **SEO Goal:** Dynamic landing pages targeting *“Local experts in [Locality],” “Verified residents [Society].”*
- **Primary CTA:** **“Ask Question”** button on expert cards.
- **Secondary CTA:** **“Save Locality”** to receive updates.
- **Required Data Arrays:** Matched experts list, active society polygons, filters metadata, and location aliases.
- **Embedded Components:** `FilterBar`, `ExpertListCard`, `InteractiveMapSplit`, `SkeletonListLoader`.
- **Internal Linking:** Links to individual expert profiles and parent locality comparison directories.
- **Empty & Error States:** If zero experts are found, render the **Intellectual Empty State**:
  - Show experts in adjoining pincodes.
  - Display the **"First Resident Expert Bounty"** CTA.
- **Responsive Adaptations:**
  - **Desktop:** Side-by-side split screen with list results on the left and an interactive map on the right.
  - **Mobile:** Single-column list layout with a sticky "Show Map" floating button.
- **Accessibility & Performance:** Ensure map elements can be focused and closed via keyboard, apply lazy loading on off-screen list cards, and target a search response latency of under $200\text{ ms}$.

---

## 5. THE EXPERT PROFILE TEMPLATE

The expert profile page showcases an expert's local credentials, trust badges, and historical reviews to encourage paid transactions.

```
 +-----------------------------------------------------------------------------------+
 |  PROFILE: Rohan Sharma (UID-948193)  [Level 3: Top Local]  [Trust Score: 98/100]  |
 |-----------------------------------------------------------------------------------|
 |  BIO: Living in Prestige Lakeside Habitat for 6 years. Specialized in water,      |
 |       school options, and society community rules.                                |
 |-----------------------------------------------------------------------------------|
 |  TRUST SIGNALS:                                                                   |
 |  [Gold Shield: Certified]  [Lightning: <4h Response]  [Heart: Buyer Favorite]       |
 |-----------------------------------------------------------------------------------|
 |  Q&A FEED: Answers Written (12)    |  REVIEWS: Verified Buyer Ratings (4.9/5)     |
 |  Q: "How is Tower B noise?"        |  "Rohan saved me ₹1.5L in rental deposit!"   |
 |  A: "Read sanitized excerpt..."   |  - Amit K. (Verified Buyer)                  |
 |-----------------------------------------------------------------------------------|
 |  CTA SIDEBAR (Sticky): Ask Rohan a Question | Baseline: ₹199 | [Proceed to Chat]  |
 +-----------------------------------------------------------------------------------+
```

### Expert Profile Page Blueprint

- **Purpose:** Deep dive into an expert’s credentials, expertise, completed answers, and reviews.
- **Primary User:** Decided buyers who want to formulate and send an inquiry.
- **Business Goal:** Convert profile views to checkout purchases (Target $25\%$).
- **SEO Goal:** Programmatic indexable profiles (e.g., `/expert/rohan-sharma-whitefield`).
- **Primary CTA:** **“Ask Rohan a Question”** checkout card.
- **Secondary CTA:** **“Save Expert”** bookmark button.
- **Required Data Arrays:** Expert metadata, trust score history, badges, completed QA snippets, and customer reviews.
- **Embedded Components:** `ExpertHeader`, `BadgeRack`, `Q&AFeed`, `ReviewList`, `StickyPaymentCard`.
- **Internal Linking:** Outbound links back to covered society pages and locality comparison hubs.
- **Empty State:** If an expert has no reviews yet, feature their verified resident coordinates and show a welcome discount badge.
- **Responsive Adaptations:**
  - **Desktop:** Two-column split layout with content on the left and a sticky, floating CTA sidebar on the right.
  - **Mobile:** Single-column stack with a sticky, full-width CTA bar at the bottom of the screen.
- **Accessibility & Performance:** Set `aria-labels` on visual badges, keep typography highly readable, and target a Largest Contentful Paint of under $500\text{ ms}$.

---

## 6. MULTI-LEVEL LOCATION DIRECTORY PAGES

Location pages serve as our primary SEO landing hubs. They crawl, index, and organize geographical hierarchies to capture local real estate queries on Google.

```
 State Hub Page ➔ City Index Page ➔ Locality Cluster ➔ Pincode Hub ➔ Society Profile Page
```

### Template Directory Specs

#### 1. State / City Directory Template
- **Purpose:** Aggregates and displays active neighborhoods and cities within a state.
- **Content Blocks:** List of active cities, total registered experts, trending localities, and general moving FAQs.
- **SEO Strategy:** Targets broad geographical terms (e.g., *“Moving to Karnataka guides,” “Bengaluru neighborhood directory”*).
- **Primary CTA:** Search bar focused on the target city or state.

#### 2. Locality / Pincode Template
- **Purpose:** Showcases societies, builders, and active local experts within a specific neighborhood.
- **Content Blocks:** Breadcrumbs, map boundaries, top-rated local experts, listed societies, and local amenities guides.
- **SEO Strategy:** Targets neighborhood queries (e.g., *“Best societies in HSR Sector 2,” “HSR Layout 560102 reviews”*).
- **Primary CTA:** **“Find an Expert”** search filter block.

#### 3. Society / Apartment Template (The Core Conversion Hub)
- **Purpose:** Deep-dive into a specific residential housing project.
- **Content Blocks:** Builder details, resident rating summaries, a grid of active verified experts, local FAQs (Water, Noise, Safety), and comparison cards.
- **SEO Strategy:** Targets exact project searches (e.g., *“Prestige Lakeside Habitat honest review,” “DLF Phase 3 issues”*).
- **Primary CTA:** **“Match with Resident Expert”** grid.

---

## 7. THE BUYER CONTROL PANEL (DASHBOARD)

Provides buyers with a centralized, secure interface to track active questions, converse with experts, and manage transaction receipts.

```
 +-----------------------------------------------------------------------------------+
 |  DASHBOARD: Overview  |  My Questions (2)  |  Saved (4)  |  Payments  |  Settings |
 |-----------------------------------------------------------------------------------|
 |  ACTIVE INQUIRIES:                                                                |
 |  [HSR Layout Q-8491] ➔ Expert: Rohan Sharma ➔ Status: [Answer Delivered] [Review] |
 |-----------------------------------------------------------------------------------|
 |  MESSAGES: Chat Sandbox                                                           |
 |  - Rohan: "The water pressure in Tower C is fine, but make sure to..."             |
 |  [Ask Follow-up Question]  [Accept & Release Escrow]  [File Dispute]              |
 +-----------------------------------------------------------------------------------+
```

### Buyer Dashboard Page Specifications

- **Purpose:** Manage active queries, chat with experts, review delivered answers, and access payment history.
- **Primary User:** Registered buyers monitoring their active neighborhood investigations.
- **Business Goal:** Encourage positive transaction closures, repeat purchases, and system referrals.
- **SEO Goal:** Gated dashboard environment (Set to `noindex, nofollow` to protect privacy).
- **Primary CTA:** **“Review Answer & Release Escrow”** task bar.
- **Secondary CTA:** **“Ask Follow-up Question”** in chat.
- **Required Data Arrays:** Active queries, message logs, saved experts, invoice receipts, and referral codes.
- **Embedded Components:** `DashboardNav`, `QueryProgressLine`, `MessageWindow`, `InvoicesTable`.
- **Empty State:** If a user has asked no questions, show empty-state guides: *“Planning a move? Explore HSR Layout experts to get started.”*
- **Responsive Adaptations:**
  - **Desktop:** Sidebar navigation with detailed tab views.
  - **Mobile:** Bottom tab bar navigation with streamlined list cards.

---

## 8. THE EXPERT WORKSTATION (DASHBOARD)

Gives local resident experts a streamlined workspace to manage pending questions, track their trust score, handle KYC updates, and monitor wallet balances.

```
 +-----------------------------------------------------------------------------------+
 |  EXPERT HUB: [ Wallet: Available ₹2,450 | Pending ₹1,200 ]  [Trust Score: 96]     |
 |-----------------------------------------------------------------------------------|
 |  TASKS:                                                                           |
 |  [NEW INQUIRY] Q: "Is Tower B3 noisy?" ➔ SLA: 18h Left ➔ [Accept & Answer]         |
 |-----------------------------------------------------------------------------------|
 |  KYC ALERTS:                                                                      |
 |  [!] "Verify your resident GPS coordinates to unlock Level 2 bonuses."           |
 +-----------------------------------------------------------------------------------+
```

### Expert Workstation Page Specifications

- **Purpose:** Track pending questions, write answers, monitor earnings, and verify identity.
- **Primary User:** Registered local experts managing their consulting tasks.
- **Business Goal:** Maintain low response times (SLA < 8 hours) and resolve queries cleanly.
- **SEO Goal:** Secure interface (`noindex, nofollow`).
- **Primary CTA:** **“Accept & Answer”** button on pending inquiries.
- **Secondary CTA:** **“Verify Resident GPS”** coordinate checks.
- **Required Data Arrays:** Pending queries list, active transaction history, KYC status, wallet balance, and user reviews.
- **Embedded Components:** `EarningsChart`, `PendingTaskCard`, `KYCUploadWizard`, `ReviewsAnalyticsFeed`.
- **Empty State:** If an expert has no pending questions, show tips on improving their bio or expanding their coverage pincodes.

---

## 9. THE SYSTEM WALLET & DISBURSEMENT CONSOLE

Handles escrow releases, pending balances, withdrawable balances, and historical ledgers for both buyers and experts.

- **Withdrawable Balance Calculation:** Reassures experts by showing clear balance breakdowns:
  $$\text{Available Balance} = \text{Cleared Transaction Earnings} - \text{Processed Withdrawals} - \text{Active Disputes}$$
- **Interactive Transaction Ledger:** A tabular list showing date, description, order reference number, type (Credit/Debit), amount (INR), and status (Held, Available, Settled).
- **Disbursement Request Module:** A simple form to input bank routing details or UPI IDs (`amitk@okaxis`), with validation to ensure the withdrawal name matches verified KYC records.

---

## 10. REAL-TIME ASYNCHRONOUS CHAT INTERFACE

Allows buyers and experts to communicate securely, ask follow-up questions, and send location photos without exposing personal contact details.

- **Asynchronous Chat Sandbox:** Displays message threads with delivery logs, read receipts, and status indicators.
- **Transaction Protection Warning:** If a user types off-platform terms (e.g., *"Call me at 9845..."*), the system displays a clear warning: *“To keep your payment protected by our escrow satisfaction guarantee, please communicate inside BeforeRegret.”*
- **Media Upload Manager:** Supports drag-and-drop file uploads for photos, cleaning EXIF metadata and checking files for malware automatically.

---

## 11. CENTRALIZED NOTIFICATIONS PANEL

Ensures users receive critical transactional and security alerts without experiencing notification fatigue.

- **Notification Center:** A centralized feed displaying transactional updates (e.g., *“Rohan responded to your question!”*), trust reminders, and referral credits.
- **Communication Controls:** A preferences dashboard allowing users to toggle notifications across WhatsApp, SMS, Email, and Push channels.
- **Critical Action Alerts:** System bypasses general mute controls for high-priority events (such as payout confirmations or dispute escalations).

---

## 12. PASSWORDLESS SECURE AUTHENTICATION FLOWS

Provides an easy, secure login process that minimizes onboarding friction for both buyers and experts.

```
 [Focus Login] ➔ [Enter Mobile / Email] ➔ [Send Verification Token] ➔ [Redirect to Dashboard]
```

- **Clean Entry Portal:** A lightweight, centered modal with options for mobile phone or social logins.
- **OTP Verification Screen:** A clean, 6-digit input screen with a 60-second countdown timer and an option to resend the code if delayed.
- **Welcome Onboarding Checklist:** Prompts new users to set their primary relocation city or resident pincode, helping customize their immediate search experience.

---

## 13. CENTRALIZED HELP & SUPPORT CONSOLE

A central help center designed to resolve customer issues quickly, manage disputes, and maintain platform trust.

- **Dynamic Help Base:** A searchable directory of guides, common billing FAQs, and user guidelines.
- **Integrated Ticket Submission:** A simple contact form allowing users to submit support tickets, with automated category routing (e.g., *“Razorpay payment stuck”* is routed directly to finance queues).
- **Dispute Escalation Form:** Allows buyers to pause escrow payouts and file a formal dispute, requiring them to submit details on how the expert's answer failed to meet agreed quality standards.

---

## 14. THE BEFOREREGRET TRUST & SAFETY HUB

A public-facing portal explaining our marketplace guidelines, verification standards, escrow safety, and dispute resolution rules.

- **Verification Standards Page:** Explains how we verify residents through Aadhaar cards, rental agreements, and GPS coordinates checks.
- **Escrow Safety Blueprint:** Demystifies our payout process, reassuring buyers that payments are safely held in escrow until they approve the delivered answer.
- **Marketplace Guidelines Checklist:** A simple, high-contrast list of our community rules, outlining expectations for respectful behavior, factual accuracy, and privacy protection.

---

## 15. ADMINISTRATIVE CONTROL PANELS (AOS)

Equips operations, support, and finance teams with the tools required to run the marketplace efficiently.

- **Operations Dashboard:** A high-level overview of active transactions, revenue metrics, SLA compliance, and system alerts.
- **KYC Verification Queue:** A split-screen interface displaying uploaded identity cards alongside OCR data extractions and manual approval controls.
- **Dispute Resolution Console:** Side-by-side screens showing the buyer's query, the expert's delivered answer, and full message logs to help support agents resolve disputes fairly.

---

## 16. THE SYSTEM REUSABLE COMPONENT DIRECTORY

To maintain layout consistency, clean code, and fast performance, BeforeRegret uses a centralized library of reusable Tailwind UI components.

### Core Reusable UI Components

#### 1. ButtonComponent (`id="btn-core"`)
- **Properties:** Variant (Primary, Secondary, Danger), Size (Small, Medium, Large), State (Default, Hover, Loading, Disabled).
- **Aesthetic Pairings:** Deep slate solids, border transitions, and subtle hover animations.

#### 2. ExpertListCard (`id="card-expert"`)
- **Properties:** Expert avatar, Name, Level badge, Resident tenure, Specialty tags, Trust score indicator, Base price (INR), Primary action CTA button.
- **Visual Style:** High-contrast border, spacious margins, and subtle shadow-on-hover effects.

#### 3. VerificationBadge (`id="badge-verified"`)
- **Properties:** Type (GPS coordinates, ID verified, Buyer favorite, Fast responder).
- **Visual Style:** Elegant vector graphics with solid gold, indigo, or rose accents.

#### 4. FilterDropdown (`id="filter-dropdown"`)
- **Properties:** Category (Price, Language, Pets, Tenure), Options list, Selection state (Single, Multi).
- **Aesthetic Pairings:** Clean slate dropdown containers with transition fade effects.

#### 5. SearchInput (`id="search-input-core"`)
- **Properties:** Placeholder text, Auto-suggest items, Focus events, Clear controls.
- **Visual Style:** Centered display layout with clean typography.

---

## 17. SYSTEM COMPREHENSIVE FEATURE INVENTORY

Our feature set is prioritized into core operational launch layers, advanced expansion features, and long-term future scaling modules:

### Core Launch Features (Phase 1)
- **Fuzzy Location Search:** typo-tolerant searches across cities, pincodes, and societies using database trigram lookups.
- **Escrow Accounting Engine:** Integrates with Razorpay to accept payments, hold funds in escrow, and automate payouts once queries are approved.
- **Asynchronous Q&A Boards:** Simple messaging boards allowing buyers to ask questions, and matched experts to deliver answers and attachments.
- **Aadhaar Identity OCR Checks:** Seamless identity validation using automated OCR on Aadhaar uploads.

### Advanced Quality Features (Phase 2)
- **Faceted Search Filters:** Advanced filtering options allowing users to refine experts by spoken language, resident tenure, price range, and household specialty tags.
- **GPS Verification Polygons:** Real-time mobile GPS validation comparing user coordinates with society boundaries.
- **Double-Blind Reviews:** Encourages honest feedback by allowing experts to view ratings only after submitting their own responses or after a 48-hour window.
- **Automation Rules Engine:** Automates system events (such as auto-canceling unanswered questions or auto-awarding Fast Responder badges).

### Long-Term AI Features (Phase 3)
- **AI-Powered Semantic Searches:** Matches natural language queries (e.g., *"quiet neighborhood in Pune with good schools"*) to database nodes using semantic vectors.
- **Automated Comparison Grids:** Generates real-time comparison tables between neighborhoods using aggregated resident feedback.
- **Dynamic Relocation Checklists:** Personalized relocation timelines that suggest local experts based on the buyer's moving stage.

---

## 18. PERMANENT INTERNAL LINKING ARCHITECTURE

To ensure search engine indexing and simple user navigation, the platform enforces a strict **Zero-Orphan-Page Policy**. Every page template must link back to parent and adjoining directories.

```
                  [State Index Page] (Links to all cities)
                           │
                           ▼
                 [City Hub Directory] (Links to localities)
                           │
                           ▼
                 [Locality / Pincode Hub] (Links to societies)
                           │
                           ▼
                 [Society Profile Page] (Links to experts & comparisons)
```

### Navigational Mappings
- **The Global Header & Footer:** Pinned on all public pages, linking to the Homepage, City Directories, Help Center, Become an Expert Onboarding, and Trust Hubs.
- **Canonical Location Breadcrumbs:** Dynamic breadcrumb paths are featured on all geographical landing pages:
  `Home ➔ Karnataka ➔ Bengaluru ➔ Whitefield ➔ 560066 ➔ Prestige Lakeside Habitat`
- **Related Locality Comparison Links:** Every society profile page displays dynamic linking chips pointing to nearby residential alternatives (e.g., *“Compare Prestige Lakeside Habitat vs Prestige Shantiniketan side-by-side”*), maximizing internal link coverage.

---

## 19. CATEGORY-AGNOSTIC BLUEPRINT STRATEGY

To ensure BeforeRegret can expand beyond neighborhood reviews into other consulting categories (e.g., *Jobs, Cars, Education, Healthcare, Travel*) without a frontend rewrite, every component and page template is abstractly defined.

```
                              [Unified AppShell]
                                      │
                                      ▼
                       [Core Generic Profile Template]
                                      │
                                      ▼
                         [Polymorphic Layout Render]
       ┌───────────────────┬───────────┴───────────┬───────────────────┐
       ▼                   ▼                       ▼                   ▼
 [Neighborhoods]      [Used Cars]               [Jobs]            [Education]
 - Locality ID        - Car VIN                 - Company ID      - College ID
 - Society Profile    - Model Details           - Company Profile - School Profile
```

- **Polymorphic Layout Engines:** Component schemas are dynamic. The `Location Card` component renders local housing details in the neighborhood vertical, but seamlessly adapts to display Make & Model details in the **Used Cars** vertical or Company attributes in the **Jobs** vertical.
- **Consistent Page Hierarchies:** The structures of our checkout flows, dashboard grids, support wikis, and wallet systems remain identical across categories, allowing BeforeRegret to scale with minimal development overhead.
- **Reusable Directory Architecture:** Programmatic SEO landing page generators treat geographic levels as abstract taxonomy nodes. When expanding, we simply swap geographical parameters for professional or industry taxonomies, allowing the platform to scale into new markets instantly.
