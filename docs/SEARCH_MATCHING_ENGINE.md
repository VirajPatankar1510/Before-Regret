# NEIGHBOR REVIEWS (BEFORE REGRET)
## Master Search, Discovery & Expert Matching Engine Spec
**Niche Focus:** Neighborhoods & Locality Intelligence (India)  
**Target SLAs:** Autocomplete <100ms, Full Index Search <300ms  
**Author:** Principal Search Architect, Discovery PM, Data Architect & UX Researcher  

---

## 1. THE SEARCH & DISCOVERY PHILOSOPHY

Moving, renting, or purchasing property ranks among the top three most stressful life events. When users arrive at BeforeRegret, they do not want to navigate complex directories or write elaborate search syntax. The search interface must act as a predictive, intelligent mind-reader. It must anticipate intent, suggest locations before typing finishes, and match the absolute best, most relevant Local Expert based on fine-grained geographic parameters.

### Operational Principles
1. **Zero-Empty-State Intent:** No search should ever end in a dead end. If an exact society is empty, suggest adjacent blocks, pincodes, or areas within a 1km radius immediately.
2. **Minimal Text Entry:** Over 80% of searches in India are executed on mobile screens. We aim for 1-click discovery using dynamic autocomplete chips, location tags, and trending search suggestions.
3. **Intent-driven Routing:** If a user types a society name, bypass generic area hubs and route them directly to the target apartment project profile page to accelerate purchase conversion.
4. **Data Freshness and Performance First:** Autocomplete responses must deliver under 100ms. If search feels sluggish, users lose confidence in the transactional integrity of the marketplace.

---

## 2. MULTI-DIMENSIONAL GEOGRAPHIC SEARCH ARCHITECTURE

The search index supports hierarchical geographical taxonomies alongside fluid physical landmarks. The matching engine parses the text input and segments it into the following index buckets:

```
                          [USER STRING INPUT]
                                   │
                                   ▼
                       [Intent Categorization]
                                   │
         ┌───────────────┬─────────┴─────────┬───────────────┐
         ▼               ▼                   ▼               ▼
    [Geographic]    [Structural]       [Institutional]  [Postal Code]
    - City          - Society          - Builder        - Pincode
    - Locality/Area - Apartment        - Landmark       - Sector / Ward
```

### Supported Tokenized Fields
- **City:** Primary geographical boundary (e.g., *“Pune”*, *“Bengaluru”*, *“Delhi-NCR”*).
- **Locality / Area:** Broad neighborhood clusters (e.g., *“Koramangala”*, *“Baner”*, *“Indiranagar”*).
- **Pincode / Postal Code:** Highly structured Indian index matching (e.g., *“560034”*, *“411045”*).
- **Builder:** Developer entity cataloging construction reputations (e.g., *“DLF”*, *“Prestige Group”*, *“Brigade”*).
- **Society / Apartment Project:** The granular housing complex or township (e.g., *“Prestige Lakeside Habitat”*, *“DLF Phase 3”*).

---

## 3. THE EXPERT SEARCH RANKING ALGORITHM (ESRA)

When a buyer searches for a location, the matching engine runs a mathematical scoring algorithm to sort and prioritize the displayed Local Experts.

### Scoring Formula

The matching engine calculates the final **Expert Match Score (EMS)** for each expert $i$ relative to the query location $L$:

$$\text{EMS}_i = (S_{\text{geo}} \times 0.35) + (R_i \times 0.25) + (C_i \times 0.15) + (F_i \times 0.15) + (T_i \times 0.10)$$

Where:

| Component | Metric Name | Score Weight | Description / Calculation |
| :--- | :--- | :--- | :--- |
| $S_{\text{geo}}$ | **Geographic Match Score** | **35%** | Direct match accuracy: Exact Society Match = 100 pts; Adjoining Pincode Match = 60 pts; General Locality Match = 40 pts; General City Match = 10 pts. |
| $R_i$ | **Average User Rating** | **25%** | Normalized average rating (1.0 to 5.0 scaled to a 0–100 range). |
| $C_i$ | **Response Rate & SLA** | **15%** | Percentage of queries answered within 24 hours. Points scale linearly from 0 (fails SLAs) to 100 (answers in <4 hours). |
| $F_i$ | **Expert Activity Freshness**| **15%** | Days since last answered query. Formula: $100 \times \max(0, 1 - \frac{\text{days\_since}}{30})$. Ensures active experts dominate rankings. |
| $T_i$ | **Transaction Density** | **10%** | Combined volume of historically completed queries and count of repeat buyers. |

---

## 4. AUTOCOMPLETE & PREDICTIVE SUGGESTIONS

The autocomplete engine launches on first focus, long before the user types their first character.

```
 +-------------------------------------------------------+
 | Search: Pres|                                         |
 |-------------------------------------------------------|
 | [Icon: Map] Prestige Lakeside Habitat, Whitefield     |
 | [Icon: Map] Prestige Shantiniketan, ITPL Road         |
 | [Icon: User] Rohan Sharma (Whitefield Expert)         |
 | [Icon: Builder] Prestige Group (Active Projects: 12)  |
 |-------------------------------------------------------|
 | Recent Searches:                                      |
 | - Indiranagar, 560038                                 |
 | - HSR Sector 2                                        |
 +-------------------------------------------------------+
```

