const fs = require('fs');
const path = require('path');

const dbSeedsDir = path.join(__dirname, 'db_seeds');

if (fs.existsSync(dbSeedsDir)) {
  const rlsLockdownPath = path.join(dbSeedsDir, 'rls_lockdown_backend_only.sql');
  if (fs.existsSync(rlsLockdownPath)) {
    let rlsLockdown = fs.readFileSync(rlsLockdownPath, 'utf8');
    if (!rlsLockdown.includes('Block direct updates on name_list_categories')) {
      rlsLockdown += `
CREATE POLICY "Block direct updates on name_list_categories" ON public.name_list_categories FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "Block direct deletes on name_list_categories" ON public.name_list_categories FOR DELETE TO anon, authenticated USING (false);

-- ------------------------------------------------------------------------------
-- 6. name_list_records
-- ------------------------------------------------------------------------------
ALTER TABLE public.name_list_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on name_list_records" ON public.name_list_records FOR SELECT USING (true);
CREATE POLICY "Block direct inserts on name_list_records" ON public.name_list_records FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "Block direct updates on name_list_records" ON public.name_list_records FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "Block direct deletes on name_list_records" ON public.name_list_records FOR DELETE TO anon, authenticated USING (false);
`;
      fs.writeFileSync(rlsLockdownPath, rlsLockdown);
      console.log('rls_lockdown_backend_only.sql patched for completion');
    }
  }
}
