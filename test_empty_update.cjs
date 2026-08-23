const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const configStr = fs.readFileSync('server/config.ts', 'utf8');
const urlMatch = configStr.match(/SUPABASE_URL.*?\|\|\s*'([^']+)'/);
const anonMatch = configStr.match(/SUPABASE_ANON_KEY.*?\|\|\s*'([^']+)'/);
const keyMatch = configStr.match(/SUPABASE_SERVICE_ROLE_KEY.*?\|\|\s*'([^']+)'/);
const supabaseUrl = process.env.VITE_SUPABASE_URL || (urlMatch ? urlMatch[1] : '');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || (keyMatch ? keyMatch[1] : (anonMatch ? anonMatch[1] : ''));
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('name_list_records').update({}).eq('id', 'some-id').select();
  console.log("Error:", error);
}
run();
