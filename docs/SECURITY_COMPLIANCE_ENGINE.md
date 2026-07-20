# BEFORE REGRET (NEIGHBOR REVIEWS)
## Master Security, Privacy, Compliance & Risk Management Architecture Spec
**Platform Security Goal:** Establish a resilient, zero-trust cybersecurity and privacy framework that protects personal user data, ensures financial transaction integrity, and complies with applicable global and regional legal guidelines.  
**Platform Architecture:** Zero-Trust Enterprise-Grade Security and Privacy Architecture  
**Author:** Chief Information Security Officer (CISO), Privacy Engineer & Lead Cybersecurity Solutions Architect  

---

## 1. STRATEGIC SECURITY PHILOSOPHY & GUIDING PRINCIPLES

In a digital marketplace where buyers share sensitive relocation details and local resident experts monetize their personal experiences, security and privacy cannot be treated as optional additions. We believe that **trust is our primary asset**, and maintaining trust requires an uncompromising approach to system security.

Our platform operates on a robust defense-in-depth model, ensuring that security measures are integrated into every layer of our software development and operational lifecycle.

```
 [User Device] ➔ [WAF & Cloudflare Shield] ➔ [API Gateway / Rate Limiter]
                                                        │
                                                        ▼
 [Scoped DB Query] <── [Least-Privilege Authorization] <── [Zero-Trust IAM Decryption]
```

### Core Security Axioms
1. **Zero-Trust Infrastructure:** We trust no user, device, or internal service by default, regardless of its location within our network boundary. Every access request must be explicitly authenticated, authorized, and validated.
2. **Least-Privilege Access:** Internal employees are granted access only to the specific resources and data fields required to execute their immediate tasks. Super Admin permissions are heavily restricted and systematically audited.
3. **Privacy by Design:** Privacy is integrated into the core architecture of our data models. Personally identifiable information (PII) is isolated, encrypted, and masked by default, ensuring that users retain absolute control over their digital identities.
4. **Secure Development Lifecycle (SDLC):** Code changes undergo automated dependency checking, static application security testing (SAST), and mandatory peer reviews before being deployed to our isolated production environments.

---

## 2. SECURE AUTHENTICATION & SESSION MANAGEMENT

To balance user convenience and credential security, BeforeRegret implements a passwordless, token-based authentication engine.

```
 [User Requests Login] ➔ [System Sends Signed SMS OTP / Social OAuth Link]
                                        │
                                        ▼
 [Encrypted Session Token Issued] <── [Multi-Factor Validation Checked]
```

### Authentication Channels
- **Passwordless OTP Authentication:** Users authenticate using one-time verification codes sent via SMS (using regional carriers) or WhatsApp. OTP tokens expire after 3 minutes and are limited to 3 retry attempts before the account is temporarily locked.
- **Social Sign-On (OAuth 2.0):** Supports 1-click authentication via Google and Apple. We retrieve only basic user profiles (name and verified email), discarding unnecessary third-party permissions.
- **Multi-Factor Authentication (MFA):** Mandatory for all administrative roles and high-earning experts. Uses Time-Based One-Time Password (TOTP) protocols (such as Google Authenticator) alongside standard credentials.

### Session Controls
- **Cryptographic JWT Tokens:** Access sessions are managed via short-lived, signed JSON Web Tokens (JWT) stored in secure, `HttpOnly`, `Secure`, and `SameSite=Strict` cookies. This mitigates cross-site scripting (XSS) and request forgery (CSRF) vulnerabilities.
- **Suspicious Session Termination:** If a session suddenly shifts geographical regions or IP footprints within a short window, the system terminates the active session tokens and prompts the user to re-authenticate via OTP.
- **Unified Device Dashboard:** Users can view all active logged-in devices and terminate specific stale or unfamiliar sessions with a single click.

---

## 3. GRANULAR ROLE-BASED ACCESS CONTROL (RBAC)

Access to the BeforeRegret Admin Operating System (AOS) is controlled by a structured permissions engine. Access to sensitive customer or financial data is strictly gated by role assignments.

### Dynamic Role Definition & Gatekeeping

