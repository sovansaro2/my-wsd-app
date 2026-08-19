const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function test() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  console.log('Select:', data, error);

  if (data && data.length > 0) {
      const user = data[0];
      const { data: upData, error: upError } = await supabase.from('profiles').upsert({ id: user.id, email: user.email, full_name: 'Test Name' });
      console.log('Upsert:', upData, upError);
  }
}
test();
