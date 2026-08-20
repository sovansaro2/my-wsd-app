const fs = require('fs');
let code = fs.readFileSync('src/components/ManageFinancialRecords.tsx', 'utf8');

const editModal = `
      {/* Edit Seil Modal */}
      <AnimatePresence>
      {isEditSeilModalOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl"
          >
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
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-slate-300 mb-1.5">កាលបរិច្ឆេទ</label>
                <input
                  type="text"
                  value={seilDateRange}
                  onChange={(e) => setSeilDateRange(e.target.value)}
                  placeholder="ឧ. ២៥ សីហា ២០២៤"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-slate-300 mb-1.5">បច្ច័យសល់ពីសីលមុន (រៀល)</label>
                <input
                  type="number"
                  value={seilPreviousBalance}
                  onChange={(e) => setSeilPreviousBalance(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-all text-gray-900 dark:text-white"
                />
              </div>
              <button
                type="submit"
                disabled={isSavingSeil}
                className="w-full mt-2 bg-orange-600 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSavingSeil ? <Loader2 className="w-5 h-5 animate-spin" /> : 'រក្សាទុកការកែប្រែ'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
`;

code = code.replace(
  '{/* Delete Confirmation Modal */}',
  editModal + '\n      {/* Delete Confirmation Modal */}'
);

fs.writeFileSync('src/components/ManageFinancialRecords.tsx', code);
