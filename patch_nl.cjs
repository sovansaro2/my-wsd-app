const fs = require('fs');
let content = fs.readFileSync('server/routers/name_lists.ts', 'utf8');

const target1 = `router.post('/records', requireAuth, requireAdmin, async (req, res) => {
  const { notify_public, category_name, ...recordBody } = req.body;
  const { data, error } = await supabaseAdmin.from('name_list_records').insert([recordBody]).select();
  if (error) return res.status(400).json({ detail: error.message });
  if (!data || data.length === 0) return res.status(403).json({ detail: 'មិនអាចកែប្រែបានទេ (RLS)' });`;

const replacement1 = `router.post('/records', requireAuth, requireAdmin, async (req, res) => {
  const { notify_public, category_name, ...recordBody } = req.body;
  let { data, error } = await supabaseAdmin.from('name_list_records').insert([recordBody]).select();
  
  if (error && (error.code === '42703' || (error.message && error.message.includes('is_100k_donor')))) {
    delete (recordBody as any).is_100k_donor;
    const retry = await supabaseAdmin.from('name_list_records').insert([recordBody]).select();
    data = retry.data;
    error = retry.error;
  }

  if (error) return res.status(400).json({ detail: error.message });
  if (!data || data.length === 0) return res.status(403).json({ detail: 'មិនអាចកែប្រែបានទេ (RLS)' });`;

const target2 = `router.put('/records/:id', requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin.from('name_list_records').update(req.body).eq('id', req.params.id).select();
  if (error) return res.status(400).json({ detail: error.message });`;

const replacement2 = `router.put('/records/:id', requireAuth, requireAdmin, async (req, res) => {
  let recordBody = { ...req.body };
  let { data, error } = await supabaseAdmin.from('name_list_records').update(recordBody).eq('id', req.params.id).select();
  
  if (error && (error.code === '42703' || (error.message && error.message.includes('is_100k_donor')))) {
    delete (recordBody as any).is_100k_donor;
    const retry = await supabaseAdmin.from('name_list_records').update(recordBody).eq('id', req.params.id).select();
    data = retry.data;
    error = retry.error;
  }

  if (error) return res.status(400).json({ detail: error.message });`;

content = content.replace(target1, replacement1);
content = content.replace(target2, replacement2);
fs.writeFileSync('server/routers/name_lists.ts', content);
