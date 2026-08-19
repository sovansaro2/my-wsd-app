import { Router } from 'express';
import { supabaseAdmin, getAuthClient } from '../database';
import { requireAuth, requireAdmin } from '../auth/dependencies';

const router = Router();

// --- Categories ---
router.get('/categories', async (req, res) => {
  const { data, error } = await supabaseAdmin.from('name_list_categories').select('*').order('created_at', { ascending: false });
  if (error) return res.status(400).json({ detail: error.message });
  res.json(data);
});

router.post('/categories', requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin.from('name_list_categories').insert([req.body]).select();
  if (error) return res.status(400).json({ detail: error.message });
  res.json(data ? data[0] : null);
});

router.put('/categories/:id', requireAuth, requireAdmin, async (req, res) => {
  console.log('Update category called:', req.params.id, req.body);
  const { data, error } = await supabaseAdmin.from('name_list_categories').update(req.body).eq('id', req.params.id).select();
  if (error) return res.status(400).json({ detail: error.message });
  res.json(data ? data[0] : null);
});

router.delete('/categories/:id', requireAuth, requireAdmin, async (req, res) => {
  const { error } = await supabaseAdmin.from('name_list_categories').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ detail: error.message });
  res.json({ success: true });
});

// --- Records ---
router.get('/records', async (req, res) => {
  const category_id = req.query.category_id as string;
  let query = supabaseAdmin.from('name_list_records').select('*').order('created_at', { ascending: false });
  if (category_id) query = query.eq('category_id', category_id);
  
  const { data, error } = await query;
  if (error) return res.status(400).json({ detail: error.message });
  res.json(data);
});

router.post('/records', requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin.from('name_list_records').insert([req.body]).select();
  if (error) return res.status(400).json({ detail: error.message });
  res.json(data ? data[0] : null);
});

router.put('/records/:id', requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin.from('name_list_records').update(req.body).eq('id', req.params.id).select();
  if (error) return res.status(400).json({ detail: error.message });
  res.json(data ? data[0] : null);
});

router.delete('/records/:id', requireAuth, requireAdmin, async (req, res) => {
  const { error } = await supabaseAdmin.from('name_list_records').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ detail: error.message });
  res.json({ success: true });
});

export default router;
