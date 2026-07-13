# BEFORE REGRET (NEIGHBOR REVIEWS)
## Master Design System, UI Component Library & Interaction Standards
**System Version:** v1.0.0-Enterprise  
**Scope:** Universal Design Standards, Core Component Library, Interactive Tokens, Form Standards, and Category-Agnostic Interface Architecture  
**Author:** Principal Design System Architect, Lead UX Researcher, HCI Specialist & Principal Frontend Architect  

---

## 1. DESIGN PRINCIPLES

Every visual boundary, typography scale, spacing choice, and interactive state on BeforeRegret is guided by eight human-centered principles. These axioms protect the user experience from aesthetic clutter ("AI-slop"), reduce cognitive load during high-anxiety life transitions, and ensure consistency across platforms.

### I. Clarity & Directness
- **Definition:** The layout must reveal its purpose and direct action within three seconds of visual exposure.
- **Implementation:** Headings are descriptive and factual. Complex financial data and resident quality scores are presented in clear, natural formats instead of technical codes. Visual elements that do not serve a specific user action are omitted.

### II. Absolute Consistency
- **Definition:** Identical interactions, vocabulary, colors, and components must produce identical outcomes across all devices and views.
- **Implementation:** A shared vocabulary is enforced. "Escrow Hold" means the exact same security and payout status on the buyer dashboard as it does on the expert workstation. Buttons, status colors, and card formats are standardized throughout the system.

### III. Typographic & Visual Hierarchy
- **Definition:** Information is organized so that the user's eye naturally scans the screen from highest to lowest priority.
- **Implementation:** Display typography uses distinct font weight pairings and high-contrast styling (such as our Primary Ink Slate). Layout headers are positioned with generous spacing, while secondary metadata is visually grouped into smaller, lighter cards.

### IV. Universal Accessibility (WCAG 2.2 AA)
- **Definition:** The platform must remain fully accessible to users with diverse sensory, cognitive, or motor abilities.
- **Implementation:** Maintain a minimum contrast ratio of 4.5:1 for body copy and 3:1 for interactive states. Touch targets on mobile screens are styled to be at least 44px in height. All interfaces support complete keyboard navigation and screen reader tags.

### V. Operational Simplicity
- **Definition:** We design to minimize the steps and cognitive effort required to complete a transaction.
- **Implementation:** Avoid multi-screen setups when a single-view, modular card can handle the task. Pre-fill common location filters based on the user's focus, and use a passwordless OTP entry flow to eliminate credential friction.

### VI. System Efficiency
- **Definition:** The interface must respond immediately to input, preventing layout shifts and lag.
- **Implementation:** The user interface remains highly responsive. Loading sequences utilize skeleton layouts to keep layout dimensions stable, and interactive transitions are limited to under 150ms.

### VII. Adaptive Responsiveness
- **Definition:** Layouts are designed desktop-first for complex data dense dashboards, and mobile-first for users exploring neighborhoods on foot.
- **Implementation:** Mobile views are optimized for simple, single-handed navigation using sticky bottom action buttons. Desktop displays use the extra space for clean split-screen panels and detailed filters.

### VIII. Transactional Trust
- **Definition:** Every element of the interface must reinforce security, accuracy, and fairness.
- **Implementation:** Real-time trust scores, clear escrow status bars, and verified resident badges provide users with complete visibility into their active transactions and payouts.

---

## 2. BRAND VISUAL IDENTITY & THEME SPECIFICATION

The BeforeRegret visual identity uses deep corporate slates, warm organic accents, and paper-like background textures to establish a professional yet approachable aesthetic.

```
  Primary Ink Slate (#0B132B)    ➔ Academic authority, primary text, dark surfaces
  Warm Marigold Accent (#FF9F1C) ➔ Local character, star ratings, gold verifications
  Forest Success Green (#0F9D58) ➔ Safe escrow holds, wallet deposits, approvals
  Neutral Background Cream (#FCFBF7) ➔ High-contrast, paper-like comfort, eye ease
```

### Color Token System

