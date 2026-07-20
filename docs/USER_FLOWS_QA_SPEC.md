# BEFORE REGRET (NEIGHBOR REVIEWS)
## Master User Flows, Edge Cases & Quality Assurance Specification
**Version:** v1.0.0-Production  
**Scope:** Universal User Journeys, Edge Cases, Dispute Protocols, Security Controls, and Comprehensive QA Testing Matrix  
**Author:** Head of Product, QA Director, Principal Systems Architect & Founding Operations Lead  

---

## 1. THE COMPLETE BUYER JOURNEY

The buyer's journey is engineered to guide users from initial discovery to successful relocation with absolute clarity, using secure, escrow-protected milestones.

```
 [Landing / Search] ➔ [View Expert Cards] ➔ [Select Package] ➔ [Secure Payment Gateway Payment]
                                                                        │
                                                                        ▼
 [Approved / Reviewed] <── [Answer Delivered] <── [Expert Responds] <── [Escrow Hold]
```

### Milestone Specifications

#### 1. Discovery & Search Focus
- **Action:** The buyer enters a residential society, builder name, pincode, or city into the homepage search bar.
- **System Response:** The system performs a typo-tolerant trigram database search, returning matching geographic profile landing pages.
- **Interruption Path:** If the search term is incomplete or spelling is highly fractured (e.g., *"HSR sec 2 bngl"*), the system displays real-time auto-suggestions: *"Did you mean: HSR Layout Sector 2, Bengaluru?"*

#### 2. Expert Selection & Evaluation
- **Action:** The buyer browses verified local expert cards, comparing resident tenures, trust scores, and specialized topic tags (e.g., Water Quality, Pet Friendliness).
- **System Response:** The system dynamically ranks experts based on availability, response velocities, and historical buyer review ratings.

#### 3. Checkout & Secure Payment
- **Action:** The buyer clicks "Ask Question" on their chosen expert's profile, drafts their query, selects a packaging tier, and initiates checkout.
- **System Response:** The system opens a PCI-compliant Secure Payment Gateway payment interface. Upon card/UPI validation, the system holds the payment in a secure, interest-free escrow account and notifies the expert via WhatsApp, SMS, and email.

#### 4. Response & Escrow Settlement
- **Action:** The expert accepts the query, types a detailed response, attaches verified local photos, and submits the answer.
- **System Response:** The buyer is notified instantly. The buyer has a 48-hour window to review the answer:
  - **Approval:** The buyer approves the response, releasing 80% of the funds to the expert's wallet and retaining 20% as the platform commission.
  - **Auto-Approval:** If the buyer does not act within 48 hours and files no dispute, the system automatically approves the answer and settles the transaction.
  - **Dispute:** The buyer flags quality or accuracy issues, pausing the transaction payout and routing the order to L2 support moderators.

---

## 2. THE COMPLETE LOCAL EXPERT JOURNEY

The resident expert's journey is designed to make registration simple, verify identity securely, reward performance, and ensure smooth payouts.

```
 [Landing / Apply] ➔ [Aadhaar OCR Ingestion] ➔ [Profile Activation] ➔ [Receive Question]
                                                                            │
                                                                            ▼
 [Earnings Cleared] <── [48h Buyer Approval] <── [Submit Answer] <── [Accept SLA]
```

### Operational Milestones

#### 1. Onboarding & Registration
- **Action:** A verified resident clicks "Become a Local Expert" on the homepage and completes their mobile OTP sign-on.
- **System Response:** The system generates an empty expert profile shell, prompting the user to complete their resident bio, select their coverage pincodes, and specify their areas of expertise.

#### 2. Verification & KYC Processing
- **Action:** The expert uploads an identity card (Aadhaar or PAN) alongside a proof of residency (rental agreement or utility bill).
- **System Response:** The platform’s OCR engine extracts identity details, redacts sensitive numbers, and flags matches for manual L2 administrative validation within 24 hours. Profiles are set to "Pending Verification" but can accept draft questions.

