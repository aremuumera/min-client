# 🚀 Min-meg Exhaustive Production Testing Matrix & Feature Catalog

This document represents the complete, exhaustive test scenario matrix derived directly from inspecting all 17 backend modules, 50+ merchant pages, and 40+ admin pages across `minmeg-backend-ts`, `minmeg-merchants`, `minmeg-admin`, and `minmeg-website`.

---

## 👥 1. Complete Seed Account Architecture (Total: 10 Accounts)

| # | Account Identifier | Primary Role | Team Tier | Company Context | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `buyer_alpha_owner@minmeg.com` | `buyer` | **Company Owner** | Alpha Procurement Ltd | Primary Buyer Account Owner. |
| **2** | `buyer_alpha_manager@minmeg.com` | `buyer` | **Manager** | Alpha Procurement Ltd | Can sign contracts, manage invoices, create RFQs. |
| **3** | `buyer_alpha_member@minmeg.com` | `buyer` | **Member** | Alpha Procurement Ltd | Read-only / chat view; tests restricted team permissions. |
| **4** | `buyer_beta_owner@minmeg.com` | `buyer` | **Company Owner** | Beta Global Imports | Secondary Buyer for multi-buyer product inquiry tests. |
| **5** | `supplier_floe_owner@minmeg.com` | `supplier` | **Company Owner** | Floe Minerals Corp | Primary Supplier Owner (Lists products, storefront setup). |
| **6** | `supplier_floe_manager@minmeg.com` | `supplier` | **Manager** | Floe Minerals Corp | Supplier Manager (Acknowledges trades, uploads certificates). |
| **7** | `merchant_dual_owner@minmeg.com` | `buyer_supplier` | **Company Owner** | Apex Mining & Trade | Dual-Role Account (bids on RFQs as seller + posts RFQs as buyer). |
| **8** | `inspector_john@minmeg.com` | `inspector` | **Inspector** | Global GeoInspect Ltd | Independent Inspector appointed for lab & site inspections. |
| **9** | `inspector_sarah@minmeg.com` | `inspector` | **Inspector** | Apex Quality Control | Secondary Inspector for testing inspector re-assignment workflows. |
| **10** | `admin_operations@minmeg.com` | `trade_admin` | **Platform Admin** | Min-meg Operations | Trade Desk Admin for managing claim queue, clauses, and approvals. |

---

## 🧪 2. Exhaustive Scenario Catalog by Domain

---

### 📦 Group A: Product Inquiry Workflows (`ProductInquiry`)
> Backend: `product-inquiry.service.ts`, `product-inquiry.controller.ts`
> Merchant: `/my-trade-inquiries`, `/received-inquiries`, `/chat/product/...`

* **A1: Single-Cycle End-to-End Trade Success**
  * Buyer Alpha inquires on listed Product → Supplier Floe Manager Acknowledges → Admin customizes contract clauses → Both parties sign contract → Admin assigns Inspector John → Inspector accepts, uploads report & certificate → Admin approves → Trade completed.
* **A2: Multi-Cycle Same Room (Partial Hiding)**
  * Buyer Alpha creates Inquiry #1 (Lithium) and Inquiry #2 (Spodumene) with Supplier Floe. Both group in same room. Admin hides Cycle #1 → Room remains active (Cycle #2 is still visible).
* **A3: Multi-Cycle Same Room (Complete Hiding)**
  * Admin hides Cycle #2 as well → 0 active cycles → Room **instantly vanishes** from sidebar and redirects to `/dashboard/chat`.
* **A4: Multi-Buyer Inquiries on Same Product**
  * Buyer Alpha and Buyer Beta both inquire on Supplier Floe's Lithium Ore → Supplier gets 2 isolated rooms. Neither buyer can see the other's room.
* **A5: Supplier Inquiry Rejection**
  * Supplier Floe rejects with reason → Rejection card shows → Room auto-hides after 24h grace period.

---

### 🎯 Group B: RFQ & Bidding Workflows (`RFQ` & `RfqOffer`)
> Backend: `rfq.service.ts`, `rfq-offer.service.ts`
> Merchant: `/rfq-list`, `/rfq-list/create`, `/my-submitted-offers`, `/rfq/offers`