| Operations Role | Raw PII Visibility | Financial Balances Override | KYC Approval Authority | Code/Config Deployment |
| :--- | :---: | :---: | :---: | :---: |
| **Founder / Super Admin** | Masked (Unmask Audited) | Yes | Yes | No (Git Only) |
| **Operations Manager** | Masked | No | Yes | No |
| **Trust & Safety Officer**| Decrypted (Read-Only) | No | Yes | No |
| **Finance Manager** | Masked | Yes (Payouts Only) | No | No |
| **Support Executive (L2)**| Masked | No | No | No |
| **Content Manager** | No | No | No | No |
| **Security/QA Engineer** | Mock Data Only | No | No | Yes (Staging Only)|

### Temporary Privilege Escalation (JIT Access)
In cases where an engineer or support manager requires temporary administrative access to debug an issue:
- **Approval Workflow:** The user requests Just-In-Time (JIT) access through the administrative panel.
- **Automatic Expiry:** JIT privileges require dual Super Admin approval and expire automatically after a maximum of 4 hours.
- **Logging:** Every action executed during JIT escalation is written to an unalterable security audit ledger.

---

## 4. COMPREHENSIVE DATA PROTECTION & PRIVACY

We apply strong encryption standards and data protection protocols to ensure that user information remains private and secure.

```
 [Raw User Data] ➔ [PII Redaction/Hashing Engine] ➔ [Encrypted Database (AES-256)]
                                                            │
                                                            ▼
 [Field Masking Layer (e.g., +91 ••••• ••948)] <── [Restricted API Gateway]
```

### Encryption Protocols
- **Data in Transit:** Enforced globally across all sub-domains using TLS 1.3 encryption, backed by automated Let's Encrypt SSL rotations.
- **Data at Rest:** All relational databases, document datastores, and cloud storage buckets use AES-256 cryptographic standards.
- **Secrets Management:** Private API credentials, gateway keys, and encryption seeds are managed via dedicated secrets engines (e.g., HashiCorp Vault), keeping them completely out of our codebase files.

### PII Protection & Data Sanitization
- **Database Field Masking:** Sensitive data fields, such as mobile numbers and email addresses, are masked by default inside administrative tables (e.g., showing `ami••••@gmail.com`). Support agents must click "Request Unmask" to view full details, which logs their action and requires a brief operational justification.
- **Strict Data Retention Curves:** 
  - Stale draft inquiries and abandoned checkouts are permanently deleted after 30 days.
  - Completed transactional question-and-answer details are retained indefinitely for our knowledge graph but are entirely unlinked from the buyer's identity if the account is deactivated.
- **Data Portability & Erasure ("Right to Be Forgotten"):** Users can request a complete ZIP download of their historical platform interactions or trigger permanent account deletion. Deletion requests purge all personal PII rows from production and backup database tables within 14 business days.

---

## 5. PAYMENT SECURITY & ESCROW INTEGRITY

Because BeforeRegret processes financial transactions across thousands of micro-payments daily, payment flows are heavily secured against fraud and technical glitches.

### Secure Payment Gateway Security Implementations
- **Strict Webhook Authentication:** The platform validates incoming payment webhook notifications using cryptographic signatures. This ensures that payment confirmations originate exclusively from verified Secure Payment Gateway servers, preventing fraudulent account updates.
- **Direct-Token Tokenization:** BeforeRegret does not store, process, or transmit raw credit card credentials, UPI codes, or net banking passwords. Payment flows are handled via Secure Payment Gateway’s PCI-DSS compliant iframe solutions.
- **Multi-layered Escrow Safekeeping:** Funds are held in isolated, interest-free escrow accounts. Released balances are processed dynamically only when:
  1. The buyer explicitly clicks "Approve Answer."
  2. The 48-hour auto-approval window closes without open disputes.
  3. Support moderators resolve a transaction dispute in favor of the expert.

---

## 6. PROGRESSIVE KYC & IDENTITY VERIFICATION SECURITY

Our delayed KYC system is designed to minimize friction for new experts while keeping the platform secure as transactions scale.

```
 Step 1: Sign Up (No Verification) ➔ Step 2: Answering (Aadhaar OCR Verified) ➔ Step 3: Payout (PAN Bank Match)
```

- **Isolated Document Storage:** Document uploads, such as Aadhaar cards or rental contracts, are stored in encrypted private storage buckets. These documents are inaccessible to public web clients and require temporary, signed administrative links to view.
- **Automated PII Redaction:** Uploaded documents are processed through automated OCR algorithms to extract verification details while immediately redacting sensitive fields (such as Aadhaar numbers and photographs) to comply with regional privacy regulations.
- **Identity Matching Auditing:** Before releasing payouts, the system cross-references the verified PAN details with the expert’s registered bank account name. Names must match exactly to prevent tax non-compliance and payment redirection fraud.

