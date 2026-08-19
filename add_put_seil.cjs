const fs = require('fs');
let code = fs.readFileSync('server/routers/financial.ts', 'utf8');

code = code.replace(
  /\/\/ --- Financial Records ---/,
  `router.put('/seil-periods/:id', requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin.from('seil_periods').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(400).json({ detail: error.message });
  res.json(data);
});
// --- Financial Records ---`
);

fs.writeFileSync('server/routers/financial.ts', code);
