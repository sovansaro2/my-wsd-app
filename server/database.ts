import { createClient } from '@supabase/supabase-js';
import { config } from './config';
import { Request } from 'express';

// admin client bypasses RLS (if real service role key is provided, else uses anon key but won't bypass RLS)
const keyToUse = config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_ANON_KEY;
export const supabaseAdmin = createClient(config.SUPABASE_URL, keyToUse, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// getAuthClient creates a client that sends the user's JWT so RLS policies see the actual user
export const getAuthClient = (req: Request) => {
  const token = req.headers.authorization?.split(' ')[1];
  return createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    }
  });
};
