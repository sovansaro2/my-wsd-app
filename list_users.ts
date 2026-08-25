import { supabaseAdmin } from './server/database';

async function run() {
  const { data: usersData, error: err1 } = await supabaseAdmin.auth.admin.listUsers();
  console.log("Users:", usersData?.users.map(u => u.email));
  
  const { data: profilesData, error: err2 } = await supabaseAdmin.from('profiles').select('id, full_name');
  console.log("Profiles:", profilesData);
}
run();
