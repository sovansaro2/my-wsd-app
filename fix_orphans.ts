import { supabaseAdmin } from './server/database';

async function run() {
  const { data: usersData, error: err1 } = await supabaseAdmin.auth.admin.listUsers();
  if (err1) { console.error("Error listing users", err1); return; }
  
  const { data: profilesData, error: err2 } = await supabaseAdmin.from('profiles').select('id');
  if (err2) { console.error("Error listing profiles", err2); return; }
  
  const profileIds = new Set(profilesData.map(p => p.id));
  
  for (const user of usersData.users) {
    if (!profileIds.has(user.id)) {
      console.log(`Deleting orphaned user: ${user.email} (${user.id})`);
      await supabaseAdmin.auth.admin.deleteUser(user.id);
    }
  }
  console.log("Cleanup complete.");
}
run();