* **B1: Buyer Posts RFQ + Competing Supplier Bids**
  * Buyer Alpha posts public RFQ → Supplier Floe submits Offer #1 → Merchant Dual submits Offer #2 → Admin evaluates & accepts Offer #2 → RFQ Trade Room created.
* **B2: RFQ Non-Selection Notification**
  * Supplier Floe receives notification that Offer #1 was not selected.
* **B3: Multi-Offer RFQ Cycle Hiding**
  * Merchant Dual has 2 offers in RFQ room. Admin hides both → Room vanishes from sidebar.
* **B4: RFQ Status Transitions**
  * Admin changes RFQ status (OPEN → CLOSED → AWARDED). Verify activity log records each transition.

---

### 🏪 Group C: Business & Storefront Inquiries (`BusinessInquiry`)
> Backend: `business-inquiry.service.ts`
> Merchant: `/business/[slug]`

* **C1: Direct B2B Storefront Inquiry**
  * Buyer Beta visits Supplier Floe's public Storefront page and submits general partnership inquiry (NOT tied to any product ID) → Appears under `Business` sidebar tab, completely isolated from ProductInquiry.

---

### 🏢 Group D: Team Permissions & Collaboration (`TeamMember`)
> Backend: `team.service.ts`, `team.controller.ts`
> Merchant: `/settings/team`

* **D1: Team Invitation & Onboarding**
  * Buyer Alpha Owner invites `buyer_alpha_manager`. Manager accepts → Status changes `pending` → `active`.
* **D2: Manager Execution vs Owner View**
  * Buyer Alpha Manager signs a contract → Document recorded under company ownership; Owner receives notification.
* **D3: Member Restricted Action**
  * Buyer Alpha Member (read-only) attempts to reject a trade or modify invoice → UI disables button or backend returns HTTP 403.

---

### 🕵️ Group E: Inspector Workflows (`InspectorAssignment`, `InspectorPhoto`, `InspectorCompany`)
> Backend: `inspector-assignment.service.ts`, `inspector-photo.service.ts`, `inspector-company.service.ts`, `inspector-invite.service.ts`, `inspector-analytics.service.ts`
> Merchant: `/inspections`, `/inspections/workbench/[id]`, `/inspections/profile`, `/inspections/services/*`, `/inspections/analytics`, `/inspections/calendar`
> Admin: `/inspectors`, `/inspectors/assign-inspector/[id]`, `/inspectors/invites`

* **E1: Inspector Job Acceptance**
  * Admin assigns Inspector John → Inspector receives card → Accepts → Chat thread unlocks.
* **E2: Inspector Job Decline**
  * Inspector Sarah declines with reason → Status → `DECLINED` → Admin notified to re-assign.
* **E3: Mid-Trade Inspector Re-Assignment**
  * Admin cancels Inspector Sarah → Re-assigns Inspector John → Sarah's thread locks, John receives new card.
* **E4: Inspector Profile & Company Setup**
  * Inspector John creates inspector company profile → Sets service matrix (mineral types, pricing tiers, coverage regions) → Sets service limits.
* **E5: Inspector Photo Upload & Workbench**
  * Inspector John accepts job → Opens Workbench → Uploads site inspection photos → Compiles inspection report → Issues Quality Certificate.
* **E6: Inspector Analytics Dashboard**
  * Inspector John views analytics (completed jobs, avg turnaround, monthly revenue) → Verifies aggregation accuracy.
* **E7: Inspector Calendar**
  * Inspector John views scheduled inspections on calendar view → Verifies date/time alignment with assignment data.
* **E8: Admin Inspector Invite**
  * Admin sends email invitation to a new inspector → Inspector registers via invite link → Profile auto-links to inviting admin.

---

### 📁 Group F: Document Vault & Architecture (`TradeDocument`, `DocumentArchitecture`)
> Backend: `trade-document.service.ts`, `document-architecture.service.ts`
> Admin: `/settings/doc-hub`

