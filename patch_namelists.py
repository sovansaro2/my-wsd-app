import re

with open('src/components/NameLists.tsx', 'r') as f:
    content = f.read()

# Add imports
if 'Pencil' not in content:
    content = content.replace(
        "import { Search, Plus,",
        "import { Search, Plus, Pencil,"
    )

# Add states
state_block = """  // Modals state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);"""
new_state_block = """  // Modals state
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ListCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [isSavingCat, setIsSavingCat] = useState(false);

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);"""

content = content.replace(state_block, new_state_block)

# Add functions
func_hook = "  const fetchCategories = async () => {"
new_funcs = """  const openAddCatModal = () => {
    setEditingCategory(null);
    setCatName('');
    setCatDesc('');
    setIsCatModalOpen(true);
  };

  const openEditCatModal = (cat: ListCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatDesc(cat.description || '');
    setIsCatModalOpen(true);
  };

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;
    setIsSavingCat(true);
    try {
      if (editingCategory) {
        const data = await api.updateListCategory(editingCategory.id, { name: catName, description: catDesc });
        if (data && selectedCategory?.id === editingCategory.id) {
          setSelectedCategory(data);
        }
      } else {
        await api.createListCategory({ name: catName, description: catDesc });
      }
      setIsCatModalOpen(false);
      fetchCategories();
    } catch (err) {
      console.error('Error saving category:', err);
    } finally {
      setIsSavingCat(false);
    }
  };

  const fetchCategories = async () => {"""

content = content.replace(func_hook, new_funcs)

# Modify the + button header
old_header_btn = """            {userRole === 'admin' && onManageNameLists && (
              <button 
                onClick={onManageNameLists}
                className="flex items-center justify-center bg-transparent text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-slate-800 w-10 h-10 rounded-full transition-colors focus:outline-none"
              >
                <Plus className="w-6 h-6" />
              </button>
            )}"""
new_header_btn = """            {userRole === 'admin' && (
              <button 
                onClick={openAddCatModal}
                className="flex items-center justify-center bg-transparent text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-slate-800 w-10 h-10 rounded-full transition-colors focus:outline-none"
              >
                <Plus className="w-6 h-6" />
              </button>
            )}"""
content = content.replace(old_header_btn, new_header_btn)

# Add Pencil icon to generalCats
old_general_btn = """                 <button 
                   key={cat.id}
                   onClick={() => setSelectedCategory(cat)}
                   className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-none transition-transform active:scale-95 hover:border-blue-200 dark:hover:border-blue-900 group"
                 >"""
new_general_btn = """                 <button 
                   key={cat.id}
                   onClick={() => setSelectedCategory(cat)}
                   className="relative flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-none transition-transform active:scale-95 hover:border-blue-200 dark:hover:border-blue-900 group"
                 >
                   {userRole === 'admin' && (
                    <div 
                      onClick={(e) => openEditCatModal(cat, e)}
                      className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </div>
                  )}"""
content = content.replace(old_general_btn, new_general_btn)

# Add Pencil icon to roofCat
old_roof_btn = """              <button 
                onClick={() => setSelectedCategory(roofCat)}
                className="w-full text-left bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-5 shadow-lg shadow-orange-500/20 relative overflow-hidden transition-transform active:scale-95"
              >"""
new_roof_btn = """              <button 
                onClick={() => setSelectedCategory(roofCat)}
                className="w-full text-left bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-5 shadow-lg shadow-orange-500/20 relative overflow-hidden transition-transform active:scale-95"
              >
                {userRole === 'admin' && (
                  <div 
                    onClick={(e) => openEditCatModal(roofCat, e)}
                    className="absolute top-3 right-3 z-20 p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-full transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </div>
                )}"""
content = content.replace(old_roof_btn, new_roof_btn)

# Add Modals at the end of the file
modals = """      {/* Category Modals */}
      <AnimatePresence>
        {isCatModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCatModalOpen(false)}
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
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {editingCategory ? 'កែប្រែបញ្ជី' : 'បន្ថែមបញ្ជីថ្មី'}
                  </h3>
                  <button
                    onClick={() => setIsCatModalOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={saveCategory} className="p-4 sm:p-5 space-y-4">
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 dark:text-slate-300 mb-1">
                      ឈ្មោះបញ្ជី <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm"
                      placeholder="បញ្ចូលឈ្មោះបញ្ជី"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 dark:text-slate-300 mb-1">
                      ការពិពណ៌នា
                    </label>
                    <textarea
                      value={catDesc}
                      onChange={(e) => setCatDesc(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm h-24 resize-none"
                      placeholder="បញ្ចូលការពិពណ៌នាបញ្ជី"
                    />
                  </div>
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSavingCat}
                      className="w-full flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white py-3 sm:py-3.5 rounded-xl font-bold text-sm sm:text-[15px] transition-colors disabled:opacity-70"
                    >
                      {isSavingCat ? (
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

with open('src/components/NameLists.tsx', 'w') as f:
    f.write(content)
