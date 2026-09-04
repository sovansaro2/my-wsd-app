import { Router } from 'express';
import { supabaseAdmin } from '../database';
import { requireAuth, requireAdmin } from '../auth/dependencies';
import ExcelJS from 'exceljs';

const router = Router();

// GET /api/backup/data (Admin Only) - Full JSON dump
router.get('/data', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [seils, financials, categories, nameLists, profiles] = await Promise.all([
      supabaseAdmin.from('seil_periods').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('financial_records').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('name_list_categories').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('name_list_records').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('profiles').select('id, user_code, full_name, latin_name, email, role, phone_number, address, created_at')
    ]);

    const backupPayload = {
      app_name: 'Wat Snay Duoc Data Management System',
      version: '1.2.0',
      exported_at: new Date().toISOString(),
      exported_by: (req as any).user?.email || 'admin',
      summary: {
        total_seil_periods: seils.data?.length || 0,
        total_financial_records: financials.data?.length || 0,
        total_categories: categories.data?.length || 0,
        total_name_list_records: nameLists.data?.length || 0,
        total_users: profiles.data?.length || 0
      },
      data: {
        seil_periods: seils.data || [],
        financial_records: financials.data || [],
        name_list_categories: categories.data || [],
        name_list_records: nameLists.data || [],
        profiles: profiles.data || []
      }
    };

    res.json(backupPayload);
  } catch (error: any) {
    res.status(500).json({ detail: error.message });
  }
});

// GET /api/backup/excel (Admin Only) - Generates clean multi-tab Excel backup
router.get('/excel', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [seilsRes, finRes, catRes, nameListRes, profilesRes] = await Promise.all([
      supabaseAdmin.from('seil_periods').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('financial_records').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('name_list_categories').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('name_list_records').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('profiles').select('id, user_code, full_name, latin_name, email, role, phone_number, address, created_at')
    ]);

    const seils = seilsRes.data || [];
    const financials = finRes.data || [];
    const categories = catRes.data || [];
    const nameLists = nameListRes.data || [];
    const profiles = profilesRes.data || [];

    const seilMap: Record<string, string> = {};
    seils.forEach(s => { seilMap[s.id] = s.date_range_text ? `${s.name} (${s.date_range_text})` : s.name; });

    const catMap: Record<string, string> = {};
    categories.forEach(c => { catMap[c.id] = c.name; });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Wat Snay Duoc App';
    workbook.created = new Date();

    // 1. Overview Sheet
    const wsOverview = workbook.addWorksheet('ព័ត៌មានទូទៅ');
    wsOverview.columns = [
      { header: 'មុខទំនិញ / Information', key: 'key', width: 35 },
      { header: 'ព័ត៌មានលម្អិត / Details', key: 'value', width: 45 }
    ];
    wsOverview.addRows([
      { key: 'ឈ្មោះប្រព័ន្ធ', value: 'កម្មវិធីគ្រប់គ្រងទិន្នន័យ វត្តស្នាយដួច (WSD Data Management)' },
      { key: 'កាលបរិច្ឆេទបម្រុងទុក', value: new Date().toLocaleString() },
      { key: 'អ្នកទាញយក', value: (req as any).user?.email || 'Admin' },
      { key: 'ចំនួនបញ្ជីសីលសរុប', value: seils.length },
      { key: 'ចំនួនកំណត់ត្រាហិរញ្ញវត្ថុ', value: financials.length },
      { key: 'ចំនួនប្រភេទបញ្ជីផ្សេងៗ', value: categories.length },
      { key: 'ចំនួនកំណត់ត្រាសប្បុរសជន', value: nameLists.length },
      { key: 'ចំនួនគណនីក្នុងប្រព័ន្ធ', value: profiles.length }
    ]);

    // 2. Financial Records Sheet
    const wsFin = workbook.addWorksheet('ចំណូល-ចំណាយ');
    wsFin.columns = [
      { header: 'ល.រ', key: 'index', width: 8 },
      { header: 'កាលបរិច្ឆេទ', key: 'date', width: 15 },
      { header: 'បញ្ជីសីល', key: 'seil', width: 28 },
      { header: 'ប្រភេទ', key: 'type', width: 12 },
      { header: 'បរិយាយ / ឈ្មោះ', key: 'desc', width: 35 },
      { header: 'ចំនួនទឹកប្រាក់ (រៀល)', key: 'amount', width: 22 },
      { header: 'ទីកន្លែង / កំណត់សម្គាល់', key: 'note', width: 25 }
    ];
    financials.forEach((f, i) => {
      wsFin.addRow({
        index: i + 1,
        date: f.record_date || (f.created_at ? f.created_at.split('T')[0] : ''),
        seil: seilMap[f.seil_id] || 'មិនស្គាល់',
        type: f.type === 'income' ? 'ចំណូល' : 'ចំណាយ',
        desc: f.description,
        amount: Number(f.amount) || 0,
        note: f.note || ''
      });
    });

    // 3. Name List Records Sheet
    const wsDonors = workbook.addWorksheet('បញ្ជីសប្បុរសជន');
    wsDonors.columns = [
      { header: 'ល.រ', key: 'index', width: 8 },
      { header: 'ប្រភេទបញ្ជី', key: 'category', width: 28 },
      { header: 'ឈ្មោះសប្បុរសជន', key: 'name', width: 30 },
      { header: 'ចំនួនបច្ច័យ (រៀល)', key: 'amount', width: 22 },
      { header: 'ទីកន្លែង / កំណត់សម្គាល់', key: 'note', width: 25 },
      { header: 'អ្នកទំនាក់ទំនង', key: 'referrer', width: 20 },
      { header: 'កាលបរិច្ឆេទ', key: 'date', width: 15 }
    ];
    nameLists.forEach((r, i) => {
      wsDonors.addRow({
        index: i + 1,
        category: catMap[r.category_id] || 'បញ្ជីផ្សេងៗ',
        name: r.name,
        amount: Number(r.amount) || 0,
        note: r.note || '',
        referrer: r.referrer || '',
        date: r.created_at ? r.created_at.split('T')[0] : ''
      });
    });

    // 4. Seil Periods Sheet
    const wsSeils = workbook.addWorksheet('បញ្ជីសីល');
    wsSeils.columns = [
      { header: 'ល.រ', key: 'index', width: 8 },
      { header: 'ឈ្មោះបញ្ជីសីល', key: 'name', width: 25 },
      { header: 'ចន្លោះកាលបរិច្ឆេទ', key: 'date_range', width: 25 },
      { header: 'សមតុល្យលើកមុន (រៀល)', key: 'prev_balance', width: 25 },
      { header: 'កាលបរិច្ឆេទបង្កើត', key: 'created_at', width: 15 }
    ];
    seils.forEach((s, i) => {
      wsSeils.addRow({
        index: i + 1,
        name: s.name,
        date_range: s.date_range_text || '',
        prev_balance: Number(s.previous_balance) || 0,
        created_at: s.created_at ? s.created_at.split('T')[0] : ''
      });
    });

    // Set Response Headers
    const nowStr = new Date().toISOString().split('T')[0];
    const filename = `WSD_Backup_${nowStr}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    res.status(500).json({ detail: error.message });
  }
});

export default router;
