const fs = require('fs');
let content = fs.readFileSync('server/auth/routes.ts', 'utf8');

const verifyPasswordEndpoint = `
// POST /api/auth/verify-password
router.post('/verify-password', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ detail: 'Unauthorized' });

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ detail: 'Unauthorized' });
    }
    
    const { password } = req.body;
    if (!password) return res.status(400).json({ detail: 'Password required' });

    // Verify password by attempting to sign in
    const { data, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: user.email!,
      password
    });

    if (signInError) {
      return res.status(400).json({ detail: 'ពាក្យសម្ងាត់មិនត្រឹមត្រូវ' });
    }

    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ detail: e.message || 'Error verifying password' });
  }
});
`;

content = content + '\n' + verifyPasswordEndpoint;
fs.writeFileSync('server/auth/routes.ts', content);
