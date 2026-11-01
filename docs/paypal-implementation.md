# PayPal Checkout Integration: Architecture & Client Guide

## Executive Summary & Specifications

* **Project:** Archtipsbox (LMS + Archviz Portfolio)
* **Payment Providers:** Bakong KHQR (Cambodia) + PayPal Checkout REST API Orders v2 (International)
* **Integration Strategy:** Automated Dynamic QR Code + Real-time Polling API (with graceful fallback to manual PayPal.me)
* **Primary Currency:** USD
* **Target Audience:** International students & clients outside Cambodia

---

## 1. System Overview

Archtipsbox provides automated online checkouts for courses and subscription plans.

| Payment Method | Target Audience | Mechanism | Status |
| :--- | :--- | :--- | :--- |
| **Bakong KHQR** | Cambodian students | Individual KHQR string, dynamic QR scan, status polling | **Active in Production** |
| **PayPal Dynamic QR** | International students | Orders v2 API, dynamic approval QR, real-time polling auto-capture | **Implemented & Ready for Keys** |
| **PayPal.me (Fallback)** | Offline / Manual | Static QR + manual receipt upload to `pending_enrollments` | **Built-in Fallback** |

---

## 2. Client Action Guide: Setting Up PayPal Credentials

To enable automated payments, the account receiving funds must have access to PayPal's REST API.

