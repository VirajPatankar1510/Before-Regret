# BEFORE REGRET (NEIGHBOR REVIEWS)
## Master System Architecture, Performance, Infrastructure & Scalability Spec
**Platform Engineering Goal:** Architect a resilient, hyper-performant, cost-efficient, and category-agnostic marketplace operating system that scales seamlessly from launch to millions of users.  
**Platform Architecture:** Modular Monolith evolving to Event-Driven Microservices  
**Author:** Principal Software Architect, SRE Lead & Founding Chief Technology Officer  

---

## 1. HIGH-LEVEL SYSTEM ARCHITECTURE

To achieve extreme reliability and low operational costs at launch while securing a path to scale, BeforeRegret is designed as an optimized **Modular Monolith** with clearly separated component boundaries. This ensures that individual domains can be extracted into independent microservices in the future without a complete platform rewrite.

```
                                    +----------------------------------------+
                                    |         User Client Interface          |
                                    |      (Next.js / React SPA / Mobile)    |
                                    +--------------------+-------------------+
                                                         |
                                                     HTTPS / TLS
                                                         |
                                                         v
                                    +--------------------+-------------------+
                                    |     CDN / Edge Layer (Cloudflare)      |
                                    |   - Static Asset Caching / WAF         |
                                    +--------------------+-------------------+
                                                         |
                                                     Reverse Proxy
                                                         |
                                                         v
                                    +--------------------+-------------------+
                                    |     API Gateway / Rate Limiter         |
                                    |       (Nginx / Envoy / Express)        |
                                    +--------------------+-------------------+
                                                         |
                                            +------------+------------+
                                            |                         |
                                            v                         v
                           +----------------+----------------+  +-----+-------------------+
                           |        Core Backend Service     |  | Background Worker Pool  |
                           |       (Node.js / Express / TS)  |  |   (BullMQ / Redis)      |
                           +--------+--------------+---------+  +-----+--------------+----+
                                    |              |                  |              |
                    +---------------+              +----+      +------+              |
                    |                                   |      |                     |
                    v                                   v      v                     v
         +----------+----------+                   +----+------+----+       +--------+--------+
         | Relational Database |                   |   In-Memory    |       |  Object Storage |
         | PostgreSQL / Cloud  |                   | Cache & Queue  |       |   Google Cloud  |
         | SQL (Drizzle ORM)   |                   |    (Redis)     |       | Storage / S3    |
         +---------------------+                   +----------------+       +-----------------+
```

### Component Responsibilities

#### 1. Frontend Client
- A lightweight, responsive web experience using React and Tailwind CSS.
- Handles search, geolocation capturing, client-side caching, localized landing page rendering, and Razorpay payment UI elements.

#### 2. CDN & Edge Layer (Cloudflare)
- Terminates TLS, runs the Web Application Firewall (WAF), performs DDoS protection, and caches programmatic SEO pages and static media assets at the edge.

#### 3. API Gateway / Reverse Proxy
- Routes incoming client traffic, enforces rate limiting, handles session cookie validation, and sanitizes headers before passing requests to the backend.

#### 4. Core Backend Application
- Exposes RESTful API endpoints. Handles core business rules: question purchases, expert matching, escrow accounting, audit logging, content moderation, and KYC ingestion.

#### 5. Background Worker Pool (BullMQ / Redis)
- Executes out-of-band asynchronous processing: processing payouts, sending SMS/WhatsApp notifications, updating search indexes, compressing images, and purging expired transient data.

#### 6. Relational Database (PostgreSQL / Cloud SQL)
- Stores structured transactional data including user profiles, escrow wallets, transaction ledgers, locations, questions, answers, and reviews. Utilizes Drizzle ORM for type-safe interactions.

#### 7. In-Memory Cache & Key-Value Datastore (Redis)
- Backs the background job queues, caches frequent database query results, tracks real-time active user sessions, and implements rate-limiting counters.

#### 8. Secure Object Storage (GCS / S3)
- Hosts unstructured media files including redacted expert KYC documents, verified local photographs, and automated programmatic backups.

---

## 2. TECHNOLOGY PRINCIPLES

Every technical decision made on BeforeRegret must align with our core engineering tenets. These principles prevent over-engineering, ensure codebase quality, and control ongoing operational costs:

```
  Simplicity First ➔ Loose Coupling ➔ High Cohesion ➔ API-First Development
```