- **Brand Primary:** Ink Slate (`#0B132B`). Represents structural integrity and security. Used for display titles, primary headers, high-impact buttons, and core layout dividers.
- **Brand Secondary & Accent:** Warm Marigold (`#FF9F1C`). Adds local warmth. Applied to star ratings, verified resident badge accents, and focal points.
- **Transactional Success:** Forest Green (`#0F9D58`). Used exclusively for financial confirmations, active escrow status, verified payout records, and transaction completions.
- **Operational Warning:** Ember Amber (`#E67E22`). Flags actions requiring attention, such as pending KYC uploads, expiring SLA timers, or incomplete profile sections.
- **System Danger:** Crimson Red (`#D32F2F`). Identifies critical failures, disputed escrow items, blocked users, or payment declines.
- **Background Palette:**
  - **Core Background:** Paper Cream (`#FCFBF7`). Soft, high-contrast off-white that reduces eye strain on mobile devices.
  - **Surface Level 1:** Bone White (`#FFFFFF`). Pure white used for container cards, input boxes, and dropdown menus.
  - **Surface Level 2:** Sand Gray (`#F3F4F1`). Light gray used for secondary sections, table headers, and inactive tabs.
- **Dividers & Borders:** Hairline Slate (`#E2E8F0`). Ultra-thin dividers used to structure components cleanly.

### Visual Foundations

#### 1. Typographic Standards
- **Display Headings:** Space Grotesk. Solid, modern geometric structure that communicates structural reliability.
- **Body & Controls:** Inter. Crisp, highly legible sans-serif font family.
- **Monospace Elements:** JetBrains Mono. Used for technical metadata, financial calculations, pincodes, and response SLAs.

#### 2. Layout Tokens
- **Base Spacing Grid:** 8px base grid (`8px`, `16px`, `24px`, `32px`, `48px`, `64px`, `96px`), defining all padding, margins, and section heights.
- **Border Radii:**
  - **8px (Small):** Buttons, tags, inline labels, badges.
  - **12px (Medium):** Input fields, autocomplete menus, notification cards.
  - **24px (Large):** Expert cards, search listings, dialog panels, dashboards.
- **Elevation Shadows:**
  - **None:** Input boxes, buttons, secondary layout panels.
  - **Low (`shadow-sm`):** Standard expert cards, profile cards, and dropdown containers.
  - **High (`shadow-lg`):** Active dialog panels, bottom sheets, and floating action alerts.

#### 3. Brand Imagery & Motion Principles
- **Photography Standards:** Real, unedited user-submitted photos of societies, streets, and community spaces. We strictly avoid stock real estate illustrations.
- **Micro-Interactions & Transitions:** Limited to a maximum duration of 150ms with `cubic-bezier(0.4, 0, 0.2, 1)` easing curves to keep transitions snappy and responsive.

---

## 3. TYPOGRAPHY SYSTEM SPECIFICATION

Typography is the most critical element of our visual interface. It is styled to maintain absolute legibility across varying screens and network conditions.

```
 Space Grotesk (Display) ➔ Large, geometric display headings with tight letter-spacing
 Inter (Body text)       ➔ Highly readable, balanced line-heights, and clear weights
 JetBrains Mono (Data)   ➔ Fixed-width layout for pincodes, prices, and time-stamps
```

### Typography Scale Specifications

| Token Name | Element Type | Font Family | Size (Mobile) | Size (Desktop) | Weight | Line Height | Letter Spacing |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: | :--- |
| `display-h1` | Main Page Titles | Space Grotesk | 32px | 48px | Bold (700) | 1.15 | `-0.02em` |
| `display-h2` | Section Titles | Space Grotesk | 24px | 32px | SemiBold (600) | 1.25 | `-0.01em` |
| `display-h3` | Component Headers | Space Grotesk | 18px | 22px | Medium (500) | 1.30 | `0` |
| `body-lg` | Large Intro Copy | Inter | 16px | 18px | Regular (400) | 1.50 | `0` |
| `body-md` | Standard Text | Inter | 14px | 16px | Regular (400) | 1.60 | `0` |
| `body-sm` | Meta / Descriptions | Inter | 12px | 13px | Regular (400) | 1.50 | `+0.01em` |
| `action-btn` | Button / Active Links | Inter | 14px | 15px | Medium (500) | 1.00 | `+0.02em` |
| `label-sh` | Input Field Labels | Inter | 12px | 12px | SemiBold (600) | 1.20 | `+0.03em` |
| `mono-data` | Prices, Dates, Pins | JetBrains Mono| 12px | 12px | Regular (400) | 1.40 | `+0.05em` |

