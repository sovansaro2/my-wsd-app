const fs = require('fs');
let content = fs.readFileSync('server/routers/profiles.ts', 'utf8');

const resetEndpoint = `
// PUT /api/profiles/me/reset-balance-pin
router.put('/me/reset-balance-pin', requireAuth, async (req, res) => {
  const { password, new_pin } = req.body;
  if (!password) return res.status(400).json({ detail: 'Password is required' });
  if (!new_pin || new_pin.length !== 4) return res.status(400).json({ detail: 'PIN ថ្មីត្រូវមាន ៤ ខ្ទង់' });
  
  // Verify password
  const { data, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
    email: req.user!.email!,
    password
  });
  if (signInError) return res.status(400).json({ detail: 'ពាក្យសម្ងាត់មិនត្រឹមត្រូវ' });
  
  const crypto = require('crypto');
  const hashedNewPin = crypto.createHash('sha256').update(req.user!.id + ':' + new_pin).digest('hex');
  
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(req.user!.id, {
    user_metadata: { ...req.user!.user_metadata, balance_pin_hash: hashedNewPin }
  });
  
  if (authError) return res.status(400).json({ detail: authError.message });
  res.json({ success: true });
});
`;

content = content + '\n' + resetEndpoint;
fs.writeFileSync('server/routers/profiles.ts', content);
