import { Hono } from 'hono';
import type { HonoBindings } from '../types';
import { getDirectAdminClient, getSupabaseAdmin } from '../lib/supabase';
import { requireAdmin, requireAuth } from '../middleware/auth';

const nameListsRoutes = new Hono<HonoBindings>();

const KNOWN_VILLAGES_OR_AREAS = new Set([
  'ទ្រាលើ',
  'ត្បាច',
  'តាខូយ',
  'ស្វាយពពារ',
  'ក្បាលសំរោង',
  'ត្រពាំងវិហារ',
  'ភូមិស្វាយចេក',
  'ភូមិថ្មី',
  'ភូមិស្មន់មុន្នី',
  'ភូមិក្រាំងឡង',
  'ភូមិព្រៃរបង',
]);

export function normalizeDonorName(name: string): string {
  if (!name) return '';
  let clean = name.trim().replace(/\s+/g, ' ');
  clean = clean.replace(/\s*\([^)]*\)/g, '');
  clean = clean.replace(
    /\s+(ព្រមទាំងកូនចៅ|ព្រមទាំងបុត្រ|ព្រមទាំងបុត្រធីតា|ព្រមទាំងក្រុមគ្រួសារ|និងក្រុមគ្រួសារ|និងកូនចៅ|និងបុត្រ|ព្រមទាំងញាតិមិត្ត|កូនចៅ|និងភរិយា|ភរិយា)$/g,
    ''
  );

  const prefixRegex =
    /^(ក្រុមគ្រួសារលោកតា|ក្រុមគ្រួសារលោកយាយ|ក្រុមគ្រួសារលោក|ក្រុមគ្រួសារ|ក្រុមកូនចៅ\s*លោកយាយ|ក្រុមកូនចៅ\s*លោកតា|ក្រុមកូនចៅ|កូនចៅ\s*លោកយាយ|កូនចៅ\s*លោកតា|កូនចៅ|ក្រុមញាតិព្រះធម៌\s*លោកយាយ|ក្រុមញាតិព្រះធម៌\s*លោកតា|ក្រុមញាតិព្រះធម៌|ក្រុមឧបាសិកា|ក្រុមឧបាសក|ក្រុម|លោកយាយ|លោកតា|ឧបាសិកា|ឧបាសក|ព្រះតេជគុណ|ភិក្ខុ|លោកគ្រូ|អ្នកគ្រូ|គ្រូ|លោកស្រី|អ្នកស្រី|អ្នកមីង|មីង|ពូ|ញោម|លោក|យាយ|តា|កុង|ម៉ែ|ឪ|ពេទ្យ|ឧ\.ក|ឧ\.សិ)\s*/g;
  clean = clean.replace(prefixRegex, '');
  clean = clean.replace(prefixRegex, '');
  clean = clean.replace(/\s+ភូមិ[\u1780-\u17D2]+$/g, '');
  clean = clean.replace(/ប៊ុន\s*រិទ្ធិ?/g, 'ប៊ុនរិទ្ធ');

  if (clean.includes(',')) {
    const parts = clean.split(',').map((p) => p.trim());
    if (parts[0]) clean = parts[0];
  }

  return clean.trim().toLowerCase();
}

