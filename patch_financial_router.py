import re

with open('server/routers/financial.ts', 'r') as f:
    content = f.read()

post_route = """router.post('/financial-records', requireAuth, requireAdmin, async (req, res) => {
  const { notify_public, seil_name, ...recordBody } = req.body;
  const { data, error } = await supabaseAdmin.from('financial_records').insert([recordBody]).select();
  if (error) return res.status(400).json({ detail: error.message });"""

post_route_new = """router.post('/financial-records', requireAuth, requireAdmin, async (req, res) => {
  const { notify_public, seil_name, ...recordBody } = req.body;
  let { data, error } = await supabaseAdmin.from('financial_records').insert([recordBody]).select();
  
  if (error && (error.code === '42703' || (error.message && error.message.includes('is_high_level')))) {
    delete recordBody.is_high_level;
    const retry = await supabaseAdmin.from('financial_records').insert([recordBody]).select();
    data = retry.data;
    error = retry.error;
  }

  if (error) return res.status(400).json({ detail: error.message });"""

content = content.replace(post_route, post_route_new)

put_route = """router.put('/financial-records/:id', requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin.from('financial_records').update(req.body).eq('id', req.params.id).select();
  if (error) return res.status(400).json({ detail: error.message });"""

put_route_new = """router.put('/financial-records/:id', requireAuth, requireAdmin, async (req, res) => {
  let recordBody = { ...req.body };
  let { data, error } = await supabaseAdmin.from('financial_records').update(recordBody).eq('id', req.params.id).select();
  
  if (error && (error.code === '42703' || (error.message && error.message.includes('is_high_level')))) {
    delete recordBody.is_high_level;
    const retry = await supabaseAdmin.from('financial_records').update(recordBody).eq('id', req.params.id).select();
    data = retry.data;
    error = retry.error;
  }

  if (error) return res.status(400).json({ detail: error.message });"""

content = content.replace(put_route, put_route_new)

with open('server/routers/financial.ts', 'w') as f:
    f.write(content)