### 2.1 Free Account Upgrade (No Legal Company Required)
If you currently hold an international personal PayPal account:
1. Log into your PayPal account at [paypal.com](https://www.paypal.com).
2. Go to **Settings** (gear icon) > **Account Options**.
3. Click **Upgrade to a Business Account** (or visit `https://www.paypal.com/bizsignup/`).
4. Select **Individual / Sole Proprietor**:
   * **Cost:** **$0 (100% Free)**.
   * **Company Documents:** **None required**.
   * Use your own legal name as the business contact name and your personal bank account for withdrawals.
5. Once submitted, your account is immediately upgraded to an Individual Business account with full API access.

---

### 2.2 Generating API Credentials on PayPal Developer Portal

Follow these steps to generate the required keys:

1. **Log in to PayPal Developer:**
   * Visit [https://developer.paypal.com/](https://developer.paypal.com/) and sign in with your PayPal credentials.
2. **Navigate to Apps & Credentials:**
   * Go to [https://developer.paypal.com/dashboard/applications](https://developer.paypal.com/dashboard/applications).
3. **Sandbox App (For Testing):**
   * Select the **Sandbox** toggle.
   * Click **Create App**, name it `Archtipsbox-Sandbox`.
   * Copy the **Client ID** and **Client Secret**.
4. **Live App (For Production):**
   * Select the **Live** toggle.
   * Click **Create App**, name it `Archtipsbox-Live`.
   * Copy the **Live Client ID** and **Live Client Secret**.
5. **(Optional) Webhooks:**
   * In your App settings, scroll to **Webhooks** > **Add Webhook**.
   * Webhook URL: `https://archtipsbox.com/api/checkout/paypal/webhook`
   * Select events: `PAYMENT.CAPTURE.COMPLETED`, `CHECKOUT.ORDER.APPROVED`.
   * Save and copy the **Webhook ID**.
6. **Send Credentials Securely:**
   * Provide the credentials to your developer using a password manager or one-time secret link (e.g. 1Password, Bitwarden, or Privnote). Never share the Client Secret in public chats.

---

## 3. Environment Variables (.env)

The backend automatically switches between Sandbox and Live based on `PAYPAL_ENVIRONMENT`.

```env
# --- PAYPAL CHECKOUT INTEGRATION (Orders v2 API) ---
# Environment: 'sandbox' for testing, 'live' for production
PAYPAL_ENVIRONMENT=sandbox

# Server-side API credentials (keep secret)
PAYPAL_CLIENT_ID=your_paypal_client_id_here
PAYPAL_CLIENT_SECRET=your_paypal_client_secret_here

# Client-side Public App ID for browser buttons (same as PAYPAL_CLIENT_ID)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id_here

# Webhook ID from PayPal Dashboard -> Webhooks (optional, for signature verification)
PAYPAL_WEBHOOK_ID=

# Fallback PayPal.me handle (used if API credentials are not yet set)
NEXT_PUBLIC_PAYPAL_HANDLE=bunsambath10
```

---

## 4. End-to-End Payment Architecture

```
                       [ STUDENT ON CHECKOUT PAGE ]
                                    │
                    Selects "PayPal (International)"
                                    │
                                    ▼
       Calls POST /api/checkout/paypal/create-order
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        BACKEND API & PAYPAL                            │
│ 1. Validates authenticated user session.                               │
│ 2. Queries course price or subscription plan from Supabase DB.         │
│ 3. Applies valid promo code discount if provided.                      │
│ 4. Inserts pending record into public.payment_transactions.           │
│ 5. Calls PayPal Orders v2 API (POST /v2/checkout/orders).              │
│ 6. PayPal returns unique approval URL:                                 │
│    https://www.paypal.com/checkoutnow?token=ORDER_ID                   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND DYNAMIC QR                             │
│ • Displays Dynamic PayPal QR Code generated from unique approval URL   │
│ • Shows exact price in USD ($49.00) & bill number reference            │
│ • Starts real-time polling GET /api/checkout/paypal/status every 3s    │
│ • Includes "Pay in this Browser" button for desktop users              │
│ • Includes "Switch to manual upload" fallback option                   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                 Student scans QR on phone & approves
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   AUTO-VERIFICATION & FULFILLMENT                      │
│ 1. Frontend polls /api/checkout/paypal/status?billNumber=...           │
│ 2. Backend queries PayPal API: GET /v2/checkout/orders/{id}            │
│ 3. Status is APPROVED -> Backend calls POST /v2/checkout/.../capture   │
│ 4. Capture is COMPLETED -> Runs lib/payments/fulfillment.ts:           │
│    - Updates public.payment_transactions (status: 'completed')         │
│    - Upserts public.course_enrollments (status: 'active')              │
│    - Upgrades public.profiles role to 'student'                        │
│    - Increments promo code redemption counter                          │
│    - Dispatches Resend receipt email (sendEmail)                       │
│    - Dispatches Telegram invoice notification to instructor            │
│ 5. Returns { status: 'completed' } to frontend                         │
│ 6. Browser automatically unlocks course and redirects to classroom!    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Backend API Routes

All PayPal routes are organized under `/api/checkout/paypal/`:

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| `POST` | `/api/checkout/paypal/create-order` | Validates price/promo, inserts pending transaction, creates PayPal order, returns approval URL for QR |
| `GET` | `/api/checkout/paypal/status` | Polling endpoint (every 3s). Queries PayPal order status, auto-captures on approval, and triggers fulfillment |
| `POST` | `/api/checkout/paypal/capture-order` | Direct capture endpoint for in-browser payments |
| `POST` | `/api/checkout/paypal/webhook` | Asynchronous webhook listener (`PAYMENT.CAPTURE.COMPLETED`) with signature verification |

---

## 6. Database Schema Alignment

The integration utilizes Archtipsbox's existing Supabase database schema with zero redundant tables:

### 6.1 `public.payment_transactions`
Stores all payment attempts and completed transactions for Bakong and PayPal.
* `transaction_id`: UUID (Primary Key)
* `user_id`: UUID (references `public.profiles.id`)
* `course_id`: UUID (references `public.courses.course_id`, nullable)
* `plan_id`: INT (references `public.subscription_plans.plan_id`, nullable)
* `payment_method`: TEXT (`'paypal'`, `'bakong_khqr'`, `'promo_free'`)
* `bill_number`: TEXT (Unique internal reference, e.g. `BILL-PP-173048...`)
* `amount`: NUMERIC(12,2)
* `currency`: TEXT (`'USD'`)
* `external_tx_hash`: TEXT (Stores PayPal Order ID or Capture ID)
* `payment_status`: TEXT (`'pending'`, `'completed'`, `'failed'`, `'expired'`)
* `promo_code`: TEXT (references `public.promo_codes.code`)
* `created_at`: TIMESTAMPTZ
* `completed_at`: TIMESTAMPTZ

### 6.2 `public.course_enrollments`
Course access is unlocked by inserting/upserting:
* `student_id`: User UUID
* `course_id`: Course UUID
* `status`: `'active'`
* `enrolled_at`: Current timestamp

### 6.3 `public.profiles`
User role is upgraded to `'student'` upon successful completion (preserving `'admin'` and `'instructor'`).

---

## 7. Shared Fulfillment Engine (`lib/payments/fulfillment.ts`)

Per the project architecture rules in `AGENTS.md`, fulfillment logic across Bakong KHQR, PayPal Capture, and Webhooks is centralized in `lib/payments/fulfillment.ts`.

When any payment confirms:
1. `payment_transactions` is marked `'completed'` with the capture ID.
2. `course_enrollments` (or `user_subscriptions`) is activated.
3. `profiles.role` upgrades to `'student'`.
4. `promo_codes.redemptions_count` increments.
5. Resend dispatches a customer HTML receipt with a direct access button.
6. Telegram bot alerts the instructor with customer name, email, amount, and bill number.

---

## 8. Graceful Fallback (Dual-Mode Design)

If `PAYPAL_CLIENT_ID` or `PAYPAL_CLIENT_SECRET` are not yet set in `.env`:
* The checkout page automatically detects that the API gateway is not yet configured.
* It gracefully switches to the **Manual PayPal.me + Receipt Upload** flow.
* The customer sees a PayPal.me QR code, note reference, and an upload box for proof of payment.
* Once the client pastes their API credentials into `.env`, the **Dynamic QR Code and instant auto-enrollment turn on automatically** without touching any code!

---

## 9. Implementation Checklist

| Phase | Milestone | Status |
| :---: | :--- | :---: |
| **1** | Shared fulfillment pipeline (`lib/payments/fulfillment.ts`) | ✅ Completed |
| **2** | Backend PayPal REST API client (`lib/paypal.ts`) | ✅ Completed |
| **3** | Dynamic order creation route (`/api/checkout/paypal/create-order`) | ✅ Completed |
| **4** | Real-time status polling route (`/api/checkout/paypal/status`) | ✅ Completed |
| **5** | Direct capture route (`/api/checkout/paypal/capture-order`) | ✅ Completed |
| **6** | PayPal Webhook route (`/api/checkout/paypal/webhook`) | ✅ Completed |
| **7** | Dynamic PayPal QR checkout UI (`app/checkout/page.tsx`) | ✅ Completed |
| **8** | Graceful manual fallback toggle | ✅ Completed |
| **9** | Environment variables documented (`.env.example`) | ✅ Completed |
| **10** | Strict TypeScript and ESLint verification (`pnpm typecheck && pnpm lint`) | ✅ Completed |
| **11** | Unit test suite verification (`tests/unit/paypal-checkout.test.ts`) | ✅ Completed |
| **12** | Client adds Sandbox credentials to `.env` | ⏳ Pending Client |
| **13** | End-to-end Sandbox transaction verification | ⏳ Pending Client |
| **14** | Client adds Live credentials to `.env` & switches `PAYPAL_ENVIRONMENT=live` | ⏳ Pending Client |

---

## 10. Official PayPal Documentation References

1. **PayPal Developer Portal:** [https://developer.paypal.com/](https://developer.paypal.com/)
2. **Orders v2 REST API:** [https://developer.paypal.com/docs/api/orders/v2/](https://developer.paypal.com/docs/api/orders/v2/)
3. **PayPal OAuth 2.0:** [https://developer.paypal.com/api/rest/authentication/](https://developer.paypal.com/api/rest/authentication/)
4. **PayPal Webhooks:** [https://developer.paypal.com/api/rest/webhooks/](https://developer.paypal.com/api/rest/webhooks/)
