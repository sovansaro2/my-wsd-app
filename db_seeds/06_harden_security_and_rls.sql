-- ==============================================================================
-- Migration 06: Harden Security & RLS Policies
-- 1. Privilege Escalation Prevention: Enforce default 'user' role & SET search_path = public
-- 2. Privacy & PII Protection: Drop redundant password_hash & protect sensitive fields (auth.uid() = id)
-- 3. Financial Data Access: Allow public SELECT ONLY for records with notify_public = true
-- 4. Lockdown Policies: Block direct INSERT, UPDATE, DELETE for anon and authenticated
-- ==============================================================================

-- 1. Privilege Escalation Prevention in handle_new_user()
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
    'user' -- Strictly enforce 'user' role; ignore role in raw_user_meta_data
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

-- 2. Privacy & PII Protection: Drop redundant password_hash column from public.profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS password_hash;

-- 3. Financial Data Access: Restrict public SELECT to notify_public = true
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

-- 4. Profiles RLS & PII Protection
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

-- Sensitive fields readable only by account owner (auth.uid() = id)
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

-- Secure Public Profiles View (Exposes only basic profile data to public)
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

-- 5. Ensure lockdown policies on other public tables
DO $$ DECLARE
    t text;
    pol record;
BEGIN
    FOR t IN 
        SELECT unnest(ARRAY['posts', 'seil_periods', 'name_list_categories', 'name_list_records', 'app_notifications', 'monastery_events'])
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

            FOR pol IN 
                SELECT policyname 
                FROM pg_policies 
                WHERE schemaname = 'public' AND tablename = t
            LOOP
                EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
            END LOOP;
            
            EXECUTE format('CREATE POLICY "Allow public read on %I" ON public.%I FOR SELECT USING (true)', t, t);
            EXECUTE format('CREATE POLICY "Block direct inserts on %I" ON public.%I FOR INSERT TO anon, authenticated WITH CHECK (false)', t, t);
            EXECUTE format('CREATE POLICY "Block direct updates on %I" ON public.%I FOR UPDATE TO anon, authenticated USING (false)', t, t);
            EXECUTE format('CREATE POLICY "Block direct deletes on %I" ON public.%I FOR DELETE TO anon, authenticated USING (false)', t, t);
        END IF;
    END LOOP;
END $$;