export function findCrossListedFinancialRecordIds(
  nameRecords: any[],
  finRecords: any[],
  catMap: Record<string, string>,
  seilMap: Record<string, string>
) {
  const matchedFinIds = new Set<string>();
  const linkedDetails = new Map<
    string,
    {
      fin_id: string;
      seil_name: string;
      fr_note: string;
      fr_date: string;
    }
  >();

  nameRecords.forEach((nr) => {
    const nrNorm = normalizeDonorName(nr.name);
    const nrAmt = Number(nr.amount);
    if (!nrNorm || nrAmt <= 0) return;

    const nrCat = catMap[nr.category_id] || '';
    if (!nrCat.includes('កសាង')) return;

    const match = finRecords.find((fr) => {
      if (matchedFinIds.has(fr.id)) return false;
      if (Number(fr.amount) !== nrAmt) return false;

      const frNorm = normalizeDonorName(fr.description);
      if (!frNorm) return false;

      const frNote = (fr.note || '').toLowerCase();
      const frDesc = (fr.description || '').toLowerCase();
      const isFrConstruction = frNote.includes('កសាង') || frDesc.includes('កសាង');

      const n1 = (nr.name || '').replace(/\s+/g, '');
      const n2 = (fr.description || '').replace(/\s+/g, '');
      if (n1.includes('ឆេងប៉េងគុណ') && n2.includes('ឆេងប៉េងគុណ')) return true;
      if (n1.includes('ស៊ីនួន') && n2.includes('ស៊ីនួន')) return true;
      if (n1.includes('ឆេងស៊ុយ') && n2.includes('ឆេងស៊ុយ')) return true;
      if (n1.includes('កុងសុក') && n2.includes('កុងសុភ')) return true;

      if (
        frNorm === nrNorm ||
        (nrNorm.length >= 4 && (frNorm.includes(nrNorm) || nrNorm.includes(frNorm)))
      ) {
        if (isFrConstruction) return true;
        const timeDiffDays =
          Math.abs(new Date(nr.created_at).getTime() - new Date(fr.created_at).getTime()) /
          (1000 * 60 * 60 * 24);
        if (timeDiffDays <= 14) return true;
      }

      return false;
    });

    if (match) {
      matchedFinIds.add(match.id);
      linkedDetails.set(nr.id, {
        fin_id: match.id,
        seil_name: seilMap[match.seil_id] || 'បញ្ជីចំណូលចំណាយ',
        fr_note: match.note || '',
        fr_date: match.record_date || match.created_at,
      });
    }
  });

  return { matchedFinIds, linkedDetails };
}

export function isHighTierIndividualDonor(name: string, categoryName?: string): boolean {
  if (!name) return false;
  const n = name.trim();

  if (n === 'ខ្ចី' || n === 'មិនស្គាល់ឈ្មោះ') return false;
  if (categoryName === 'លុយជាងដក') return false;
  if (categoryName?.includes('ចំណាយ') || categoryName?.includes('បញ្ជីថវិការចំណាយ')) return false;
  if (n.startsWith('ជាងអ៊ុំ')) return false;

  if (
    n.startsWith('បច្ច័យប្រចាំសីល') ||
    n.startsWith('បច្ច័យថ្ងៃសីល') ||
    n.startsWith('បច្ច័យសល់') ||
    n.includes('ចេតិយរួម')
  ) {
    return false;
  }

  if (n === 'ញាតិញោមមកពីភ្នំជីសូរ' || n === 'គេចូលតាមរយៈមេភូមិ') return false;
  if (n === 'បុណ្យ១០០ថ្ងៃ') return false;
  if (n.startsWith('វត្ត ') || n.startsWith('វត្ត')) return false;
  if (KNOWN_VILLAGES_OR_AREAS.has(n)) return false;
  if (n.startsWith('បរិស័ទភូមិ') || n.startsWith('ពុទ្ធបរិស័ទ ភូមិ') || n.startsWith('ពុទ្ធបរិស័ទ')) {
    return false;
  }

  return true;
}

