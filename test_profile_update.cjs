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
    password: 'Password123!' // Try to guess?
  });
  if (signInErr) {
    console.log(signInErr);
  } else {
     const token = signInData.session.access_token;
     console.log('Logged in!');
  }
}
test();