### Core Tenets
- **Modular Monolith First:** We resist the temptation to build microservices on day one. A single, well-structured codebase is significantly cheaper to host, faster to develop, and easier to debug, provided domain boundaries are strictly enforced.
- **Loose Coupling & High Cohesion:** Components within our monolith communicate using clean interface contracts and transactional event emitters. This ensures that the billing, messaging, or search domains can be extracted into individual services with minimal refactoring.
- **API-First Development:** The backend and frontend communicate exclusively via versioned, validated JSON REST APIs. This establishes a clean boundary and allows our core APIs to immediately support future native mobile apps or external integrations.
- **Configuration over Hardcoding:** Features, pricing tiers, operational margins, SMS routing rules, and experimental variations are controlled by runtime environment variables and database configurations, eliminating the need for code redeployments to alter business rules.
- **Progressive Enhancement:** Ensure the core features of the platform (searching neighborhoods, viewing expert profiles) are fast and functional even on slow mobile networks or older hardware, reserving complex interactive features for capable clients.

---

## 3. FRONTEND ARCHITECTURE

The frontend is designed for speed, search engine accessibility, and absolute responsive layout stability.

```
                             [Global App Context]
                                      │
     ┌────────────────────────────────┼────────────────────────────────┐
     ▼                                ▼                                ▼
 [Routes / Pages]           [Dynamic Components]               [Local State Hooks]
 - /                        - ExpertCard                       - useAuth
 - /s/[society]             - QuestionForm                     - useSearch
 - /p/[expert_id]           - PaymentModal                     - useNotification
```

### Component & State Design
- **Core Component Isolation:** UI components are kept small, modular, and declarative, relying on Tailwind CSS for layout styling. Complex components like interactive maps or charts are loaded dynamically only when requested.
- **State Separation Strategy:**
  - **Server State:** Handled using efficient caching libraries (like React Query or SWR) to cache, deduplicate, and automatically revalidate data from backend APIs.
  - **Local UI State:** Managed locally within individual components using React hooks (`useState`, `useReducer`), keeping the global application context lightweight and responsive.
- **Graceful Error Handling:** Every major layout module (such as the map view or checkouts) is wrapped in a custom **React Error Boundary**. This ensures that if a component fails (e.g., due to an unexpected API response), the rest of the page remains functional while the error is logged.

### Optimization & Delivery
- **Route-Based Lazy Loading:** Code splitting is applied at the router level. Sub-pages like the Expert Dashboard or Admin Panels are loaded lazily, reducing the size of the initial bundle downloaded by visitors.
- **Image Optimization Engine:** External assets and user photos are requested through optimized image pipelines, converting images to modern formats (`WebP`/`AVIF`) and delivering responsive sizes based on client screen dimensions.
- **Core Web Vitals Performance:** Target and enforce strict performance metrics:
  - **Cumulative Layout Shift (CLS):** Keep under $0.05$ by setting fixed aspect ratios on all image containers and skeleton loaders.
  - **Interaction to Next Paint (INP):** Maintain under $100\text{ ms}$ by keeping event handlers lightweight and moving heavy computations out of the main execution thread.

---

## 4. BACKEND ARCHITECTURE

Our backend architecture relies on clean layering, keeping business rules separated from routing and database structures.

```
 [Client Request] ➔ [Route Controller] ➔ [Request Sanitizer] ➔ [Service Interactor]
                                                                        │
                                                                        ▼
 [JSON Response] <── [Format Presenter] <── [ORM Accessor] <── [Core Domain Logic]
```

### Layered Architecture Responsibilities

#### 1. Routing & Transport Layer
- Exposes HTTP endpoints. Parses request headers, validates cookies, and manages request/response payloads.

#### 2. Validation & Security Middleware
- Runs incoming payloads through schema validation libraries (e.g., Zod). Performs security checks to prevent SQL injection, cross-site scripting (XSS), and unauthorized resource access.

#### 3. Core Service Layer (Business Logic)
- This is the core of our backend. Contains pure business logic (e.g., *“If a buyer opens a dispute, hold the transaction payout, notify the expert, and enqueue a moderator review task”*). It is completely decoupled from Express, making it highly testable.

#### 4. Data Access Layer (Repository / ORM)
- Interacts with our PostgreSQL database using type-safe Drizzle ORM queries. Restricts direct database execution to prevent unoptimized or insecure queries.

#### 5. Background Jobs & Events Integration
- Listens for transactional events (e.g., `OrderPlacedEvent`) and pushes background tasks to Redis queues, keeping the main request-response thread lightning-fast.

