-- Push notification subscriptions table for Lock Screen calendar reminders
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  endpoint TEXT PRIMARY KEY,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_id TEXT,
  device_label TEXT,
  notify_seil BOOLEAN NOT NULL DEFAULT TRUE,
  notify_events BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS automatically; prevent direct anon/client reads of push endpoints
DROP POLICY IF EXISTS "No direct public access to push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "No direct public access to push_subscriptions"
  ON public.push_subscriptions
  FOR ALL
  USING (FALSE)
  WITH CHECK (FALSE);
