require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '');
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function test() {
  const email = 'sovansaro2025@gmail.com';
  // Attempt to login to get a token
  const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
    email,
    password: 'password123' // Try a dummy password or we'll need to check the exact RLS policy definition
  });
  console.log('Login attempt:', signInErr ? signInErr.message : 'Success');
}
test();