* **F1: Contract Template & Clause Customization**
  * Admin selects template → Edits Payment Terms clause → Adds custom Inspection Clause → Draft contract updates in real time.
* **F2: Document Generation & Multi-Party Signing**
  * Admin generates contract PDF → Buyer signs → Supplier countersigns → Inspector signs (if applicable) → Final executed document with SHA-256 hash audit trail.
* **F3: Trade Document Upload & Status Management**
  * Supplier uploads LC (Letter of Credit) → Admin reviews & approves → Status transitions logged.

---

### 💰 Group G: Invoices & Payment Agreements (`InvoiceAgreement`, `InvoiceApproval`)
> Backend: `invoice-agreement.service.ts`, `invoice-approval.service.ts`
> Merchant: `/invoices`, `/invoices/[invoiceId]`
> Admin: `/invoices`, `/invoices/[id]`

* **G1: Invoice Creation & Counterpart Approval**
  * Supplier Floe Manager creates Invoice for Milestone #1 ($50,000) → Buyer Alpha Manager receives invoice → Clicks **Approve**.
* **G2: Admin Payment Milestone Approval**
  * Admin verifies bank receipt → Approves payment milestone → Activity log records `INVOICE_PAYMENT_APPROVED`.
* **G3: Invoice Rejection**
  * Buyer Alpha rejects invoice with reason "Quantity mismatch" → Supplier notified → Activity log records rejection.

---

### 🔒 Group H: Activity Log Privacy & Scrubbing (`ActivityLog`)
> Backend: `activity.service.ts`, `activity.controller.ts`
> Merchant: `/activity`
> Admin: `/activities`

* **H1: 4-Perspective Privacy Audit**
  * Buyer Alpha Manager uploads document. Viewed from:
    1. **Internal (Buyer Alpha Owner)**: `"Buyer Alpha Manager (BUYER)"` (Full name).
    2. **External (Supplier Floe)**: `"BUYER"` (Role only, name scrubbed).
    3. **External (Inspector John)**: `"BUYER"` (Role only).
    4. **Platform Admin**: `"Buyer Alpha Manager (BUYER)"` (Full name + role).

---

### 🩺 Group I: Profile Health & Onboarding (`ProfileHealth`)
> Merchant: `/overview` (profile-health.tsx)

* **I1: Buyer Profile Health**
  * Logged in as Buyer Alpha: Checks `useGetMyRfqOffersQuery` for RFQ offers; no catalog exploration step.
* **I2: Supplier Profile Health**
  * Logged in as Supplier Floe: Checklist verifies Storefront banner, Product listing count (>0), RFQ offer submission.
* **I3: Dual Role Profile Health**
  * Logged in as Merchant Dual: Both buyer and supplier checklist items accessible.

---

### 🔐 Group J: Auth, Registration & Account Management (`Auth`)
> Backend: `auth.service.ts`, `auth.controller.ts`, `admin-role.controller.ts`, `waitlist.controller.ts`
> Merchant: `/settings/account`, `/settings/security`
> Admin: `/users/all-users`, `/users/admin`, `/users/permission`, `/users/deletion-requests`, `/waitlist`

* **J1: New User Registration & Email Verification**
  * New user registers → Email verification sent → User clicks link → Account activated.
* **J2: Login & Token Refresh**
  * User logs in → JWT issued → Token refresh on expiry → Firebase custom token sync.
* **J3: Password Change & Security**
  * User changes password from Settings → Old sessions invalidated.
* **J4: Admin Role Management**
  * Super Admin creates a new `trade_admin` role for another user → Permissions applied.
* **J5: Account Deletion Requests**
  * User requests account deletion → Admin reviews deletion request → Approves or denies.
* **J6: Waitlist Management**
  * New signup added to waitlist → Admin approves or rejects from waitlist page.

---

### 🏬 Group K: Supplier Products & Storefront (`SupplierProduct`, `SupplierProfile`)
> Backend: `supplier-product.service.ts`, `supplier-profile.service.ts`
> Merchant: `/supplier-list`, `/supplier-list/create`, `/supplier-list/update/[id]`, `/supplier-list/company-profile/create`
> Admin: `/products`, `/products/[id]`, `/suppliers`

