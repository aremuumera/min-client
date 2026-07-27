# 🚀 Min-meg Production Testing Guide & Seed Accounts

This document provides a concise setup guide for seed accounts and core test scenarios for the Min-meg platform's production-readiness verification.

---

## 👥 1. Required Seed Accounts (Total: 8 Accounts)

| # | Account Identifier | Persona / Role | Company Context | Key Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **1** | `buyer_alpha@minmeg.com` | `buyer` (Owner) | Alpha Procurement Ltd | Primary Buyer for multi-cycle product inquiries & RFQ postings. |
| **2** | `buyer_alpha_team@minmeg.com` | `buyer` (Team Member) | Alpha Procurement Ltd | Team member under Buyer Alpha to verify internal vs external activity log privacy. |
| **3** | `buyer_beta@minmeg.com` | `buyer` (Owner) | Beta Global Imports | Secondary Buyer to test multiple buyers inquiring on the **same** product. |
| **4** | `supplier_floe@minmeg.com` | `supplier` (Owner) | Floe Minerals Corp | Primary Supplier with listed products & storefront setup. |
| **5** | `supplier_floe_team@minmeg.com` | `supplier` (Team Member) | Floe Minerals Corp | Team member under Supplier Floe to verify supplier team activity logs. |
| **6** | `merchant_dual@minmeg.com` | `buyer_supplier` / `both` | Apex Mining & Trade | Dual-role merchant (bids on RFQs as seller + posts RFQs as buyer). |
| **7** | `inspector_john@minmeg.com` | `inspector` | Global GeoInspect Ltd | Independent Inspector appointed by Admin to inspect shipments and issue certificates. |
| **8** | `admin_desk@minmeg.com` | `super_admin` / `trade_admin` | Min-meg Operations | Platform Admin to evaluate trades, assign inspectors, manage document templates/clauses, approve statuses. |

---

## 🧪 2. Core Product & Trade Room Scenarios

> 💡 **Codebase Rule for Trade Room Creation**:
> * **Same Buyer + Same Supplier + SAME Product (`product_id`)** $\rightarrow$ Reuses `firebase_room_id` $\rightarrow$ Groups into **1 Trade Room** with multiple trade cycles (tabs).
> * **Same Buyer + Same Supplier + DIFFERENT Products** $\rightarrow$ Generates new `firebase_room_id` $\rightarrow$ Creates **Separate Trade Rooms** per product.
> * **Different Buyers + Same Supplier** $\rightarrow$ Creates **Separate Trade Rooms** per buyer.

