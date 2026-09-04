import { Router } from 'express';
import { supabaseAdmin, getClient } from '../database';
import { requireAuth, requireAdmin } from '../auth/dependencies';

const router = Router();

const KNOWN_VILLAGES_OR_AREAS = new Set([
  'ទ្រាលើ', 'ត្បាច', 'តាខូយ', 'ស្វាយពពារ', 'ក្បាលសំរោង', 'ត្រពាំងវិហារ'
]);

export function isHighTierIndividualDonor(name: string, categoryName?: string): boolean {
  if (!name) return false;
  const n = name.trim();

  // 1. Non-donor keywords or withdrawals/loans
  if (n === 'ខ្ចី' || n === 'មិនស្គាល់ឈ្មោះ') return false;
  if (categoryName === 'លុយជាងដក') return false;
  if (n.startsWith('ជាងអ៊ុំ')) return false;

  // 2. Exclude groups (ឈ្មោះក្រុម)
  if (n.includes('ក្រុម')) return false;

  // 3. Exclude pagodas/temples (ឈ្មោះវត្ត)
  if (n.includes('វត្ត')) return false;

  // 4. Exclude villages / localities (ឈ្មោះភូមិ)
  if (n.includes('ភូមិ') || n.includes('មេភូមិ') || n.includes('បរិស័ទភូមិ')) return false;
  if (KNOWN_VILLAGES_OR_AREAS.has(n)) return false;

  // 5. Exclude ceremonies or generic collective funds
  if (n.startsWith('បច្ច័យ') || n.startsWith('បុណ្យ') || n.includes('ញាតិញោម')) return false;

  return true;
}

// --- 100k+ Donors ---
router.get('/donors-100k', async (req, res) => {
  try {
    const { data: categories, error: catError } = await supabaseAdmin.from('name_list_categories').select('id, name');
    if (catError) throw catError;

    const catMap: Record<string, string> = {};
    categories?.forEach(c => {
      catMap[c.id] = c.name;
    });

    const donorsMap = new Map<string, any>();

    // 1. Fetch NameList records where amount >= 100,000 or is_100k_donor is true
    const { data: records, error: recError } = await supabaseAdmin
      .from('name_list_records')
      .select('*')
      .gte('amount', 100000);
      
    if (!recError && records) {
      for (const r of records) {
        const catName = catMap[r.category_id] || 'បញ្ជីផ្សេងៗ';
        if (isHighTierIndividualDonor(r.name, catName)) {
          const key = (r.name.trim() + '_' + r.amount).toLowerCase();
          donorsMap.set(key, {
            id: r.id,
            name: r.name.trim(),
            amount: Number(r.amount),
            created_at: r.created_at,
            category_name: catName,
            note: r.note
          });
        }
      }
    }

    // 2. Fetch Financial records (income only) where amount >= 100,000
    const { data: finRecords, error: finError } = await supabaseAdmin
      .from('financial_records')
      .select('*')
      .eq('type', 'income')
      .gte('amount', 100000);

    if (!finError && finRecords) {
      for (const f of finRecords) {
        if (isHighTierIndividualDonor(f.description)) {
          const key = (f.description.trim() + '_' + f.amount).toLowerCase();
          if (!donorsMap.has(key)) {
            donorsMap.set(key, {
              id: f.id,
              name: f.description.trim(),
              amount: Number(f.amount),
              created_at: f.created_at,
              category_name: 'ចំណូលទូទៅ',
              note: f.note
            });
          }
        }
      }
    }

    const result = Array.from(donorsMap.values());
    // Sort by amount descending
    result.sort((a, b) => b.amount - a.amount);

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ detail: error.message });
  }
});

