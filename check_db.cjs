const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const configPath = 'server/config.ts';
let config = '';
try {
  config = fs.readFileSync(configPath, 'utf8');
} catch(e) {
  console.log("No config");
}
const urlMatch = config.match(/SUPABASE_URL\s*:\s*\(\s*process\.env\.VITE_SUPABASE_URL[^']+'([^']+)'\)/) || config.match(/SUPABASE_URL:.*?\|\|\s*'([^']+)'/);
const anonMatch = config.match(/SUPABASE_ANON_KEY:.*?\|\|\s*'([^']+)'/);

// If the regexes above fail, let's just use regex to extract the fallback string literals
const matchURL = config.match(/VITE_SUPABASE_URL\s*\|\|\s*'([^']+)'/);
const matchAnon = config.match(/VITE_SUPABASE_ANON_KEY\s*\|\|\s*'([^']+)'/);

const supabaseUrl = process.env.VITE_SUPABASE_URL || (matchURL ? matchURL[1] : null);
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || (matchAnon ? matchAnon[1] : null);

if(supabaseUrl && supabaseKey) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  async function run() {
    const { data, error } = await supabase.from('financial_records').select('*').limit(1);
    console.log("Error:", error);
    if(data) console.log("Data keys:", data.length > 0 ? Object.keys(data[0]) : "No data");
  }
  run();
} else {
  console.log("Could not find keys");
}