---

## 5. DATABASE ARCHITECTURE & SCHEMAS

We use PostgreSQL to ensure data consistency, enforce relational integrity, and support complex hyper-local geographical queries.

```
 +--------------------+         +--------------------+         +--------------------+
 |       users        |         |      societies     |         |      experts       |
 |--------------------|         |--------------------|         |--------------------|
 | id (PK)            |         | id (PK)            |         | id (PK)            |
 | phone              |<--+     | name               |<--+     | user_id (FK)       |--+
 | role               |   |     | pincode            |   |     | base_price         |  |
 +--------------------+   |     +--------------------+   |     +--------------------+  |
                          |                              |                             |
 +--------------------+   |     +--------------------+   |     +--------------------+  |
 |      wallets       |   |     |      queries       |   |     |  expert_societies  |  |
 |--------------------|   |     |--------------------|   |     |--------------------|  |
 | id (PK)            |   +---->| buyer_id (FK)      |   +---->| society_id (FK)    |  |
 | user_id (FK)       |         | expert_id (FK)     |---------| expert_id (FK)     |<--+
 | balance_escrow     |         | status             |         +--------------------+
 +--------------------+         +--------------------+
```

### Relational Entity Definitions

```sql
-- 1. Core Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    full_name VARCHAR(100),
    role VARCHAR(20) NOT NULL DEFAULT 'visitor', -- 'visitor', 'buyer', 'expert', 'moderator', 'admin'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Societies & Localities Directory
CREATE TABLE societies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    city VARCHAR(100) NOT NULL,
    latitude DECIMAL(9, 6),
    longitude DECIMAL(9, 6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Expert Extensions Table
CREATE TABLE experts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    base_price_inr INTEGER NOT NULL DEFAULT 199,
    kyc_status VARCHAR(20) NOT NULL DEFAULT 'unverified', -- 'unverified', 'pending', 'verified'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. Many-to-Many Experts to Societies Mapping
CREATE TABLE expert_societies (
    expert_id UUID REFERENCES experts(id) ON DELETE CASCADE,
    society_id UUID REFERENCES societies(id) ON DELETE CASCADE,
    PRIMARY KEY (expert_id, society_id)
);

-- 5. Transactional Queries/Questions Table
CREATE TABLE queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES users(id),
    expert_id UUID NOT NULL REFERENCES experts(id),
    society_id UUID NOT NULL REFERENCES societies(id),
    question_text TEXT NOT NULL,
    detailed_mode BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(30) NOT NULL DEFAULT 'pending_payment', -- 'pending_payment', 'assigned', 'answered', 'approved', 'disputed'
    price_inr INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

### Query Optimization & Database Lifecycles
- **Targeted Indexes:** We place secondary indexes on frequently queried foreign keys (`queries.buyer_id`, `queries.expert_id`) and search filters (`societies.pincode`, `societies.city`).
- **Database Backups:** We automate daily snapshot backups, retaining them in encrypted storage for 30 days. Write-ahead logs (WAL) are streamed continuously to support point-in-time recovery.
- **Future Partitioning & Archiving:** Once our transactional tables exceed 50 million rows, the database partitions the historical tables by year. Completed queries older than 3 years are archived to cold storage to maintain high database performance.

---

## 6. SEARCH & DISCOVERY INFRASTRUCTURE

Fast and accurate neighborhood search is critical for keeping users engaged and driving conversions.

```
 [User Input] ➔ [Sanitize & Tokenize] ➔ [Check Cache (Redis)]
                                                 │
                                     ┌───────────┴───────────┐
                                  Hit▼                     Miss▼
                          [Return Results]         [Query Database / Trigram]
                                                             │
                                                             ▼
                                                    [Cache Result in Redis]
