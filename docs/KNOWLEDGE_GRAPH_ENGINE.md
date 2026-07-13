# BEFORE REGRET (NEIGHBOR REVIEWS)
## Master Knowledge Graph, Decision Intelligence & Platform Memory Spec
**Platform Core Goal:** Turn peer-to-peer conversations into a structured, compounding semantic asset.  
**Platform Architecture:** Graph-Relational Hybrid (Entity-Attribute-Value Metadata Graph)  
**Author:** Chief Knowledge Officer, Principal Ontologist, Lead Data Scientist & Search Engineer  

---

## 1. STRATEGIC KNOWLEDGE GRAPH PHILOSOPHY

Most marketplaces operate as transactional silos—storing messages, reviews, and questions as isolated, flat rows in standard databases. Once a conversation is resolved, its semantic value remains dormant.

BeforeRegret rejects this flat-data approach. We treat every customer interaction, resident response, and geographical review as a **dynamic, interconnecting node** inside a unified **Locality Knowledge Graph**. 

```
 [Raw Resident Answer] ──(Natural Language Parsing)──> [Extracted Semantic Triplets]
                                                                  │
                                                                  ▼
 [Dynamic Comparison Page] <── (Context Mesh) ── [Topical Knowledge Graph Update]
```

### Strategic Axioms
1. **Knowledge Compounds Continuously:** Each new question-and-answer pair enriches the metadata of its associated society, builder, and pincode, turning individual transactional chats into collective local intelligence.
2. **Relationships Define Relevance:** A location is defined not just by coordinates, but by its connection to transit times, water safety, developer reputation, and local experts.
3. **Graceful Decay & Freshness Curves:** Local knowledge decays over time (e.g., a water pipe leak is repaired; a new metro station opens). The graph must automatically deprecate old data nodes and favor fresh resident logs.
4. **Complete Privacy Anonymization:** Data patterns are harvested programmatically while completely scrubbing personally identifiable information (PII) to preserve user anonymity.

---

## 2. THE GEOGRAPHIC & MARKETPLACE ENTITY SCHEMA

Our core database schema is mapped as an entity-relationship graph. Nodes represent concrete resources, while edges define real-world semantic relationships.

```
  [Builder] ──(DEVELOPED)──> [Society] ──(LOCATED_IN)──> [Locality/Area] ──(PART_OF)──> [City]
                                 ▲
                                 │
                            (REFERS_TO)
                                 │
                             [Question] <──(ANSWERS)── [Expert] ──(COVERS)──> [Pincode]
```

### Core Graph Nodes

#### 1. Geographic Nodes
- **`State`:** Broad geo-taxonomic boundary (e.g., *“Karnataka”*).
- **`City`:** Urban center containing neighborhoods (e.g., *“Pune”*, *“Bengaluru”*).
- **`Locality` / `Area`:** Sub-divisions within a city (e.g., *“Baner”*, *“HSR Layout”*).
- **`Pincode`:** Official postal boundaries mapping postal divisions (e.g., *“560102”*).
- **`Society` / `Project`:** Modern high-density residential housing complexes or communities (e.g., *“Prestige Lakeside Habitat”*).
- **`Tower` / `Block`:** Specific micro-structures within a society that face distinct local challenges (e.g., *“Tower B3 faces noise from the main bypass road”*).
- **`Landmark`:** Public transit hubs, tech parks, hospitals, or lakes impacting quality of life.

#### 2. Marketplace & Transactional Nodes
- **`User`:** The general customer profile (can toggle roles).
- **`Local Expert`:** A verified resident profile linked to designated covered pincodes and societies.
- **`Question`:** Structured customer inquiry containing textual questions, selected package details, and geographical target tags.
- **`Answer`:** Textual resident expert responses containing structural descriptions, media attachments, and local insights.
- **`Topic` / `Taxonomy`:** The semantic categorization layer (e.g., *“Water”*, *“Noise”*, *“Transit”*).
- **`Review`:** Verified buyer feedback containing star ratings, text comments, and private quality feedback scores.

---

## 3. SEMANTIC RELATIONSHIP (EDGE) MATRIX

Edges connect disparate nodes with distinct directionality and strength parameters to drive precision recommendations and search results.

