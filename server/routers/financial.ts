import { Router } from 'express';
import { supabaseAdmin, getAuthClient } from '../database';
import { requireAuth, requireAdmin } from '../auth/dependencies';

const router = Router();

// --- Seil Periods ---
router.get('/seil-periods', async (req, res) => {
  const { data, error } = await supabaseAdmin.from('seil_periods').select('*').order('created_at', { ascending: false });
  if (error) return res.status(400).json({ detail: error.message });
  res.json(data);
});

router.post('/seil-periods', requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin.from('seil_periods').insert([req.body]).select();
  if (error) return res.status(400).json({ detail: error.message });
  if (!data || data.length === 0) return res.status(403).json({ detail: 'មិនអាចកែប្រែបានទេ (RLS) សូមពិនិត្យមើល Service Role Key' });
  res.json(data[0]);
});

router.put('/seil-periods/:id', requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin.from('seil_periods').update(req.body).eq('id', req.params.id).select();
  if (error) return res.status(400).json({ detail: error.message });
  if (!data || data.length === 0) return res.status(403).json({ detail: 'មិនអាចកែប្រែបានទេ (RLS) សូមពិនិត្យមើល Service Role Key' });
  res.json(data[0]);
});

// --- Financial Records ---
router.get('/financial-records', async (req, res) => {
  const seil_id = req.query.seil_id as string;
  let query = supabaseAdmin.from('financial_records').select('*').order('created_at', { ascending: false });
  if (seil_id) query = query.eq('seil_id', seil_id);
  
  const { data, error } = await query;
  if (error) return res.status(400).json({ detail: error.message });
  res.json(data);
});

router.post('/financial-records', requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin.from('financial_records').insert([req.body]).select();
  if (error) return res.status(400).json({ detail: error.message });
  if (!data || data.length === 0) return res.status(403).json({ detail: 'មិនអាចកែប្រែបានទេ (RLS) សូមពិនិត្យមើល Service Role Key' });
  res.json(data[0]);
});

router.put('/financial-records/:id', requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin.from('financial_records').update(req.body).eq('id', req.params.id).select();
  if (error) return res.status(400).json({ detail: error.message });
  if (!data || data.length === 0) return res.status(403).json({ detail: 'មិនអាចកែប្រែបានទេ (RLS) សូមពិនិត្យមើល Service Role Key' });
  res.json(data[0]);
});

router.delete('/financial-records/:id', requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin.from('financial_records').delete().eq('id', req.params.id).select();
  if (error) return res.status(400).json({ detail: error.message });
  if (!data || data.length === 0) return res.status(403).json({ detail: 'មិនអាចកែប្រែបានទេ (RLS) សូមពិនិត្យមើល Service Role Key' });
  res.json({ success: true });
});

export default router;
