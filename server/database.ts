import { createClient } from '@supabase/supabase-js';
import { config } from './config';
import { Request } from 'express';

// admin client bypasses RLS if SUPABASE_SERVICE_ROLE_KEY is provided
const keyToUse = config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_ANON_KEY;
export const supabaseAdmin = createClient(config.SUPABASE_URL, keyToUse, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// We are no longer using getAuthClient to insert/update data. We use supabaseAdmin
// after verifying the role with requireAdmin.