---

## 7. SECURE MESSAGING & CHAT SECURITY

We protect our community and prevent transaction leakage by securing asynchronous buyer-expert communication channels.

- **Transaction Leakage Defense Regex:** High-performance, low-latency algorithms scan communication flows for string patterns that resemble phone numbers, email addresses, UPI IDs, or external payment links. Flagged strings are redacted, and a warning is displayed: *“To protect your transaction with our escrow guarantee, please keep communication inside BeforeRegret.”*
- **Malicious URL Defense:** Shared hyperlinks are scanned against real-time global security databases (such as Google Safe Browsing APIs). Malicious, phishing, or advertising links are automatically stripped from messages.
- **Attachment Sanitization Engine:** Uploaded files (e.g., neighborhood photos, local guides) are scanned for malware and stripped of sensitive GPS EXIF metadata before being stored, preventing hackers from tracing the precise home coordinates of our resident experts.

---

## 8. INFRASTRUCTURE DEFENSE & SECURITY ARCHITECTURE

Our infrastructure is designed to defend against modern digital threats, ensuring high availability and system reliability.

```
 [Web Client Request]
          │
          ▼
 [Cloudflare Web Application Firewall (WAF)] ➔ Mitigates DDoS, SQL Injection, XSS
          │
          ▼
 [Rate Limiter / API Gateway] ➔ Filters brute-force attempts
          │
          ▼
 [Isolated Backend Server Clusters] ➔ Processes validated requests
```

- **Cloudflare Edge Protection:** The platform routes all domain traffic through Cloudflare’s Web Application Firewall (WAF) to block DDoS attacks, cross-site scripting (XSS), SQL injection attempts, and automated scraper bots.
- **API Gateway Rate Limiting:** We enforce tight rate limits across all public APIs:
  - Login and OTP requests: Limited to 5 requests per 15 minutes per IP address.
  - Location and search autocomplete APIs: Limited to 60 requests per minute per user session.
- **Isolated Network Segments:** Our backend servers, database systems, and background processing systems are isolated in private cloud networks. Only the public-facing API gateways are exposed to the public internet, preventing direct attacks on our databases.

---

## 9. COMPLIANCE & LEGAL ALIGNMENT

We design our workflows to comply with applicable data protection and consumer privacy standards, preparing the platform for audits and legal review.

- **Topical Compliance Checklist:**
  - **Data Privacy & Protection:** Our data processing, masking, and erasure controls are designed to align with modern privacy standards (such as GDPR and India’s Digital Personal Data Protection Act, DPDP).
  - **Financial Accountability:** All transaction ledgers, platform commission allocations, and expert payouts are audit-ready, complying with standard accounting practices and regional tax guidelines.
  - **Tax Compliance (TDS):** We automate the calculation and withholding of TDS (Tax Deducted at Source) on expert earnings, providing automated tax certificates to simplify compliance.
- **Immutable Administrative Logs:** We keep unalterable, append-only logs (`security_audit_logs`) of all administrative actions (such as KYC approvals, wallet adjustments, and account suspensions) for audit and compliance purposes.

---

## 10. VULNERABILITY MANAGEMENT & TESTING

We continuously evaluate and secure our codebase through structured vulnerability scans and testing programs.

- **Automated Security Scanning:**
  - **Static Analysis (SAST):** Our build pipelines scan code changes for common security weaknesses, insecure imports, or hardcoded credentials before deployment.
  - **Dependency Scans:** Automated tools scan package declarations daily for outdated or vulnerable libraries, opening automated pull requests to patch identified issues.
- **Regular Penetration Testing:** We engage certified external cybersecurity firms annually to conduct thorough penetration tests across our API gateways, database systems, and administrative interfaces.
- **Responsible Disclosure (Bug Bounty):** We host a clean `security.txt` file and a clear disclosure portal, welcoming independent security researchers to find and report vulnerabilities responsibly in exchange for reward recognition.

---

## 11. BUSINESS CONTINUITY & DISASTER RECOVERY (BC/DR)

We protect our services from natural disasters, infrastructure failures, and critical data loss through robust recovery plans.

### Recovery Targets
- **Recovery Point Objective (RPO):** Maximum of 1 hour. In a catastrophic event, we aim to lose no more than 1 hour of operational transaction data.
- **Recovery Time Objective (RTO):** Maximum of 4 hours. We aim to restore critical platform services (search, payment checkout, answering boards) within 4 hours of a disaster.

