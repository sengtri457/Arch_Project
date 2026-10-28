# ArchTipsBox — Next Phase Technical Implementation Plan
### Engineering Specification & Architecture

**Audience:** Senior Developers & DevOps  
**Scope:** PayPal QR Webhooks, Device Session RPCs, Token DRM Gating, Batch Reordering  

---

## 1. Database Schema & RPC Migrations

Run this DDL script in Supabase SQL editor:

```sql
-- 1. Active Devices Table
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

CREATE POLICY "Users view own devices" ON public.user_active_devices
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users delete own devices" ON public.user_active_devices
    FOR DELETE USING (auth.uid() = user_id);

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
    SELECT id INTO v_existing_device
    FROM public.user_active_devices
    WHERE user_id = p_user_id AND device_id = p_device_id;

    IF v_existing_device IS NOT NULL THEN
        UPDATE public.user_active_devices
        SET last_active_at = now(),
            device_name = COALESCE(p_device_name, device_name)
        WHERE id = v_existing_device;

        RETURN jsonb_build_object('allowed', true, 'action', 'updated');
    END IF;

    SELECT COUNT(*) INTO v_device_count
    FROM public.user_active_devices
    WHERE user_id = p_user_id;

    IF v_device_count >= p_max_devices THEN
        DELETE FROM public.user_active_devices
        WHERE id IN (
            SELECT id FROM public.user_active_devices
            WHERE user_id = p_user_id
            ORDER BY last_active_at ASC
            LIMIT (v_device_count - p_max_devices + 1)
        );
    END IF;

    INSERT INTO public.user_active_devices (user_id, device_id, device_name, last_active_at)
    VALUES (p_user_id, p_device_id, COALESCE(p_device_name, 'Unknown Device'), now());

    RETURN jsonb_build_object('allowed', true, 'action', 'registered');
END;
$$;

-- 3. Batch Reorder RPC
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

## 2. Anti-Piracy Device Limiting Integration

### Interceptor: `app/api/lessons/[lessonId]/video/route.ts`
1. Extract client device identifiers from headers:
   * `x-device-id`: Generated and stored in client `localStorage`.
   * `x-device-name`: Formatted from user agent (e.g. "Chrome 122 on Windows").
2. Call `enforce_device_session` RPC using Supabase Service Client:
   ```ts
   const { data: sessionResult } = await supabase.rpc('enforce_device_session', {
     p_user_id: user.id,
     p_device_id: deviceId,
     p_device_name: deviceName,
     p_max_devices: 2
   })
   ```
3. If allowed, proceed to mint Bunny Stream HS256 signed playback token.

---

## 3. Drag-and-Drop Reordering Engine

### Library: `@hello-pangea/dnd`
* Implemented in `components/admin/syllabus-drag-list.tsx`.
* Uses `DragDropContext`, `Droppable`, and `Draggable`.
* On `onDragEnd`:
  1. Reorders client array immediately (optimistic UI).
  2. Re-indexes each item: `items.map((item, index) => ({ ...item, order_index: index + 1 }))`.
  3. Sends `PATCH /api/admin/lessons/reorder` with array of `{ lesson_id, order_index, module_id }`.

### Endpoint: `app/api/admin/lessons/reorder/route.ts`
```ts
export async function PATCH(request: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { updates } = await request.json()
  if (!Array.isArray(updates)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const supabase = serviceClient()
  const { error } = await supabase.rpc('batch_reorder_lessons', { p_updates: updates })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
```

---

## 4. PayPal QR & International Checkout Flow

### 1. UI Integration: `app/checkout/page.tsx`
* Add `"paypal"` to payment method state:
  ```ts
  const [paymentMethod, setPaymentMethod] = useState<"khqr" | "telegram" | "paypal">("khqr")
  ```
* Render PayPal Tab:
  * Static QR image asset pointing to instructor's verified PayPal QR.
  * Direct deep-link: `https://paypal.me/YOUR_HANDLE/${price}USD`.
  * Unique Order Reference: `ATB-${courseSlug.toUpperCase().slice(0, 4)}-${userId.slice(0, 6)}`.
  * File upload field for receipt screenshot / transaction ID.

### 2. Submission Handler:
* Inserts into `pending_enrollments`:
  ```ts
  await supabase.from('pending_enrollments').insert({
    student_id: user.id,
    course_id: course.id,
    payment_method: 'paypal',
    transaction_reference: refCode,
    proof_url: uploadedReceiptUrl,
    status: 'pending'
  })
  ```
* Admin views and approves in `/admin` with one click, upgrading the role and issuing welcome notifications.
