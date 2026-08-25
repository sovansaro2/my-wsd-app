import { Router } from 'express';
import { supabaseAdmin} from '../database';
import { requireAuth, requireAdmin } from '../auth/dependencies';

const router = Router();

// GET /api/profiles (Admin only)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, phone_number, role, avatar_url, created_at')
    .order('created_at', { ascending: false });
    
  if (error) return res.status(400).json({ detail: error.message });
  res.json(data);
});

// PUT /api/profiles/:id/role (Admin only)
router.put('/:id/role', requireAuth, requireAdmin, async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'user'].includes(role)) {
    return res.status(400).json({ detail: 'Invalid role' });
  }
  
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ role })
    .eq('id', req.params.id)
    .select('id, email, full_name, phone_number, role, avatar_url, created_at')
    .single();
    
  if (error) return res.status(400).json({ detail: error.message });
  res.json(data);
});

// PUT /api/profiles/:id/reset-password (Admin only)
router.put('/:id/reset-password', requireAuth, requireAdmin, async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ detail: 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ ៦ តួអក្សរ' });
  }

  // Update password in Supabase Auth using Admin API
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(req.params.id, {
    password: password
  });

  if (authError) return res.status(400).json({ detail: authError.message });
  
  res.json({ success: true, message: 'ពាក្យសម្ងាត់ត្រូវបានកែប្រែដោយជោគជ័យ' });
});

// GET /api/profiles/me
router.get('/me', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin.from('profiles').select('id, email, full_name, phone_number, role, avatar_url, created_at').eq('id', req.user!.id).maybeSingle();
  if (error) return res.status(400).json({ detail: error.message });
  
  if (!data) {
    return res.json({
      id: req.user!.id,
      email: req.user!.email,
      full_name: req.user!.user_metadata?.full_name || '',
      phone_number: req.user!.user_metadata?.phone_number || '',
      role: req.user!.role || 'user',
      avatar_url: null,
      has_balance_pin: !!req.user!.user_metadata?.balance_pin_hash
    });
  }
  
  res.json(data);
});

// PUT /api/profiles/me
router.put('/me', requireAuth, async (req, res) => {
  const updates = { ...req.body };
  
  if (updates.password) {
    // Update password in Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(req.user!.id, {
      password: updates.password
    });
    if (authError) return res.status(400).json({ detail: authError.message });
    delete updates.password;
  }

  // Update or insert profile
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .upsert({ id: req.user!.id, email: req.user!.email, ...updates })
    .select('id, email, full_name, phone_number, role, avatar_url, created_at')
    .single();

  if (error) return res.status(400).json({ detail: error.message });

  // Sync author_name on posts to reflect full_name changes efficiently
  if (updates.full_name) {
    await supabaseAdmin.from('posts').update({ author_name: updates.full_name }).eq('author_id', req.user!.id);
  }

  res.json(data);
});

export default router;


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
