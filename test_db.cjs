const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const config = fs.readFileSync('server/config.ts', 'utf8');
const urlMatch = config.match(/SUPABASE_URL = '([^']+)'/);
const keyMatch = config.match(/SUPABASE_SERVICE_ROLE_KEY = '([^']+)'/);
const anonMatch = config.match(/SUPABASE_ANON_KEY = '([^']+)'/);

const supabaseUrl = urlMatch ? urlMatch[1] : '';
const supabaseKey = keyMatch ? keyMatch[1] : (anonMatch ? anonMatch[1] : '');

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: cols1 } = await supabase.rpc('get_columns_for_table', { table_name: 'financial_records' });
  const { data: cols2 } = await supabase.rpc('get_columns_for_table', { table_name: 'name_list_records' });
  console.log("Cols", cols1, cols2);
}
test();
