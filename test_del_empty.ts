import { supabaseAdmin } from './server/database.js';

async function run() {
  const del = await supabaseAdmin.from('name_list_records').delete().eq('id', '8b8bfc1f-0bb8-4186-b643-c9fb64608492').select();
  console.log('Deleted result:', del.data, del.error);
}
run().catch(console.error);