| Source Node | Edge Label | Target Node | Edge Properties / Description |
| :--- | :--- | :--- | :--- |
| `Society` | `LOCATED_IN` | `Locality` | Spatial containment mapping. |
| `Locality` | `HAS_PINCODE` | `Pincode` | Postal routing relationship. |
| `Society` | `DEVELOPED_BY` | `Builder` | Tracks developer quality across projects. |
| `Local Expert`| `COVERS` | `Pincode` | Operating zone boundary. |
| `Local Expert`| `RESIDES_IN` | `Society` | Establishes top-tier residential authority. |
| `Question` | `REFERENCES` | `Society` | Associates customer worries with exact coordinates. |
| `Answer` | `RESOLVES` | `Question` | Connects delivered advice to its source query. |
| `Question` | `CATEGORIZED_AS`| `Topic` | Taxonomic linking for filtering and SEO directories. |
| `Society` | `ADJACENT_TO` | `Landmark` | Proximity mapping (e.g., distance to tech park). |

---

## 4. SYSTEM TOPIC TAXONOMY (THE ONTOLOGY)

We organize locality challenges into a strict parent-child structural taxonomy. This ensures users can filter local issues with precision, while the system routes questions to the correct expert profiles automatically.

```
 [Locality Quality-of-Life (QoL)]
   ├── [Infrastructure]
   │     ├── [Water Supply] (Municipal vs Borewell vs Tankers)
   │     ├── [Power Back-Up] (Grid stability, generator capacities)
   │     └── [Waste & Sewage] (Drainage, organic waste converters)
   ├── [Safety & Security]
   │     ├── [Night Lighting] (Streetlight coverage)
   │     ├── [Guard Presence] (Society gate security audits)
   │     └── [Crime & Street Safety] (Waterlogging, stray dogs)
   ├── [Transit & Connectivity]
   │     ├── [Traffic Jam Points] (Rush-hour bottlenecks)
   │     ├── [Public Transport] (Proximity to metro stations/bus stops)
   │     └── [Broadband Fiber] (Airtel vs Jio fiber availability)
   └── [Community & Living]
         ├── [Pet Friendliness] (Dog parks, leash rules)
         ├── [Noise Pollution] (Highway echo, construction sites)
         └── [Landlord Habits] (Rental deposit returns, maintenance costs)
```

---

## 5. INTELLIGENT AUTO-TAGGING ENGINE

When an expert writes an answer or a buyer drafts a question, the platform runs a semantic processing pipeline to automatically tag the transaction and assign relevant nodes.

```
 [Raw User Input] ──> [Fuzzy Keyword Match] ──> [Synonym Mapping Group]
                                                           │
                                                           ▼
 [Inject Node Tag] <── [Verify Local Context Check] <──────┘
```

### Tagging Processing Pipeline
1. **Fuzzy Phrase Recognition:** Identifies local synonyms (e.g., *“tanker charges”*, *“kaveri water”*, *“borewell dried”* are grouped under the parent category `Infrastructure -> Water Supply`).
2. **Context-Aware Geographic Extraction:** If an answer says: *“Tower C faces the railway line,”* the system automatically adds a dynamic link tag: `Tower: Block C` ➔ `Related Issue: Rail Noise`.
3. **Tag Governance Controls:** To prevent spelling clutter (e.g., "wtar", "waterr"), manual tag creation is restricted. If a user enters a custom tag, it enters a `PENDING_REVIEW` queue in the CMS. Moderators can approve, delete, or merge it with an existing taxonomy node.

---

## 6. DECISION INTELLIGENCE & PATTERN EXTRACTION

By analyzing thousands of questions and answers, BeforeRegret identifies and surfaces recurring local patterns to protect users before they buy or rent.

```
 Analyze Q&A Logs ➔ Spot Pattern: "Water shortage in Block B" ➔ Surface Alarm on Checkout
```

