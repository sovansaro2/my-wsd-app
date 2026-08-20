import dotenv from 'dotenv';
dotenv.config();

export const config = {
  SUPABASE_URL: (process.env.VITE_SUPABASE_URL || '').trim().replace(/\/rest\/v1\/?$/, ''),
  SUPABASE_SERVICE_ROLE_KEY: (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim(),
  JWT_SECRET: (process.env.JWT_SECRET_KEY || 'wsd-super-secret-jwt-key-2026').trim(),
};
