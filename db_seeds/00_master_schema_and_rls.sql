-- ==============================================================================
-- PHASE A: Master Schema Definition
-- ==============================================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY, -- Links to auth.users
  user_code TEXT,
  family_name TEXT,
  given_name TEXT,
  full_name TEXT,
  latin_name TEXT,
  gender TEXT,
  date_of_birth TEXT,
  address TEXT,
  email TEXT,
  phone_number TEXT,
  role TEXT DEFAULT 'user',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure redundant password_hash is removed from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS password_hash;

-- 2. Posts Table (assuming used for Feed)
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. App Notifications
CREATE TABLE IF NOT EXISTS public.app_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT,
  target_tab TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Seil Periods
CREATE TABLE IF NOT EXISTS public.seil_periods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  date_range_text TEXT,
  previous_balance NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Financial Records
CREATE TABLE IF NOT EXISTS public.financial_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seil_id UUID REFERENCES public.seil_periods(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('income', 'expense')),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  record_date DATE,
  note TEXT,
  is_high_level BOOLEAN DEFAULT false,
  notify_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Name List Categories
CREATE TABLE IF NOT EXISTS public.name_list_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL CONSTRAINT unique_category_name UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Name List Records
CREATE TABLE IF NOT EXISTS public.name_list_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.name_list_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  note TEXT,
  referrer TEXT,
  is_100k_donor BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Trigger to handle new users from auth schema
-- Enforces strict 'user' role default and SET search_path = public to prevent privilege escalation and search-path hijacking
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, latin_name, email, role)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'latin_name',
    new.email,
    'user' -- Strictly enforce default 'user' role (never trust client metadata for roles)
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    latin_name = COALESCE(EXCLUDED.latin_name, public.profiles.latin_name),
    email = COALESCE(EXCLUDED.email, public.profiles.email);
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================================
-- PHASE B: Supabase RLS Lockdown for Backend Proxy Model
-- 1. All mutations (INSERT, UPDATE, DELETE) are locked down for anon and authenticated.
-- 2. Only backend service_role can modify data.
-- 3. financial_records SELECT is restricted to notify_public = true.
-- 4. profiles sensitive PII fields are protected: only readable by account owner (auth.uid() = id).
-- ==============================================================================

-- 1. General tables lockdown & public read configuration
DO $$ DECLARE
    t text;
    pol record;
BEGIN
    FOR t IN 
        SELECT unnest(ARRAY['posts', 'seil_periods', 'name_list_categories', 'name_list_records', 'app_notifications', 'monastery_events'])
    LOOP
        -- Enable RLS if table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

            -- Drop existing policies
            FOR pol IN 
                SELECT policyname 
                FROM pg_policies 
                WHERE schemaname = 'public' AND tablename = t
            LOOP
                EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
            END LOOP;
            
            -- Create Policies
            EXECUTE format('CREATE POLICY "Allow public read on %I" ON public.%I FOR SELECT USING (true)', t, t);
            EXECUTE format('CREATE POLICY "Block direct inserts on %I" ON public.%I FOR INSERT TO anon, authenticated WITH CHECK (false)', t, t);
            EXECUTE format('CREATE POLICY "Block direct updates on %I" ON public.%I FOR UPDATE TO anon, authenticated USING (false)', t, t);
            EXECUTE format('CREATE POLICY "Block direct deletes on %I" ON public.%I FOR DELETE TO anon, authenticated USING (false)', t, t);
        END IF;
    END LOOP;
END $$;

-- 2. Financial Records: Allow public SELECT access ONLY where notify_public = true
ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;

DO $$ DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'financial_records'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.financial_records', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "Allow public read on published financial records" 
ON public.financial_records 
FOR SELECT 
USING (notify_public = true);

CREATE POLICY "Block direct inserts on financial_records" 
ON public.financial_records 
FOR INSERT TO anon, authenticated WITH CHECK (false);

CREATE POLICY "Block direct updates on financial_records" 
ON public.financial_records 
FOR UPDATE TO anon, authenticated USING (false);

CREATE POLICY "Block direct deletes on financial_records" 
ON public.financial_records 
FOR DELETE TO anon, authenticated USING (false);

-- 3. Profiles: Privacy & PII Protection
-- - Account owners (auth.uid() = id) can view their own complete profile.
-- - Public / anon users can only view basic profile data (full_name, avatar_url, role).
-- - Direct mutations remain blocked; managed strictly through backend proxy.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
END $$;

-- Account owner can read their full record (including sensitive email, phone_number, address, date_of_birth)
CREATE POLICY "Users can read own sensitive profile" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- Public / anon users can read basic profile rows
CREATE POLICY "Public users can view basic profiles" 
ON public.profiles 
FOR SELECT 
TO anon 
USING (true);

-- Block direct mutations from clients
CREATE POLICY "Block direct inserts on profiles" 
ON public.profiles 
FOR INSERT TO anon, authenticated WITH CHECK (false);

CREATE POLICY "Block direct updates on profiles" 
ON public.profiles 
FOR UPDATE TO anon, authenticated USING (false);

CREATE POLICY "Block direct deletes on profiles" 
ON public.profiles 
FOR DELETE TO anon, authenticated USING (false);

-- Column-level privileges to prevent public harvesting of sensitive fields:
REVOKE ALL ON public.profiles FROM anon, authenticated, public;
GRANT SELECT (id, user_code, full_name, latin_name, role, avatar_url, created_at) ON public.profiles TO anon, authenticated;
GRANT SELECT (email, phone_number, address, date_of_birth, gender, family_name, given_name, updated_at) ON public.profiles TO authenticated;

-- Secure Public Profiles View (Guarantees public consumers only access basic profile data)
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = false) AS
SELECT 
  id,
  user_code,
  full_name,
  latin_name,
  role,
  avatar_url,
  created_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;
