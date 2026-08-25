import { supabaseAdmin } from './server/database';
async function run() {
  const { data, error } = await supabaseAdmin.rpc('run_sql_query', { query: 'SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = \'handle_new_user\';' });
  console.log("Trigger:", data, "Error:", error);
}
run();
