import { supabaseAdmin } from './server/database.js';

async function run() {
  // create dummy category
  const cat = await supabaseAdmin.from('name_list_categories').insert({ name: 'test_cat' }).select();
  const catId = cat.data[0].id;
  
  // create dummy record
  const rec = await supabaseAdmin.from('name_list_records').insert({ category_id: catId, name: 'Test', amount: 100 }).select();
  const recId = rec.data[0].id;
  
  console.log('Created record:', recId);
  
  // try to delete it
  const del = await supabaseAdmin.from('name_list_records').delete().eq('id', recId).select();
  console.log('Deleted result:', del.data);
  
  // cleanup
  await supabaseAdmin.from('name_list_categories').delete().eq('id', catId);
}
run().catch(console.error);