### Disaster Recovery Implementations
- **Automated, Encrypted Backups:** Database backups are generated hourly, encrypted, and stored in physically isolated cloud locations to prevent simultaneous failures.
- **High Availability (HA) Deployments:** We run our backend servers across multiple isolated cloud regions, with automated traffic routing to redirect users instantly if a region experiences an outage.
- **Active Failover Protocols:** Database clusters use active-standby replication setups, automatically promoting standby databases to primary roles within 60 seconds if a primary server fails.

---

## 12. SECURITY OPERATIONS & SYSTEM PERFORMANCE METRICS

Our security and DevOps teams monitor several security-specific indicators to identify and mitigate threats proactively:

- **Security Threat Frequency:** Logs and tracks daily counts of blocked brute-force login attempts, WAF detections, and injection flags.
- **Average Time to Remediate (ATTR):** Measures the hours taken to address a newly identified code vulnerability or dependency security patch.
- **Account Takeover (ATO) Incident Rate:** Tracks the percentage of active accounts reporting unauthorized access or session takeovers.
- **Database Backup Verification Rate:** Automatically validates historical backup files weekly inside a test environment, ensuring backup files are uncorrupted and ready for restoration.

---

## 13. COMPREHENSIVE CYBERSECURITY & OPERATIONAL RISK REGISTER

To keep founders and engineers aligned on risk priorities, we maintain a central **Marketplace Risk Register**. This register catalogs potential threats, evaluates their likelihood and impact, identifies owners, and defines clear mitigation plans.

### Operational Risk Matrix

```
       High │  [Risk 3: Leakage]        [Risk 1: Takeover]
            │
     S      │  [Risk 5: Collusion]      [Risk 2: KYC Delay]
     E      │
     V      │  [Risk 4: DDoS Scrapes]
            │
        Low └──────────────────────────────────────────────
                   Low                       High
                              LIKELIHOOD
```

### Risk Registry Table

| Risk Ref | Identified Threat | Category | Severity | Likelihood | Assigned Owner | Actionable Mitigation Plan | Review Cadence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RISK-01** | **Expert Account Takeover (ATO)** | Cybersecurity | **Critical** | Medium | Lead Security Architect | Enforce mandatory multi-factor authentication (MFA) on all expert profiles earning over ₹5,000 monthly. Set up automated email/SMS alerts for logins from new IP addresses or devices. | Weekly |
| **RISK-02** | **Delayed KYC Document Verification Backlog** | Operational | **High** | High | Customer Operations Director | Deploy automated OCR extraction to verify identity cards instantly, using manual admin review queues only as a secondary fallback. | Weekly |
| **RISK-03** | **Transaction Leakage (Off-Platform Payouts)** | Financial | **High** | Medium | Head of Growth | Implement real-time regex scanning on active chats to redact phone numbers, emails, or bank terms. Provide a 48-hour escrow protection guarantee to incentivize in-platform transactions. | Monthly |
| **RISK-04** | **DDoS Scrapers Stealing Directory Content** | Cybersecurity | **Medium** | High | Lead Infrastructure Engineer | Configure rate limits on search APIs and deploy Cloudflare Bot Management rules to block aggressive scraper behavior. | Quarterly |
| **RISK-05** | **Self-Dealing and Review Collusion** | Marketplace Trust | **High** | Medium | Trust & Safety Officer | Analyze IP logs, browser fingerprint matches, and payment card details to block experts from purchasing their own advice using secondary accounts. | Monthly |

---

## 14. MULTI-CATEGORY SECURITY SCALE

Our security models, encryption keys, authorization permissions, and risk management systems are category-agnostic. This ensures that BeforeRegret can expand from neighborhood reviews to other high-stakes categories (e.g., *Jobs, Cars, Education, Healthcare, Travel*) without rebuilding our security core.

- **Abstract Data Protection:** We secure files using generalized tags. A document containing a "Rental Agreement" in our neighborhood category is treated under the same security class as a "Medical History File" in healthcare or a "Salary slip" in jobs.
- **Consistent Authentication:** The underlying security protocols—including passwordless OTPs, JWT cookies, rate limiting, and RBAC administrative matrices—remain identical across categories. This allows BeforeRegret to scale securely and efficiently into any consulting category.
