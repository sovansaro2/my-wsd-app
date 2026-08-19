require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '');
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

// We can check if we can insert via anon key
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function test() {
  const { data: insData, error: insErr } = await supabase.from('financial_records').insert([
    { type: 'income', description: 'RLS TEST', amount: 10, seil_id: 'ef96c72c-b2f7-4928-9bc6-a50573fe02cd' }
  ]).select();
  console.log('Insert:', insData, insErr);
}
test();
