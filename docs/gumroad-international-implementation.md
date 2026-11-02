# Gumroad International Checkout Integration

## Overview
This document describes the integration of Gumroad as the official global checkout provider for international and overseas students enrolled in ArchTipsBox courses (such as the D5 Render Masterclass).

## Configuration
Add the following variables to your `.env.local` or hosting provider environment variables:

```bash
# Direct checkout link for International Students
NEXT_PUBLIC_GUMROAD_D5_URL=https://archtipsbox.gumroad.com/l/d5masterclass?wanted=true

# (Optional) Secret token for verifying webhook pings from Gumroad
GUMROAD_WEBHOOK_SECRET=
```

## Checkout Flow
1. **Selection**: On the `/checkout` page, international students select the **International (Cards / Apple Pay)** tab.
2. **Student Experience**:
   - The UI presents a clean, high-conversion card highlighting accepted payment methods: Visa, MasterCard, American Express, Apple Pay, Google Pay, and PayPal.
   - It pre-fills the checkout link with the student's logged-in email using `?wanted=true&email=<student_email>` to reduce drop-offs.
3. **Tracking**:
   - When the student clicks **Proceed to International Checkout**, the application automatically records a `pending_enrollments` record in Supabase with `payment_method: 'gumroad'`.
   - Gumroad opens in a new tab (`target="_blank"`), leaving the website session open with a clear reassurance message.
4. **Automated Fulfillment (Webhook)**:
   - Gumroad sends a webhook ping to `/api/webhooks/gumroad`.
   - The endpoint matches the buyer email:
     - If the student already has an account, it activates enrollment in `course_enrollments` and `enrollments` immediately.
     - If the student hasn't registered an account yet, it records an approved pending enrollment so access is ready upon registration.
