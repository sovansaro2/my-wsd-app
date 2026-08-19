require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const { data } = await supabase.from('name_list_categories').select('*');
  console.log(data);
}
run();
