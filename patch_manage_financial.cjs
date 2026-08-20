const fs = require('fs');
let code = fs.readFileSync('src/components/ManageFinancialRecords.tsx', 'utf8');

// 1. Add state for editing Seil
code = code.replace(
  "const [isSeilModalOpen, setIsSeilModalOpen] = useState(false);",
  "const [isSeilModalOpen, setIsSeilModalOpen] = useState(false);\n  const [isEditSeilModalOpen, setIsEditSeilModalOpen] = useState(false);\n  const [editingSeil, setEditingSeil] = useState<SeilPeriod | null>(null);"
);

// 2. Add handleUpdateSeil logic and modal open
const editLogic = `
  const openEditSeilModal = () => {
    if (!selectedPeriod) return;
    setEditingSeil(selectedPeriod);
    setSeilName(selectedPeriod.name);
    setSeilDateRange(selectedPeriod.date_range_text || '');
    setSeilPreviousBalance(selectedPeriod.previous_balance.toString());
    setIsEditSeilModalOpen(true);
  };

  const handleUpdateSeil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSeil || !seilName) return;
    setIsSaving(true);
    try {
      const data = await api.updateSeilPeriod(editingSeil.id, {
        name: seilName,
        date_range_text: seilDateRange || null,
        previous_balance: parseFloat(seilPreviousBalance || '0')
      });
      setIsEditSeilModalOpen(false);
      await fetchPeriods();
      if (data) setSelectedPeriod(data);
    } catch (err) {
      console.error('Error updating seil:', err);
    } finally {
      setIsSaving(false);
    }
  };
`;
code = code.replace(
  "const handleCreateSeil = async (e: React.FormEvent) => {",
  editLogic + "\n  const handleCreateSeil = async (e: React.FormEvent) => {"
);

// 3. Add an Edit button next to the Period Selector
code = code.replace(
  '<div className="relative">',
  '<div className="flex gap-2">\n                  <div className="relative flex-1">'
);
code = code.replace(
  '                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none w-5 h-5 text-zinc-400 dark:text-slate-500" />\n                </div>',
  '                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none w-5 h-5 text-zinc-400 dark:text-slate-500" />\n                  </div>\n                  <button onClick={openEditSeilModal} className="flex-shrink-0 flex items-center justify-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700/60 w-[52px] rounded-xl text-zinc-500 hover:text-orange-600 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-all">\n                    <Edit2 className="w-5 h-5" />\n                  </button>\n                </div>'
);

// 4. Add the Edit Modal UI (similar to Add Modal but for edit)
const editModal = `
      {/* Edit Seil Modal */}
      {isEditSeilModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-800">
              <h3 className="text-[17px] font-bold text-zinc-900 dark:text-white">កែប្រែចំណងជើងសីល</h3>
              <button onClick={() => setIsEditSeilModalOpen(false)} className="p-2 rounded-full hover:bg-zinc-100 dark:bg-slate-800 text-zinc-400 dark:text-slate-500 hover:text-zinc-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateSeil} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-slate-300 mb-1.5">ចំណងជើងសីល <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={seilName}
                  onChange={(e) => setSeilName(e.target.value)}
                  placeholder="ឧ. សីល ៨រោច ខែស្រាពណ៍"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-slate-300 mb-1.5">កាលបរិច្ឆេទ</label>
                <input
                  type="text"
                  value={seilDateRange}
                  onChange={(e) => setSeilDateRange(e.target.value)}
                  placeholder="ឧ. ២៥ សីហា ២០២៤"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-slate-300 mb-1.5">បច្ច័យសល់ពីសីលមុន (រៀល)</label>
                <input
                  type="number"
                  value={seilPreviousBalance}
                  onChange={(e) => setSeilPreviousBalance(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className="w-full mt-2 bg-orange-600 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'រក្សាទុកការកែប្រែ'}
              </button>
            </form>
          </div>
        </div>
      )}
`;

code = code.replace(
  '{/* Add Record Modal */}',
  editModal + '\n      {/* Add Record Modal */}'
);

fs.writeFileSync('src/components/ManageFinancialRecords.tsx', code);
