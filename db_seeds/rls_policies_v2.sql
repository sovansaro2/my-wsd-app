-- 1. Create Handle New User Trigger
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

-- 2. Add role column to profiles if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
    ALTER TABLE public.profiles ADD COLUMN role text DEFAULT 'user';
  END IF;
END $$;

-- Drop old policies
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seil_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.name_list_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.name_list_records ENABLE ROW LEVEL SECURITY;

-- Helper function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE USING (is_admin());
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT WITH CHECK (is_admin());

-- Posts Policies
CREATE POLICY "Posts viewable by everyone" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Admins can insert posts" ON public.posts FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update posts" ON public.posts FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete posts" ON public.posts FOR DELETE USING (is_admin());

-- Financial Records Policies
CREATE POLICY "Financial records viewable by everyone" ON public.financial_records FOR SELECT USING (true);
CREATE POLICY "Admins can insert financial records" ON public.financial_records FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update financial records" ON public.financial_records FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete financial records" ON public.financial_records FOR DELETE USING (is_admin());

-- Seil Periods Policies
CREATE POLICY "Seil periods viewable by everyone" ON public.seil_periods FOR SELECT USING (true);
CREATE POLICY "Admins can insert seil periods" ON public.seil_periods FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update seil periods" ON public.seil_periods FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete seil periods" ON public.seil_periods FOR DELETE USING (is_admin());

-- Name List Categories Policies
CREATE POLICY "Name list categories viewable by everyone" ON public.name_list_categories FOR SELECT USING (true);
CREATE POLICY "Admins can insert categories" ON public.name_list_categories FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update categories" ON public.name_list_categories FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete categories" ON public.name_list_categories FOR DELETE USING (is_admin());

-- Name List Records Policies
CREATE POLICY "Name list records viewable by everyone" ON public.name_list_records FOR SELECT USING (true);
CREATE POLICY "Admins can insert name list records" ON public.name_list_records FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update name list records" ON public.name_list_records FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete name list records" ON public.name_list_records FOR DELETE USING (is_admin());

-- Storage Policies
-- Assumes you already have buckets 'post_images' and 'avatars'
-- But just in case, we will apply to storage.objects
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload an avatar" ON storage.objects;
DROP POLICY IF EXISTS "Post images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload a post image" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update a post image" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete a post image" ON storage.objects;

CREATE POLICY "Public Read Access" ON storage.objects FOR SELECT USING (bucket_id IN ('avatars', 'post_images'));
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update avatars" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can upload post images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'post_images' AND is_admin());
CREATE POLICY "Admins can update post images" ON storage.objects FOR UPDATE USING (bucket_id = 'post_images' AND is_admin());
CREATE POLICY "Admins can delete post images" ON storage.objects FOR DELETE USING (bucket_id = 'post_images' AND is_admin());
