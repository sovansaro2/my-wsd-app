import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || '').trim().replace(/\/rest\/v1\/?$/, '');
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error(error);
    return;
  }
  
  const adminUser = users.find(u => u.email === 'sovansaro2025@gmail.com');
  if (!adminUser) {
    console.log("Admin user not found.");
    return;
  }

  console.log(`Updating password for ${adminUser.email}...`);
  const { error: updateError } = await supabase.auth.admin.updateUserById(adminUser.id, {
    password: 'admin123456'
  });

  if (updateError) {
    console.error("Update error:", updateError);
  } else {
    console.log("Password successfully reset to 'admin123456'");
  }
}
run();