#### 3. Answering Queries & SLA Tracking
- **Action:** The expert receives a real-time notification for an assigned paid query, with a countdown timer displaying the remaining response window (e.g., 24 hours).
- **System Response:** The expert accepts the task. The system provides structured drafting interfaces with pre-formatted sections (e.g., Water, Commute, Community) to ensure high-quality answers.

#### 4. Wallet Management & Withdrawals
- **Action:** Once an answer is approved, cleared earnings are deposited into the expert's secure wallet. The expert requests a withdrawal to their registered UPI ID or bank routing account.
- **System Response:** The payment system checks that the withdrawal target name matches the expert's verified PAN details, processes the transfer via Secure Payment Gateway Payouts, and sends a transaction summary PDF via email.

---

## 3. PASSWORDSLESS AUTHENTICATION WORKFLOWS

BeforeRegret uses secure, token-based authentication to eliminate credential theft, minimize login friction, and manage active sessions safely.

```
 [User requests OTP] ➔ [Rate limit check passed] ➔ [Send 6-digit SMS / WhatsApp token]
                                                                 │
                                                                 ▼
 [Redirect to Target] <── [Store secure JWT Cookie] <── [Validate OTP token]
```

### Core Authentication Scenarios

#### 1. User Sign-Up & Registration
- **Scenario:** A new visitor registers on the platform.
- **Expected System Behavior:** The user enters their mobile number. The system verifies that the number is valid, generates a unique, cryptographically secure 6-digit OTP, and delivers it via SMS.
- **Timeout & Retries:** OTP codes expire after 3 minutes. Users can request a new OTP only after a 60-second cooldown timer.

#### 2. Registered Member Login
- **Scenario:** A registered buyer or expert logs back in.
- **Expected System Behavior:** The system checks the database for the user's phone number. If found, it routes them to their corresponding buyer or expert dashboard. If the device signature is unfamiliar, the system sends an email security alert.

#### 3. Session Expiration & Auto-Logouts
- **Scenario:** An active user session remains idle or expires.
- **Expected System Behavior:** Secure session cookies are configured with a strict 30-day lifetime. If a token is expired or altered, the API gateway intercepts the request, clears client-side state, and redirects the browser to the login screen with a clean banner: *“Your session has expired. Please log in again.”*

#### 4. Verified Phone or Email Modification
- **Scenario:** A user requests to update their registered contact details.
- **Expected System Behavior:** The user must enter and verify an OTP on their *current* registered number before the system allows them to bind a new contact number. This prevents account takeovers through stolen device SIMs.

---

## 4. PAYMENT INTERACTIVE FLOWS & FAILURES

Every financial interaction is designed to ensure complete transaction integrity, audit compliance, and simple error recovery.

```
                  [Initiate Transaction Checkout]
                                 │
                                 ▼
                     [Secure Payment Gateway Payment API]
                                 │
         ┌───────────────────────┴───────────────────────┐
         ▼                                               ▼
 [Transaction Success]                           [Transaction Fail]
 - Verify secure Webhook signature                - Revert query status
 - Move status to 'Assigned'                     - Expose clean failure card
 - Enforce Escrow Lock                           - Safe Retry checkout path
```

### Financial Workflows & Resilience Matrix

#### 1. Standard Payment Success
- **Expected Behavior:** The buyer completes the Secure Payment Gateway checkout. Secure Payment Gateway's servers dispatch a signed, cryptographically verified webhook event. The backend validates the signature, creates a pending escrow transaction record, moves the query status to `Assigned`, and updates the buyer's payment status to `Paid`.

#### 2. Secure Payment Gateway Gateway Failure
- **Expected Behavior:** The user's credit card or bank rejects the charge.
- **Recovery Path:** The payment modal captures the exact error code (e.g., `BAD_SIGNATURE`, `INSUFFICIENT_FUNDS`), displays a helpful error message to the user, and re-opens the checkout screen with alternative payment methods. The question draft remains safely saved in the user's session.

#### 3. Duplicate Transaction Defense
- **Expected Behavior:** A user double-clicks the "Complete Checkout" button, or network lag triggers a duplicate request.
- **Recovery Path:** The backend uses an idempotency key generated from the unique query parameters (`buyer_id` + `expert_id` + `society_id` + `price`). Duplicate transaction requests with matching idempotency keys are blocked, returning the existing active order details.

