require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const sql = fs.readFileSync('db_seeds/seed_list2_records.sql', 'utf8');
  const { data, error } = await supabase.rpc('execute_sql', { sql_statement: sql });
  console.log('Result:', data, error);
}
run();
