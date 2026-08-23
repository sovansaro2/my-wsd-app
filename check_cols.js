import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const configStr = fs.readFileSync('server/config.ts', 'utf8');
const urlMatch = configStr.match(/SUPABASE_URL.*?\|\|\s*'([^']+)'/);
const anonMatch = configStr.match(/SUPABASE_ANON_KEY.*?\|\|\s*'([^']+)'/);
const keyMatch = configStr.match(/SUPABASE_SERVICE_ROLE_KEY.*?\|\|\s*'([^']+)'/);

const supabaseUrl = process.env.VITE_SUPABASE_URL || (urlMatch ? urlMatch[1] : '');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || (keyMatch ? keyMatch[1] : (anonMatch ? anonMatch[1] : ''));

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('financial_records').select('*').limit(1);
  if (data) {
    console.log("Cols in financial_records:", data.length > 0 ? Object.keys(data[0]) : "No data");
  } else {
    console.log("Error:", error);
  }
}
run();
