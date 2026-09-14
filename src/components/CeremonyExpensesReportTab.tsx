import React, { useState, useEffect } from 'react';
import { Printer, Search, Plus, Loader2, ArrowUpDown, Calendar, DollarSign, Receipt, FileText } from 'lucide-react';
import { api } from '../lib/apiClient';
import { useLanguage } from '../contexts/LanguageContext';
import CeremonyExpenseReportModal, { CeremonyExpenseItem } from './CeremonyExpenseReportModal';
import { khmerNumberToWords } from '../lib/khmerNumberToWords';

export default function CeremonyExpensesReportTab() {
  const { language } = useLanguage();
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [records, setRecords] = useState<CeremonyExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await api.getNameListCategories();
      const expenseCats = (data || []).filter((c: any) =>
        c.name.includes('ចំណាយ') || c.name === 'បញ្ជីថវិការចំណាយក្នុងកម្មវិធីបុណ្យ'
      );

      setCategories(expenseCats.length > 0 ? expenseCats : data || []);
      if (expenseCats.length > 0) {
        setSelectedCategoryId(expenseCats[0].id);
        fetchCategoryRecords(expenseCats[0].id);
      } else if (data && data.length > 0) {
        setSelectedCategoryId(data[0].id);
        fetchCategoryRecords(data[0].id);
      }
    } catch (err) {
      console.error('Error loading expense categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryRecords = async (catId: string) => {
    try {
      setLoading(true);
      const data = await api.getNameListRecords(catId);
      setRecords((data || []) as CeremonyExpenseItem[]);
    } catch (err) {
      console.error('Error fetching records:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedCategoryId(newId);
    fetchCategoryRecords(newId);
  };

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);
  const categoryName = selectedCategory?.name || 'បញ្ជីថវិការចំណាយក្នុងកម្មវិធីបុណ្យ';

  const filteredRecords = records.filter(r => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.name?.toLowerCase().includes(q) ||
      r.referrer?.toLowerCase().includes(q) ||
      r.note?.toLowerCase().includes(q)
    );
  });

  const totalExpense = records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const filteredTotal = filteredRecords.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const totalInWords = khmerNumberToWords(totalExpense);

  return (
    <div className="space-y-4 font-battambang">
      {/* Top Banner & Action */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <h2 className="text-lg sm:text-xl font-battambang font-bold text-gray-900 dark:text-white">
                របាយការណ៍ថវិការចំណាយក្នុងកម្មវិធីបុណ្យ
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
              តាមដាន និងចេញរបាយការណ៍ចំណាយផ្លូវការរបស់វត្តអារាម
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {categories.length > 1 && (
              <select
                value={selectedCategoryId}
                onChange={handleCategoryChange}
                className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-battambang focus:ring-2 focus:ring-[#028090]"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() => setShowReportModal(true)}
              disabled={records.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs sm:text-sm font-medium font-battambang transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>ចេញរបាយការណ៍បច្ច័យ (ស្លឹក A5)</span>
            </button>
          </div>
        </div>

        {/* Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-5">
          <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-transparent">
            <p className="text-xs text-gray-500 dark:text-slate-400 font-battambang">សរុបការចំណាយទាំងអស់</p>
            <p className="text-xl sm:text-2xl font-rajdhani font-bold text-amber-600 dark:text-amber-400 mt-1">
              ៛ {totalExpense.toLocaleString()}
            </p>
            <p className="text-[11.5px] text-gray-600 dark:text-slate-400 font-battambang mt-1 truncate" title={totalInWords}>
              {totalInWords}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-transparent">
            <p className="text-xs text-gray-500 dark:text-slate-400 font-battambang">ចំនួនមុខចំណាយសរុប</p>
            <p className="text-xl sm:text-2xl font-rajdhani font-bold text-gray-900 dark:text-white mt-1">
              {records.length} មុខ
            </p>
            <p className="text-[11.5px] text-gray-500 dark:text-slate-400 font-battambang mt-1">
              កត់ត្រាក្នុងប្រព័ន្ធ
            </p>
          </div>

          <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-transparent">
            <p className="text-xs text-gray-500 dark:text-slate-400 font-battambang">មធ្យមភាគក្នុងមួយមុខ</p>
            <p className="text-xl sm:text-2xl font-rajdhani font-bold text-gray-900 dark:text-white mt-1">
              ៛ {records.length > 0 ? Math.round(totalExpense / records.length).toLocaleString() : 0}
            </p>
            <p className="text-[11.5px] text-gray-500 dark:text-slate-400 font-battambang mt-1">
              គិតជាមធ្យម
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ស្វែងរកមុខទំនិញ ឬអ្នកចាត់ចែង..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-battambang focus:outline-none focus:ring-2 focus:ring-[#028090]"
            />
          </div>

          {searchQuery && (
            <div className="text-xs text-gray-500 dark:text-slate-400 font-battambang">
              ឃើញ {filteredRecords.length} មុខ • សរុប៖ ៛ {filteredTotal.toLocaleString()}
            </div>
          )}
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-2 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin text-[#028090]" />
            <span className="text-xs font-battambang">កំពុងទាញយកទិន្នន័យ...</span>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-gray-400 dark:text-slate-500 text-sm font-battambang">
            មិនមានទិន្នន័យចំណាយត្រូវបានរកឃើញទេ
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm font-battambang">
              <thead className="bg-gray-50 dark:bg-slate-800/60 border-b border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 font-medium">
                <tr>
                  <th className="py-3 px-3 text-center w-12">ល.រ</th>
                  <th className="py-3 px-4">មុខទំនិញ / បរិយាយការចំណាយ</th>
                  <th className="py-3 px-4 text-center">អ្នកចាត់ចែង / អ្នកទិញ</th>
                  <th className="py-3 px-4 text-center">កាលបរិច្ឆេទ</th>
                  <th className="py-3 px-4 text-right">ចំនួនទឹកប្រាក់</th>
                  <th className="py-3 px-4">កំណត់សម្គាល់</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/80">
                {filteredRecords.map((r, idx) => {
                  const expenseDate = r.metadata?.expense_date || (r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB') : '-');
                  return (
                    <tr key={r.id || idx} className="hover:bg-gray-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 text-center font-rajdhani font-medium text-gray-500">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                        {r.name}
                      </td>
                      <td className="py-3 px-4 text-center text-gray-600 dark:text-slate-300">
                        {r.referrer || '-'}
                      </td>
                      <td className="py-3 px-4 text-center font-rajdhani text-gray-500 dark:text-slate-400 whitespace-nowrap">
                        {expenseDate}
                      </td>
                      <td className="py-3 px-4 text-right font-rajdhani font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                        ៛ {Number(r.amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500 dark:text-slate-400">
                        {r.note || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 dark:bg-slate-800/80 font-bold border-t-2 border-gray-200 dark:border-slate-700">
                <tr>
                  <td colSpan={4} className="py-3.5 px-4 text-right font-battambang text-gray-900 dark:text-white">
                    សរុបការចំណាយទាំងអស់៖
                  </td>
                  <td className="py-3.5 px-4 text-right font-rajdhani text-base font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                    ៛ {filteredTotal.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-gray-500 dark:text-slate-400 font-normal">
                    {khmerNumberToWords(filteredTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Official Ceremony Expense Report Modal */}
      {showReportModal && (
        <CeremonyExpenseReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          categoryName={categoryName}
          records={records}
        />
      )}
    </div>
  );
}