---

## 4. LAYOUT, GRIDS & SPACING TOKENS

We enforce structural guidelines across our grids to prevent unexpected layouts and ensure visual alignment across diverse screens.

```
   [1200px Maximum Width Center-Aligned Layout Container]
   ┌──────────────────────────────────────────────────┐
   │  Gutter: 24px       Columns: 12 (Desktop Grid)   │
   │                                                  │
   │  [Left Card (8 Cols)]      [Right Card (4 Cols)] │
   └──────────────────────────────────────────────────┘
```

### Grid & Breakpoint Specifications
- **Mobile Breakpoint (sm):** up to 640px. Single-column grid with a minimum of 16px of horizontal padding.
- **Tablet Breakpoint (md):** 641px to 1024px. 6-column grid with a minimum of 24px of horizontal padding.
- **Desktop Breakpoint (lg):** 1025px to 1280px. 12-column grid, max-width of 1200px, 24px columns gutters.
- **Widescreen Breakpoint (xl):** 1281px and above. 12-column grid centered horizontally with a max-width of 1200px.

### Spacing Token Rules
- **Component Padding:** Controlled by strict values (`px-2 py-1` for tags, `p-4` for standard cards, and `p-8` for dashboard cards).
- **Section Spacing:** Major vertical layout separations use `space-y-12` (96px) on desktop and `space-y-8` (64px) on mobile.
- **Card Spacing:** Grids of list cards or expert profiles use `gap-6` (24px) spacing, scaling down to `gap-4` (16px) on mobile screens.

---

## 5. REUSABLE ATOMIC DESIGN COMPONENTS

The complete system interface is constructed using a library of verified, responsive atomic components.

```
 +----------------------------------------------------------------------------------+
 |  COMPONENTS: [ btn-core (Primary/Danger) ]  [ input-form (Validated/Focused) ]   |
 |              [ badge-verified (GPS/Tenure) ] [ skeleton-list (Stable Layout) ]   |
 +----------------------------------------------------------------------------------+
```

### Core Action & Navigation Components

#### 1. ButtonComponent (`id="btn-core"`)
- **Usage:** Performs critical actions like page transitions, submissions, or checkout pathways.
- **Variants:**
  - **Primary Ink Solid:** Deep slate background (`#0B132B`) with solid white text.
  - **Primary Secondary Border:** Transparent background, crisp slate border, and smooth transition properties.
  - **Danger Solid:** Solid red background (`#D32F2F`) used exclusively for cancellations or dispute entries.
- **States:** Default, Hover (`opacity-90`), Focus (thick outline), Loading (hides text, reveals a centered spinner), and Disabled (`opacity-40` with click events suspended).

#### 2. InputFieldComponent (`id="input-form"`)
- **Usage:** Captures simple inputs like names, pincodes, search keywords, or numeric phone parameters.
- **Variants:** Text Area, Numeric Entry, and Custom OTP Grid.
- **States:** Default, Focused (highlights with a warm marigold border), Valid (displays an emerald checkmark), and Invalid (displays a crimson red error border).

#### 3. VerificationBadge (`id="badge-verified"`)
- **Usage:** Displays trust badges like expert residency statuses or verified identity states.
- **Variants:** GPS Verified (gold shield icon), ID/KYC Verified (indigo badge), Fast Responder (lightning icon), and Highly Rated (gold star icon).

#### 4. SkeletonLoaderComponent (`id="skeleton-list"`)
- **Usage:** Replaces loading indicators to maintain layout stability during data fetches.
- **Structure:** Uses pulsing, neutral gray container skeletons that match the exact visual layout of incoming cards or list elements.

---

## 6. BEFOREREGRET SPECIALIZED MARKETPLACE COMPONENTS

Our design system features unique component layouts built specifically to support our multi-sided consultation marketplace.

```
 +-----------------------------------------------------------------------------------+
 |  EXPERT CARD:                                                                     |
 |  Rohan S.  [Tenure: 6 yrs]  [GPS Verified]                     [Trust Score: 98]   |
 |  "Ask me about Tower C noise, water quality, and local school options"            |
 |  Response Speed: <4 hours | Price: ₹199                       [Ask Question]      |
 +-----------------------------------------------------------------------------------+
```

### Specialized Component Definitions

