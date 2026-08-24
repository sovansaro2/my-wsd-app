const { Client } = require('pg');
require('dotenv').config();

async function run() {
  if (!process.env.DATABASE_URL) {
     console.log("No DATABASE_URL");
     return;
  }
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    await client.query('ALTER TABLE public.name_list_records ADD COLUMN IF NOT EXISTS metadata JSONB;');
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log("Success");
  } catch(e) {
    console.log("Error:", e.message);
  } finally {
    await client.end();
  }
}
run();
