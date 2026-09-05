import dotenv from 'dotenv';
dotenv.config();

const DEFAULT_SUPABASE_URL = 'https://vstwhhuqgeimssqxfmij.supabase.co';
const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzdHdoaHVxZ2VpbXNzcXhmbWlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5MjU2NjEsImV4cCI6MjEwMjUwMTY2MX0.QVzdZkx3kNw3sGvnAK8E8My1szvDpz3Qario2XuPmmI';
const DEFAULT_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzdHdoaHVxZ2VpbXNzcXhmbWlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjkyNTY2MSwiZXhwIjoyMTAyNTAxNjYxfQ.SAmCoX_JPmfmsdtbQp_Zpxyg7MmrFDDC-VBsh1w3Vtk';

export const config = {
  SUPABASE_URL: (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL).trim().replace(/\/rest\/v1\/?$/, ''),
  SUPABASE_ANON_KEY: (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || DEFAULT_ANON_KEY).trim(),
  SUPABASE_SERVICE_ROLE_KEY: (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || DEFAULT_SERVICE_ROLE_KEY).trim(),
  JWT_SECRET: (process.env.JWT_SECRET_KEY || 'wsd-super-secret-jwt-key-2026').trim(),
};