nameListsRoutes.get('/donors-100k', async (c) => {
  try {
    const supabaseAdmin = getSupabaseAdmin(c.env);
    const [catRes, seilRes, recRes, finRes] = await Promise.all([
      supabaseAdmin.from('name_list_categories').select('id, name'),
      supabaseAdmin.from('seil_periods').select('id, name, date_range_text'),
      supabaseAdmin.from('name_list_records').select('*').gte('amount', 100000),
      supabaseAdmin.from('financial_records').select('*').eq('type', 'income').gte('amount', 100000),
    ]);

    const catMap: Record<string, string> = {};
    catRes.data?.forEach((cat) => {
      catMap[cat.id] = cat.name;
    });

    const seilMap: Record<string, string> = {};
    seilRes.data?.forEach((s) => {
      seilMap[s.id] = s.date_range_text ? `${s.name} (${s.date_range_text})` : s.name;
    });

    const records = recRes.data || [];
    const finRecords = finRes.data || [];
    const { matchedFinIds } = findCrossListedFinancialRecordIds(records, finRecords, catMap, seilMap);
    const donorsMap = new Map<string, any>();

    for (const r of records) {
      const catName = catMap[r.category_id] || 'បញ្ជីផ្សេងៗ';
      if (isHighTierIndividualDonor(r.name, catName)) {
        const norm = normalizeDonorName(r.name) || r.name.trim().toLowerCase();
        const key = (norm + '_' + r.amount).toLowerCase();
        donorsMap.set(key, {
          id: r.id,
          name: r.name.trim(),
          amount: Number(r.amount),
          created_at: r.created_at,
          category_name: catName,
          note: r.note,
        });
      }
    }

    for (const f of finRecords) {
      if (matchedFinIds.has(f.id)) continue;
      if (isHighTierIndividualDonor(f.description)) {
        const norm = normalizeDonorName(f.description) || f.description.trim().toLowerCase();
        const key = (norm + '_' + f.amount).toLowerCase();
        if (!donorsMap.has(key)) {
          donorsMap.set(key, {
            id: f.id,
            name: f.description.trim(),
            amount: Number(f.amount),
            created_at: f.created_at,
            category_name: seilMap[f.seil_id] || 'ចំណូលទូទៅ',
            note: f.note,
          });
        }
      }
    }

    const result = Array.from(donorsMap.values());
    result.sort((a, b) => b.amount - a.amount);
    return c.json(result);
  } catch (error: any) {
    if (error?.message?.includes('fetch failed')) return c.json([]);
    return c.json({ detail: error.message }, 400);
  }
});

nameListsRoutes.get('/top-benefactors', async (c) => {
  try {
    const supabaseAdmin = getSupabaseAdmin(c.env);
    const [catRes, seilRes, nameRecRes, finRecRes] = await Promise.all([
      supabaseAdmin.from('name_list_categories').select('id, name'),
      supabaseAdmin.from('seil_periods').select('id, name, date_range_text'),
      supabaseAdmin.from('name_list_records').select('*').order('created_at', { ascending: false }),
      supabaseAdmin
        .from('financial_records')
        .select('*')
        .eq('type', 'income')
        .order('created_at', { ascending: false }),
    ]);

    const catMap: Record<string, string> = {};
    catRes.data?.forEach((cat) => {
      catMap[cat.id] = cat.name;
    });

    const seilMap: Record<string, string> = {};
    seilRes.data?.forEach((s) => {
      seilMap[s.id] = s.date_range_text ? `${s.name} (${s.date_range_text})` : s.name;
    });

    const nameRecords = nameRecRes.data || [];
    const finRecords = finRecRes.data || [];

    const { matchedFinIds, linkedDetails } = findCrossListedFinancialRecordIds(
      nameRecords,
      finRecords,
      catMap,
      seilMap
    );

    const donorsMap = new Map<
      string,
      {
        displayName: string;
        total_amount: number;
        contributions_count: number;
        locations: Set<string>;
        records: Array<{
          id: string;
          recorded_name?: string;
          amount: number;
          source_name: string;
          source_id?: string;
          source_type: 'category' | 'seil';
          date: string;
          note: string;
          is_cross_listed?: boolean;
          cross_listed_info?: string;
        }>;
      }
    >();

    function getDonorEntry(rawName: string) {
      const norm = normalizeDonorName(rawName) || rawName.trim().toLowerCase();
      if (!donorsMap.has(norm)) {
        donorsMap.set(norm, {
          displayName: rawName.trim(),
          total_amount: 0,
          contributions_count: 0,
          locations: new Set<string>(),
          records: [],
        });
      }
      const d = donorsMap.get(norm)!;
      if (!rawName.includes('(') && d.displayName.includes('(')) {
        d.displayName = rawName.trim();
      } else if (
        rawName.trim().length > d.displayName.length &&
        (!rawName.includes('(') || d.displayName.includes('('))
      ) {
        d.displayName = rawName.trim();
      }
      return d;
    }

    nameRecords.forEach((r) => {
      const cleanName = (r.name || '').trim().replace(/\s+/g, ' ');
      if (!isHighTierIndividualDonor(cleanName)) return;
      const amt = Number(r.amount) || 0;
      if (amt <= 0) return;

      const d = getDonorEntry(cleanName);
      d.total_amount += amt;
      d.contributions_count += 1;
      if (r.note && r.note.trim()) d.locations.add(r.note.trim());

      const linked = linkedDetails.get(r.id);
      if (linked?.fr_note) d.locations.add(linked.fr_note.trim());

      d.records.push({
        id: r.id,
        recorded_name: cleanName,
        amount: amt,
        source_name: catMap[r.category_id] || 'បញ្ជីផ្សេងៗ',
        source_id: r.category_id,
        source_type: 'category',
        date: r.created_at || new Date().toISOString(),
        note: r.note ? r.note.trim() : '',
        is_cross_listed: !!linked,
        cross_listed_info: linked ? `មានកត់ត្រាក្នុង ${linked.seil_name} (រាប់តែម្ដង)` : undefined,
      });
    });

    finRecords.forEach((f) => {
      if (matchedFinIds.has(f.id)) return;
      const cleanName = (f.description || '').trim().replace(/\s+/g, ' ');
      if (!isHighTierIndividualDonor(cleanName)) return;
      const amt = Number(f.amount) || 0;
      if (amt <= 0) return;

      const d = getDonorEntry(cleanName);
      d.total_amount += amt;
      d.contributions_count += 1;
      if (f.note && f.note.trim()) d.locations.add(f.note.trim());

      d.records.push({
        id: f.id,
        recorded_name: cleanName,
        amount: amt,
        source_name: seilMap[f.seil_id] || 'ចំណូលទូទៅ',
        source_id: f.seil_id,
        source_type: 'seil',
        date: f.record_date || f.created_at || new Date().toISOString(),
        note: f.note ? f.note.trim() : '',
        is_cross_listed: false,
      });
    });

    const donors = Array.from(donorsMap.values()).map((d) => ({
      name: d.displayName,
      total_amount: d.total_amount,
      contributions_count: d.contributions_count,
      locations: Array.from(d.locations),
      records: d.records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    }));

    donors.sort((a, b) => b.total_amount - a.total_amount);

    return c.json({
      total_donors: donors.length,
      deduplicated_overlapping_count: matchedFinIds.size,
      donors,
    });
  } catch (error: any) {
    if (error?.message?.includes('fetch failed')) {
      return c.json({ total_donors: 0, deduplicated_overlapping_count: 0, donors: [] });
    }
    return c.json({ detail: error.message }, 500);
  }
});

