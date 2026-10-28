# ArchTipsBox — Next Phase Architecture & Enhancement Plan (v4)

**Platform:** [archtipsbox.com](https://archtipsbox.com/)  
**Document Version:** 4.0.0  
**Status:** Approved for Implementation  
**Target Stack:** Next.js 16 (App Router), React 19, TypeScript (Strict), Tailwind CSS v4, Supabase (PostgreSQL RLS), Bunny Stream HLS, Bakong KHQR & PayPal.

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Critical Root-Cause Bug Fixes](#2-critical-root-cause-bug-fixes)
   - [2.1 Fix: Broken Syllabus Analytics](#21-fix-broken-syllabus-analytics)
   - [2.2 Fix: "Assign Lesson" Resetting / Module Wipe](#22-fix-assign-lesson-resetting--module-wipe)
3. [Course Authoring & Management Enhancements](#3-course-authoring--management-enhancements)
   - [3.1 Inline Lesson Rename (Zero-Modal Workflow)](#31-inline-lesson-rename-zero-modal-workflow)
   - [3.2 Drag-and-Drop Reordering with Auto-Indexing](#32-drag-and-drop-reordering-with-auto-indexing)
   - [3.3 Auto-Sync Video Duration](#33-auto-sync-video-duration)
   - [3.4 Thumbnail Inheritance & Bulk Apply](#34-thumbnail-inheritance--bulk-apply)
4. [Monetization & International Growth](#4-monetization--international-growth)
   - [4.1 PayPal QR & International Payment Gateway](#41-paypal-qr--international-payment-gateway)
5. [Security & Anti-Piracy Architecture](#5-security--anti-piracy-architecture)
   - [5.1 Multi-Device Limiting (Anti-Account Sharing)](#51-multi-device-limiting-anti-account-sharing)
6. [Database Schema Migrations](#6-database-schema-migrations)
7. [API Route Specifications](#7-api-route-specifications)
8. [Phased Implementation Roadmap & Verification Checklist](#8-phased-implementation-roadmap--verification-checklist)

---

## 1. Executive Summary

This enhancement plan addresses high-impact instructor workflow bottlenecks, dashboard reporting failures, international conversion gaps, and digital rights management (DRM) leaks in ArchTipsBox.

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                       ARCHTIPSBOX SCALE & ENHANCE SUITE                        │
├────────────────────┬─────────────────────────────┬─────────────────────────────┤
│ 1. URGENT REPAIRS  │ 2. INSTRUCTOR STUDIO (UX)   │ 3. REVENUE & ACCESS CONTROL │
│ • Syllabus query   │ • Instant inline rename     │ • PayPal QR Checkout        │
│ • Module retention │ • Drag-and-drop reordering  │ • 2-Device Session Lock     │
│                    │ • Bunny duration auto-sync  │ • Self-service device audit │
│                    │ • Chapter thumb inheritance │                             │
└────────────────────┴─────────────────────────────┴─────────────────────────────┘
```

---

## 2. Critical Root-Cause Bug Fixes

### 2.1 Fix: Broken Syllabus Analytics

#### Root Cause
In `lib/react-query/hooks/use-admin.ts` (lines 85–95), the `lessons` query is conditionally disabled when the user is on any tab other than `"courses"`:
```ts
// BUG in lib/react-query/hooks/use-admin.ts
const lessons = useQuery({
  queryKey: queryKeys.admin.adminLessons,
  queryFn: async () => { ... },
  staleTime: 2 * 60 * 1000,
  enabled: activeTab === "courses", // ❌ Evaluates to false on activeTab === "analytics"
})
```
When an admin views the **Syllabus Analytics** tab, `lessons` resolves to `[]`. In `app/admin/page.tsx`, `courseLessons.length === 0`, causing all `AreaChart` components to starve of data points and display: *"No lessons registered in this course curriculum."*

#### Code Patch
```ts
// FIXED in lib/react-query/hooks/use-admin.ts
const lessons = useQuery({
  queryKey: queryKeys.admin.adminLessons,
  queryFn: async () => {
    const res = await fetch('/api/admin/lessons')
    if (!res.ok) return []
    const json = await res.json()
    return json.lessons || []
  },
  staleTime: 2 * 60 * 1000,
  enabled: activeTab === "courses" || activeTab === "analytics", // ✅ Enabled for analytics
})
```

---

### 2.2 Fix: "Assign Lesson" Resetting / Module Wipe

#### Root Cause
1. In `app/admin/page.tsx` (`handleSaveLesson`, lines 1002–1012), the payload dispatched to `POST /api/admin/lessons` omits `module_id`.
2. In `app/api/admin/lessons/route.ts` (line 195):
   ```ts
   module_id: typeof body.module_id === 'string' && body.module_id ? body.module_id : null
   ```
   When saving an edited lesson, `body.module_id` is `undefined`, causing the endpoint to wipe `module_id = null` in the database. Every time an admin edits a lesson's title, asset, or video, its module link is severed.

#### Code Patch
1. **Preserve `module_id` on Lesson Updates (`app/api/admin/lessons/route.ts`):**
   ```ts
   // If updating and module_id is not provided in body, do not overwrite existing module_id
   const payload: Record<string, any> = {
     title,
     video_source_type: sourceType,
     video_external_id: videoExternalId,
     duration_minutes: durationMinutes,
     order_index: orderIndex,
     downloadable_asset_url: downloadableAssetUrl || null,
     thumbnail_url: thumbnailUrl || null
   }
   
   // Only explicitly update module_id if key was supplied in the request body
   if (body.module_id !== undefined) {
     payload.module_id = typeof body.module_id === 'string' && body.module_id ? body.module_id : null
   }
   ```
2. **Include Current `module_id` in Edit Form (`app/admin/page.tsx`):**
   Ensure `lessonForm.module_id` is initialized when opening `handleEditLesson(les)` and forwarded inside `handleSaveLesson`.

---

## 3. Course Authoring & Management Enhancements

### 3.1 Inline Lesson Rename (Zero-Modal Workflow)

Eliminate the multi-click friction of opening modals just to fix a typo or rename a chapter item.

#### UX Flow
1. In the Syllabus lesson list, hovering over a lesson reveals a subtle edit pencil icon next to the title.
2. Clicking the pencil (or double-clicking the title text) switches the title text into an inline input field with autofocus.
3. **Save triggers:**
   - Pressing `Enter`
   - Clicking the green `Check` icon
   - Blur / clicking outside
4. **Cancel triggers:** Pressing `Escape`
5. An optimistic UI update changes the title immediately while sending `PATCH /api/admin/lessons` in the background.

```
[ Normal State ]  ▶ Lesson 03: Lighting Setup                   [ ✎ ] [ ⋮ ]
[ Editing State ] ▶ [ Lighting Setup - Advanced V-Ray HDRI    ] [ ✓ ] [ ✕ ]
```

---

### 3.2 Drag-and-Drop Reordering with Auto-Indexing

#### Problem
Instructors currently have to manually calculate and type `order_index` (e.g., changing index from 5 to 6). Inserting a lesson between 2 and 3 requires re-indexing all subsequent lessons manually.

#### Solution
* Integrate `@hello-pangea/dnd` (the React 19-safe fork of `react-beautiful-dnd`).
* Render a `GripVertical` handle icon on each lesson card.
* When dragged to a new position (within a module or between modules):
  1. The client re-sequences the items `order_index = 1, 2, 3...` in local state instantly.
  2. The client debounces and triggers a single batch call to `PATCH /api/admin/lessons/reorder`:
     ```json
     {
       "course_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
       "updates": [
         { "lesson_id": "4a08...", "order_index": 1, "module_id": "mod-1" },
         { "lesson_id": "5c12...", "order_index": 2, "module_id": "mod-1" },
         { "lesson_id": "9f34...", "order_index": 3, "module_id": "mod-2" }
       ]
     }
     ```

---

### 3.3 Auto-Sync Video Duration

Instructors should never have to manually enter video durations in minutes.

#### Implementation Architecture
* **For Bunny Stream:**
  * When an instructor pastes a Bunny Stream Video ID into the input:
  * Trigger an automated server-side query:
    ```
    GET https://video.bunnycdn.com/library/{BUNNY_STREAM_LIBRARY_ID}/videos/{videoExternalId}
    Headers: AccessKey: {BUNNY_STREAM_API_KEY}
    ```
  * Response contains `{ "length": 1425 }` (duration in seconds).
  * Auto-populate the lesson form with `duration_minutes: Math.ceil(1425 / 60)` (24 minutes).
* **For YouTube / Direct MP4 URLs:**
  * For YouTube: Call existing `/api/youtube/info` endpoint.
  * For MP4: Load metadata in an offscreen HTML5 `Audio`/`Video` element on client: `video.onloadedmetadata = () => Math.round(video.duration / 60)`.
* **UI Control:** Add a small **"Sync Duration"** icon button next to the duration field for on-demand re-syncing.

---

### 3.4 Thumbnail Inheritance & Bulk Apply

#### Problem
Setting thumbnails for 40 individual lessons is tedious. Often, every lesson in a chapter shares the same stylized 3D chapter render.

#### Solution
1. **Fallback Inheritance (Zero-Config):**
   In the public LMS classroom and syllabus components:
   ```ts
   const displayThumbnail = 
     lesson.thumbnail_url || 
     lesson.module?.cover_image_url || 
     course.thumbnail_url || 
     '/placeholder-course.jpg';
   ```
2. **Bulk Chapter Thumbnail Action:**
   In the Admin Module manager, add an action button:
   - **"Apply Chapter Cover to All Lessons in this Module"**
   - Dispatches a quick update query:
     ```sql
     UPDATE lessons 
     SET thumbnail_url = $module_cover_url 
     WHERE module_id = $module_id AND (thumbnail_url IS NULL OR thumbnail_url = '');
     ```

---

## 4. Monetization & International Growth

### 4.1 PayPal QR & International Payment Gateway

To capture non-Cambodian students who cannot use Bakong KHQR, we add an international payment path.

#### Two-Track Architecture

```
                                  [ Checkout Page ]
                                         │
                 ┌───────────────────────┴────────────────────────┐
                 ▼                                                ▼
     [ Cambodian Student: KHQR ]                    [ International Student: PayPal ]
                 │                                                │
       Scan KHQR via Bakong                             Scan PayPal QR / Click Link
                 │                                                │
   Auto-Poll /api/checkout/status                 Upload Receipt / Input Transaction ID
                 │                                                │
        Instant Activation                       Created in `pending_enrollments`
                                                                  │
                                                        Admin 1-Click Approval
                                                        (or Automated via Webhook)
```

#### UI Specification in `app/checkout/page.tsx`
* Under the payment method tabs, add **"PayPal (International)"**.
* **Display Elements:**
  1. High-resolution PayPal QR Code.
  2. Instant Click-to-Pay button (`https://paypal.me/YOUR_HANDLE/{amount}USD`).
  3. Dynamic Order Reference Tag: `Order Ref: ATB-[COURSE_SLUG]-[USER_SHORT_ID]`.
  4. Receipt upload box or PayPal Transaction ID field.
* **Database State:**
  Inserts record into `pending_enrollments` or `orders` with `payment_method = 'paypal'` and status `'pending_review'`.
* **Admin Verification:**
  On the Admin Overview & Users tab, display pending international payments with a 1-click **"Approve & Enroll"** button that promotes the student and triggers their welcome email.

---

## 5. Security & Anti-Piracy Architecture

### 5.1 Multi-Device Limiting (Anti-Account Sharing)

#### The Problem
Students purchasing a subscription or course frequently share login credentials with classmates or studios, multiplying unauthorized video streaming.

#### The Enforcement Point: Bunny Video Token Minting
Because ArchTipsBox already routes every playback request through the gated API endpoint [`/api/lessons/[lessonId]/video`](file:///d:/Contribute/ArchProject/archviz-portfolio-website/app/api/lessons/[lessonId]/video/route.ts), we enforce strict device concurrency **inside Postgres and the token generation handler**.

```
[ Student Browser ] ───(1. Request Video URL)───> [ /api/lessons/[id]/video ]
                                                            │
                                              Extract: Client Device Fingerprint
                                                            │
                                             Check `user_active_devices` Table
                                                            │
                                  ┌─────────────────────────┴─────────────────────────┐
                                  ▼                                                   ▼
                         Active Devices ≤ 2                                  Active Devices > 2
                                  │                                                   │
                       Update `last_active_at`                          Is this a recognized device?
                                  │                                         ├── YES ─> Issue Token
                       Issue Bunny Signed Token                             └── NO  ─> Trigger Policy:
                                                                                • Auto-kick oldest OR
                                                                                • Return 403 Session Limit
```

#### Technical Rules
1. **Device Fingerprint Identification:**
   On login, client generates a persistent `device_uuid` stored in `localStorage`. Sent in headers: `X-Device-Id`, `X-Device-Name` (e.g. *"MacBook Pro 16 - Chrome"*).
2. **Concurrency Cap:** Standard accounts are allowed a maximum of **2 active devices** (e.g., 1 primary workstation + 1 mobile/tablet).
3. **Session Eviction:**
   When a 3rd unrecognized device requests a lesson video, the system performs an **Auto-Eviction of the oldest inactive device**, logging that device out, or blocks streaming with a clean UI prompt:
   *"Active device limit reached (2 devices). Manage active devices in Account Settings."*
4. **Student Self-Service Portal:**
   Add a **"Registered Devices"** section under `/dashboard/account` allowing students to view and revoke authorized devices.

---

## 6. Database Schema Migrations

Save and execute the following SQL migration in the Supabase SQL editor:

```sql
-- ============================================================================
-- Migration: Next Phase Enhancements (Device Limits & Batch Reordering)
-- ============================================================================

-- 1. Active Devices Table for Anti-Account Sharing
CREATE TABLE IF NOT EXISTS public.user_active_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    device_name TEXT DEFAULT 'Browser / Workstation',
    ip_address TEXT,
    user_agent TEXT,
    last_active_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT user_device_unique UNIQUE(user_id, device_id)
);

ALTER TABLE public.user_active_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own devices" ON public.user_active_devices;
CREATE POLICY "Users view own devices" ON public.user_active_devices
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own devices" ON public.user_active_devices;
CREATE POLICY "Users delete own devices" ON public.user_active_devices
    FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins view all devices" ON public.user_active_devices;
CREATE POLICY "Admins view all devices" ON public.user_active_devices
    FOR ALL USING (public.is_instructor_or_admin(auth.uid()));

-- 2. Device Enforcement RPC
CREATE OR REPLACE FUNCTION public.enforce_device_session(
    p_user_id UUID,
    p_device_id TEXT,
    p_device_name TEXT,
    p_max_devices INT DEFAULT 2
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_device_count INT;
    v_existing_device UUID;
BEGIN
    -- Check if this specific device is already registered
    SELECT id INTO v_existing_device
    FROM public.user_active_devices
    WHERE user_id = p_user_id AND device_id = p_device_id;

    IF v_existing_device IS NOT NULL THEN
        -- Update heartbeat timestamp
        UPDATE public.user_active_devices
        SET last_active_at = now(),
            device_name = COALESCE(p_device_name, device_name)
        WHERE id = v_existing_device;

        RETURN jsonb_build_object('allowed', true, 'action', 'updated');
    END IF;

    -- Count active devices
    SELECT COUNT(*) INTO v_device_count
    FROM public.user_active_devices
    WHERE user_id = p_user_id;

    -- If limit exceeded, evict the oldest device
    IF v_device_count >= p_max_devices THEN
        DELETE FROM public.user_active_devices
        WHERE id IN (
            SELECT id FROM public.user_active_devices
            WHERE user_id = p_user_id
            ORDER BY last_active_at ASC
            LIMIT (v_device_count - p_max_devices + 1)
        );
    END IF;

    -- Register the new device
    INSERT INTO public.user_active_devices (user_id, device_id, device_name, last_active_at)
    VALUES (p_user_id, p_device_id, COALESCE(p_device_name, 'Unknown Device'), now());

    RETURN jsonb_build_object('allowed', true, 'action', 'registered');
END;
$$;

-- 3. Batch Lesson Reorder RPC
CREATE OR REPLACE FUNCTION public.batch_reorder_lessons(
    p_updates JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    item JSONB;
BEGIN
    FOR item IN SELECT * FROM jsonb_array_elements(p_updates)
    LOOP
        UPDATE public.lessons
        SET 
            order_index = (item->>'order_index')::INT,
            module_id = CASE 
                WHEN item ? 'module_id' AND (item->>'module_id') IS NOT NULL AND (item->>'module_id') <> '' 
                THEN (item->>'module_id')::UUID 
                ELSE module_id 
            END
        WHERE lesson_id = (item->>'lesson_id')::UUID;
    END LOOP;
END;
$$;

NOTIFY pgrst, 'reload schema';
```

---

## 7. API Route Specifications

### 7.1 `PATCH /api/admin/lessons` (Inline Rename)
* **Auth:** Admin / Instructor only.
* **Payload:**
  ```json
  {
    "lesson_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "title": "Module 02: Camera Angles & Visual Hierarchy"
  }
  ```
* **Response:** `{ "success": true, "title": "..." }`

### 7.2 `PATCH /api/admin/lessons/reorder` (Batch Reorder)
* **Auth:** Admin / Instructor only.
* **Payload:**
  ```json
  {
    "updates": [
      { "lesson_id": "uuid-1", "order_index": 1, "module_id": "mod-uuid" },
      { "lesson_id": "uuid-2", "order_index": 2, "module_id": "mod-uuid" }
    ]
  }
  ```
* **Execution:** Calls Postgres RPC `batch_reorder_lessons`.

### 7.3 `POST /api/admin/lessons/sync-duration` (Bunny Stream Duration)
* **Auth:** Admin only.
* **Payload:** `{ "video_id": "bunny-video-guid" }`
* **Response:** `{ "duration_seconds": 1560, "duration_minutes": 26 }`

---

## 8. Phased Implementation Roadmap & Verification Checklist

### Sprint 1: Critical Bug Squashing
- [ ] Update `lib/react-query/hooks/use-admin.ts` to enable `lessons` query for `activeTab === "analytics"`.
- [ ] Verify Syllabus Analytics renders completion charts and lesson progress rows.
- [ ] Patch `app/api/admin/lessons/route.ts` to stop overwriting `module_id = null` when saving lessons.
- [ ] Test editing existing lessons; verify assigned modules remain intact.

### Sprint 2: Authoring Workflow & Studio UX
- [ ] Add inline renaming to syllabus lesson cards (`Check`/`Cancel` hotkeys `Enter`/`Esc`).
- [ ] Install `@hello-pangea/dnd` and implement drag-and-drop handles on the admin syllabus list.
- [ ] Wire up `PATCH /api/admin/lessons/reorder` with database batch RPC.
- [ ] Implement Bunny Stream video duration auto-fetch on Video ID blur.
- [ ] Add thumbnail inheritance fallback in public classroom + "Apply chapter cover" button in module modal.

### Sprint 3: International Checkout & Device Security
- [ ] Add PayPal QR payment method to `app/checkout/page.tsx`.
- [ ] Build pending enrollment submission and admin 1-click verification.
- [ ] Execute database migration for `user_active_devices` and `enforce_device_session`.
- [ ] Connect device limit check to `/api/lessons/[lessonId]/video` token generation.
- [ ] Verify multi-device streaming eviction behavior on 3rd device playback.