```

### Search Operations
- **Trigram Database Search:** For our initial launch, we perform fast hyper-local searches using PostgreSQL's `pg_trgm` extension. This allows us to handle typo-tolerant searches (e.g., matching "Koromangla" to "Koramangala") efficiently without running an expensive Elasticsearch cluster.
- **Unified Location Indexing:** We merge search queries across city, pincode, builder, and society tables into a single indexed lookup table, reducing query latency to under $30\text{ ms}$.
- **Smart Autocomplete:** Autocomplete queries are cached in-memory using Redis sorted sets (ZSET), delivering autocomplete suggestions with sub-10ms response times.
- **Search Exits Auditing:** The platform logs all searches that yield zero results, allowing operations teams to identify regions with high user interest but no registered local experts.

---

## 7. SECURE OBJECT STORAGE STRATEGY

We store unstructured files securely using role-based access permissions and automated lifecycle retention policies.

### Storage Architecture & Lifecycle Policies

| File Asset Type | Access Controls | Retention Policy | Versioning | Post-Processing |
| :--- | :--- | :--- | :---: | :--- |
| **Expert KYC Documents**| Private (Presigned URI Only) | Purge 14 days after approval | Yes | Redact sensitive ID card numbers via automated OCR |
| **User Profile Images** | Public (Edge CDN Cache) | Indefinite (Until Deleted) | No | Compress and convert to WebP/AVIF format |
| **Question Attachments**| Public (Inside Platform) | Retained with Query | No | Strip GPS metadata (EXIF data) to protect privacy |
| **Platform Backups** | Private Admin Access Only | Retained for 30 days | Yes | Encrypt backups immediately using AES-256 keys |
| **System Event Logs** | Read-Only Admin Access | Archive to Glacier after 90 days| No | Compress and stream logs continuously |

---

## 8. SERVICE LEVEL PERFORMANCE STANDARDS

We set strict performance targets to ensure a lightning-fast user experience across all devices and network conditions.

```
 +-----------------------------------------------------------------------------------+
 |                    TARGET SERVICE PERFORMANCE BENCHMARKS                          |
 |                                                                                   |
 |  [ Home Page Load: < 1.2s ]      [ Search Autocomplete: < 30ms ]                  |
 |  [ Expert Profile: < 400ms ]     [ Checkout Process: < 250ms ]                    |
 |  [ API Latency: < 100ms ]        [ Cumulative Layout Shift: < 0.05 ]              |
 +-----------------------------------------------------------------------------------+
```

### Core Performance Metrics
- **Largest Contentful Paint (LCP):** Target $\le 1.2\text{ s}$ on standard mobile devices over stable mobile networks.
- **Cumulative Layout Shift (CLS):** Limit to $\le 0.05$ to prevent unexpected layout shifts during page loads.
- **Interaction to Next Paint (INP):** Target $\le 100\text{ ms}$ to maintain UI responsiveness during user interactions.
- **Search Autocomplete Latency:** Target $\le 30\text{ ms}$ for standard queries.
- **API Response Latency:** Ensure 95% of read API requests complete in under $100\text{ ms}$.

---

## 9. STEPPED SCALABILITY PLAN

We outline five distinct engineering growth stages, defining exactly when and how our systems must evolve as user volume scales.

```
 Stage 1: MVP (0 - 10k Users) ➔ Stage 2: Scale (100k Users) ➔ Stage 3: Enterprise (1M+ Users)
```

### Growth Matrix & Infrastructure Evolution

| Phase | Volume (Monthly Active) | Core Database Setup | Cache Layer Setup | Job Queue Setup | Deployment Model |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. MVP** | $0 \rightarrow 10,000$ | Single PostgreSQL instance | Local memory cache | In-memory queues | Serverless Containers (Cloud Run) |
| **2. Scale** | $10,000 \rightarrow 100,000$ | Primary / Replica replication | Dedicated Redis instance | Redis-backed BullMQ | Managed Server Containers |
| **3. Growth**| $100,000 \rightarrow 1,000,000$ | Database partitioning | Distributed Redis cluster | Distributed Workers | Multi-Region Containers |
| **4. Enterprise**| $1,000,000 \rightarrow 10,000,000$ | Globally replicated tables | Multi-region caching | Independent Microservices | Globally Distributed Kubernetes |

---

## 10. MULTI-LEVEL CACHING STRATEGY

We use a multi-tiered caching structure to minimize database load, reduce API latencies, and optimize resource usage.

```
 [User Client Browser] (Local Session Caching)
          │
          ▼
 [Cloudflare Edge CDN] (Static SEO Pages & Local Directories)
          │
          ▼
 [Application Server Cache] (Redis Key-Value Storage)
          │
          ▼
 [Relational Database] (Primary PostgreSQL Storage)
