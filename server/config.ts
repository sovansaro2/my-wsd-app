import dotenv from 'dotenv';
dotenv.config();

const DEFAULT_SUPABASE_URL = 'https://vstwhhuqgeimssqxfmij.supabase.co';
const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzdHdoaHVxZ2VpbXNzcXhmbWlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5MjU2NjEsImV4cCI6MjEwMjUwMTY2MX0.QVzdZkx3kNw3sGvnAK8E8My1szvDpz3Qario2XuPmmI';
export const DEFAULT_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzdHdoaHVxZ2VpbXNzcXhmbWlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjkyNTY2MSwiZXhwIjoyMTAyNTAxNjYxfQ.SAmCoX_JPmfmsdtbQp_Zpxyg7MmrFDDC-VBsh1w3Vtk';

export function getJwtRole(token?: string | null): string | null {
  if (!token) return null;
  try {
    const clean = token.trim().replace(/^["']|["']$/g, '');
    const parts = clean.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = Buffer.from(base64, 'base64').toString('utf-8');
    const payload = JSON.parse(jsonStr);
    return payload.role || null;
  } catch {
    return null;
  }
}

function resolveServiceRoleKey(): string {
  const candidates = [
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.SUPABASE_SERVICE_KEY,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
    process.env.SERVICE_ROLE_KEY,
  ];

  for (const candidate of candidates) {
    if (candidate && candidate.trim()) {
      const clean = candidate.trim().replace(/^["']|["']$/g, '');
      const role = getJwtRole(clean);
      if (role === 'service_role') {
        return clean;
      }
      if (role === 'anon') {
        console.warn('[Supabase Config Warning] Provided service role key in environment is an ANON key (role="anon"). Ignoring it to prevent RLS violations and using default service_role key.');
      }
    }
  }

  return DEFAULT_SERVICE_ROLE_KEY;
}

export const config = {
  SUPABASE_URL: (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL).trim().replace(/\/rest\/v1\/?$/, ''),
  SUPABASE_ANON_KEY: (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || DEFAULT_ANON_KEY).trim().replace(/^["']|["']$/g, ''),
  SUPABASE_SERVICE_ROLE_KEY: resolveServiceRoleKey(),
  JWT_SECRET: (process.env.JWT_SECRET_KEY || 'wsd-super-secret-jwt-key-2026').trim(),
};