nameListsRoutes.get('/search-donors', async (c) => {
  try {
    const q = (c.req.query('q') || '').trim().toLowerCase();
    const supabaseAdmin = getSupabaseAdmin(c.env);

    const [catRes, seilRes, nameRecRes, finRecRes] = await Promise.all([
      supabaseAdmin.from('name_list_categories').select('id, name'),
      supabaseAdmin.from('seil_periods').select('id, name, date_range_text'),
      supabaseAdmin.from('name_list_records').select('*').order('created_at', { ascending: false }),
      supabaseAdmin
        .from('financial_records')
        .select('*')
        .eq('type', 'income')
        .order('created_at', { ascending: false }),
    ]);

    const catMap: Record<string, string> = {};
    catRes.data?.forEach((cat) => {
      catMap[cat.id] = cat.name;
    });

    const seilMap: Record<string, string> = {};
    seilRes.data?.forEach((s) => {
      seilMap[s.id] = s.date_range_text ? `${s.name} (${s.date_range_text})` : s.name;
    });

    const nameRecords = nameRecRes.data || [];
    const finRecords = finRecRes.data || [];

    const { matchedFinIds, linkedDetails } = findCrossListedFinancialRecordIds(
      nameRecords,
      finRecords,
      catMap,
      seilMap
    );

    const allItems: any[] = [];

    nameRecords.forEach((r) => {
      const name = (r.name || '').trim();
      if (!name) return;
      if (q && !name.toLowerCase().includes(q) && !(r.note || '').toLowerCase().includes(q)) return;
      const linked = linkedDetails.get(r.id);
      allItems.push({
        id: r.id,
        name,
        amount: Number(r.amount) || 0,
        source_type: 'category',
        source_name: catMap[r.category_id] || 'បញ្ជីផ្សេងៗ',
        source_id: r.category_id,
        date: r.created_at,
        note: r.note || '',
        referrer: r.referrer || '',
        is_cross_listed: !!linked,
        cross_listed_info: linked ? `មានកត់ត្រាក្នុង ${linked.seil_name} (រាប់តែម្ដង)` : undefined,
      });
    });

    finRecords.forEach((f) => {
      if (matchedFinIds.has(f.id)) return;
      const name = (f.description || '').trim();
      if (!name) return;
      if (q && !name.toLowerCase().includes(q) && !(f.note || '').toLowerCase().includes(q)) return;
      allItems.push({
        id: f.id,
        name,
        amount: Number(f.amount) || 0,
        source_type: 'seil',
        source_name: seilMap[f.seil_id] || 'បញ្ជីសីល',
        source_id: f.seil_id,
        date: f.record_date || f.created_at,
        note: f.note || '',
        referrer: '',
        is_cross_listed: false,
      });
    });

    const grouped = new Map<string, any>();
    allItems.forEach((item) => {
      const key = normalizeDonorName(item.name) || item.name.toLowerCase();
      if (!grouped.has(key)) {
        grouped.set(key, {
          name: item.name,
          total_amount: 0,
          contributions_count: 0,
          locations: new Set<string>(),
          records: [],
        });
      }
      const entry = grouped.get(key);
      if (!item.name.includes('(') && entry.name.includes('(')) {
        entry.name = item.name;
      } else if (item.name.length > entry.name.length && (!item.name.includes('(') || entry.name.includes('('))) {
        entry.name = item.name;
      }
      entry.total_amount += item.amount;
      entry.contributions_count += 1;
      if (item.note) entry.locations.add(item.note);
      entry.records.push(item);
    });

    const donors = Array.from(grouped.values()).map((d) => ({
      ...d,
      locations: Array.from(d.locations),
    }));
    donors.sort((a, b) => b.total_amount - a.total_amount);

    return c.json({
      total_donors_found: donors.length,
      total_contributions_found: allItems.length,
      donors,
      recent_items: allItems.slice(0, 50),
    });
  } catch (error: any) {
    return c.json({ detail: error.message }, 500);
  }
});