### Scenario A1: Single Buyer + Single Supplier + Single Trade Cycle (End-to-End)
* **Parties Involved**: `Buyer Alpha` + `Supplier Floe` + `Inspector John` + `Admin`
* **Flow**:
  1. `Buyer Alpha` browses catalog and sends Product Inquiry for "High-Grade Lithium Ore" (Product ID #1).
  2. `Supplier Floe` receives inquiry directly, clicks **Acknowledge Trade**.
  3. `Admin` opens Trade Room → Generates Contract Template → Customizes Clauses.
  4. `Buyer Alpha` and `Supplier Floe` review and **Sign Contract** in Document Vault.
  5. `Admin` appoints `Inspector John` to inspect shipment.
  6. `Inspector John` accepts job assignment → uploads inspection photos & report → issues Quality Certificate.
  7. `Admin` approves inspection certificate → Trade moves to Completed.
* **Verification**: Verify audit timeline logs at every step.

### Scenario A2: Single Buyer + Single Supplier + MULTIPLE Inquiries on SAME Product (Multi-Cycle)
* **Parties Involved**: `Buyer Alpha` + `Supplier Floe`
* **Flow**:
  1. `Buyer Alpha` creates Inquiry #1 for Product ID #1 ("High-Grade Lithium Ore", 1,000 MT) with `Supplier Floe`.
  2. `Buyer Alpha` later creates Inquiry #2 for the **SAME Product ID #1** ("High-Grade Lithium Ore", additional 500 MT) with `Supplier Floe`.
  3. Both cycles group inside the **SAME Firestore Trade Room** (`trade_rooms/{roomId}/trades`).
  4. Admin hides Trade Cycle #1 from users.
* **Expected Result**:
  * `Buyer Alpha` & `Supplier Floe` **STILL SEE** the Trade Room in their sidebars because Trade Cycle #2 is still active.
  * Inside the room, Trade Cycle #1 tab vanishes, leaving only Trade Cycle #2.

### Scenario A3: Single Buyer + Single Supplier + DIFFERENT Products (Separate Trade Rooms)
* **Parties Involved**: `Buyer Alpha` + `Supplier Floe`
* **Flow**:
  1. `Buyer Alpha` sends Inquiry for Product ID #1 ("High-Grade Lithium Ore") to `Supplier Floe`.
  2. `Buyer Alpha` sends a second Inquiry for Product ID #2 ("Spodumene Concentrate") to the **SAME** `Supplier Floe`.
* **Expected Result**:
  * Because Product ID #1 $\neq$ Product ID #2, the system creates **2 SEPARATE Trade Rooms** in both sidebars (one room per product).
  * Each room operates independently with its own chat history and document vault.

### Scenario A4: Multiple Different Buyers for the SAME Product / Supplier
* **Parties Involved**: `Buyer Alpha` + `Buyer Beta` + `Supplier Floe`
* **Flow**:
  1. `Buyer Alpha` sends Inquiry for Product ID #1 ("High-Grade Lithium Ore").
  2. `Buyer Beta` ALSO sends an Inquiry for the SAME Product ID #1 ("High-Grade Lithium Ore").
* **Expected Result**:
  * `Supplier Floe` gets **2 separate Trade Rooms** in their sidebar (one with `Buyer Alpha`, one with `Buyer Beta`).
  * `Buyer Alpha` sees only their own room with `Supplier Floe`.
  * `Buyer Beta` sees only their own room with `Supplier Floe`.
  * Neither buyer can see or access the other buyer's trade room or chat.

### Scenario A5: Trade Cycle Rejection & Auto-Hide
* **Parties Involved**: `Buyer Alpha` + `Supplier Floe`
* **Flow**:
  1. `Buyer Alpha` sends Product Inquiry.
  2. `Supplier Floe` clicks **Decline / Reject Trade** with reason "Out of Stock".
* **Expected Result**:
  * Trade status changes to `REJECTED`. Rejection Action Panel displays reason.
  * Room remains visible for 24-hour grace period, then auto-hides from merchant sidebars.

---

### Scenario B1: Buyer Posts RFQ + Multiple Suppliers Submit Competing Offers
* **Parties Involved**: `Buyer Alpha` + `Supplier Floe` + `Merchant Dual` + `Admin`
* **Flow**:
  1. `Buyer Alpha` posts a public RFQ: "Required: 2,000 MT Tantalite Ore, Grade 30%+".
  2. `Supplier Floe` submits Offer #1 ($45,000 / MT).
  3. `Merchant Dual` (acting as supplier) submits Offer #2 ($42,500 / MT).
  4. `Admin` reviews offers on Admin Dashboard → Accepts Offer #2 (`Merchant Dual`).
* **Expected Result**:
  * An RFQ Trade Room is created between `Buyer Alpha`, `Merchant Dual`, and `Admin`.
  * `Supplier Floe` receives notification that their offer was not selected / rejected.
  * Buyer & winning Supplier progress into narrow trade negotiation & document signatures.

### Scenario B2: Multi-Cycle Bidding inside RFQ Room
* **Parties Involved**: `Buyer Alpha` + `Merchant Dual`
* **Flow**:
  1. `Buyer Alpha` accepts Offer #1 from `Merchant Dual`.
  2. Later, `Merchant Dual` submits a revised supplementary Offer #2 for additional quantity on the same RFQ.
  3. Both offers exist as subcollection cycles inside the RFQ Trade Room.
  4. Admin hides Offer #1.
* **Expected Result**:
  * Room remains in sidebar with Offer #2 active.
  * When Admin hides Offer #2 as well (0 active cycles remaining for `Merchant Dual`), the room **instantly vanishes** from `Merchant Dual`'s sidebar and active thread view redirects to `/dashboard/chat`.

---

### Scenario C1: Internal Team vs External Party Privacy Audit
* **Parties Involved**: `Buyer Alpha (Owner)`, `Buyer Alpha Team`, `Supplier Floe (Owner)`, `Inspector John`, `Admin`
* **Flow**:
  1. `Buyer Alpha Team` uploads a trade contract document.
  2. View Activity Log from **4 perspectives**:
     * **Perspective 1 (`Buyer Alpha Owner`)**: Sees `"John Doe (BUYER)"` (Full name visible for internal team members).
     * **Perspective 2 (`Supplier Floe`)**: Sees `"BUYER"` (Name is scrubbed; role only).
     * **Perspective 3 (`Inspector John`)**: Sees `"BUYER"` (Name is scrubbed; role only).
     * **Perspective 4 (`Minmeg Admin`)**: Sees `"John Doe (BUYER)"` (Full name & role visible for Admin).

---

### Scenario D1: Role-Based Profile Health Checklist
* **Parties Involved**: `Buyer Alpha` vs `Supplier Floe` vs `Merchant Dual`
* **Flow**:
  1. Log in as `Buyer Alpha` (`buyer`):
     * Verify "Submit an RFQ Offer" is tracked via `useGetMyRfqOffersQuery`.
     * Verify no "Explore Catalog" or supplier storefront setup tasks are shown.
  2. Log in as `Supplier Floe` (`supplier`):
     * Verify Storefront setup, Product Creation, and RFQ Offer tasks are tracked.
  3. Log in as `Merchant Dual` (`buyer_supplier`):
     * Verify both Buyer and Supplier health tasks are accessible.

---

## 📊 Summary Checklist

| Scenario ID | Scenario Name | Primary Persona | Verification Point | Status |
| :--- | :--- | :--- | :--- | :--- |
| **A1** | Single Product Trade E2E | Buyer + Supplier + Inspector | Full lifecycle + Inspection certificate | ⬜ |
| **A2** | Multi-Cycle Same Product | Buyer + Supplier | 1 Room with sub-tabs for same product inquiries | ⬜ |
| **A3** | Multi-Product Same Supplier | Buyer + Supplier | 2 Separate Rooms for different products | ⬜ |
| **A4** | Multi-Buyer Same Product | Buyer A + Buyer B + Supplier | 2 isolated rooms; no cross-buyer leak | ⬜ |
| **A5** | Inquiry Rejection | Buyer + Supplier | Rejection panel + 24h auto-hide | ⬜ |
| **B1** | RFQ Multi-Supplier Bids | Buyer + 2 Suppliers + Admin | Admin evaluation + Trade room spawn | ⬜ |
| **B2** | RFQ Multi-Cycle Auto-Hide | Buyer + Supplier | Room vanishes when 0 cycles remain | ⬜ |
| **C1** | Activity Log Privacy | Team + Counterpart + Admin | Internal = Full Name; External = Role Only | ⬜ |
| **D1** | Profile Health Checklist | Buyer vs Supplier vs Both | Accurate role queries & no catalog steps | ⬜ |

---

> **For the exhaustive 62-scenario matrix covering all 17 backend modules, see [PRODUCTION_TESTING_MATRIX.md](./PRODUCTION_TESTING_MATRIX.md).**

---
*Created for Min-meg Staging & Production Verification.*