### Autocomplete State Machine
1. **Focus State (0 Characters entered):** Displays user's **Recent Searches** (saved locally in browser storage) alongside 3 **Trending Locations** (cached server-side from popular transaction volumes).
2. **Input State (1–2 Characters entered):** Enforces a 50ms keystroke debounce. Matches against broad indexing terms (e.g., "Pr" matches "Prestige Group", "Pune").
3. **Refined State (3+ Characters entered):** Performs fuzzy geographic match. Returns structured results segmented by type: Locality, Society, Pincode, and direct Experts.

---

## 5. FACETED NAVIGATION & SEARCH FILTERS

Faceted navigation enables high-intent buyers to drill down to the exact expert matching their personal demographics or specific household needs.

```
 +-----------------------------------------------------------------------------------+
 | FILTERS: [ Budget (₹99 - ₹499) ]   [ Rating: 4.5+ ]   [ Tenure: 3+ Years Resident ]|
 |          [ Family-Focused ]       [ Pet Friendly ]   [ Speaks: Kannada / English ]|
 +-----------------------------------------------------------------------------------+
```

### Core Marketplace Filters
- **Residence Tenure:** Filter experts by years lived in the target locality (e.g., *“1-3 Years”*, *“3-5 Years”*, *“5+ Years”*). High-tenure experts command premium trust.
- **Consultation Budget (INR):** Price bracket slider to identify experts fitting specific ranges (e.g., ₹99 to ₹499).
- **Core Specialization Tags:**
  - **Family & Kids:** Experts who can advise on nearby schools, parks, and safety.
  - **Pet Owners:** Residents who know if societies are pet-friendly, have dog parks, or restrict pets.
  - **Remote Workers:** Experts who know about power back-up stability and local broadband options.
  - **Tenant Specialist:** Homeowners or renters who understand landlord dynamics and deposit returns.
- **Language Proficiency:** Filter by spoken languages to ensure fluid communication (e.g., English, Hindi, Kannada, Tamil, Marathi, Telugu).

---

## 6. DYNAMIC RECOMENDATION ENGINE & DISCOVERY MODES

For users who aren't searching for a specific apartment project, the homepage and category nodes showcase horizontal discovery clusters:

```
  [Discovery Clusters] ──> [Recommended Experts] ──> [Related Localities] ──> [Similar Projects]
```

### 1. Trending Neighborhoods
- Highlights Indian neighborhoods experiencing rapid real estate inquiries (e.g., *“Most Searched: Gachibowli (Hyderabad), Baner (Pune)”*).

### 2. Best for Remote Workers
- Automatically curates and displays Local Experts in societies with documented 100% power backup ratings and dual-broadband fiber providers.

### 3. Highly Active Local Experts
- Promotes experts who have completed 5+ queries in the last 48 hours with a perfect 5-star feedback rating.

### 4. Direct Comparison Recommendations
- Suggests direct comparisons to help users decide between competing sectors: *“Undecided? Compare Indiranagar vs Koramangala side-by-side.”*

---

## 7. INTELLECTUAL EMPTY-STATE RECOVERY

No search query should ever return a dead-end "No Results Found" message. If a location has zero experts, the engine executes the following recovery chain:

```
   [Exact Match: 0 Results]
              │
              ▼
    [Attempt 1: Pincode Expansion] (Find experts within same pin)
              │
              ▼
    [Attempt 2: Locality Radius Search] (Find experts within 2km)
              │
              ▼
    [Attempt 3: Request New Resident Expert Form]
```

### Error Recovery UX Specs
- **Dynamic Pincode Match:** *“We don’t have an expert in Prestige Shantiniketan yet, but we found 3 verified residents living in the same pincode (560066) who can answer your questions.”*
- **The "First Expert" Bounty:** *“Are you a resident of [Searched Locality]? Register as our first neighborhood expert here and keep 100% of your earnings for your first 5 queries!”*
- **SLA Alert Notification:** If a user requests an expert for an empty area, they enter their email. The system triggers a programmatic alert to the community marketing team to acquire a resident expert in that pincode within 48 hours.

---

## 8. BACKEND SEARCH PERFORMANCE & SCALABILITY SPEC

### Indexes and Schemas
- Geographic databases use PostgreSQL with **PostGIS extensions** to support indexing of spatial coordinates, boundary shapes, and radius distance queries.
- Autocomplete strings are cached inside **Redis sorted sets** to support prefix search speeds under 50ms.

### Index Pruning & Invalidation
- The matching engine recalculates and prunes inactive expert profiles (no logins or responses in 60 days) to prevent stale profiles from cluttering active search results.
- Rating changes and response times trigger immediate incremental scoring updates on the active search indexes.

---

## 9. FUTURE AI-NATURAL LANGUAGE MATCHING ASSISTANT

The database schema and search API are designed to support transition to semantic, AI-grounded vector search:

```
 User Input: "I want a safe, quiet society in Pune with good water for my elderly parents."
                                     │
                                     ▼
                [Semantic Embedding Generator (Gemini-3.5-Flash)]
                                     │
                                     ▼
           Matches against expert bios, local ratings, and resident answers.
```

### Structural Grounding Specs
- **Semantic Mapping:** Expert bios and public answered queries are tokenized into high-density vector databases.
- **Predictive Matching:** The assistant can translate vague queries (e.g., *“not noisy”*) into exact technical metadata criteria (e.g., *“Noise level: Low, distance to highway: >500 meters”*) and recommend exact matching resident profiles.
- **Privacy Layer:** Prior to passing data to AI models, all private buyer names, phone numbers, and payment details are stripped to ensure absolute privacy compliance.