nameListsRoutes.get('/categories', async (c) => {
  try {
    const supabaseAdmin = getSupabaseAdmin(c.env);
    const { data, error } = await supabaseAdmin
      .from('name_list_categories')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      if (error.message?.includes('fetch failed')) return c.json([]);
      return c.json({ detail: error.message }, 400);
    }
    return c.json(data || []);
  } catch {
    return c.json([]);
  }
});

nameListsRoutes.post('/categories', requireAuth, requireAdmin, async (c) => {
  const body = await c.req.json();
  const supabaseAdmin = getSupabaseAdmin(c.env);
  const { data, error } = await supabaseAdmin.from('name_list_categories').insert([body]).select();
  if (error) return c.json({ detail: error.message }, 400);
  if (!data || data.length === 0) return c.json({ detail: 'មិនអាចកែប្រែបានទេ (RLS)' }, 403);
  return c.json(data[0]);
});

nameListsRoutes.put('/categories/:id', requireAuth, requireAdmin, async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const supabaseAdmin = getSupabaseAdmin(c.env);
  const { data, error } = await supabaseAdmin.from('name_list_categories').update(body).eq('id', id).select();
  if (error) return c.json({ detail: error.message }, 400);
  if (!data || data.length === 0) return c.json({ detail: 'មិនអាចកែប្រែបានទេ (RLS)' }, 403);
  return c.json(data[0]);
});

nameListsRoutes.delete('/categories/:id', requireAuth, requireAdmin, async (c) => {
  const id = c.req.param('id');
  const supabaseAdmin = getSupabaseAdmin(c.env);
  const { error } = await supabaseAdmin.from('name_list_categories').delete().eq('id', id).select();
  if (error) return c.json({ detail: error.message }, 400);
  return c.json({ success: true });
});

nameListsRoutes.get('/records', async (c) => {
  try {
    const categoryId = c.req.query('category_id');
    const supabaseAdmin = getSupabaseAdmin(c.env);
    let query = supabaseAdmin.from('name_list_records').select('*').order('created_at', { ascending: false });
    if (categoryId) query = query.eq('category_id', categoryId);
    const { data, error } = await query;
    if (error) {
      if (error.message?.includes('fetch failed')) return c.json([]);
      return c.json({ detail: error.message }, 400);
    }
    return c.json(data || []);
  } catch {
    return c.json([]);
  }
});