* **K1: Product Listing CRUD**
  * Supplier Floe creates new product listing (Lithium Ore, Grade A, 500 MT) → Edits price → Updates listing → Verifies on marketplace.
* **K2: Storefront Company Profile**
  * Supplier Floe sets up company profile (banner, description, certificates) → Profile visible on public marketplace.
* **K3: Admin Product Moderation**
  * Admin views all listed products → Suspends a flagged product listing.

---

### 🛒 Group L: Public Marketplace & Discovery
> Backend: `public-marketplace.controller.ts`
> Merchant: `/products`, `/products/all-mineral-cp`, `/products/rfq-products`, `/products/details/[id]`, `/rfqs`, `/rfqs/details/[id]`, `/marketplace/compare`

* **L1: Product Search & Filtering**
  * Buyer Alpha searches for "Tantalite" → Filters by grade, location, price range → Views product detail page.
* **L2: RFQ Marketplace Browse**
  * Supplier Floe browses open RFQs → Filters by mineral type → Views RFQ detail with requirements.
* **L3: Product Comparison**
  * Buyer Alpha selects 2-3 products → Opens compare view → Side-by-side specifications displayed.

---

### 📝 Group M: Reviews & Ratings (`Review`)
> Backend: `review.service.ts`, `review.controller.ts`

* **M1: Post-Trade Review Submission**
  * After completed trade, Buyer Alpha submits a review for Supplier Floe (rating + comment) → Review visible on supplier's storefront.
* **M2: Review Moderation**
  * Admin flags inappropriate review → Review hidden from public view.

---

### 📌 Group N: Saved Items & Bookmarks (`SavedItem`)
> Backend: `saved-item.service.ts`
> Merchant: `/saved-products`

* **N1: Save & Unsave Products**
  * Buyer Alpha saves "High-Grade Lithium Ore" to bookmarks → Appears in Saved Products page → Unsaves → Removed from list.

---

### ✅ Group O: Business Verification (`BusinessVerification`)
> Backend: `business-verification.service.ts`
> Merchant: `/company-info-verification`
> Admin: `/business`

* **O1: Business Document Submission**
  * Supplier Floe submits CAC certificate, Tax ID, and utility bill for verification.
* **O2: Admin Verification Review**
  * Admin reviews documents → Approves or requests re-submission → Verification status badge updates on storefront.

---

### 📰 Group P: Blog & Content Management (`Blog`)
> Backend: `blog.controller.ts`
> Admin: `/blogs`, `/blogs/create`, `/blogs/update/[id]`, `/blogs/categories`

* **P1: Blog Post CRUD**
  * Admin creates blog post → Publishes → Edits → Archives.
* **P2: Blog Category Management**
  * Admin creates/edits blog categories → Associates posts with categories.

---

### 📊 Group Q: Categories & Definitions (`Category`, `Definition`)
> Backend: `category.service.ts`, `definition.controller.ts`
> Admin: `/categories`, `/capabilities`

* **Q1: Mineral Category CRUD**
  * Admin creates "Rare Earths" category → Adds subcategories → Products auto-filter by category.
* **Q2: Mineral Definition & Capability Management**
  * Admin defines grade parameters, testing standards, and purity thresholds for minerals.

---

### 💬 Group R: Direct Messaging (`Chat`)
> Backend: `chat.controller.ts`
> Merchant: `/chat` (direct messages between buyers and suppliers outside of trade context)

* **R1: Direct Buyer-to-Supplier Message**
  * Buyer Alpha sends a direct message to Supplier Floe (non-trade inquiry context) → Message delivered in real-time.

---

### 📋 Group S: Enquiry Module (`Enquiry`)
> Backend: `enquiry.controller.ts`
> Admin: `/enquiry`

* **S1: General Enquiry Submission**
  * Visitor submits a contact form enquiry from the public website → Admin views and responds from enquiry dashboard.

---

