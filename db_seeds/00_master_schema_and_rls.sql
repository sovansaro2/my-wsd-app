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
  gender TEXT,
  date_of_birth TEXT,
  address TEXT,
  email TEXT,
  phone_number TEXT,
  role TEXT DEFAULT 'user',
  avatar_url TEXT,
  password_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', COALESCE(new.raw_user_meta_data->>'role', 'user'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================================
-- PHASE B: Supabase RLS Lockdown for Backend Proxy Model
-- Only service_role can modify data. Clients can only SELECT.
-- ==============================================================================

DO $$ DECLARE
    t text;
    pol record;
BEGIN
    FOR t IN 
        SELECT unnest(ARRAY['posts', 'profiles', 'financial_records', 'seil_periods', 'name_list_categories', 'name_list_records', 'app_notifications'])
    LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

        -- Drop existing policies
        FOR pol IN 
            SELECT policyname 
            FROM pg_policies 
            WHERE schemaname = 'public' AND tablename = t
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
        END LOOP;
        
        -- Create Lockdown Policies
        EXECUTE format('CREATE POLICY "Allow public read on %I" ON public.%I FOR SELECT USING (true)', t, t);
        EXECUTE format('CREATE POLICY "Block direct inserts on %I" ON public.%I FOR INSERT TO anon, authenticated WITH CHECK (false)', t, t);
        EXECUTE format('CREATE POLICY "Block direct updates on %I" ON public.%I FOR UPDATE TO anon, authenticated USING (false)', t, t);
        EXECUTE format('CREATE POLICY "Block direct deletes on %I" ON public.%I FOR DELETE TO anon, authenticated USING (false)', t, t);
    END LOOP;
END $$;