#### 4. Payment Confirmed but Order Creation Fails
- **Expected Behavior:** A payment is charged successfully by the gateway, but a database timeout prevents the platform from creating the corresponding query order.
- **Recovery Path:** The system runs an automated reconciliation job every 10 minutes. This job matches completed Secure Payment Gateway transactions against our database orders. Any unmatched successful payments are flagged, creating the query order automatically and notifying the operations team.

---

## 5. ASYNCHRONOUS MESSAGING & SLA TIMERS

We track communication milestones and enforce strict response SLAs to protect our marketplace reputation and build trust.

```
 [Buyer Purchases Query] ➔ [24h SLA Acceptance Timer Starts]
                                        │
         ┌──────────────────────────────┴──────────────────────────────┐
         ▼                                                             ▼
 [Expert Accepts Query]                                       [Expert Fails to Accept]
 - Transition to 'Answering'                                  - Cancel order at 24h limit
 - Start 48h Delivery SLA Timer                               - Issue full refund
                                                              - Alert operations team
```

### Communication & Timing Rules

#### 1. Expert SLA Acceptance Windows
- **Rule:** Experts must accept an assigned query within 24 hours of purchase.
- **SLA Breach Recovery:** If the expert does not accept the question within 24 hours, the system cancels the order, returns a full refund to the buyer’s payment source, and flags the expert's profile for temporary inactivity.

#### 2. Answer Delivery SLA Timers
- **Rule:** Once an expert accepts a query, they have 48 hours to draft and submit their detailed response.
- **SLA Breach Recovery:** If the expert fails to deliver the answer within 48 hours, the system cancels the order, issues a full refund, and applies a penalty to the expert's Trust Score.

#### 3. Secure File Attachment Limits
- **Rule:** Users can attach photos or local guides to their responses to provide visual context.
- **Security Validation:** Uploaded files are scanned for malware and stripped of EXIF coordinates automatically. If a file is corrupted or too large (>10MB), the system rejects the file and displays an informative warning: *“Attachments must be under 10MB in PNG or JPG formats.”*

#### 4. Off-Platform Leakage Protections
- **Rule:** Prevent users from taking transactions off-platform to bypass our safety guarantees.
- **Security Validation:** Real-time regex algorithms monitor chat inputs for phone numbers, email addresses, or payment keywords (e.g., Paytm, PhonePe, GPay). Flagged strings are masked, and a reminder is displayed to keep interactions within BeforeRegret.

---

## 6. REVIEWS, ESCROW DISPUTES & MODERATION

When a buyer receives an answer that does not meet baseline quality standards, our structured escrow dispute system ensures fair, objective resolution.

```
 [Buyer Files Escrow Dispute] ➔ [Escrow Payout Suspended]
                                          │
                                          ▼
 [Moderation Decision Issued] <── [L2 Moderator Review Logs]
                                          │
         ┌────────────────────────────────┴────────────────────────────────┐
         ▼                                                                 ▼
 [Support Rules for Buyer]                                      [Support Rules for Expert]
 - Issue 100% Buyer Refund                                      - Release Escrow to Wallet
 - Reduce Expert Trust Score                                    - Dismiss Dispute
```

### Dispute & Moderation Guidelines

#### 1. Initiating a Dispute
- **Workflow:** If a buyer is unsatisfied with the delivered answer, they can click "File a Dispute" on their dashboard. The system suspends the automated payout timer, freezes the transaction funds in escrow, and opens a dispute form.
- **Information Required:** The buyer must select a reason for the dispute (e.g., Incomplete Answer, Outdated Information, Spam) and provide a brief description of the issue.

#### 2. Operational Case Assessment
- **Workflow:** The dispute is routed to our L2 support moderation dashboard. Support agents review:
  - The buyer's original question and specific requirements.
  - The expert's response, attachments, and response times.
  - Full interaction logs and chat history.
- **Moderator SLA:** Support teams must review and resolve active disputes within 24 business hours.