- **Recurring Local Issue Extraction:** If three distinct resident answers for a society mention *“borewell failure in March”*, the system extracts this pattern and appends a warning tag to the society profile page: *“Water Supply: Frequent shortages documented in summer months.”*
- **Comparative Rating Indicators:** Evaluates ratings across a builder's various projects to calculate a **Builder Quality Index**. This helps buyers decide: *“Prestige projects in East Bangalore average a 4.8 rating, while West Bangalore projects average 4.2.”*
- **SLA Optimizations:** The system detects patterns in question completions to determine the best delivery times. For example, if questions about local schools are routed to experts who are parents on weekends, response rates increase by 30%.

---

## 7. MULTI-DIMENSIONAL QUESTION CLASSIFICATION

When a buyer submits a question, the classification engine parses the text and assigns several operational attributes before routing it:

```
  [Raw Input text] ➔ [Topic: Renting] ➔ [Intent: Contract Verify] ➔ [SLA Routing Path]
```

- **Primary Topic Target:** Identifies the core concern (e.g., *“How noisy is the construction nearby?”* is mapped to `Transit & Connectivity -> Noise Pollution`).
- **Buyer Intent Category:**
  - `EVALUATIVE`: Deciding whether to rent or purchase a home.
  - `LOGISTICAL`: Planning move-in dates, parking clearances, and local internet options.
  - `ADMINISTRATIVE`: Confirming landlord policies, society maintenance costs, and gate passes.
- **Target Audience Demographics:** Identifies who the advice is for (e.g., family with kids, bachelor student, pet owner, remote worker).
- **Urgency Threshold Score:** Evaluates if the buyer is signing a lease within 24 hours. High-urgency questions are automatically upgraded to priority queues to trigger immediate expert response alerts.

---

## 8. EXPERT EXPERTISE MAPPING MATRIX

The platform creates a detailed, dynamic profile of every local expert based on their actual contribution records.

- **Primary Coverage Polygon:** The geographic bounds (pincodes and specific societies) where the expert’s coordinates are validated.
- **Topical Domain Authority:** Calculated as:
  $$\text{Domain Authority}_{\text{Topic}} = \text{Completed Answers}_{\text{Topic}} \times \text{Average Buyer Rating}_{\text{Topic}}$$
  An expert who has answered 20 questions about *Local Schools* with a 4.9 rating becomes the designated authority for school inquiries in that locality, gaining higher search visibility for related queries.
- **Reliability Metric Log:** Tracks their consistency over time (e.g., *“98% SLA compliance, average response time is under 2.4 hours, zero open disputes”*).

---

## 9. SEARCH INTELLIGENCE & AUTOCOMPLETE INTEGRATION

Structured knowledge maps make our search engine fast, predictive, and intelligent.

- **Fuzzy Autocomplete Redirection:** If a user searches for a broad topic (e.g., *“Noisy roads in Pune”*), the autocomplete engine bypasses generic city lists and displays relevant local societies facing noise challenges (e.g., *“Societies near Highway bypass: Wakad, Baner”*).
- **Dynamic Related Searches:** If a user views *“HSR Sector 2”*, the search bar dynamically suggests related local hubs: *“Compare Sector 2 vs Sector 3”* or *“Top Rated Experts in HSR Sector 2.”*
- **Link Equity Flow:** Each structured Q&A pair automatically generates an indexable canonical URL page with rich structured schema markup, boosting SEO and crawlability without creating duplicate pages.

---

## 10. REAL-TIME COMPARISON ENGINE ARCHITECTURE

We automate comparison matrices between competing neighborhoods, builders, or apartment complexes using resident-contributed data.

```
 +---------------------------------------------------------+
 | COMPARE: [ Society A ]  vs  [ Society B ]               |
 |---------------------------------------------------------|
 | - Water Supply:    85% Positive  |  40% (shortage alert)|
 | - Noise Level:     Low / Quiet   |  High (metro work)   |
 | - Pet Friendly:    Yes           |  No (dogs banned)    |
 | - Expert Verdict:  "Great for bachelors" | "Best for kids" |
 +---------------------------------------------------------+
```

- **Context-Agnostic Comparison Grids:** Displays comparison metrics across core taxonomy features (Water, Power, Noise, Safety) by aggregating rating scores from verified resident answers.
- **Automated Expert Consensus Summary:** Highlights a unified resident verdict (e.g., *“6 of 8 residents agree that Society A has better construction quality but higher maintenance charges than Society B”*).

---

## 11. STRATEGIC RECOMMENDATION PATHWAYS