### ⚙️ Group T: Admin Platform Settings
> Admin: `/settings`, `/settings/fees`, `/settings/doc-hub`

* **T1: Platform Fee Configuration**
  * Admin configures transaction fees (percentage / flat rate) → Fees applied to future invoices.
* **T2: Document Hub Template Management**
  * Admin creates/edits document templates and clause blocks → Templates available for contract generation.

---

### 🔔 Group U: Notifications
> Merchant: `/notifications`
> Admin: `/notifications`, `/notifications/send`

* **U1: Notification Delivery**
  * Trade events (acknowledge, reject, inspector assigned) generate in-app notifications → User views and clears from notification center.
* **U2: Admin Broadcast Notification**
  * Admin sends a platform-wide notification from `/notifications/send` → All users receive the broadcast.

---

### 📈 Group V: Analytics & Dashboards
> Merchant: `/analytics`, `/inspections/analytics`
> Admin: `/dashboard`

* **V1: Merchant Analytics Dashboard**
  * Supplier Floe views product views, inquiry count, and revenue metrics.
* **V2: Inspector Analytics**
  * Inspector John views completed jobs, avg turnaround time, and earnings.
* **V3: Admin Platform Dashboard**
  * Admin views total trades, active RFQs, pending verifications, and revenue overview.

---

### 🔄 Group W: Become a Supplier (Role Upgrade)
> Merchant: `/become-a-supplier`

* **W1: Buyer Role Upgrade to Dual**
  * Buyer Alpha navigates to "Become a Supplier" → Submits supplier profile & documents → Role upgrades from `buyer` to `buyer_supplier`.

---

### 🧮 Group X: Calculator Tool
> Merchant: `/calculator`

* **X1: Mineral Pricing Calculator**
  * Buyer Alpha uses the pricing calculator to estimate costs for a specific mineral type, grade, and quantity.

---

## 📊 3. Complete Summary Matrix

| Group | Scenarios | Domain Module | Status |
| :---: | :--- | :--- | :---: |
| **A** | A1–A5 (5) | Product Inquiry | 🟩 Ready |
| **B** | B1–B4 (4) | RFQ & Offers | 🟩 Ready |
| **C** | C1 (1) | Business Inquiry | 🟩 Ready |
| **D** | D1–D3 (3) | Team Permissions | 🟩 Ready |
| **E** | E1–E8 (8) | Inspector Workflows | 🟩 Ready |
| **F** | F1–F3 (3) | Document Vault | 🟩 Ready |
| **G** | G1–G3 (3) | Invoices | 🟩 Ready |
| **H** | H1 (1) | Activity Privacy | 🟩 Ready |
| **I** | I1–I3 (3) | Profile Health | 🟩 Ready |
| **J** | J1–J6 (6) | Auth & Accounts | 🟩 Ready |
| **K** | K1–K3 (3) | Supplier Products | 🟩 Ready |
| **L** | L1–L3 (3) | Marketplace | 🟩 Ready |
| **M** | M1–M2 (2) | Reviews | 🟩 Ready |
| **N** | N1 (1) | Saved Items | 🟩 Ready |
| **O** | O1–O2 (2) | Business Verification | 🟩 Ready |
| **P** | P1–P2 (2) | Blog CMS | 🟩 Ready |
| **Q** | Q1–Q2 (2) | Categories & Definitions | 🟩 Ready |
| **R** | R1 (1) | Direct Messaging | 🟩 Ready |
| **S** | S1 (1) | General Enquiry | 🟩 Ready |
| **T** | T1–T2 (2) | Admin Settings | 🟩 Ready |
| **U** | U1–U2 (2) | Notifications | 🟩 Ready |
| **V** | V1–V3 (3) | Analytics | 🟩 Ready |
| **W** | W1 (1) | Role Upgrade | 🟩 Ready |
| **X** | X1 (1) | Calculator | 🟩 Ready |
| | **TOTAL: 62 Scenarios** | **24 Groups** | |

---
*Generated from code inspection of 17 backend modules, 50+ merchant pages, and 40+ admin pages.*
*Created for Min-meg Staging & Production Quality Assurance.*
