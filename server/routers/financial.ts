import { Router } from 'express';
import { supabaseAdmin } from '../database';
import { requireAuth, requireAdmin } from '../auth/dependencies';

const router = Router();

// --- Seil Periods ---
router.get('/seil-periods', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('seil_periods').select('*').order('created_at', { ascending: false });
    if (error) return res.status(400).json({ detail: error.message });
    res.json(data || []);
  } catch (e: any) {
    res.status(500).json({ detail: e.message || 'Error fetching seil periods' });
  }
});

router.post('/seil-periods', requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin.from('seil_periods').insert([req.body]).select();
  if (error) return res.status(400).json({ detail: error.message });
  if (!data || data.length === 0) return res.status(403).json({ detail: 'មានបញ្ហាក្នុងការរក្សាទុកទិន្នន័យ (RLS) សូមពិនិត្យមើល Service Role Key' });
  res.json(data[0]);
});

router.put('/seil-periods/:id', requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin.from('seil_periods').update(req.body).eq('id', req.params.id).select();
  if (error) return res.status(400).json({ detail: error.message });
  if (!data || data.length === 0) return res.status(403).json({ detail: 'មានបញ្ហាក្នុងការរក្សាទុកទិន្នន័យ (RLS) សូមពិនិត្យមើល Service Role Key' });
  res.json(data[0]);
});

// --- Financial Records ---
router.get('/financial-records', async (req, res) => {
  try {
    const seil_id = req.query.seil_id as string;
    let query = supabaseAdmin.from('financial_records').select('*').order('created_at', { ascending: false });
    if (seil_id) query = query.eq('seil_id', seil_id);
    const { data, error } = await query;
    if (error) return res.status(400).json({ detail: error.message });
    res.json(data || []);
  } catch (e: any) {
    res.status(500).json({ detail: e.message || 'Error fetching financial records' });
  }
});

router.post('/financial-records', requireAuth, requireAdmin, async (req, res) => {
  const { notify_public, seil_name, ...recordBody } = req.body;
  let { data, error } = await supabaseAdmin.from('financial_records').insert([recordBody]).select();
  
  if (error && (error.code === '42703' || (error.message && error.message.includes('is_high_level')))) {
    delete recordBody.is_high_level;
    const retry = await supabaseAdmin.from('financial_records').insert([recordBody]).select();
    data = retry.data;
    error = retry.error;
  }

  if (error) return res.status(400).json({ detail: error.message });
  if (!data || data.length === 0) return res.status(403).json({ detail: 'មានបញ្ហាក្នុងការរក្សាទុកទិន្នន័យ (RLS) សូមពិនិត្យមើល Service Role Key' });
  if (notify_public) {
    try {
      const f = data[0];
      await supabaseAdmin.from('app_notifications').insert([{
        title: f.type === 'income' ? 'ចំណូលថ្មីត្រូវបានបន្ថែម' : 'ចំណាយថ្មីត្រូវបានបន្ថែម',
        message: `${f.description} (${f.amount.toLocaleString()}៛) ក្នុង ${seil_name || 'បញ្ជីសីល'}`,
        type: f.type,
        target_tab: 'records'
      }]);
    } catch (err) {
      console.error('Failed to insert notification:', err);
    }
  }
  
  res.json(data[0]);
});

router.put('/financial-records/:id', requireAuth, requireAdmin, async (req, res) => {
  let recordBody = { ...req.body };
  let { data, error } = await supabaseAdmin.from('financial_records').update(recordBody).eq('id', req.params.id).select();
  
  if (error && (error.code === '42703' || (error.message && error.message.includes('is_high_level')))) {
    delete (recordBody as any).is_high_level;
    if (Object.keys(recordBody).length === 0) {
      const existing = await supabaseAdmin.from('financial_records').select('*').eq('id', req.params.id);
      data = existing.data;
      error = existing.error;
    } else {
      const retry = await supabaseAdmin.from('financial_records').update(recordBody).eq('id', req.params.id).select();
      data = retry.data;
      error = retry.error;
    }
  }

  if (error) return res.status(400).json({ detail: error.message });
  if (!data || data.length === 0) return res.status(403).json({ detail: 'មានបញ្ហាក្នុងការរក្សាទុកទិន្នន័យ (RLS) សូមពិនិត្យមើល Service Role Key' });
  res.json(data[0]);
});

router.delete('/financial-records/:id', requireAuth, requireAdmin, async (req, res) => {
  const { error } = await supabaseAdmin.from('financial_records').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ detail: error.message });
  
  res.json({ success: true });
});