The recommendation engine guides buyers through their decision timeline, presenting relevant, personalized options.

- **Contextual Expert Recommendations:** Displays adjacent expert profiles based on specialized niches (e.g., *“You asked Rohan about traffic. You might also want to ask Sneha about safety and schools in the same neighborhood.”*).
- **Dynamic Content Discovery:** Suggests indexable articles, checklists, and comparison guides that correspond to the searched location (e.g., *“Moving to Whitefield? Read our survival guide regarding local tanker water prices.”*).

---

## 12. PLATFORM MEMORY & PRIVACY SECURITY

To improve user experience while maintaining privacy, the platform stores user preferences securely.

- **Localized Search Context Caches:** Remembers recently searched localities, favorited expert profiles, and draft inquiries to resume sessions seamlessly.
- **The "Buyer Moving Sandbox":** A personalized planning dashboard that tracks their decision status (e.g., *“Lease negotiation stage”*, *“Deposit paid stage”*), adjusting recommend tools accordingly.
- **Strict Privacy Controls:** All personal names, email addresses, exact tower apartment numbers, or bank accounts are completely scrubbed from the public knowledge graph.

---

## 13. EDITORIAL KNOWLEDGE MESHING

Our editorial content (guides, blogs, and FAQ pages) is structurally connected to our knowledge graph nodes, enhancing topical authority.

- **Programmatic Guide Generation:** Articles (e.g., *“The Ultimate Guide to Living in HSR Layout”*) dynamically pull active expert lists, local average water scores, and safety ratings directly from graph variables.
- **Contextual Content Recommendations:** Relevant FAQ pages are injected into active buyer dashboards during the checkout process to answer common questions before they purchase.

---

## 14. DATA GRAPH ANALYTICS DASHBOARD

We equip operators with an operational control panel to evaluate knowledge health across the marketplace.

- **Friction Map Visualizers:** Highlights areas with high search volumes but low expert answer rates, helping recruitment teams focus on local supply gaps.
- **Emerging Locality Alerts:** Detects sudden drops in rating scores for specific locations (e.g., a sudden increase in power cut mentions in Baner), helping team members spot local infrastructure challenges.
- **Search Gaps Detector:** Logs searches that yield no matches, helping teams expand categories and taxonomy parameters to match user intent.

---

## 15. KNOWLEDGE GOVERNANCE & TAXONOMY MAINTENANCE

To maintain data integrity and prevent clutter as we scale to millions of nodes, we enforce automated maintenance protocols:

- **Fuzzy Duplicate Entity Merger:** Identifies duplicate society or developer records (e.g., *“Prestige PLS”*, *“PLS Habitat”*) and merges them into a single, clean canonical node.
- **Taxonomy Drift Watcher:** Prevents tag clutter by restricting custom tag creations and routing unmapped tags to moderator review queues.
- **Stale Relationship Pruning:** Automatically deprecates temporal relationship tags (e.g., a highway repair tag) after 180 days, ensuring local data remains fresh and accurate.

---

## 16. STRUCTURAL ABSTRACTION FOR FUTURE CATEGORIES

The database, node tables, and relational edges are structurally abstract. This allows BeforeRegret to scale into any consulting category with zero modifications to its core codebase.

```
                                  [BeforeRegret Graph Engine]
                                               │
             ┌───────────────────┬─────────────┴─────┬───────────────────┐
             ▼                   ▼                   ▼                   ▼
    [Neighborhoods]           [Used Cars]          [Jobs]           [Education]
    - Locality ID             - Car VIN            - Company ID     - College ID
    - Pincode                 - Make & Model       - Industry       - Degree / Major
    - Society                 - Manufacture Year   - Job Title      - Intake Year
```

- **Generic Node Abstraction:** Fields like "Locality" or "Society" are treated as generic `EntityNode` elements. In the **Used Cars** category, an `EntityNode` maps to a Car VIN or Model. In **Jobs**, it represents a Company name.
- **The Consistency of Workflows:** The underlying payment settlement, delayed KYC verification queue, and dispute resolution logic remain unchanged. The only adjustments are the questions asked in forms and the profile layouts, allowing BeforeRegret to scale into any consulting category with ease.
