import re

with open('src/components/NameLists.tsx', 'r') as f:
    content = f.read()

# The category modals to insert
cat_modals = """
      {/* Category Modals */}
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
"""

# Insert it into the early return block
early_return_end = content.find("</div>\n    );\n  }\n\n  return (")
if early_return_end != -1:
    # We need to wrap it in a fragment
    early_return_start = content.find("    return (\n      <div className=\"flex flex-col h-full")
    if early_return_start != -1:
        # Change the early return to use fragment
        content = content[:early_return_start] + "    return (\n      <>\n      " + content[early_return_start+13:early_return_end+6] + "\n" + cat_modals + "      </>\n" + content[early_return_end+6:]
        print("Successfully patched NameLists.tsx")
    else:
        print("Could not find early_return_start in NameLists.tsx")
else:
    print("Could not find early_return_end in NameLists.tsx")

with open('src/components/NameLists.tsx', 'w') as f:
    f.write(content)

