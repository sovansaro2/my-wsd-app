const fs = require('fs');
let content = fs.readFileSync('server/routers/profiles.ts', 'utf8');

// Replace the response in GET /me to include has_balance_pin
content = content.replace(
  `res.json(data);`,
  `res.json({ ...data, has_balance_pin: !!req.user!.user_metadata?.balance_pin_hash });`
);

content = content.replace(
  `avatar_url: null
    });`,
  `avatar_url: null,
      has_balance_pin: !!req.user!.user_metadata?.balance_pin_hash
    });`
);

// Add the new endpoints for PIN
const pinEndpoints = `
// POST /api/profiles/me/verify-pin
router.post('/me/verify-pin', requireAuth, async (req, res) => {
  const { pin } = req.body;
  if (!pin) return res.status(400).json({ detail: 'PIN is required' });
  
  const currentHash = req.user!.user_metadata?.balance_pin_hash;
  if (!currentHash) return res.status(400).json({ detail: 'PIN is not configured' });
  
  const crypto = require('crypto');
  const hashedPin = crypto.createHash('sha256').update(req.user!.id + ':' + pin).digest('hex');
  
  if (hashedPin === currentHash) {
    res.json({ success: true });
  } else {
    res.status(400).json({ detail: 'PIN មិនត្រឹមត្រូវ' });
  }
});

// PUT /api/profiles/me/balance-pin
router.put('/me/balance-pin', requireAuth, async (req, res) => {
  const { current_pin, new_pin } = req.body;
  
  const crypto = require('crypto');
  const currentHash = req.user!.user_metadata?.balance_pin_hash;
  
  // Verify current PIN if it exists
  if (currentHash) {
    if (!current_pin) return res.status(400).json({ detail: 'Current PIN is required' });
    const hashedCurrent = crypto.createHash('sha256').update(req.user!.id + ':' + current_pin).digest('hex');
    if (hashedCurrent !== currentHash) {
      return res.status(400).json({ detail: 'PIN បច្ចុប្បន្នមិនត្រឹមត្រូវ' });
    }
  }
  
  if (!new_pin || new_pin.length !== 4) {
    return res.status(400).json({ detail: 'PIN ថ្មីត្រូវមាន ៤ ខ្ទង់' });
  }
  
  const hashedNewPin = crypto.createHash('sha256').update(req.user!.id + ':' + new_pin).digest('hex');
  
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(req.user!.id, {
    user_metadata: { ...req.user!.user_metadata, balance_pin_hash: hashedNewPin }
  });
  
  if (authError) return res.status(400).json({ detail: authError.message });
  
  res.json({ success: true });
});
`;

content = content + '\n' + pinEndpoints;
fs.writeFileSync('server/routers/profiles.ts', content);
console.log('Patched profiles.ts');
