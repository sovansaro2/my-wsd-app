import { Router } from 'express';
import { supabaseAdmin } from '../database';
import { requireAuth, requireAdmin } from '../auth/dependencies';

const router = Router();

// --- 100k+ Donors ---
router.get('/donors-100k', async (req, res) => {
  try {
    const { data: categories, error: catError } = await supabaseAdmin.from('name_list_categories').select('id, name');
    if (catError) throw catError;

    // Fetch records where is_100k_donor is true
    const { data: records, error: recError } = await supabaseAdmin
      .from('name_list_records')
      .select('*')
      .eq('is_100k_donor', true)
      .order('amount', { ascending: false });
      
    if (recError) {
      // Fallback if column doesn't exist yet
      if (recError.code === '42703' || recError.message?.includes('does not exist')) {
         return res.json([]);
      }
      throw recError;
    }

    const catMap: Record<string, string> = {};
    categories?.forEach(c => {
      catMap[c.id] = c.name;
    });

    const result = records?.map(r => ({
      ...r,
      category_name: catMap[r.category_id] || 'ផ្សេងៗ'
    })) || [];

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ detail: error.message });
  }
});

// --- Name List Categories ---
router.get('/categories', async (req, res) => {
  const { data, error } = await supabaseAdmin.from('name_list_categories').select('*').order('created_at', { ascending: false });
  if (error) return res.status(400).json({ detail: error.message });
  res.json(data);
});

router.post('/categories', requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin.from('name_list_categories').insert([req.body]).select();
  if (error) return res.status(400).json({ detail: error.message });
  if (!data || data.length === 0) return res.status(403).json({ detail: 'មិនអាចកែប្រែបានទេ (RLS)' });
  res.json(data[0]);
});

router.put('/categories/:id', requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin.from('name_list_categories').update(req.body).eq('id', req.params.id).select();
  if (error) return res.status(400).json({ detail: error.message });
  if (!data || data.length === 0) return res.status(403).json({ detail: 'មិនអាចកែប្រែបានទេ (RLS)' });
  res.json(data[0]);
});

router.delete('/categories/:id', requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin.from('name_list_categories').delete().eq('id', req.params.id).select();
  if (error) return res.status(400).json({ detail: error.message });
  if (!data || data.length === 0) return res.status(403).json({ detail: 'មិនអាចកែប្រែបានទេ (RLS)' });
  res.json({ success: true });
});

// --- Name List Records ---
router.get('/records', async (req, res) => {
  const category_id = req.query.category_id as string;
  let query = supabaseAdmin.from('name_list_records').select('*').order('created_at', { ascending: false });
  if (category_id) query = query.eq('category_id', category_id);
  const { data, error } = await query;
  if (error) return res.status(400).json({ detail: error.message });
  res.json(data);
});

router.post('/records', requireAuth, requireAdmin, async (req, res) => {
  const { notify_public, category_name, ...recordBody } = req.body;
  const { data, error } = await supabaseAdmin.from('name_list_records').insert([recordBody]).select();
  if (error) return res.status(400).json({ detail: error.message });
  if (!data || data.length === 0) return res.status(403).json({ detail: 'មិនអាចកែប្រែបានទេ (RLS)' });
  
  if (notify_public) {
    try {
      const n = data[0];
      await supabaseAdmin.from('app_notifications').insert([{
        title: 'ឈ្មោះថ្មីត្រូវបានបន្ថែមក្នុងបញ្ជី',
        message: `${n.name} (${n.amount.toLocaleString()}៛) ក្នុង ${category_name || 'បញ្ជីឈ្មោះ'}`,
        type: 'name_list',
        target_tab: 'manage_name_lists'
      }]);
    } catch (err) {
      console.error('Failed to insert notification:', err);
    }
  }
  
  res.json(data[0]);
});

router.put('/records/:id', requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin.from('name_list_records').update(req.body).eq('id', req.params.id).select();
  if (error) return res.status(400).json({ detail: error.message });
  if (!data || data.length === 0) return res.status(403).json({ detail: 'មិនអាចកែប្រែបានទេ (RLS)' });
  res.json(data[0]);
});

router.delete('/records/:id', requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin.from('name_list_records').delete().eq('id', req.params.id).select();
  if (error) return res.status(400).json({ detail: error.message });
  if (!data || data.length === 0) return res.status(403).json({ detail: 'មិនអាចកែប្រែបានទេ (RLS)' });
  res.json({ success: true });
});

export default router;
