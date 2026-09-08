import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config, DEFAULT_SERVICE_ROLE_KEY } from './config';
import { Request } from 'express';
import WebSocket from 'ws';

if (typeof (globalThis as any).WebSocket === 'undefined') {
  (globalThis as any).WebSocket = WebSocket;
}

const serviceRoleKey = config.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SERVICE_ROLE_KEY;

// Dedicated Admin Client that strictly bypasses Row Level Security (RLS)
export const supabaseAdmin = createClient(config.SUPABASE_URL, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
    },
  },
});

// Dedicated Auth Client for user-facing authentication (signIn, signUp, refresh, verifyOtp)
// Must NOT be supabaseAdmin, because signInWithPassword mutates the client's internal auth state!
export const createAuthClient = (): SupabaseClient => {
  return createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Fallback direct admin client guaranteed to use the master service_role key
export const getDirectAdminClient = (): SupabaseClient => {
  return createClient(config.SUPABASE_URL, DEFAULT_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${DEFAULT_SERVICE_ROLE_KEY}`,
        apikey: DEFAULT_SERVICE_ROLE_KEY,
      },
    },
  });
};

export const getAuthClient = (token: string) => {
  return createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
};

export const getClient = (_req?: Request) => {
  return supabaseAdmin;
};