```

### Cache Configuration & Invalidation Rules

#### 1. Browser-Level Caching
- **Assets Cached:** Client-side CSS, JavaScript, and UI icons.
- **Caching Headers:** Styled as `Cache-Control: public, max-age=31536000, immutable`.
- **Invalidation Strategy:** Handled automatically during deployments using unique file hashing.

#### 2. Cloudflare Edge CDN Caching
- **Assets Cached:** Programmatic SEO landing pages and society directories.
- **Caching Headers:** Styled as `Cache-Control: public, max-age=86400, s-maxage=604800`.
- **Invalidation Strategy:** Invalidation requests are sent immediately to Cloudflare’s APIs when an expert’s details change.

#### 3. Application-Level Redis Caching
- **Assets Cached:** Active user sessions, verified expert profiles, and common search results.
- **Invalidation Strategy:** We apply short Time-to-Live (TTL) limits (e.g., 5 minutes) and implement strict write-through caching logic to prevent stale data.

---

## 11. ASYNCHRONOUS BACKGROUND JOBS

We offload heavy, non-blocking tasks to a background queue to ensure our main API handlers remain highly responsive.

- **Background Job Engine:** Managed using **BullMQ** backed by Redis. BullMQ provides job retries with exponential backoff, job rate-limiting, and precise scheduling.
- **Core Asynchronous Tasks:**
  - **Communications:** Sending email, SMS, and WhatsApp alerts for new transactions.
  - **Payments:** Checking payout eligibility, scheduling transfers, and handling refunds.
  - **File Operations:** Redacting KYC documents and generating zipped data exports for compliance.
  - **Indexes:** Updating local search and SEO rankings dynamically.

---

## 12. API STRATEGY & STANDARDS

We build our APIs to remain consistent, clean, and developer-friendly as our services scale.

- **RESTful Design Patterns:** We enforce clean RESTful structures, returning standardized JSON payloads.
- **Strict Endpoint Versioning:** We include the API version directly in the request path (e.g., `/api/v1/queries`), allowing us to introduce major updates without breaking legacy clients.
- **Comprehensive Rate Limiting:** Rate limit policies are managed at our API gateway:
  - Auth & OTP Endpoints: 5 attempts per 15 minutes.
  - Core Search Endpoints: 60 queries per minute.
- **Standardized Error Responses:** API errors return a uniform format:
  ```json
  {
    "success": false,
    "error_code": "INSUFFICIENT_FUNDS",
    "message": "The wallet balance is insufficient for this withdrawal.",
    "timestamp": "2026-07-12T03:13:35Z"
  }
  ```

---

## 13. OBSERVABILITY, MONITORING & METRICS

We ensure full system visibility by implementing continuous monitoring and alerting systems across all layers.

- **Application Performance Monitoring (APM):** We use tools like OpenTelemetry to track request paths, trace slow database queries, and monitor active backend API performances.
- **Log Management System:** System logs are collected, standardized to JSON, and streamed to central logging platforms (e.g., Cloud Logging) for audit review.
- **Real-Time System Dashboards:** We monitor system health through continuous status panels:
  - **Compute Health:** Track CPU use, memory footprint, and network latency.
  - **Database Metrics:** Monitor active connection pool sizes and slow transaction queries.
  - **Operational Metrics:** Track Razorpay payment success rates, message delivery velocity, and background worker queues.
- **Incident Escalation Pipelines:** Major system errors trigger high-priority alerts to on-call engineering teams via automated integration tools (such as PagerDuty or Slack).

---

## 14. DEVOPS & CI/CD PIPELINES

Our DevOps processes ensure safe, repeatable, and automated software releases with zero downtime.

```
 [Git Commit] ➔ [Automated Linter/Tests] ➔ [Build Docker Image] ➔ [Deploy Staging]
                                                                        │
                                                                        ▼
 [Zero-Downtime Rollout] <── [Verify Health Checks] <── [Manual Release Approval]
