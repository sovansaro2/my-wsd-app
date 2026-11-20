-- Create monastery_events table for Buddhist Calendar bookmarks & invitations
CREATE TABLE IF NOT EXISTS public.monastery_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'monastery',
  host_name TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  location TEXT DEFAULT '',
  event_date DATE NOT NULL,
  event_time TEXT DEFAULT '',
  monks_count INTEGER DEFAULT 0,
  description TEXT DEFAULT '',
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_monastery_events_date ON public.monastery_events (event_date);

ALTER TABLE public.monastery_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read monastery_events" ON public.monastery_events;
CREATE POLICY "Public read monastery_events"
  ON public.monastery_events
  FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Authenticated write monastery_events" ON public.monastery_events;
CREATE POLICY "Authenticated write monastery_events"
  ON public.monastery_events
  FOR ALL
  USING (auth.role() IN ('authenticated', 'service_role'))
  WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

-- Refresh Supabase PostgREST schema cache immediately
NOTIFY pgrst, 'reload schema';