#### 3. Resolution Outcomes
- **Outcome A (In Favor of Buyer):** If the moderator determines that the expert's answer was incomplete or inaccurate, they issue a full refund to the buyer and apply a penalty to the expert's Trust Score.
- **Outcome B (In Favor of Expert):** If the moderator finds that the expert answered the question completely and met all quality requirements, they dismiss the dispute and release the escrow funds directly to the expert’s wallet.

---

## 7. DASHBOARD INTERACTION FLOWS & ERROR RECOVERIES

Dashboards are configured to handle network drops, empty states, and permission changes gracefully, keeping users informed at all times.

### Dashboard Behavior & Fallbacks

#### 1. Offline Mode & Network Re-connection
- **Scenario:** A user loses internet connection while writing an answer or browsing local listings.
- **System Behavior:** The UI detects offline states, displays a subtle, non-blocking warning banner (*“You are offline. Reconnecting...”*), and caches draft inputs locally. Once the connection is restored, the system auto-saves outstanding drafts and synchronizes state seamlessly.

#### 2. Accidental Page Refresh Safeguards
- **Scenario:** A user accidentally refreshes their browser while filling out a long form.
- **System Behavior:** The system uses browser storage (`localStorage`) to cache form inputs in real-time. If a page refresh occurs, the form auto-fills with the saved draft data, preventing any loss of user effort.

#### 3. Access Permission Upgrades
- **Scenario:** A registered visitor is approved as an expert.
- **System Behavior:** The backend updates the user's role metadata in their session token. On the next page load, the UI displays the Expert Dashboard tab and updates access permissions without requiring manual re-authentication.

---

## 8. ADMINISTRATIVE CONTROLS & SECURITY ENFORCEMENTS

Our administration panel provides our trust and safety, finance, and operations teams with the tools required to manage the platform securely.

### Administrative Action Matrix

#### 1. Managing Fake Accounts & Spam
- **Action:** A moderator flags an expert profile as spam or uncovers fraudulent activity (e.g., self-dealing reviews).
- **System Response:** The administrator clicks "Suspend Account." The system revokes the user's active session tokens, hides their public profiles from search results, pauses any pending withdrawals, and logs the action in our immutable security ledger.

#### 2. Financial Audit Trail Reporting
- **Action:** An auditor requests a breakdown of GST allocations and payouts for a tax filing period.
- **System Response:** The admin panel generates a secure CSV export detailing transaction references, platform commissions, GST collected, and payout disbursements. Every export is recorded in our admin security audit log.

#### 3. Location Directory Management
- **Action:** An operations manager needs to add a newly constructed residential society or update local pincode boundaries.
- **System Response:** The manager adds the location node via the administration dashboard. The database updates the geographic directory, and the system automatically creates the corresponding programmatic SEO pages for search indexation.

---

## 9. EDGE CASES MATRIX & COMPREHENSIVE FAILURE RECOVERIES

This matrix defines exact system behaviors and recovery procedures for rare, unexpected, or failure scenarios.

### Operational Exceptions Matrix

| Exception ID | Identified Scenario | Immediate System Action | Recovery & Communication Path | Primary Owner |
| :--- | :--- | :--- | :--- | :--- |
| **EXC-01** | **Search executed in region with 0 local experts** | Display search results with adjacent neighborhood listings. | Expose a prominent CTA banner inviting residents to apply as local experts: *“Be the first verified expert in this society!”* | Growth PM |
| **EXC-02** | **Expert requests a temporary holiday break** | Toggles expert status to `Inactive`. | Hides the expert's profile from search results, pauses new question assignments, but keeps active chat boards open for completing outstanding answers. | Ops Lead |
| **EXC-03** | **Expert account is suspended with active orders pending** | Suspends the expert's wallet and terminates active sessions. | Automatically cancels pending questions, issues full refunds to buyers, and displays a supportive notification: *“We apologize, but this expert is currently unavailable. Your payment has been fully refunded.”* | Trust Lead |
| **EXC-04** | **Buyer deletes account with active escrow balances pending** | Blocks the deactivation request and flags a dashboard error. | Informs the user that account deletion is paused until active questions are completed and pending escrow balances are released. | UX Architect |
| **EXC-05** | **Webhook delivery delay from Secure Payment Gateway** | Holds transaction status as `pending_payment` for up to 30 minutes. | A background job checks with Secure Payment Gateway's API to confirm payment status, updating the order and notifying the expert once validated. | SRE Lead |

