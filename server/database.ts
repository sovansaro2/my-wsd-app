import { createClient } from '@supabase/supabase-js';
import { config } from './config';
import { Request } from 'express';
import WebSocket from 'ws';

if (typeof (globalThis as any).WebSocket === 'undefined') {
  (globalThis as any).WebSocket = WebSocket;
}

// admin client bypasses RLS if SUPABASE_SERVICE_ROLE_KEY is provided
const keyToUse = config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_ANON_KEY;
export const supabaseAdmin = createClient(config.SUPABASE_URL, keyToUse, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export const getAuthClient = (token: string) => {
  return createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
};

export const getClient = (_req?: Request) => {
  return supabaseAdmin;
};

