import { Router } from 'express';
import { supabaseAdmin, getDirectAdminClient } from '../database';
import { requireAuth, requireAdmin } from '../auth/dependencies';

const router = Router();

const KNOWN_VILLAGES_OR_AREAS = new Set([
  'ទ្រាលើ', 'ត្បាច', 'តាខូយ', 'ស្វាយពពារ', 'ក្បាលសំរោង', 'ត្រពាំងវិហារ',
  'ភូមិស្វាយចេក', 'ភូមិថ្មី', 'ភូមិស្មន់មុន្នី', 'ភូមិក្រាំងឡង', 'ភូមិព្រៃរបង'
]);

export function normalizeDonorName(name: string): string {
  if (!name) return '';
  let clean = name.trim().replace(/\s+/g, ' ');

  // Remove content in parentheses e.g. (ក្រាំងលៀវ), (Sing Sing), (កូនចៅ), (កំពង់ស្ពឺ), (កូនចៅកុងណា), (ថ្លៃដាក់គ្រឿង), (វណ្ណា)
  clean = clean.replace(/\s*\([^)]*\)/g, '');

  // Remove common family and group suffixes
  clean = clean.replace(/\s+(ព្រមទាំងកូនចៅ|ព្រមទាំងបុត្រ|ព្រមទាំងបុត្រធីតា|ព្រមទាំងក្រុមគ្រួសារ|និងក្រុមគ្រួសារ|និងកូនចៅ|និងបុត្រ|ព្រមទាំងញាតិមិត្ត|កូនចៅ|និងភរិយា|ភរិយា)$/g, '');

  // Remove polite titles, monk titles, elders, groups prefixes (run twice for compound prefixes)
  const prefixRegex = /^(ក្រុមគ្រួសារលោកតា|ក្រុមគ្រួសារលោកយាយ|ក្រុមគ្រួសារលោក|ក្រុមគ្រួសារ|ក្រុមកូនចៅ\s*លោកយាយ|ក្រុមកូនចៅ\s*លោកតា|ក្រុមកូនចៅ|កូនចៅ\s*លោកយាយ|កូនចៅ\s*លោកតា|កូនចៅ|ក្រុមញាតិព្រះធម៌\s*លោកយាយ|ក្រុមញាតិព្រះធម៌\s*លោកតា|ក្រុមញាតិព្រះធម៌|ក្រុមឧបាសិកា|ក្រុមឧបាសក|ក្រុម|លោកយាយ|លោកតា|ឧបាសិកា|ឧបាសក|ព្រះតេជគុណ|ភិក្ខុ|លោកគ្រូ|អ្នកគ្រូ|គ្រូ|លោកស្រី|អ្នកស្រី|អ្នកមីង|មីង|ពូ|ញោម|លោក|យាយ|តា|កុង|ម៉ែ|ឪ|ពេទ្យ|ឧ\.ក|ឧ\.សិ)\s*/g;
  clean = clean.replace(prefixRegex, '');
  clean = clean.replace(prefixRegex, '');

  // Remove location suffix if attached directly e.g. "ភូមិព្រៃស្មាច់"
  clean = clean.replace(/\s+ភូមិ[\u1780-\u17D2]+$/g, '');

  // Normalize silent vowels on same names: e.g. ប៊ុនរិទ្ធិ -> ប៊ុនរិទ្ធ
  clean = clean.replace(/ប៊ុន\s*រិទ្ធិ?/g, 'ប៊ុនរិទ្ធ');

  // If there are comma-separated names e.g. "ម៉ៅ ប៊ុនរិទ្ធ, កូន ម៉ៅ សំអាង", extract the first primary person
  if (clean.includes(',')) {
    const parts = clean.split(',').map(p => p.trim());
    if (parts[0]) {
      clean = parts[0];
    }
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
  const linkedDetails = new Map<string, {
    fin_id: string;
    seil_name: string;
    fr_note: string;
    fr_date: string;
  }>();

  nameRecords.forEach(nr => {
    const nrNorm = normalizeDonorName(nr.name);
    const nrAmt = Number(nr.amount);
    if (!nrNorm || nrAmt <= 0) return;

    const nrCat = catMap[nr.category_id] || '';
    const isConstruction = nrCat.includes('កសាង');
    // Cross-deduplication should strictly only apply to construction records cross-entered in both lists
    if (!isConstruction) return;

    const match = finRecords.find(fr => {
      if (matchedFinIds.has(fr.id)) return false;
      if (Number(fr.amount) !== nrAmt) return false;

      const frNorm = normalizeDonorName(fr.description);
      if (!frNorm) return false;

      const frNote = (fr.note || '').toLowerCase();
      const frDesc = (fr.description || '').toLowerCase();
      const isFrConstruction = frNote.includes('កសាង') || frDesc.includes('កសាង');

      // Check specific known spelling variations for roof construction entries
      const n1 = (nr.name || '').replace(/\s+/g, '');
      const n2 = (fr.description || '').replace(/\s+/g, '');
      if (n1.includes('ឆេងប៉េងគុណ') && n2.includes('ឆេងប៉េងគុណ')) return true;
      if (n1.includes('ស៊ីនួន') && n2.includes('ស៊ីនួន')) return true;
      if (n1.includes('ឆេងស៊ុយ') && n2.includes('ឆេងស៊ុយ')) return true;
      if (n1.includes('កុងសុក') && n2.includes('កុងសុភ')) return true;

      // When matching in construction, ensure name matches AND it relates to construction or same recording period
      if (frNorm === nrNorm || (nrNorm.length >= 4 && (frNorm.includes(nrNorm) || nrNorm.includes(frNorm)))) {
        if (isFrConstruction) return true;
        const timeDiffDays = Math.abs(new Date(nr.created_at).getTime() - new Date(fr.created_at).getTime()) / (1000 * 60 * 60 * 24);
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
        fr_date: match.record_date || match.created_at
      });
    }
  });

  return { matchedFinIds, linkedDetails };
}

