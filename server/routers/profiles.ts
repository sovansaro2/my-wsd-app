import { Router } from 'express';
import { supabaseAdmin} from '../database';
import { requireAuth } from '../auth/dependencies';

const router = Router();

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
      avatar_url: null
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