---

## 10. SYSTEM ERROR HANDLING STANDARDS

The platform implements unified, user-friendly error boundaries to ensure that unexpected errors are captured, explained clearly, and resolved without disrupting the application.

```
 +-----------------------------------------------------------------------------------+
 |  ERROR: [!] Something went wrong.                                                 |
 |  "We experienced a temporary server lag while processing your payment."           |
 |  Error Code: ERR-502-PAY                                                          |
 |                                                                                   |
 |  [ Retry Payment ]           [ Contact Help Support ]                             |
 +-----------------------------------------------------------------------------------+
```

### Standardized Error Classifications
- **Validation Errors (`ERR-400-VAL`):** Occur when form inputs are incomplete or incorrect. The UI highlights the affected input fields in red and provides helpful, inline suggestions (e.g., *“IFSC code must be exactly 11 characters long.”*).
- **Network Latency Errors (`ERR-499-NET`):** Triggered when API requests time out. The UI displays a non-blocking toast notification: *“Network delay detected. Retrying your request...”*, and automatically retries the operation up to 3 times.
- **Database Server Errors (`ERR-500-SRV`):** Triggered by unexpected backend exceptions. The system wraps the affected page module in a secure boundary, logs the traceback details to our logging service, and displays a friendly recovery card.

---

## 11. MEANINGFUL EMPTY STATES ARCHITECTURE

We design intentional, actionable empty states to guide users toward the next useful step on the platform.

```
 +-----------------------------------------------------------------------------------+
 |  EMPTY: [Icon: Empty Inbox]                                                       |
 |  "No Active Questions"                                                            |
 |  "Ask a local expert about water quality, amenities, and community guidelines."   |
 |                                                                                   |
 |  [ Find Local Experts ]                                                           |
 +-----------------------------------------------------------------------------------+
```

### Standardized Empty State Formats

#### 1. No Questions Dashboard State
- **Description:** Displayed when a new buyer logs in and has not purchased any questions yet.
- **Actionable CTA:** Prominent **“Find Local Experts”** button that redirects users to search trending neighborhood listings.

#### 2. Zero Search Results Directory State
- **Description:** Displayed when a search query yields no exact database matches.
- **Actionable CTA:** Shows adjacent neighborhoods, or displays the **“First Resident Expert Bounty”** onboarding link.

#### 3. Empty Transactions Wallet State
- **Description:** Displayed when an expert views an empty transaction history list.
- **Actionable CTA:** Displays tips on how to improve profile descriptions and expand pincode coverages to attract buyers.

---

## 12. MULTI-CHANNEL SYSTEM NOTIFICATION MATRIX

To keep users informed without causing notification fatigue, we route alerts through distinct, priority-based channels.

### Notification Configuration Blueprint

| Event Trigger | Target Role | Delivery Priority | WhatsApp / SMS | Email Channel | In-App Feed | Notification Summary Text |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **New Question Purchased** | Expert | **Critical** | Yes | Yes | Yes | *“Hi Rohan, you received a new question about Tower B with an 8-hour response window! Click to accept.”* |
| **Payment Webhook Confirmed** | Buyer | **High** | Yes | Yes | Yes | *“Your payment of ₹199 has been securely deposited in escrow. Rohan has been notified to respond.”* |
| **Expert Submits Answer** | Buyer | **High** | Yes | Yes | Yes | *“Hi Amit, Rohan has delivered your detailed resident review! Click to read and verify.”* |
| **Withdrawal Cleared** | Expert | **Medium** | No | Yes | Yes | *“Your withdrawal of ₹2,450 has been successfully deposited in your bank account.”* |
| **Monthly Earnings Digest** | Expert | **Low** | No | Yes | No | *“Read your monthly resident expert earnings report for June 2026.”* |

---

## 13. COMPREHENSIVE QUALITY ASSURANCE CHECKLIST

Our QA team executes a multi-layered testing protocol before every minor and major platform release.