#### 1. ResidentExpertCard (`id="card-expert-core"`)
- **Purpose:** Showcases an expert's resident credentials, coverage areas, base price, and trust indicators on search results and landing pages.
- **Aesthetics:** Clean white card bordered by a fine gray hairline, featuring a distinct Trust Score rating at the top right, a list of active tags, and a prominent Primary Action button at the bottom.

#### 2. LocationCard (`id="card-location-core"`)
- **Purpose:** Displays societies, apartments, or pincodes on directories and dashboard views.
- **Aesthetics:** Shows a profile photo of the residential society, name, city, number of registered experts, and a direct lookup CTA.

#### 3. TrustScoreBadge (`id="badge-trust-core"`)
- **Purpose:** A prominent circular status badge displaying an expert's trust score (from 0 to 100).
- **Aesthetics:** Styled with a solid gold outline for high-performing experts ($\ge 95$), indigo for standard verifications ($80\text{--}94$), and neutral slates for new experts.

#### 4. WalletBalanceSummary (`id="wallet-summary-core"`)
- **Purpose:** Displays available earnings, pending escrow balances, active payouts, and tax allocations.
- **Aesthetics:** Displays clear numeric balances, green positive indicators for cleared earnings, and gold indicators for active escrow holds.

#### 5. PricingTiersCard (`id="card-pricing-core"`)
- **Purpose:** Displays pricing options for standard or deep-dive questions on the checkout panel.
- **Aesthetics:** Prominent price tag (e.g., ₹199), a list of included benefits (such as follow-up questions and escrow protection), and a checkout CTA.

---

## 7. FORM STANDARDS & USER SAFETY INTERRUPTS

We design forms to minimize friction, protect data accuracy, and prevent accidental actions during critical transactions.

```
 [User types field] ➔ [Validates on blur (No early error noise)] ➔ [Renders validation check]
```

- **Validation Timing Policies:** Inputs are validated on the `blur` event rather than as the user is actively typing, preventing unnecessary error messages while typing is in progress.
- **Standardized Inline Error System:** Validation errors are displayed directly below the affected input field in clear red text (`text-rose-600`), explaining the exact resolution required.
- **Dynamic Character Counters:** Multi-line text boxes, such as those used for typing questions, display a real-time character counter to keep the input within established limits (e.g., `45 / 500 characters`).
- **Destructive Action Interrupts:** High-consequence actions, like canceling a transaction or initiating a dispute, trigger a clear confirmation modal requiring a second click to complete.

---

## 8. NAVIGATION, SIDEBARS & THUMB-REACH PATTERNS

We structure our navigation menus to keep primary actions within thumb-reach on mobile devices and beautifully organized on desktop screens.

```
 +-----------------------------------------------------------------------------------+
 |  DESKTOP HEADER: [Logo: BeforeRegret]           [Discover]  [Wallet]  [Profile]   |
 |-----------------------------------------------------------------------------------|
 |  MOBILE FOOTER (Thumb-Reach Menu):                                                |
 |        [Home]        [Search]        [My Queries]        [Dashboard]              |
 +-----------------------------------------------------------------------------------+
```

- **Global Desktop Header:** A fixed, clean navigation header at the top of the screen featuring the platform logo, direct search access, global notifications, wallet balances, and user profile dropdowns.
- **Mobile Sticky Bottom Menu:** A 56px sticky menu bar positioned at the bottom of mobile screens. This keeps primary navigation links (Home, Search, Queries, Dashboard) within easy thumb reach.
- **Dynamic Breadcrumbs Trail:** Prominent navigation paths displayed on all directory and landing pages to ensure easy back-navigation:
  `Home ➔ Maharashtra ➔ Pune ➔ Kharadi ➔ 411014`
- **Dashboard Sidebar Panels:** Sidebars use simple vertical layout links with clear icons, highlighting active navigation nodes using a solid slate indicator block on the left edge.

---

## 9. TRANSITIONS, ANIMATIONS & MICRO-INTERACTIONS

We use purposeful, lightweight animations to guide the user's attention and keep interactions responsive.

