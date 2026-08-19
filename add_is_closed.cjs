require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function addColumn() {
  const { data, error } = await supabase.rpc('execute_sql', {
    sql_statement: 'ALTER TABLE seil_periods ADD COLUMN IF NOT EXISTS is_closed BOOLEAN DEFAULT FALSE;'
  });
  console.log('Add Column RPC:', data, error);
}
addColumn();