// Helper to resolve date of financial record accurately
const KHMER_MONTHS_MAP: [string, number][] = [
  ['មករា', 1], ['កុម្ភៈ', 2], ['មីនា', 3], ['មេសា', 4],
  ['ឧសភា', 5], ['មិថុនា', 6], ['កក្កដា', 7], ['សីហា', 8],
  ['កញ្ញា', 9], ['តុលា', 10], ['វិច្ឆិកា', 11], ['ធ្នូ', 12]
];

function resolveFinancialRecordDate(f: any, seil: any): { year: number; month: number; quarter: number; dateStr: string } {
  if (f.record_date) {
    const d = new Date(f.record_date);
    if (!isNaN(d.getTime())) {
      const m = d.getMonth() + 1;
      return {
        year: d.getFullYear(),
        month: m,
        quarter: Math.floor((m - 1) / 3) + 1,
        dateStr: f.record_date
      };
    }
  }

  // Infer from seil date_range_text if record_date is null
  if (seil && seil.date_range_text) {
    const text = seil.date_range_text;
    for (const [mName, mNum] of KHMER_MONTHS_MAP) {
      if (text.includes(mName)) {
        const mm = String(mNum).padStart(2, '0');
        return {
          year: 2026,
          month: mNum,
          quarter: Math.floor((mNum - 1) / 3) + 1,
          dateStr: `2026-${mm}-15`
        };
      }
    }
  }

  if (seil && seil.created_at) {
    const d = new Date(seil.created_at);
    const m = d.getMonth() + 1;
    return {
      year: d.getFullYear(),
      month: m,
      quarter: Math.floor((m - 1) / 3) + 1,
      dateStr: seil.created_at.split('T')[0]
    };
  }

  const d = new Date(f.created_at || Date.now());
  const m = d.getMonth() + 1;
  return {
    year: d.getFullYear(),
    month: m,
    quarter: Math.floor((m - 1) / 3) + 1,
    dateStr: f.created_at ? f.created_at.split('T')[0] : '2026-01-01'
  };
}