nameListsRoutes.post('/records', requireAuth, requireAdmin, async (c) => {
  const { notify_public, category_name, ...recordBody } = await c.req.json();
  const supabaseAdmin = getSupabaseAdmin(c.env);
  if (recordBody.is_100k_donor === undefined && recordBody.amount) {
    recordBody.is_100k_donor =
      Number(recordBody.amount) >= 100000 && isHighTierIndividualDonor(recordBody.name, category_name);
  }
  let { data, error } = await supabaseAdmin.from('name_list_records').insert([recordBody]).select();

  if (error && (error.code === '42703' || error.message?.includes('is_100k_donor'))) {
    delete recordBody.is_100k_donor;
    const retry = await supabaseAdmin.from('name_list_records').insert([recordBody]).select();
    data = retry.data;
    error = retry.error;
  }

  if (error && (error.code === '42501' || error.message?.includes('row-level security policy'))) {
    const retry = await getDirectAdminClient(c.env).from('name_list_records').insert([recordBody]).select();
    data = retry.data;
    error = retry.error;
  }

  if (error) return c.json({ detail: error.message }, 400);
  if (!data || data.length === 0) return c.json({ detail: 'មិនអាចកែប្រែបានទេ (RLS)' }, 403);

  if (notify_public) {
    try {
      const n = data[0];
      const isExpenseCat = category_name?.includes('ចំណាយ');
      await supabaseAdmin.from('app_notifications').insert([
        {
          title: isExpenseCat ? 'ចំណាយថ្មីក្នុងកម្មវិធីបុណ្យ' : 'ឈ្មោះថ្មីត្រូវបានបន្ថែមក្នុងបញ្ជី',
          message: `${n.name} (${n.amount.toLocaleString()}៛) ក្នុង ${category_name || 'បញ្ជីឈ្មោះ'}`,
          type: 'name_list',
          target_tab: 'manage_name_lists',
        },
      ]);
    } catch (err) {
      console.error('Failed to insert notification:', err);
    }
  }

  return c.json(data[0]);
});

nameListsRoutes.put('/records/:id', requireAuth, requireAdmin, async (c) => {
  const id = c.req.param('id');
  const recordBody: Record<string, any> = await c.req.json();
  const supabaseAdmin = getSupabaseAdmin(c.env);

  if (recordBody.name && recordBody.amount !== undefined && recordBody.is_100k_donor === undefined) {
    recordBody.is_100k_donor =
      Number(recordBody.amount) >= 100000 && isHighTierIndividualDonor(recordBody.name);
  }
  let { data, error } = await supabaseAdmin.from('name_list_records').update(recordBody).eq('id', id).select();

  if (error && (error.code === '42703' || error.message?.includes('is_100k_donor'))) {
    delete recordBody.is_100k_donor;
    if (Object.keys(recordBody).length === 0) {
      const existing = await supabaseAdmin.from('name_list_records').select('*').eq('id', id);
      data = existing.data;
      error = existing.error;
    } else {
      const retry = await supabaseAdmin.from('name_list_records').update(recordBody).eq('id', id).select();
      data = retry.data;
      error = retry.error;
    }
  }

  if (error && (error.code === '42501' || error.message?.includes('row-level security policy'))) {
    const retry = await getDirectAdminClient(c.env)
      .from('name_list_records')
      .update(recordBody)
      .eq('id', id)
      .select();
    data = retry.data;
    error = retry.error;
  }

  if (error) return c.json({ detail: error.message }, 400);
  if (!data || data.length === 0) return c.json({ detail: 'មិនអាចកែប្រែបានទេ (RLS)' }, 403);
  return c.json(data[0]);
});

nameListsRoutes.delete('/records/:id', requireAuth, requireAdmin, async (c) => {
  const id = c.req.param('id');
  const supabaseAdmin = getSupabaseAdmin(c.env);
  let { error } = await supabaseAdmin.from('name_list_records').delete().eq('id', id);
  if (error && (error.code === '42501' || error.message?.includes('row-level security policy'))) {
    const retry = await getDirectAdminClient(c.env).from('name_list_records').delete().eq('id', id);
    error = retry.error;
  }
  if (error) return c.json({ detail: error.message }, 400);
  return c.json({ success: true });
});

export default nameListsRoutes;
