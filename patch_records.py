import re

with open('src/components/Records.tsx', 'r') as f:
    content = f.read()

# Add imports
if 'Pencil' not in content:
    content = content.replace(
        "import { ChevronDown,",
        "import { ChevronDown, Pencil,"
    )

# Add states
state_block = """  // Add Record Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);"""
new_state_block = """  // Seil Modal State
  const [isSeilModalOpen, setIsSeilModalOpen] = useState(false);
  const [isEditSeilModalOpen, setIsEditSeilModalOpen] = useState(false);
  const [seilName, setSeilName] = useState('');
  const [seilDateRange, setSeilDateRange] = useState('');
  const [seilPreviousBalance, setSeilPreviousBalance] = useState('');
  const [editingSeil, setEditingSeil] = useState<SeilPeriod | null>(null);
  const [isSavingSeil, setIsSavingSeil] = useState(false);

  // Add Record Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);"""

content = content.replace(state_block, new_state_block)

# Add functions
func_hook = "  const handleAddRecord = async (e: React.FormEvent) => {"
new_funcs = """  const openAddSeilModal = () => {
    setSeilName('');
    setSeilDateRange('');
    setSeilPreviousBalance('');
    setEditingSeil(null);
    setIsSeilModalOpen(true);
  };

  const openEditSeilModal = (seil: SeilPeriod, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSeil(seil);
    setSeilName(seil.name);
    setSeilDateRange(seil.date_range_text || '');
    setSeilPreviousBalance(seil.previous_balance ? seil.previous_balance.toString() : '');
    setIsEditSeilModalOpen(true);
  };

  const saveSeil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seilName) return;
    setIsSavingSeil(true);
    try {
      const data = await api.createSeilPeriod({ name: seilName, date_range_text: seilDateRange || null, previous_balance: parseFloat(seilPreviousBalance || '0') });
      setIsSeilModalOpen(false);
      await fetchPeriods();
      if (data) setSelectedPeriod(data);
    } catch (error) {
      console.error('Error saving seil:', error);
    } finally {
      setIsSavingSeil(false);
    }
  };

  const handleUpdateSeil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSeil || !seilName) return;
    setIsSavingSeil(true);
    try {
      const data = await api.updateSeilPeriod(editingSeil.id, { 
        name: seilName, 
        date_range_text: seilDateRange || null, 
        previous_balance: parseFloat(seilPreviousBalance || '0') 
      });
      setIsEditSeilModalOpen(false);
      await fetchPeriods();
      if (data && selectedPeriod?.id === editingSeil.id) {
         setSelectedPeriod(data);
      }
    } catch (err) {
      console.error('Error updating seil:', err);
    } finally {
      setIsSavingSeil(false);
    }
  };

  const handleAddRecord = async (e: React.FormEvent) => {"""

content = content.replace(func_hook, new_funcs)

# Modify the + button header
old_header_btn = """             {userRole === 'admin' && onAddRecord && (
               <button 
                 onClick={onAddRecord}
                 className="flex items-center justify-center bg-transparent text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-slate-800 w-10 h-10 rounded-full transition-colors focus:outline-none"
               >
                 <Plus className="w-6 h-6" />
               </button>
             )}"""
new_header_btn = """             {userRole === 'admin' && (
               <button 
                 onClick={openAddSeilModal}
                 className="flex items-center justify-center bg-transparent text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-slate-800 w-10 h-10 rounded-full transition-colors focus:outline-none"
               >
                 <Plus className="w-6 h-6" />
               </button>
             )}"""
content = content.replace(old_header_btn, new_header_btn)

# Add Pencil icon to periods grid
old_period_button = """                <button 
                  key={period.id}
                  onClick={() => setSelectedPeriod(period)}
                  className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-none transition-transform active:scale-95 hover:border-blue-200 dark:hover:border-blue-900 group"
                >"""
new_period_button = """                <button 
                  key={period.id}
                  onClick={() => setSelectedPeriod(period)}
                  className="relative flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-none transition-transform active:scale-95 hover:border-blue-200 dark:hover:border-blue-900 group"
                >
                  {userRole === 'admin' && (
                    <div 
                      onClick={(e) => openEditSeilModal(period, e)}
                      className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </div>
                  )}"""
content = content.replace(old_period_button, new_period_button)

# Add Modals at the end of the file
modals = """      {/* Seil Modals */}
      <AnimatePresence>
        {isSeilModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSeilModalOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            <div className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden pointer-events-auto"
              >
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 dark:border-slate-800">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">បន្ថែមបញ្ជីចំណូល-ចំណាយថ្មី</h3>
                  <button
                    onClick={() => setIsSeilModalOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={saveSeil} className="p-4 sm:p-5 space-y-4">
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 dark:text-slate-300 mb-1">
                      ឈ្មោះបញ្ជី (ឧ. សីលទី១, បុណ្យផ្កា...) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={seilName}
                      onChange={(e) => setSeilName(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm"
                      placeholder="បញ្ចូលឈ្មោះបញ្ជី"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 dark:text-slate-300 mb-1">
                      កាលបរិច្ឆេទ (ឧ. ១៣-២១ សីហា)
                    </label>
                    <input
                      type="text"
                      value={seilDateRange}
                      onChange={(e) => setSeilDateRange(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm"
                      placeholder="បញ្ចូលកាលបរិច្ឆេទ"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 dark:text-slate-300 mb-1">
                      ប្រាក់ប្រតិបត្តិការសល់ពីមុន (៛)
                    </label>
                    <input
                      type="number"
                      value={seilPreviousBalance}
                      onChange={(e) => setSeilPreviousBalance(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm font-sans"
                      placeholder="0"
                    />
                  </div>
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSavingSeil}
                      className="w-full flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white py-3 sm:py-3.5 rounded-xl font-bold text-sm sm:text-[15px] transition-colors disabled:opacity-70"
                    >
                      {isSavingSeil ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-5 h-5 mr-2" />
                          រក្សាទុក
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}

        {isEditSeilModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditSeilModalOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            <div className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden pointer-events-auto"
              >
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 dark:border-slate-800">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">កែប្រែបញ្ជី</h3>
                  <button
                    onClick={() => setIsEditSeilModalOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleUpdateSeil} className="p-4 sm:p-5 space-y-4">
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 dark:text-slate-300 mb-1">
                      ឈ្មោះបញ្ជី <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={seilName}
                      onChange={(e) => setSeilName(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 dark:text-slate-300 mb-1">
                      កាលបរិច្ឆេទ
                    </label>
                    <input
                      type="text"
                      value={seilDateRange}
                      onChange={(e) => setSeilDateRange(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 dark:text-slate-300 mb-1">
                      ប្រាក់ប្រតិបត្តិការសល់ពីមុន (៛)
                    </label>
                    <input
                      type="number"
                      value={seilPreviousBalance}
                      onChange={(e) => setSeilPreviousBalance(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm font-sans"
                    />
                  </div>
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSavingSeil}
                      className="w-full flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white py-3 sm:py-3.5 rounded-xl font-bold text-sm sm:text-[15px] transition-colors disabled:opacity-70"
                    >
                      {isSavingSeil ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-5 h-5 mr-2" />
                          រក្សាទុក
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Add Record Modal */}"""
content = content.replace("      {/* Add Record Modal */}", modals)

with open('src/components/Records.tsx', 'w') as f:
    f.write(content)