export function isHighTierIndividualDonor(name: string, categoryName?: string): boolean {
  if (!name) return false;
  const n = name.trim();

  // Exclude loans and withdrawals
  if (n === 'ខ្ចី' || n === 'មិនស្គាល់ឈ្មោះ') return false;
  if (categoryName === 'លុយជាងដក') return false;
  if (n.startsWith('ជាងអ៊ុំ')) return false;

  // Exclude pure temple collection boxes
  if (
    n.startsWith('បច្ច័យប្រចាំសីល') ||
    n.startsWith('បច្ច័យថ្ងៃសីល') ||
    n.startsWith('បច្ច័យសល់') ||
    n.includes('ចេតិយរួម')
  ) {
    return false;
  }

  // Exclude collective visitors with no personal or family name
  if (n === 'ញាតិញោមមកពីភ្នំជីសូរ' || n === 'គេចូលតាមរយៈមេភូមិ') return false;
  if (n === 'បុណ្យ១០០ថ្ងៃ') return false;

  // Exclude other temples
  if (n.startsWith('វត្ត ') || n.startsWith('វត្ត')) return false;

  // Exclude pure village collective donations without individual names
  if (KNOWN_VILLAGES_OR_AREAS.has(n)) return false;
  if (n.startsWith('បរិស័ទភូមិ') || n.startsWith('ពុទ្ធបរិស័ទ ភូមិ') || n.startsWith('ពុទ្ធបរិស័ទ')) return false;

  return true;
}

router.get('/donors-100k', async (req, res) => {
  try {
    const [catRes, seilRes, recRes, finRes] = await Promise.all([
      supabaseAdmin.from('name_list_categories').select('id, name'),
      supabaseAdmin.from('seil_periods').select('id, name, date_range_text'),
      supabaseAdmin.from('name_list_records').select('*').gte('amount', 100000),
      supabaseAdmin.from('financial_records').select('*').eq('type', 'income').gte('amount', 100000)
    ]);

    const catMap: Record<string, string> = {};
    catRes.data?.forEach(c => { catMap[c.id] = c.name; });

    const seilMap: Record<string, string> = {};
    seilRes.data?.forEach(s => { seilMap[s.id] = s.date_range_text ? `${s.name} (${s.date_range_text})` : s.name; });

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
          note: r.note
        });
      }
    }

    for (const f of finRecords) {
      if (matchedFinIds.has(f.id)) continue; // Skip duplicate cross-listed record
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
            note: f.note
          });
        }
      }
    }

    const result = Array.from(donorsMap.values());
    result.sort((a, b) => b.amount - a.amount);

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ detail: error.message });
  }
});

