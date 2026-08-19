-- ==============================================================================
-- PHASE B: Supabase RLS Lockdown for Defense-in-Depth
-- This script restricts all direct client-side (anon/authenticated) WRITE 
-- operations (INSERT, UPDATE, DELETE).
-- Only the backend using the `service_role` key can modify data.
-- ==============================================================================

DO $$ 
DECLARE
    t text;
    pol record;
BEGIN
    -- Drop all existing policies on the target tables to ensure no permissive policies remain
    FOR t IN 
        SELECT unnest(ARRAY['posts', 'profiles', 'financial_records', 'seil_periods', 'name_list_categories', 'name_list_records'])
    LOOP
        FOR pol IN 
            SELECT policyname 
            FROM pg_policies 
            WHERE schemaname = 'public' AND tablename = t
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
        END LOOP;
    END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 1. profiles
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Block direct inserts on profiles" ON public.profiles FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "Block direct updates on profiles" ON public.profiles FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "Block direct deletes on profiles" ON public.profiles FOR DELETE TO anon, authenticated USING (false);

-- ------------------------------------------------------------------------------
-- 2. posts
-- ------------------------------------------------------------------------------
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Block direct inserts on posts" ON public.posts FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "Block direct updates on posts" ON public.posts FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "Block direct deletes on posts" ON public.posts FOR DELETE TO anon, authenticated USING (false);

-- ------------------------------------------------------------------------------
-- 3. seil_periods
-- ------------------------------------------------------------------------------
ALTER TABLE public.seil_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on seil_periods" ON public.seil_periods FOR SELECT USING (true);
CREATE POLICY "Block direct inserts on seil_periods" ON public.seil_periods FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "Block direct updates on seil_periods" ON public.seil_periods FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "Block direct deletes on seil_periods" ON public.seil_periods FOR DELETE TO anon, authenticated USING (false);

-- ------------------------------------------------------------------------------
-- 4. financial_records
-- ------------------------------------------------------------------------------
ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on financial_records" ON public.financial_records FOR SELECT USING (true);
CREATE POLICY "Block direct inserts on financial_records" ON public.financial_records FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "Block direct updates on financial_records" ON public.financial_records FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "Block direct deletes on financial_records" ON public.financial_records FOR DELETE TO anon, authenticated USING (false);

-- ------------------------------------------------------------------------------
-- 5. name_list_categories
-- ------------------------------------------------------------------------------
ALTER TABLE public.name_list_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on name_list_categories" ON public.name_list_categories FOR SELECT USING (true);
CREATE POLICY "Block direct inserts on name_list_categories" ON public.name_list_categories FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "Block direct updates on name_list_categories" ON public.name_list_categories FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "Block direct deletes on name_list_categories" ON public.name_list_categories FOR DELETE TO anon, authenticated USING (false);

-- ------------------------------------------------------------------------------
-- 6. name_list_records
-- ------------------------------------------------------------------------------
ALTER TABLE public.name_list_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on name_list_records" ON public.name_list_records FOR SELECT USING (true);
CREATE POLICY "Block direct inserts on name_list_records" ON public.name_list_records FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "Block direct updates on name_list_records" ON public.name_list_records FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "Block direct deletes on name_list_records" ON public.name_list_records FOR DELETE TO anon, authenticated USING (false);
