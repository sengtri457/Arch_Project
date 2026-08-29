-- Migration: Add RLS policies for payment_transactions table
-- Target: ArchTipsBox LMS database security

-- 1. Select policy for admins to view all transactions
DROP POLICY IF EXISTS "Admins view all transactions" ON public.payment_transactions;
CREATE POLICY "Admins view all transactions" ON public.payment_transactions
    FOR SELECT USING (public.is_admin(auth.uid()));

-- 2. Select policy for authenticated users to view their own transactions
DROP POLICY IF EXISTS "Users view own transactions" ON public.payment_transactions;
CREATE POLICY "Users view own transactions" ON public.payment_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- 3. Insert policy for authenticated users to create their own transactions
DROP POLICY IF EXISTS "Users create own transactions" ON public.payment_transactions;
CREATE POLICY "Users create own transactions" ON public.payment_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Notify pgrst to reload the schema cache
NOTIFY pgrst, 'reload schema';