- **Interactive Hover Transitions:** Primary links and action buttons use smooth background transitions (`transition-colors duration-150 ease-in-out`), changing background colors slightly when hovered over.
- **Entrance Animation Limits:** Components use simple, lightweight opacity transitions (e.g., card lists fading in over 150ms). We strictly avoid complex, heavy layout movements to keep pages loading quickly.
- **Interactive Focus Indicator Ring:** Pressing the `tab` key highlights active interactive components using a clean, 2px wide outline ring (`focus:ring-2 focus:ring-slate-900`), ensuring full keyboard navigation support.

---

## 10. SYSTEM MESSAGING, VOICE & TONAL GUIDELINES

Every status update, inline error, alert banner, and system notification uses a clear, factual, and reassuring voice.

```
   Factual Description ➔ Clear, actionable status messages that avoid technical jargon.
   Reassuring Escrow   ➔ Regular reminders that payment is held safely in escrow.
   Actionable Errors   ➔ Clear instructions on how to resolve the problem immediately.
```

- **Transaction Confirmations:** Always use reassuring, secure language: *“Your payment of ₹199 has been securely deposited into escrow. Your expert, Sneha, has been notified to respond within 8 hours.”*
- **Error Remediation Alerts:** Write clear, helpful errors that outline the exact solution: *“The IFSC code entered is invalid. Please verify your bank routing code and try again.”*
- **System Maintenance Alerts:** Displays an informative notification card: *“BeforeRegret is undergoing a standard system check. You can continue reading verified neighborhood reviews, but checkouts will be restored in 15 minutes.”*

---

## 11. ACCESSIBILITY COMPLIANCE (WCAG 2.2 AA)

BeforeRegret enforces strict accessibility protocols to ensure the platform remains fully functional for all users.

- **Color Contrast Assurance:** All text pairings are validated to maintain high contrast. Primary text, buttons, and system headers are styled to exceed a minimum contrast ratio of 4.5:1 against their backgrounds.
- **Touch Targets:** Interactive targets (such as buttons, checkboxes, and menu links) are styled to be at least 44px in height on mobile screens, preventing accidental presses.
- **Keyboard Navigation Support:** Users can navigate every view and component on the platform using the `tab`, `enter`, and `escape` keys, with active components highlighted by clear outline rings.
- **Screen Reader Support:** Interactive icons and non-text visual elements are styled with descriptive `aria-label` tags, allowing screen readers to translate the user interface accurately.

---

## 12. COMPONENT DESIGN PERFORMANCE GUIDELINES

We optimize our frontend components to load instantly and prevent layout shifts on slower mobile networks.

- **Cumulative Layout Shift (CLS) Defenses:** Media containers and skeleton loaders are configured with fixed aspect ratios (`aspect-video`, `aspect-square`), preventing unexpected shifts as resources load.
- **Interactive Latency Limits:** Component actions and calculations (such as parsing filter checks or toggling tabs) are kept simple to ensure they execute within 100ms.
- **Progressive Component Enhancement:** Core page content (such as reading answers and viewing reviews) remains fully legible even on slow 3G networks, while heavy assets are deferred until the connection is established.

---

## 13. CATEGORY-AGNOSTIC BLUEPRINT STRATEGY

Our design system is built using polymorphic components. This ensures that BeforeRegret can scale beyond neighborhood reviews into other high-stakes consulting categories (e.g., *Jobs, Cars, Education, Healthcare, Travel*) without a frontend redesign.

```
                         [Atomic Component Library]
                                      │
                                      ▼
                      [Polymorphic Layout Container]
                                      │
                                      ▼
                         [Category-Specific Renderer]
       ┌───────────────────┬───────────┴───────────┬───────────────────┐
       ▼                   ▼                       ▼                   ▼
 [Neighborhoods]      [Used Cars]               [Jobs]            [Education]
 - Locality ID        - Car VIN                 - Company ID      - College ID
 - Society Profile    - Model Details           - Company Profile - School Profile
```

- **Polymorphic Layout Components:** Component structures are abstract. The `Location Card` component renders local housing details in the neighborhood vertical, but seamlessly adapts to display Make & Model details in the **Used Cars** vertical or Company attributes in the **Jobs** vertical.
- **Unified Transactional Layouts:** The core designs of our checkout flows, dashboard grids, support wikis, and wallet systems remain identical across categories, enabling BeforeRegret to scale with minimal frontend development.
- **Universal Visual Themes:** The underlying visual brand—including color palettes, typography, spacing scales, and accessibility profiles—remains consistent across all product lines, establishing a single source of design truth.