router.get('/top-benefactors', async (req, res) => {
  try {
    const [catRes, seilRes, nameRecRes, finRecRes] = await Promise.all([
      supabaseAdmin.from('name_list_categories').select('id, name'),
      supabaseAdmin.from('seil_periods').select('id, name, date_range_text'),
      supabaseAdmin.from('name_list_records').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('financial_records').select('*').eq('type', 'income').order('created_at', { ascending: false })
    ]);

    const catMap: Record<string, string> = {};
    catRes.data?.forEach(c => { catMap[c.id] = c.name; });

    const seilMap: Record<string, string> = {};
    seilRes.data?.forEach(s => { seilMap[s.id] = s.date_range_text ? `${s.name} (${s.date_range_text})` : s.name; });

    const nameRecords = nameRecRes.data || [];
    const finRecords = finRecRes.data || [];

    // Find and pair duplicates between name_list_records and financial_records
    const { matchedFinIds, linkedDetails } = findCrossListedFinancialRecordIds(
      nameRecords,
      finRecords,
      catMap,
      seilMap
    );

    const donorsMap = new Map<string, {
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
    }>();

    function getDonorEntry(rawName: string) {
      const norm = normalizeDonorName(rawName) || rawName.trim().toLowerCase();
      if (!donorsMap.has(norm)) {
        donorsMap.set(norm, {
          displayName: rawName.trim(),
          total_amount: 0,
          contributions_count: 0,
          locations: new Set<string>(),
          records: []
        });
      }
      const d = donorsMap.get(norm)!;
      // Preserve clean descriptive display name (avoid keeping parentheses notes as primary title)
      if (!rawName.includes('(') && d.displayName.includes('(')) {
        d.displayName = rawName.trim();
      } else if (rawName.trim().length > d.displayName.length && (!rawName.includes('(') || d.displayName.includes('('))) {
        d.displayName = rawName.trim();
      }
      return d;
    }

    // 1. Process name list records
    nameRecords.forEach(r => {
      const cleanName = (r.name || '').trim().replace(/\s+/g, ' ');
      if (!isHighTierIndividualDonor(cleanName)) return;
      const amt = Number(r.amount) || 0;
      if (amt <= 0) return;

      const d = getDonorEntry(cleanName);
      d.total_amount += amt;
      d.contributions_count += 1;
      if (r.note && r.note.trim()) {
        d.locations.add(r.note.trim());
      }

      const linked = linkedDetails.get(r.id);
      if (linked?.fr_note) {
        d.locations.add(linked.fr_note.trim());
      }

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
        cross_listed_info: linked ? `មានកត់ត្រាក្នុង ${linked.seil_name} (រាប់តែម្ដង)` : undefined
      });
    });

    // 2. Process financial records (excluding matched duplicates)
    finRecords.forEach(f => {
      if (matchedFinIds.has(f.id)) return; // Skip duplicate record to avoid double counting

      const cleanName = (f.description || '').trim().replace(/\s+/g, ' ');
      if (!isHighTierIndividualDonor(cleanName)) return;
      const amt = Number(f.amount) || 0;
      if (amt <= 0) return;

      const d = getDonorEntry(cleanName);
      d.total_amount += amt;
      d.contributions_count += 1;
      if (f.note && f.note.trim()) {
        d.locations.add(f.note.trim());
      }

      d.records.push({
        id: f.id,
        recorded_name: cleanName,
        amount: amt,
        source_name: seilMap[f.seil_id] || 'ចំណូលទូទៅ',
        source_id: f.seil_id,
        source_type: 'seil',
        date: f.record_date || f.created_at || new Date().toISOString(),
        note: f.note ? f.note.trim() : '',
        is_cross_listed: false
      });
    });

    const donors = Array.from(donorsMap.values()).map(d => ({
      name: d.displayName,
      total_amount: d.total_amount,
      contributions_count: d.contributions_count,
      locations: Array.from(d.locations),
      records: d.records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }));

    donors.sort((a, b) => b.total_amount - a.total_amount);

    res.json({
      total_donors: donors.length,
      deduplicated_overlapping_count: matchedFinIds.size,
      donors
    });
  } catch (error: any) {
    res.status(500).json({ detail: error.message });
  }
});

