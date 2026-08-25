const { Client } = require('pg');
require('dotenv').config();
async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    await client.query('ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS balance_pin TEXT;');
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log("Success");
  } catch(e) {
    console.log("Error:", e.message);
  } finally {
    await client.end();
  }
}
run();
