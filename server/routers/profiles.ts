import crypto from 'crypto';
import { Router } from 'express';
import { supabaseAdmin} from '../database';
import { requireAuth, requireAdmin } from '../auth/dependencies';

const router = Router();

// GET /api/profiles (Admin only)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  let { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, user_code, family_name, given_name, full_name, gender, date_of_birth, address, email, phone_number, role, avatar_url, created_at')
    .order('created_at', { ascending: false });
    
  if (error && error.message?.includes('user_code')) {
    // Fallback if column user_code is not yet added in SQL
    const fallback: any = await supabaseAdmin
      .from('profiles')
      .select('id, family_name, given_name, full_name, gender, date_of_birth, address, email, phone_number, role, avatar_url, created_at')
      .order('created_at', { ascending: false });
    data = fallback.data;
    error = fallback.error;
  }

  if (error) return res.status(400).json({ detail: error.message });
  
  // Ensure user_code is present in response
  const profilesWithCode = (data || []).map((p: any) => ({
    ...p,
    user_code: p.user_code || `WSD-${p.id ? p.id.replace(/-/g, '').substring(0, 4).toUpperCase() : '0810'}`
  }));

  res.json(profilesWithCode);
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
    .select('id, email, full_name, role, avatar_url, created_at, family_name, given_name, date_of_birth, gender, address, phone_number')
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
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(String(req.params.id), {
    password: password
  });

  if (authError) return res.status(400).json({ detail: authError.message });
  
  res.json({ success: true, message: 'ពាក្យសម្ងាត់ត្រូវបានកែប្រែដោយជោគជ័យ' });
});

// GET /api/profiles/me
router.get('/me', requireAuth, async (req, res) => {
  let { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, user_code, family_name, given_name, full_name, gender, date_of_birth, address, email, phone_number, role, avatar_url, created_at')
    .eq('id', req.user!.id)
    .maybeSingle();
    
  if (error && error.message?.includes('user_code')) {
    const fallback: any = await supabaseAdmin
      .from('profiles')
      .select('id, family_name, given_name, full_name, gender, date_of_birth, address, email, phone_number, role, avatar_url, created_at')
      .eq('id', req.user!.id)
      .maybeSingle();
    data = fallback.data;
    error = fallback.error;
  }

  if (error) return res.status(400).json({ detail: error.message });
  
  const userCode = data?.user_code || req.user!.user_metadata?.user_code || 'WSD-0810';

  if (!data) {
    return res.json({
      id: req.user!.id,
      email: req.user!.email,
      full_name: req.user!.user_metadata?.full_name || '',
      role: req.user!.role || 'user',
      avatar_url: null,
      user_code: userCode,
      has_balance_pin: !!req.user!.user_metadata?.balance_pin_hash
    });
  }
  
  res.json({
    ...data,
    user_code: userCode,
    has_balance_pin: !!req.user!.user_metadata?.balance_pin_hash
  });
});

// PUT /api/profiles/me
router.put('/me', requireAuth, async (req, res) => {
  const updates: Record<string, any> = { ...req.body };
  
  if (updates.password) {
    // Update password in Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(req.user!.id, {
      password: updates.password
    });
    if (authError) return res.status(400).json({ detail: authError.message });
    delete updates.password;
  }

  if (updates.email && updates.email.trim() !== '' && updates.email !== req.user!.email) {
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(req.user!.id, {
      email: updates.email.trim(),
      email_confirm: true
    });
    if (authError) return res.status(400).json({ detail: authError.message });
  }

  // Persist user_code in auth metadata as well
  if (updates.user_code) {
    try {
      await supabaseAdmin.auth.admin.updateUserById(req.user!.id, {
        user_metadata: { ...req.user!.user_metadata, user_code: updates.user_code }
      });
    } catch (err) {
      console.warn('Could not update user metadata:', err);
    }
  }

  // Handle date_of_birth formatting and empty string -> null
  if (updates.date_of_birth !== undefined) {
    if (!updates.date_of_birth || typeof updates.date_of_birth !== 'string' || updates.date_of_birth.trim() === '') {
      updates.date_of_birth = null;
    } else {
      const trimmedDate = updates.date_of_birth.trim();
      // Handle DD/MM/YYYY to YYYY-MM-DD conversion if needed
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmedDate)) {
        const [d, m, y] = trimmedDate.split('/');
        updates.date_of_birth = `${y}-${m}-${d}`;
      }
    }
  }

  // Sanitize empty strings to null or defaults
  if (updates.family_name !== undefined && updates.family_name.trim() === '') updates.family_name = null;
  if (updates.given_name !== undefined && updates.given_name.trim() === '') updates.given_name = null;
  if (updates.address !== undefined && updates.address.trim() === '') updates.address = null;
  if (updates.phone_number !== undefined && updates.phone_number.trim() === '') updates.phone_number = null;
  
  // Normalize gender
  if (updates.gender) {
    if (updates.gender === 'ប្រុស' || updates.gender === 'Male') {
      updates.gender = 'Male';
    } else if (updates.gender === 'ស្រី' || updates.gender === 'Female') {
      updates.gender = 'Female';
    } else if (updates.gender === 'ផ្សេងទៀត' || updates.gender === 'Other') {
      updates.gender = 'Other';
    } else {
      updates.gender = 'Male';
    }
  }

  // Compute full_name if not provided or empty
  if (!updates.full_name || updates.full_name.trim() === '') {
    const combined = [updates.family_name, updates.given_name].filter(Boolean).join(' ');
    if (combined) {
      updates.full_name = combined;
    }
  }

  // Update or insert profile
  let { data, error } = await supabaseAdmin
    .from('profiles')
    .upsert({ id: req.user!.id, email: req.user!.email, ...updates })
    .select('id, user_code, family_name, given_name, full_name, gender, date_of_birth, address, email, phone_number, role, avatar_url, created_at')
    .single();

  if (error && error.message?.includes('user_code')) {
    // Retry without user_code if column not in DB schema yet
    const { user_code, ...updatesWithoutCode } = updates;
    const fallback: any = await supabaseAdmin
      .from('profiles')
      .upsert({ id: req.user!.id, email: req.user!.email, ...updatesWithoutCode })
      .select('id, family_name, given_name, full_name, gender, date_of_birth, address, email, phone_number, role, avatar_url, created_at')
      .single();
    data = fallback.data;
    error = fallback.error;
    if (data) {
      data.user_code = updates.user_code || 'WSD-0810';
    }
  }

  if (error) return res.status(400).json({ detail: error.message });

  // Sync author_name on posts to reflect full_name changes efficiently
  if (updates.full_name) {
    await supabaseAdmin.from('posts').update({ author_name: updates.full_name }).eq('author_id', req.user!.id);
  }

  res.json({
    ...data,
    user_code: data?.user_code || updates.user_code || 'WSD-0810'
  });
});

export default router;


// POST /api/profiles/me/verify-pin
router.post('/me/verify-pin', requireAuth, async (req, res) => {
  const { pin } = req.body;
  if (!pin) return res.status(400).json({ detail: 'PIN is required' });
  
  const currentHash = req.user!.user_metadata?.balance_pin_hash;
  if (!currentHash) return res.status(400).json({ detail: 'PIN is not configured' });
  
  
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
  
  
  const hashedNewPin = crypto.createHash('sha256').update(req.user!.id + ':' + new_pin).digest('hex');
  
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(req.user!.id, {
    user_metadata: { ...req.user!.user_metadata, balance_pin_hash: hashedNewPin }
  });
  
  if (authError) return res.status(400).json({ detail: authError.message });
  res.json({ success: true });
});
