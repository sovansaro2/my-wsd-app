import { supabaseAdmin } from './server/database';
async function run() {
  const { data, error } = await supabaseAdmin.auth.signUp({
    email: 'test' + Date.now() + '@example.com',
    password: 'password123',
    options: {
      data: {
        full_name: 'Test User',
        phone_number: '123456789',
        role: 'user'
      }
    }
  });
  console.log("Data:", data, "Error:", error);
}
run();
