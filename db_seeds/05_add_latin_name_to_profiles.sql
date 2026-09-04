-- ==============================================================================
-- Migration: Add latin_name to profiles table & update trigger
-- ==============================================================================

-- 1. Add latin_name column to public.profiles if it does not exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS latin_name TEXT;

-- 2. Update handle_new_user trigger function to populate latin_name and email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, latin_name, email, role)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'latin_name',
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    latin_name = COALESCE(EXCLUDED.latin_name, public.profiles.latin_name),
    email = COALESCE(EXCLUDED.email, public.profiles.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