// --- Search Donors Across System ---
router.get('/search-donors', async (req, res) => {
  try {
    const q = ((req.query.q as string) || '').trim().toLowerCase();

    // 1. Fetch categories and seil periods to map names
    const [catRes, seilRes] = await Promise.all([
      supabaseAdmin.from('name_list_categories').select('id, name'),
      supabaseAdmin.from('seil_periods').select('id, name, date_range_text')
    ]);

    const catMap: Record<string, string> = {};
    catRes.data?.forEach(c => { catMap[c.id] = c.name; });

    const seilMap: Record<string, string> = {};
    seilRes.data?.forEach(s => { seilMap[s.id] = s.date_range_text ? `${s.name} (${s.date_range_text})` : s.name; });

    // 2. Fetch name list records and financial income records
    const [nameRecRes, finRecRes] = await Promise.all([
      supabaseAdmin.from('name_list_records').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('financial_records').select('*').eq('type', 'income').order('created_at', { ascending: false })
    ]);

    const allItems: any[] = [];

    (nameRecRes.data || []).forEach(r => {
      const name = (r.name || '').trim();
      if (!name) return;
      if (q && !name.toLowerCase().includes(q) && !(r.note || '').toLowerCase().includes(q)) {
        return;
      }
      allItems.push({
        id: r.id,
        name: name,
        amount: Number(r.amount) || 0,
        source_type: 'category',
        source_name: catMap[r.category_id] || 'បញ្ជីផ្សេងៗ',
        source_id: r.category_id,
        date: r.created_at,
        note: r.note || '',
        referrer: r.referrer || ''
      });
    });

    (finRecRes.data || []).forEach(f => {
      const name = (f.description || '').trim();
      if (!name) return;
      if (q && !name.toLowerCase().includes(q) && !(f.note || '').toLowerCase().includes(q)) {
        return;
      }
      allItems.push({
        id: f.id,
        name: name,
        amount: Number(f.amount) || 0,
        source_type: 'seil',
        source_name: seilMap[f.seil_id] || 'បញ្ជីសីល',
        source_id: f.seil_id,
        date: f.record_date || f.created_at,
        note: f.note || '',
        referrer: ''
      });
    });

    // Group by normalized donor name
    const grouped = new Map<string, any>();
    allItems.forEach(item => {
      const key = item.name.toLowerCase();
      if (!grouped.has(key)) {
        grouped.set(key, {
          name: item.name,
          total_amount: 0,
          contributions_count: 0,
          locations: new Set<string>(),
          records: []
        });
      }
      const entry = grouped.get(key);
      entry.total_amount += item.amount;
      entry.contributions_count += 1;
      if (item.note) entry.locations.add(item.note);
      entry.records.push(item);
    });

    const donors = Array.from(grouped.values()).map(d => ({
      ...d,
      locations: Array.from(d.locations)
    }));

    // Sort by total amount descending
    donors.sort((a, b) => b.total_amount - a.total_amount);

    res.json({
      total_donors_found: donors.length,
      total_contributions_found: allItems.length,
      donors: donors,
      recent_items: allItems.slice(0, 50)
    });
  } catch (error: any) {
    res.status(500).json({ detail: error.message });
  }
});

// --- Name List Categories ---
router.get('/categories', async (req, res) => {
  const { data, error } = await supabaseAdmin.from('name_list_categories').select('*').order('created_at', { ascending: false });
  if (error) return res.status(400).json({ detail: error.message });
  res.json(data);
});

router.post('/categories', requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await getClient(req).from('name_list_categories').insert([req.body]).select();
  if (error) return res.status(400).json({ detail: error.message });
  if (!data || data.length === 0) return res.status(403).json({ detail: 'មិនអាចកែប្រែបានទេ (RLS)' });
  res.json(data[0]);
});

router.put('/categories/:id', requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await getClient(req).from('name_list_categories').update(req.body).eq('id', req.params.id).select();
  if (error) return res.status(400).json({ detail: error.message });
  if (!data || data.length === 0) return res.status(403).json({ detail: 'មិនអាចកែប្រែបានទេ (RLS)' });
  res.json(data[0]);
});

router.delete('/categories/:id', requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await getClient(req).from('name_list_categories').delete().eq('id', req.params.id).select();
  if (error) return res.status(400).json({ detail: error.message });
  
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
  if (recordBody.is_100k_donor === undefined && recordBody.amount) {
    recordBody.is_100k_donor = Number(recordBody.amount) >= 100000 && isHighTierIndividualDonor(recordBody.name, category_name);
  }
  let { data, error } = await getClient(req).from('name_list_records').insert([recordBody]).select();
  
  if (error && (error.code === '42703' || (error.message && error.message.includes('is_100k_donor')))) {
    delete (recordBody as any).is_100k_donor;
    const retry = await getClient(req).from('name_list_records').insert([recordBody]).select();
    data = retry.data;
    error = retry.error;
  }

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
  let recordBody = { ...req.body };
  if (recordBody.name && recordBody.amount !== undefined && recordBody.is_100k_donor === undefined) {
    recordBody.is_100k_donor = Number(recordBody.amount) >= 100000 && isHighTierIndividualDonor(recordBody.name);
  }
  let { data, error } = await getClient(req).from('name_list_records').update(recordBody).eq('id', req.params.id).select();
  
  if (error && (error.code === '42703' || (error.message && error.message.includes('is_100k_donor')))) {
    delete (recordBody as any).is_100k_donor;
    if (Object.keys(recordBody).length === 0) {
      const existing = await getClient(req).from('name_list_records').select('*').eq('id', req.params.id);
      data = existing.data;
      error = existing.error;
    } else {
      const retry = await getClient(req).from('name_list_records').update(recordBody).eq('id', req.params.id).select();
      data = retry.data;
      error = retry.error;
    }
  }

  if (error) return res.status(400).json({ detail: error.message });
  if (!data || data.length === 0) return res.status(403).json({ detail: 'មិនអាចកែប្រែបានទេ (RLS)' });
  res.json(data[0]);
});

router.delete('/records/:id', requireAuth, requireAdmin, async (req, res) => {
  const { error } = await getClient(req).from('name_list_records').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ detail: error.message });
  
  res.json({ success: true });
});

export default router;