```
 [Lint Applet Validation] ➔ [End-to-End Automated Tests] ➔ [Manual Security Verification]
```

### Unified Testing Checklist

#### 1. Core Functional Testing
- [ ] Confirm mobile OTP entry delivers successfully and verifies within 3 minutes.
- [ ] Verify that duplicate checkout requests are blocked by the database idempotency key.
- [ ] Ensure that answers not approved or disputed within 48 hours are automatically settled in escrow.

#### 2. Usability & Layout Testing
- [ ] Ensure that mobile touch targets on directories and checkout menus are at least 44px in size.
- [ ] Verify that accidental page refreshes do not clear form draft inputs.
- [ ] Confirm that skeleton loaders match the size and structure of incoming cards.

#### 3. Security & Access Testing
- [ ] Validate that sensitive database fields, such as phone numbers, are masked by default inside administrative panels.
- [ ] Ensure that SQL injections and malicious script tags are blocked by API gateways and request sanitizers.
- [ ] Verify that chat attachments are stripped of EXIF GPS coordinates and scanned for malware.

#### 4. Performance & Core Web Vitals
- [ ] Target a Largest Contentful Paint (LCP) of under 1.2s on standard mobile networks.
- [ ] Ensure the Cumulative Layout Shift (CLS) remains under 0.05 across all directory pages.
- [ ] Target API response times of under 100ms for read-only database queries.

---

## 14. DRAFT STRATEGY ACCEPTANCE CRITERIA

Each key platform feature is defined by clear, measurable success and failure boundaries to guide quality engineering.

### Feature Sign-Off Blueprint

#### I. Secure Escrow Payouts
- **Success Criteria:** The buyer approves the answer, transferring 80% of funds to the expert's wallet and 20% to platform revenues instantly.
- **Failure Criteria:** Funds are settled without buyer approval, or payout values are calculated incorrectly.
- **Recovery Path:** Support L2 administrators can pause payment transactions and adjust wallet ledger records manually if an issue occurs.

#### II. Aadhaar OCR KYC Processing
- **Success Criteria:** The system extracts the expert's name and residential details from the uploaded card, redacts sensitive numbers, and saves the verified record to the expert's profile within 10 seconds.
- **Failure Criteria:** The OCR fails on legible documents, or saves raw PII details without redaction.
- **Recovery Path:** The document is flagged for manual L2 verification queue review, notifying the expert that their profile is being processed.

---

## 15. LAUNCH READINESS CHECKLIST

The final pre-flight operational checks that must be approved before deploying BeforeRegret live:

- **Directory Indexes:** Ensure that all programmatic SEO templates, state directories, and society landing pages are fully configured and indexable by search engine crawlers.
- **Escrow Integrity:** Verify that Secure Payment Gateway webhook signature handshakes are authenticated successfully and log records write cleanly to financial ledgers.
- **KYC Pipeline Security:** Confirm that private file storage buckets are fully secured, and OCR redaction scripts run successfully on uploaded documents.
- **Operations & Support:** Verify that L2 moderation panels are active, and support teams are trained on dispute guidelines and turnaround SLAs.
- **System Backups:** Verify that hourly automated database snapshots are active, encrypted, and restore successfully to a staging database cluster.

---

## 16. MULTI-CATEGORY COMPLIANCE SCALE

Our user flows, exception matrix, and QA checklists are designed to be category-agnostic. This ensures that BeforeRegret can expand beyond neighborhood reviews into other high-stakes categories (e.g., *Jobs, Cars, Education, Healthcare, Travel*) without a rewrite of our core engines.

- **Polymorphic Journeys:** The core transaction flow—finding an expert, purchasing a package, holding funds in escrow, completing the consultation, and settling the transaction—remains identical across categories. The only adjustments are the questions asked in forms and the profile layouts, allowing BeforeRegret to scale with ease.
- **Consistent SLA Frameworks:** The timing metrics, dispute moderation rules, and quality verification standards can adapt to any category, establishing a highly secure and predictable marketplace environment.
- **Scalable QA Systems:** Our QA checklists are structured to test horizontal, core platform systems, allowing us to deploy new consulting categories with minimal testing overhead.
