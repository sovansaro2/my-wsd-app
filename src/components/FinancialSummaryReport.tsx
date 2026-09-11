import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Printer, Filter, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { api } from '../lib/apiClient';
import { useLanguage } from '../contexts/LanguageContext';
import OfficialReportPrintModal from './OfficialReportPrintModal';

interface MonthlyItem {
  month: number;
  month_name: string;
  opening_balance?: number;
  income: number;
  expense: number;
  net: number;
  cumulative_balance?: number;
}

interface FinancialSummaryData {
  selected_year: number;
  selected_quarter: string;
  available_years: number[];
  initial_starting_balance?: number;
  beginning_balance?: number;
  total_income: number;
  total_expense: number;
  period_net?: number;
  carried_adjustment?: number;
  net_balance: number;
  ending_balance?: number;
  income_count: number;
  expense_count: number;
  top_expenses: any[];
  top_incomes: any[];
  monthly_data: MonthlyItem[];
  seil_breakdown: {
    name: string;
    range?: string;
    previous_balance?: number;
    income: number;
    expense: number;
    net: number;
    ending_balance?: number;
  }[];
  total_records_count: number;
}

export default function FinancialSummaryReport() {
  const { language } = useLanguage();
  const [data, setData] = useState<FinancialSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState<string>('all');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [activeTableTab, setActiveTableTab] = useState<'monthly' | 'seils'>('monthly');

  useEffect(() => {
    fetchSummary();
  }, [selectedYear, selectedQuarter]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await api.get<FinancialSummaryData>(`/api/financial-summary?year=${selectedYear}&quarter=${selectedQuarter}`);
      setData(res);
      if (res.available_years && res.available_years.length > 0 && !res.available_years.includes(selectedYear)) {
        setSelectedYear(res.available_years[0]);
      }
    } catch (err) {
      console.error('Failed to load financial summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    setShowPrintModal(true);
  };

  return (
    <div className="space-y-4 font-battambang">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex flex-col xs:flex-row xs:items-center gap-2 sm:gap-2.5">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 dark:text-slate-400 shrink-0">
              <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
              <span className="whitespace-nowrap">{language === 'en' ? 'Period:' : 'ចន្លោះពេល៖'}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(parseInt(e.target.value, 10))}
                className="w-full sm:w-auto px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm bg-transparent border border-gray-200 dark:border-slate-800 rounded-xl text-gray-900 dark:text-white font-rajdhani font-semibold focus:outline-none focus:border-[#028090] cursor-pointer"
              >
                {data?.available_years?.map(y => (
                  <option key={y} value={y} className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
                    {language === 'en' ? `Year ${y}` : `ឆ្នាំ ${y}`}
                  </option>
                )) || (
                  <option value={selectedYear} className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
                    {selectedYear}
                  </option>
                )}
              </select>

              <select
                value={selectedQuarter}
                onChange={e => setSelectedQuarter(e.target.value)}
                className="w-full sm:w-auto px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm bg-transparent border border-gray-200 dark:border-slate-800 rounded-xl text-gray-900 dark:text-white font-battambang focus:outline-none focus:border-[#028090] cursor-pointer"
              >
                <option value="all" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
                  {language === 'en' ? 'Full Year (12M)' : 'ពេញមួយឆ្នាំ (១២ ខែ)'}
                </option>
                <option value="1" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
                  {language === 'en' ? 'Q1 (Jan - Mar)' : 'ត្រីមាសទី ១ (មករា - មីនា)'}
                </option>
                <option value="2" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
                  {language === 'en' ? 'Q2 (Apr - Jun)' : 'ត្រីមាសទី ២ (មេសា - មិថុនា)'}
                </option>
                <option value="3" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
                  {language === 'en' ? 'Q3 (Jul - Sep)' : 'ត្រីមាសទី ៣ (កក្កដា - កញ្ញា)'}
                </option>
                <option value="4" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
                  {language === 'en' ? 'Q4 (Oct - Dec)' : 'ត្រីមាសទី ៤ (តុលា - ធ្នូ)'}
                </option>
              </select>
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
          >
            <Printer className="w-4 h-4 text-gray-500 shrink-0" />
            <span>{language === 'en' ? 'Print Summary' : 'បោះពុម្ពសង្ខេប'}</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="py-12 flex flex-col items-center justify-center text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mb-2 text-[#028090] dark:text-teal-400" />
          <span className="text-xs sm:text-sm">{language === 'en' ? 'Calculating summary...' : 'កំពុងគណនារបាយការណ៍...'}</span>
        </div>
      )}

      {!loading && data && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
            <div className="p-3 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-sm text-gray-500 dark:text-slate-400 font-medium truncate pr-1">
                  {language === 'en' ? 'Beginning Balance' : 'សមតុល្យដើមគ្រា'}
                </span>
                <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-500 shrink-0" />
              </div>
              <div className="mt-2 sm:mt-3">
                <span className="font-rajdhani font-bold text-lg sm:text-3xl text-sky-600 dark:text-sky-400 block leading-tight">
                  {(data.beginning_balance || 0).toLocaleString()} ៛
                </span>
                <span className="text-[10px] sm:text-xs text-gray-400 dark:text-slate-500 mt-1 block truncate">
                  {selectedQuarter === 'all'
                    ? (language === 'en' ? 'Brought forward (Jan 1)' : 'ថវិកាដើមឆ្នាំ (លើកមក)')
                    : (language === 'en' ? `Carried forward from Q${parseInt(selectedQuarter, 10) > 1 ? parseInt(selectedQuarter, 10) - 1 : 1}` : `ថវិកាសល់លើកមកពីត្រីមាសមុន`)}
                </span>
              </div>
            </div>

            <div className="p-3 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-sm text-gray-500 dark:text-slate-400 font-medium truncate pr-1">
                  {language === 'en' ? 'Total Income' : 'ចំណូលក្នុងគ្រា'}
                </span>
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
              </div>
              <div className="mt-2 sm:mt-3">
                <span className="font-rajdhani font-bold text-lg sm:text-3xl text-emerald-600 dark:text-emerald-400 block leading-tight">
                  {data.total_income.toLocaleString()} ៛
                </span>
                <span className="text-[10px] sm:text-xs text-gray-400 dark:text-slate-500 mt-1 block truncate">
                  {language === 'en' ? `${data.income_count} transactions` : `${data.income_count} ប្រតិបត្តិការ`}
                </span>
              </div>
            </div>

            <div className="p-3 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-sm text-gray-500 dark:text-slate-400 font-medium truncate pr-1">
                  {language === 'en' ? 'Total Expense' : 'ចំណាយក្នុងគ្រា'}
                </span>
                <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 shrink-0" />
              </div>
              <div className="mt-2 sm:mt-3">
                <span className="font-rajdhani font-bold text-lg sm:text-3xl text-rose-600 dark:text-rose-400 block leading-tight">
                  {data.total_expense.toLocaleString()} ៛
                </span>
                <span className="text-[10px] sm:text-xs text-gray-400 dark:text-slate-500 mt-1 block truncate">
                  {language === 'en' ? `${data.expense_count} transactions` : `${data.expense_count} ប្រតិបត្តិការ`}
                </span>
              </div>
            </div>

            <div className="p-3 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-sm text-gray-500 dark:text-slate-400 font-medium truncate pr-1">
                  {language === 'en' ? 'Actual Cash in Hand' : 'សមតុល្យសរុបជាក់ស្ដែង'}
                </span>
                <DollarSign className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${data.net_balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} />
              </div>
              <div className="mt-2 sm:mt-3">
                <span className={`font-rajdhani font-bold text-lg sm:text-3xl block leading-tight ${
                  data.net_balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {data.net_balance.toLocaleString()} ៛
                </span>
                <span className="text-[10px] sm:text-xs text-gray-400 dark:text-slate-500 mt-1 block truncate">
                  {language === 'en'
                    ? `Actual cash remaining in hand`
                    : `ថវិកាសល់ជាក់ស្ដែងក្នុងដៃ`}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {typeof data.period_net === 'number' && (
              <div className="px-3 sm:px-4 py-2 sm:py-2.5 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 flex flex-col xs:flex-row xs:items-center justify-between gap-1 sm:gap-2 text-xs">
                <span className="text-gray-500 dark:text-slate-400">
                  {language === 'en' ? 'Net Flow in this Period (Income - Expense):' : 'លទ្ធផលចំណូល-ចំណាយក្នុងគ្រានេះ (ចំណូល - ចំណាយ)៖'}
                </span>
                <span className={`font-rajdhani font-bold text-sm ${data.period_net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {data.period_net >= 0 ? `+${data.period_net.toLocaleString()}` : data.period_net.toLocaleString()} ៛
                  <span className="font-battambang font-normal text-xs ml-1.5 text-gray-400">
                    {data.period_net >= 0 ? '(ចំណេញក្នុងគ្រា)' : '(ចំណាយលើសចំណូលក្នុងគ្រា)'}
                  </span>
                </span>
              </div>
            )}

            {data.carried_adjustment && data.carried_adjustment !== 0 && (
              <div className="px-3 sm:px-4 py-2 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 flex flex-col xs:flex-row xs:items-center justify-between gap-1 sm:gap-2 text-xs">
                <span className="text-gray-500 dark:text-slate-400">
                  {language === 'en'
                    ? 'Carried Forward & Seil Balance Adjustments:'
                    : 'ថវិកាលើកមក និងកែតម្រូវបំពេញបន្ថែមតាមបញ្ជីសីល៖'}
                </span>
                <span className="font-rajdhani font-semibold text-gray-900 dark:text-white text-xs sm:text-sm">
                  {data.carried_adjustment > 0 ? `+${data.carried_adjustment.toLocaleString()}` : data.carried_adjustment.toLocaleString()} ៛
                  <span className="font-battambang font-normal text-[11px] ml-1.5 text-gray-400">
                    {language === 'en' ? '(Ensures exact cash in hand balance)' : '(ផ្ទៀងផ្ទាត់ត្រូវគ្នាជាមួយថវិកាក្នុងដៃ 2,892,000 ៛)'}
                  </span>
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-4 sm:p-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                  <span>{language === 'en' ? 'Top Incomes' : 'ចំណូលចម្បងៗ'}</span>
                </h4>
                <span className="text-xs text-gray-400 dark:text-slate-500">
                  {language === 'en' ? 'Highest amounts' : 'ទឹកប្រាក់ច្រើនបំផុត'}
                </span>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-slate-800/60 mt-2">
                {data.top_incomes.length === 0 ? (
                  <div className="py-6 text-center text-xs text-gray-400">{language === 'en' ? 'No income records' : 'មិនមានកំណត់ត្រាចំណូល'}</div>
                ) : (
                  data.top_incomes.map((f, i) => (
                    <div key={f.id || i} className="py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm">
                      <div className="min-w-0 pr-2">
                        <span className="font-medium text-gray-800 dark:text-slate-200 block truncate">
                          {f.description}
                        </span>
                        <span className="text-[11px] text-gray-400 dark:text-slate-500 block mt-0.5">
                          {f.seil_name} {f.note ? `• ${f.note}` : ''}
                        </span>
                      </div>
                      <span className="font-rajdhani font-semibold text-emerald-600 dark:text-emerald-400 text-sm sm:text-base shrink-0">
                        {Number(f.amount).toLocaleString()} ៛
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-4 sm:p-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <ArrowDownRight className="w-4 h-4 text-rose-500" />
                  <span>{language === 'en' ? 'Top Expenses' : 'ចំណាយចម្បងៗ'}</span>
                </h4>
                <span className="text-xs text-gray-400 dark:text-slate-500">
                  {language === 'en' ? 'Highest amounts' : 'ទឹកប្រាក់ច្រើនបំផុត'}
                </span>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-slate-800/60 mt-2">
                {data.top_expenses.length === 0 ? (
                  <div className="py-6 text-center text-xs text-gray-400">{language === 'en' ? 'No expense records' : 'មិនមានកំណត់ត្រាចំណាយ'}</div>
                ) : (
                  data.top_expenses.map((f, i) => (
                    <div key={f.id || i} className="py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm">
                      <div className="min-w-0 pr-2">
                        <span className="font-medium text-gray-800 dark:text-slate-200 block truncate">
                          {f.description}
                        </span>
                        <span className="text-[11px] text-gray-400 dark:text-slate-500 block mt-0.5">
                          {f.seil_name} {f.note ? `• ${f.note}` : ''}
                        </span>
                      </div>
                      <span className="font-rajdhani font-semibold text-rose-600 dark:text-rose-400 text-sm sm:text-base shrink-0">
                        {Number(f.amount).toLocaleString()} ៛
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-3 sm:p-5 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 sm:pb-3 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#028090] dark:text-teal-400 shrink-0" />
                <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                  {language === 'en' ? 'Detailed Breakdown' : 'តារាងលម្អិតចំណូល-ចំណាយ'}
                </h4>
              </div>

              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none text-xs sm:text-sm">
                <button
                  onClick={() => setActiveTableTab('monthly')}
                  className={`px-2.5 sm:px-3 py-1 font-medium transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
                    activeTableTab === 'monthly'
                      ? 'text-[#028090] dark:text-teal-400 border-[#028090] font-semibold'
                      : 'text-gray-500 dark:text-slate-400 border-transparent hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <span>{language === 'en' ? 'Monthly Flow' : 'តារាងប្រចាំខែ'}</span>
                  <span className="font-rajdhani text-[11px] sm:text-xs ml-1">
                    {language === 'en' ? '(12M)' : '(១២ ខែ)'}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTableTab('seils')}
                  className={`px-2.5 sm:px-3 py-1 font-medium transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
                    activeTableTab === 'seils'
                      ? 'text-[#028090] dark:text-teal-400 border-[#028090] font-semibold'
                      : 'text-gray-500 dark:text-slate-400 border-transparent hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <span>{language === 'en' ? 'Seil Periods' : 'តាមបញ្ជីសីល'}</span>
                  <span className="font-rajdhani text-[11px] sm:text-xs ml-1">
                    {language === 'en' ? '(11 Periods)' : '(១១ សីល)'}
                  </span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto mt-2">
              {activeTableTab === 'monthly' ? (
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 dark:text-slate-500 text-[11px] sm:text-xs">
                      <th className="py-2.5 px-2 font-normal">{language === 'en' ? 'Month' : 'ខែ'}</th>
                      <th className="py-2.5 px-2 font-normal text-right">{language === 'en' ? 'Opening (៛)' : 'សមតុល្យដើមខែ (៛)'}</th>
                      <th className="py-2.5 px-2 font-normal text-right">{language === 'en' ? 'Income (៛)' : 'ចំណូល (៛)'}</th>
                      <th className="py-2.5 px-2 font-normal text-right">{language === 'en' ? 'Expense (៛)' : 'ចំណាយ (៛)'}</th>
                      <th className="py-2.5 px-2 font-normal text-right">{language === 'en' ? 'Net (៛)' : 'ចំណេញ/ខាត (៛)'}</th>
                      <th className="py-2.5 px-2 font-normal text-right">{language === 'en' ? 'Cumulative (៛)' : 'សមតុល្យចុងខែ (៛)'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60 font-rajdhani">
                    {data.monthly_data.map((m) => (
                      <tr key={m.month} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="py-2.5 px-2 font-battambang text-gray-800 dark:text-slate-200">
                          {m.month_name}
                        </td>
                        <td className="py-2.5 px-2 text-right text-gray-500 dark:text-slate-400 font-medium">
                          {(m.opening_balance ?? 0).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-2 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                          {m.income.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-2 text-right text-rose-600 dark:text-rose-400 font-medium">
                          {m.expense.toLocaleString()}
                        </td>
                        <td className={`py-2.5 px-2 text-right font-medium ${m.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {m.net.toLocaleString()}
                        </td>
                        <td className={`py-2.5 px-2 text-right font-semibold ${(m.cumulative_balance ?? 0) >= 0 ? 'text-gray-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
                          {(m.cumulative_balance ?? 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 dark:border-slate-700 font-rajdhani font-bold text-xs sm:text-sm">
                      <td className="py-3 px-2 font-battambang text-gray-900 dark:text-white">
                        {language === 'en' ? 'Total / Position' : 'សរុប'}
                      </td>
                      <td className="py-3 px-2 text-right text-gray-500 dark:text-slate-400">
                        {(data.beginning_balance || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-right text-emerald-600 dark:text-emerald-400">
                        {data.total_income.toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-right text-rose-600 dark:text-rose-400">
                        {data.total_expense.toLocaleString()}
                      </td>
                      <td className={`py-3 px-2 text-right ${(data.period_net ?? 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {(data.period_net ?? 0).toLocaleString()}
                      </td>
                      <td className={`py-3 px-2 text-right ${data.net_balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {data.net_balance.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 dark:text-slate-500 text-[11px] sm:text-xs">
                      <th className="py-2.5 px-2 font-normal">{language === 'en' ? 'No.' : 'ល.រ'}</th>
                      <th className="py-2.5 px-2 font-normal">{language === 'en' ? 'Seil Period & Date Range' : 'កាលបរិច្ឆេទបញ្ជីសីល'}</th>
                      <th className="py-2.5 px-2 font-normal text-right">{language === 'en' ? 'Previous Balance (៛)' : 'សមតុល្យលើកមក (៛)'}</th>
                      <th className="py-2.5 px-2 font-normal text-right">{language === 'en' ? 'Income (៛)' : 'ចំណូល (៛)'}</th>
                      <th className="py-2.5 px-2 font-normal text-right">{language === 'en' ? 'Expense (៛)' : 'ចំណាយ (៛)'}</th>
                      <th className="py-2.5 px-2 font-normal text-right">{language === 'en' ? 'Net (៛)' : 'ចំណេញ/ខាត (៛)'}</th>
                      <th className="py-2.5 px-2 font-normal text-right">{language === 'en' ? 'Ending Balance (៛)' : 'សមតុល្យសល់ចុងសីល (៛)'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60 font-rajdhani">
                    {data.seil_breakdown.map((s, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="py-2.5 px-2 font-rajdhani font-semibold text-gray-500 dark:text-slate-400">
                          {String(idx + 1).padStart(2, '0')}
                        </td>
                        <td className="py-2.5 px-2 font-battambang text-gray-800 dark:text-slate-200">
                          <span className="font-medium block">{s.name}</span>
                          {s.range && (
                            <span className="text-[11px] text-gray-400 dark:text-slate-500 block font-rajdhani">
                              {s.range}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-right text-sky-600 dark:text-sky-400 font-medium">
                          {(s.previous_balance ?? 0).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-2 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                          {s.income.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-2 text-right text-rose-600 dark:text-rose-400 font-medium">
                          {s.expense.toLocaleString()}
                        </td>
                        <td className={`py-2.5 px-2 text-right font-medium ${s.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {s.net >= 0 ? `+${s.net.toLocaleString()}` : s.net.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-2 text-right font-bold text-gray-900 dark:text-white">
                          {(s.ending_balance ?? (s.previous_balance || 0) + s.net).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 dark:border-slate-700 font-rajdhani font-bold text-xs sm:text-sm">
                      <td colSpan={2} className="py-3 px-2 font-battambang text-gray-900 dark:text-white">
                        {language === 'en' ? 'Final Cash In Hand (Latest Seil)' : 'សមតុល្យជាក់ស្ដែងសល់ក្នុងដៃ (សីលចុងក្រោយ)'}
                      </td>
                      <td className="py-3 px-2 text-right text-sky-600 dark:text-sky-400">
                        {(data.initial_starting_balance || 1700000).toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-right text-emerald-600 dark:text-emerald-400">
                        {data.total_income.toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-right text-rose-600 dark:text-rose-400">
                        {data.total_expense.toLocaleString()}
                      </td>
                      <td className={`py-3 px-2 text-right ${(data.period_net ?? 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {(data.period_net ?? 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-right text-emerald-600 dark:text-emerald-400 text-sm sm:text-base">
                        {data.net_balance.toLocaleString()} ៛
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {data && (
        <OfficialReportPrintModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          data={data}
          selectedYear={selectedYear}
          selectedQuarter={selectedQuarter}
        />
      )}
    </div>
  );
}
