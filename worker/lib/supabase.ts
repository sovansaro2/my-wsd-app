import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { WorkerEnv } from '../types';

const DEFAULT_SUPABASE_URL = 'https://vstwhhuqgeimssqxfmij.supabase.co';
const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzdHdoaHVxZ2VpbXNzcXhmbWlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5MjU2NjEsImV4cCI6MjEwMjUwMTY2MX0.QVzdZkx3kNw3sGvnAK8E8My1szvDpz3Qario2XuPmmI';
export const DEFAULT_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzdHdoaHVxZ2VpbXNzcXhmbWlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjkyNTY2MSwiZXhwIjoyMTAyNTAxNjYxfQ.SAmCoX_JPmfmsdtbQp_Zpxyg7MmrFDDC-VBsh1w3Vtk';

export function decodeBase64UrlToUtf8(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function encodeUtf8ToBase64(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function getJwtRole(token?: string | null): string | null {
  if (!token) return null;
  try {
    const clean = token.trim().replace(/^["']|["']$/g, '');
    const parts = clean.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(decodeBase64UrlToUtf8(parts[1]));
    return payload.role || null;
  } catch {
    return null;
  }
}

function resolveServiceRoleKey(env: WorkerEnv): string {
  const candidates = [
    env.SUPABASE_SERVICE_ROLE_KEY,
    env.SUPABASE_SERVICE_KEY,
    env.VITE_SUPABASE_SERVICE_ROLE_KEY,
    env.SERVICE_ROLE_KEY,
  ];

  for (const candidate of candidates) {
    if (candidate && candidate.trim()) {
      const clean = candidate.trim().replace(/^["']|["']$/g, '');
      const role = getJwtRole(clean);
      if (role === 'service_role') {
        return clean;
      }
      if (role === 'anon') {
        console.warn('[Supabase Config Warning] Provided service role key is an ANON key. Using default service_role key.');
      }
    }
  }

  return DEFAULT_SERVICE_ROLE_KEY;
}

export function getWorkerConfig(env: WorkerEnv) {
  return {
    SUPABASE_URL: (env.VITE_SUPABASE_URL || env.SUPABASE_URL || DEFAULT_SUPABASE_URL)
      .trim()
      .replace(/\/rest\/v1\/?$/, ''),
    SUPABASE_ANON_KEY: (env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || DEFAULT_ANON_KEY)
      .trim()
      .replace(/^["']|["']$/g, ''),
    SUPABASE_SERVICE_ROLE_KEY: resolveServiceRoleKey(env),
    JWT_SECRET: (env.JWT_SECRET_KEY || 'wsd-super-secret-jwt-key-2026').trim(),
  };
}

export function getSupabaseAdmin(env: WorkerEnv): SupabaseClient {
  const cfg = getWorkerConfig(env);
  return createClient(cfg.SUPABASE_URL, cfg.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${cfg.SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: cfg.SUPABASE_SERVICE_ROLE_KEY,
      },
    },
  });
}

export function createAuthClient(env: WorkerEnv): SupabaseClient {
  const cfg = getWorkerConfig(env);
  return createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function getDirectAdminClient(env: WorkerEnv): SupabaseClient {
  const cfg = getWorkerConfig(env);
  return createClient(cfg.SUPABASE_URL, DEFAULT_SERVICE_ROLE_KEY, {
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
}