```

- **Environment Isolation:** We operate completely separate environments:
  - **Development:** Locally run containers for local testing.
  - **Staging:** A sandbox environment matching our production configurations to validate releases.
  - **Production:** Our highly available, secured production platform.
- **Automated CI/CD Workflows:** 
  - Code changes merged to primary branches trigger automated test runners, dependency scanners, and build pipelines.
  - Validated changes are packaged into lightweight Docker containers and prepared for rollout.
- **Zero-Downtime Rolling Deployments:** We perform rolling deployments, spinning up new containers and verifying their health checks before routing user traffic and decommissioning older instances.
- **Rapid Rollback Protocols:** If health checks fail during a rollout, the API gateway redirects traffic to the previous stable release within seconds.

---

## 15. SYSTEM RELIABILITY & GRACEFUL DEGRADATION

We design our services to handle unexpected system stress or dependencies failures without disrupting the core user experience.

- **Graceful Failure Degradation:** If non-essential systems fail, we degrade the UI gracefully:
  - If our map service goes down, we fallback to simple text lists of neighborhoods.
  - If our SMS gateway experiences delays, we prompt users to verify their identities using secure email verification instead.
- **Database Connection Optimization:** We manage database connections through a resilient connection pooling engine, preventing database performance drops during high traffic surges.
- **Resilient Retry Frameworks:** Failed internal requests or background tasks use structured retry intervals with **exponential backoff and random jitter** to prevent overloading downstream services.

---

## 16. PRAGMATIC COST OPTIMIZATION

We prioritize capital-efficiency at launch, using modern cloud designs to keep operational costs extremely low while securing our path to scale.

- **Scale-to-Zero Compute Deployments:** For our initial launch, we deploy compute workloads to serverless platforms (such as GCP Cloud Run). This ensures we pay only when APIs are actively being executed, reducing compute costs to near-zero during low-traffic hours.
- **Smart Database Sizing:** We launch with modest, developer-tier managed database instances, upgrading resources (vCPUs, RAM) only as active transaction volumes grow.
- **Maximized Edge Delivery:** We route domain traffic through aggressive caching at the Cloudflare Edge CDN. Edge caching handles up to 80% of landing page visits, saving significant compute costs.

---

## 17. TECHNICAL DEBT GOVERNANCE

We manage technical debt proactively, ensuring that rapid feature development does not compromise long-term system stability.

- **Structured Tech Debt Backlog:** Technical debt is cataloged alongside standard product tasks. We allocate up to 20% of engineering bandwidth in every sprint to refactoring and performance optimization.
- **Pragmatic Refactoring Triggers:** We avoid refactoring working code unnecessarily. Code is refactored only when:
  1. A module requires frequent bug fixes.
  2. Performance metrics fall below our service level objectives.
  3. A component boundary is violated, risking loose coupling standards.

---

## 18. BUSINESS CONTINUITY & DISASTER RECOVERY (BC/DR)

We maintain strict disaster recovery plans to safeguard user data and ensure platform availability during catastrophic events.

- **Recovery Objectives:**
  - **Recovery Point Objective (RPO):** Maximum of 1 hour. We limit potential transaction data loss to under 1 hour by utilizing continuous database WAL streaming.
  - **Recovery Time Objective (RTO):** Maximum of 4 hours. We aim to restore core platform services (search, payment checkout, answering boards) within 4 hours.
- **Weekly Backup Validation:** Backups are restored weekly in an isolated sandbox environment to verify data integrity and test recovery procedures.
- **Incident Playbooks:** The team maintains detailed, step-by-step recovery playbooks, defining exact operational roles and communication protocols during system outages.

---

## 19. CATEGORY-AGNOSTIC DATA ARCHITECTURE

Our technical architecture is category-agnostic, enabling BeforeRegret to scale beyond neighborhood reviews into other high-stakes consulting categories (e.g., *Jobs, Cars, Education, Healthcare, Travel*) without a rewrite.

```
                              [API Gateway Layer]
                                       │
                                       ▼
                       [Generic Consulting Service]
                                       │
                                       ▼
                         [Abstract Entity Taxonomy]
       ┌───────────────────┬───────────┴───────────┬───────────────────┐
       ▼                   ▼                       ▼                   ▼
 [Neighborhoods]      [Used Cars]               [Jobs]            [Education]
 - Locality ID        - Car VIN                 - Company ID      - College ID
 - Society Name       - Make & Model            - Job Title       - Major Name
```

- **Database Abstraction:** Core transactional tables treat localized concepts as generic elements. A "Society Name" in our neighborhood vertical is modeled as a polymorphic `TargetEntity` in the database, allowing it to seamlessly represent a "Car VIN" in our used cars category or a "Company Name" in our jobs vertical.
- **Reusable Core Micro-Services:** Payments (Razorpay), Escrow Accounting, KYC Ingestion, Messaging, and Identity Management are designed as reusable, horizontal service modules, eliminating duplicate code and accelerating multi-vertical launches.
- **Standardized Performance Reporting:** Core performance indicators (such as Autocomplete Latency, Checkout Speed, and API Response Times) are measured consistently across all verticals, providing founders with a unified view of platform health.