router.get('/search-donors', async (req, res) => {
  try {
    const q = ((req.query.q as string) || '').trim().toLowerCase();

    const [catRes, seilRes] = await Promise.all([
      supabaseAdmin.from('name_list_categories').select('id, name'),
      supabaseAdmin.from('seil_periods').select('id, name, date_range_text')
    ]);

    const catMap: Record<string, string> = {};
    catRes.data?.forEach(c => { catMap[c.id] = c.name; });

    const seilMap: Record<string, string> = {};
    seilRes.data?.forEach(s => { seilMap[s.id] = s.date_range_text ? `${s.name} (${s.date_range_text})` : s.name; });

    const [nameRecRes, finRecRes] = await Promise.all([
      supabaseAdmin.from('name_list_records').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('financial_records').select('*').eq('type', 'income').order('created_at', { ascending: false })
    ]);

    const nameRecords = nameRecRes.data || [];
    const finRecords = finRecRes.data || [];

    const { matchedFinIds, linkedDetails } = findCrossListedFinancialRecordIds(
      nameRecords,
      finRecords,
      catMap,
      seilMap
    );

    const allItems: any[] = [];

    nameRecords.forEach(r => {
      const name = (r.name || '').trim();
      if (!name) return;
      if (q && !name.toLowerCase().includes(q) && !(r.note || '').toLowerCase().includes(q)) {
        return;
      }
      const linked = linkedDetails.get(r.id);
      allItems.push({
        id: r.id,
        name: name,
        amount: Number(r.amount) || 0,
        source_type: 'category',
        source_name: catMap[r.category_id] || 'បញ្ជីផ្សេងៗ',
        source_id: r.category_id,
        date: r.created_at,
        note: r.note || '',
        referrer: r.referrer || '',
        is_cross_listed: !!linked,
        cross_listed_info: linked ? `មានកត់ត្រាក្នុង ${linked.seil_name} (រាប់តែម្ដង)` : undefined
      });
    });

    finRecords.forEach(f => {
      if (matchedFinIds.has(f.id)) return; // Skip duplicate cross-listed record

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
        referrer: '',
        is_cross_listed: false
      });
    });

    const grouped = new Map<string, any>();
    allItems.forEach(item => {
      const key = normalizeDonorName(item.name) || item.name.toLowerCase();
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

    const donors = Array.from(grouped.values()).map(d => ({
      ...d,
      locations: Array.from(d.locations)
    }));

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
  
  res.json({ success: true });
});

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
  let { data, error } = await supabaseAdmin.from('name_list_records').insert([recordBody]).select();
  
  if (error && (error.code === '42703' || (error.message && error.message.includes('is_100k_donor')))) {
    delete (recordBody as any).is_100k_donor;
    const retry = await supabaseAdmin.from('name_list_records').insert([recordBody]).select();
    data = retry.data;
    error = retry.error;
  }

  if (error && (error.code === '42501' || error.message?.includes('row-level security policy'))) {
    console.warn('[Name List Records] RLS policy error detected, retrying with direct admin client...');
    const directAdmin = getDirectAdminClient();
    const retry = await directAdmin.from('name_list_records').insert([recordBody]).select();
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
  let { data, error } = await supabaseAdmin.from('name_list_records').update(recordBody).eq('id', req.params.id).select();
  
  if (error && (error.code === '42703' || (error.message && error.message.includes('is_100k_donor')))) {
    delete (recordBody as any).is_100k_donor;
    if (Object.keys(recordBody).length === 0) {
      const existing = await supabaseAdmin.from('name_list_records').select('*').eq('id', req.params.id);
      data = existing.data;
      error = existing.error;
    } else {
      const retry = await supabaseAdmin.from('name_list_records').update(recordBody).eq('id', req.params.id).select();
      data = retry.data;
      error = retry.error;
    }
  }

  if (error && (error.code === '42501' || error.message?.includes('row-level security policy'))) {
    console.warn('[Name List Records Update] RLS policy error detected, retrying with direct admin client...');
    const directAdmin = getDirectAdminClient();
    const retry = await directAdmin.from('name_list_records').update(recordBody).eq('id', req.params.id).select();
    data = retry.data;
    error = retry.error;
  }

  if (error) return res.status(400).json({ detail: error.message });
  if (!data || data.length === 0) return res.status(403).json({ detail: 'មិនអាចកែប្រែបានទេ (RLS)' });
  res.json(data[0]);
});

router.delete('/records/:id', requireAuth, requireAdmin, async (req, res) => {
  let { error } = await supabaseAdmin.from('name_list_records').delete().eq('id', req.params.id);
  if (error && (error.code === '42501' || error.message?.includes('row-level security policy'))) {
    const directAdmin = getDirectAdminClient();
    const retry = await directAdmin.from('name_list_records').delete().eq('id', req.params.id);
    error = retry.error;
  }
  if (error) return res.status(400).json({ detail: error.message });
  
  res.json({ success: true });
});

export default router;
