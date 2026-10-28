-- ============================================================================
-- Migration: 20261028000000_next_phase_features.sql
-- Description:
--   1. Active device tracking table & session enforcement RPC (anti-account sharing)
--   2. Batch lesson & module reordering RPC for drag-and-drop studio
--   3. Extend pending_enrollments with payment_method, proof_url, transaction_reference, amount
--   4. Storage bucket & RLS policies for payment-proofs
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Active Devices Table
-- ----------------------------------------------------------------------------
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

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_user_active_devices_user ON public.user_active_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_active_devices_last_active ON public.user_active_devices(user_id, last_active_at DESC);

-- Enable Row Level Security
ALTER TABLE public.user_active_devices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users view own devices" ON public.user_active_devices;
CREATE POLICY "Users view own devices" ON public.user_active_devices
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own devices" ON public.user_active_devices;
CREATE POLICY "Users delete own devices" ON public.user_active_devices
    FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage all devices" ON public.user_active_devices;
CREATE POLICY "Admins manage all devices" ON public.user_active_devices
    FOR ALL USING (public.is_instructor_or_admin(auth.uid()))
    WITH CHECK (public.is_instructor_or_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- 2. Device Session Enforcement RPC
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_device_session(
    p_user_id UUID,
    p_device_id TEXT,
    p_device_name TEXT,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_max_devices INT DEFAULT 2
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_device_count INT;
    v_existing_device UUID;
    v_evicted_count INT := 0;
BEGIN
    -- Authorization safeguard: if called by authenticated client, caller must match p_user_id unless admin
    IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id AND NOT public.is_instructor_or_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Unauthorized device session registration';
    END IF;

    IF p_user_id IS NULL OR p_device_id IS NULL OR trim(p_device_id) = '' THEN
        RETURN jsonb_build_object('allowed', false, 'error', 'Invalid user or device identifier');
    END IF;

    -- Check if this specific device is already registered for this user
    SELECT id INTO v_existing_device
    FROM public.user_active_devices
    WHERE user_id = p_user_id AND device_id = p_device_id;

    IF v_existing_device IS NOT NULL THEN
        -- Device recognized: update heartbeat and metadata
        UPDATE public.user_active_devices
        SET last_active_at = now(),
            device_name = COALESCE(NULLIF(trim(p_device_name), ''), device_name),
            ip_address = COALESCE(p_ip_address, ip_address),
            user_agent = COALESCE(p_user_agent, user_agent)
        WHERE id = v_existing_device;

        SELECT COUNT(*) INTO v_device_count
        FROM public.user_active_devices
        WHERE user_id = p_user_id;

        RETURN jsonb_build_object(
            'allowed', true,
            'action', 'updated',
            'device_id', p_device_id,
            'active_devices', v_device_count
        );
    END IF;

    -- Device is new: count active devices for this user
    SELECT COUNT(*) INTO v_device_count
    FROM public.user_active_devices
    WHERE user_id = p_user_id;

    -- Enforce device limit by evicting oldest device(s)
    IF v_device_count >= p_max_devices THEN
        v_evicted_count := v_device_count - p_max_devices + 1;
        
        DELETE FROM public.user_active_devices
        WHERE id IN (
            SELECT id FROM public.user_active_devices
            WHERE user_id = p_user_id
            ORDER BY last_active_at ASC
            LIMIT v_evicted_count
        );
    END IF;

    -- Register the new device
    INSERT INTO public.user_active_devices (
        user_id,
        device_id,
        device_name,
        ip_address,
        user_agent,
        last_active_at
    )
    VALUES (
        p_user_id,
        p_device_id,
        COALESCE(NULLIF(trim(p_device_name), ''), 'Workstation / Browser'),
        p_ip_address,
        p_user_agent,
        now()
    );

    SELECT COUNT(*) INTO v_device_count
    FROM public.user_active_devices
    WHERE user_id = p_user_id;

    RETURN jsonb_build_object(
        'allowed', true,
        'action', 'registered',
        'device_id', p_device_id,
        'evicted_devices', v_evicted_count,
        'active_devices', v_device_count
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. Batch Lesson Reordering RPC
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.batch_reorder_lessons(
    p_updates JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    item JSONB;
    v_lesson_id UUID;
    v_order_index INT;
    v_module_id UUID;
BEGIN
    -- Guard: Only instructors or admins (or service role) may reorder curriculum
    IF auth.uid() IS NOT NULL AND NOT public.is_instructor_or_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Admin or instructor privileges required to reorder curriculum';
    END IF;

    IF p_updates IS NULL OR jsonb_typeof(p_updates) <> 'array' THEN
        RAISE EXCEPTION 'Invalid updates payload: expected JSON array';
    END IF;

    FOR item IN SELECT * FROM jsonb_array_elements(p_updates)
    LOOP
        v_lesson_id := (item->>'lesson_id')::UUID;
        v_order_index := (item->>'order_index')::INT;
        
        IF v_lesson_id IS NOT NULL AND v_order_index IS NOT NULL THEN
            IF item ? 'module_id' AND (item->>'module_id') IS NOT NULL AND (item->>'module_id') <> '' THEN
                v_module_id := (item->>'module_id')::UUID;
                UPDATE public.lessons
                SET order_index = v_order_index,
                    module_id = v_module_id
                WHERE lesson_id = v_lesson_id;
            ELSE
                UPDATE public.lessons
                SET order_index = v_order_index
                WHERE lesson_id = v_lesson_id;
            END IF;
        END IF;
    END LOOP;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. Extend Pending Enrollments
-- ----------------------------------------------------------------------------
ALTER TABLE public.pending_enrollments 
    ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'telegram',
    ADD COLUMN IF NOT EXISTS transaction_reference TEXT,
    ADD COLUMN IF NOT EXISTS proof_url TEXT,
    ADD COLUMN IF NOT EXISTS amount NUMERIC(10, 2);

-- Update RLS for student insert to allow optional fields
DROP POLICY IF EXISTS "Students can insert own pending enrollments" ON public.pending_enrollments;
CREATE POLICY "Students can insert own pending enrollments" ON public.pending_enrollments
    FOR INSERT WITH CHECK (
      auth.uid() IS NOT NULL AND 
      LOWER(email) = LOWER(auth.jwt() ->> 'email')
    );

-- ----------------------------------------------------------------------------
-- 5. Payment Proofs Storage Bucket
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
    -- Authenticated students upload payment proofs
    DROP POLICY IF EXISTS "Authenticated users upload payment proofs" ON storage.objects;
    CREATE POLICY "Authenticated users upload payment proofs" ON storage.objects
        FOR INSERT WITH CHECK (
            bucket_id = 'payment-proofs' AND
            auth.role() = 'authenticated'
        );

    -- Anyone with receipt URL or admins can view
    DROP POLICY IF EXISTS "Public view payment proofs" ON storage.objects;
    CREATE POLICY "Public view payment proofs" ON storage.objects
        FOR SELECT USING (bucket_id = 'payment-proofs');

    -- Admins manage payment proofs
    DROP POLICY IF EXISTS "Admins manage payment proofs" ON storage.objects;
    CREATE POLICY "Admins manage payment proofs" ON storage.objects
        FOR ALL USING (
            bucket_id = 'payment-proofs' AND
            public.is_instructor_or_admin(auth.uid())
        );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

NOTIFY pgrst, 'reload schema';