// --- Annual & Quarterly Financial Summary ---
router.get('/financial-summary', async (req, res) => {
  try {
    const [seilsRes, finRes] = await Promise.all([
      supabaseAdmin.from('seil_periods').select('*').order('created_at', { ascending: true }),
      supabaseAdmin.from('financial_records').select('*').order('created_at', { ascending: true })
    ]);

    const seils = seilsRes.data || [];
    const financials = finRes.data || [];

    const seilMap: Record<string, any> = {};
    seils.forEach(s => { seilMap[s.id] = s; });

    // Initial starting balance from the earliest seil
    const initialStartingBalance = seils.length > 0 ? (Number(seils[0].previous_balance) || 0) : 0;

    // Attach resolved date to every financial record
    const enrichedFinancials = financials.map(f => {
      const s = seilMap[f.seil_id];
      const resolved = resolveFinancialRecordDate(f, s);
      return {
        ...f,
        seil_name: s?.name || 'មិនស្គាល់',
        resolved_year: resolved.year,
        resolved_month: resolved.month,
        resolved_quarter: resolved.quarter,
        resolved_date: resolved.dateStr
      };
    });

    // Determine all distinct years
    const yearsSet = new Set<number>();
    enrichedFinancials.forEach(f => {
      if (f.resolved_year) yearsSet.add(f.resolved_year);
    });

    const currentYear = new Date().getFullYear();
    yearsSet.add(currentYear);
    yearsSet.add(2026);
    const availableYears = Array.from(yearsSet).sort((a, b) => b - a);

    const selectedYear = req.query.year ? parseInt(req.query.year as string, 10) : availableYears[0];
    const selectedQuarter = req.query.quarter ? (req.query.quarter as string) : 'all';

    // Khmer months names
    const khmerMonths = [
      'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
      'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
    ];

    // Compute exact financial metrics for each Seil period
    const detailedSeils = seils.map((s, idx) => {
      const sFins = enrichedFinancials.filter(f => f.seil_id === s.id);
      const inc = sFins.filter(f => f.type === 'income').reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
      const exp = sFins.filter(f => f.type === 'expense').reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
      const prev = Number(s.previous_balance) || 0;
      const end = prev + inc - exp;
      
      let monthIdx = 7; // default August
      const text = s.date_range_text || '';
      if (text.includes('ឧសភា')) monthIdx = 4; // May
      else if (text.includes('មិថុនា')) monthIdx = 5; // June
      else if (text.includes('កក្កដា')) monthIdx = 6; // July
      else if (text.includes('សីហា')) {
        if (idx === 10 || text.includes('ដល់')) monthIdx = 8; // Late Aug into Sept
        else monthIdx = 7; // August
      }

      return {
        id: s.id,
        name: s.name,
        date_range_text: s.date_range_text,
        previous_balance: prev,
        income: inc,
        expense: exp,
        net: inc - exp,
        ending_balance: end,
        month_idx: monthIdx,
        month_name: khmerMonths[monthIdx],
        quarter: Math.floor(monthIdx / 3) + 1,
        created_at: s.created_at
      };
    });

    // Compute monthly breakdown with accurate opening and cumulative ending balances
    let rollingBalance = initialStartingBalance;
    const monthlyData = khmerMonths.map((mName, mIdx) => {
      const mSeils = detailedSeils.filter(s => s.month_idx === mIdx);
      const openBal = rollingBalance;
      let mInc = 0;
      let mExp = 0;

      if (mSeils.length > 0) {
        mInc = mSeils.reduce((sum, s) => sum + s.income, 0);
        mExp = mSeils.reduce((sum, s) => sum + s.expense, 0);
        rollingBalance = mSeils[mSeils.length - 1].ending_balance;
      }

      return {
        month: mIdx + 1,
        month_name: mName,
        opening_balance: openBal,
        income: mInc,
        expense: mExp,
        net: mInc - mExp,
        cumulative_balance: rollingBalance
      };
    });

    // Calculate Quarter opening and ending balances based on Seil authoritative positions
    let beginningBalance = initialStartingBalance;
    let endingBalance = initialStartingBalance;
    let periodIncome = 0;
    let periodExpense = 0;
    let incomeCount = 0;
    let expenseCount = 0;
    const filteredRecords: any[] = [];

    if (selectedQuarter === 'all') {
      beginningBalance = initialStartingBalance;
      // Ending balance of the entire year is the ending balance of the latest active Seil
      endingBalance = detailedSeils.length > 0 ? detailedSeils[detailedSeils.length - 1].ending_balance : initialStartingBalance;
    } else {
      const qNum = parseInt(selectedQuarter, 10);
      const startMonthIdx = (qNum - 1) * 3;
      const endMonthIdx = startMonthIdx + 2;
      beginningBalance = monthlyData[startMonthIdx].opening_balance;
      endingBalance = monthlyData[endMonthIdx].cumulative_balance;
    }

    enrichedFinancials.forEach(f => {
      if (f.resolved_year !== selectedYear) return;
      if (selectedQuarter !== 'all' && f.resolved_quarter !== parseInt(selectedQuarter, 10)) return;

      const amt = Number(f.amount) || 0;
      filteredRecords.push(f);

      if (f.type === 'income') {
        periodIncome += amt;
        incomeCount++;
      } else {
        periodExpense += amt;
        expenseCount++;
      }
    });

    const periodNet = periodIncome - periodExpense;
    // Difference between cash flow in period and actual cash in hand
    const carriedAdjustment = endingBalance - (beginningBalance + periodNet);

    // Top Expenses in the filtered period
    const topExpenses = [...filteredRecords]
      .filter(f => f.type === 'expense')
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 5);

    // Top Incomes in the filtered period
    const topIncomes = [...filteredRecords]
      .filter(f => f.type === 'income')
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 5);

    // Filter detailed seils by selected quarter if applicable
    const filteredSeils = selectedQuarter === 'all' 
      ? detailedSeils 
      : detailedSeils.filter(s => s.quarter === parseInt(selectedQuarter, 10));

    res.json({
      selected_year: selectedYear,
      selected_quarter: selectedQuarter,
      available_years: availableYears,
      initial_starting_balance: initialStartingBalance,
      beginning_balance: beginningBalance, // ថវិកាសល់ពីគ្រាមុន / ត្រីមាសមុន
      total_income: periodIncome,          // ចំណូលក្នុងគ្រា
      total_expense: periodExpense,        // ចំណាយក្នុងគ្រា
      period_net: periodNet,              // ចំណេញ/ខាត ក្នុងគ្រា (ចំណូល - ចំណាយ)
      carried_adjustment: carriedAdjustment, // ថវិកាកែតម្រូវ/បំពេញបន្ថែមតាមបញ្ជីសីល
      net_balance: endingBalance,         // សមតុល្យសរុបជាក់ស្ដែងសល់ក្នុងដៃ
      ending_balance: endingBalance,       // សមតុល្យសរុបជាក់ស្ដែងចុងគ្រា (2,892,000 ៛)
      income_count: incomeCount,
      expense_count: expenseCount,
      top_expenses: topExpenses,
      top_incomes: topIncomes,
      monthly_data: monthlyData,
      seil_breakdown: filteredSeils.map(s => ({
        name: s.name,
        range: s.date_range_text,
        previous_balance: s.previous_balance,
        income: s.income,
        expense: s.expense,
        net: s.net,
        ending_balance: s.ending_balance
      })),
      seil_periods_detailed: detailedSeils,
      total_records_count: filteredRecords.length
    });
  } catch (error: any) {
    res.status(500).json({ detail: error.message });
  }
});

export default router;
