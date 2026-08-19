import { createClient } from '@supabase/supabase-js';
import { config } from './config';
import { Request } from 'express';

// ប្រើ service_role ដើម្បីមានសិទ្ធិពេញ (Bypass RLS) នៅក្នុង Backend (បើមាន)
export const supabaseAdmin = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export const getAuthClient = (req: Request) => {
  const token = req.headers.authorization?.split(' ')[1];
  return createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    }
  });
};
