import re

with open('src/components/ManageFinancialRecords.tsx', 'r') as f:
    content = f.read()

# I will just replace the tail part with the proper closure.
# We had </div> </div> )} </div>

tail = """                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating Add Button */}
      {!loading && !error && selectedPeriod && (
        <div className="fixed bottom-24 right-4 sm:right-6 sm:bottom-6 z-40">
          <button 
            onClick={openAddRecordModal}
            className="w-14 h-14 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-600/30 transition-all active:scale-95 focus:outline-none"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {isSeilModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSeilModalOpen(false)}
            className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: "100%", opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: "100%", opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-5 flex justify-between items-center border-b border-gray-100 dark:border-slate-800">
                <h3 className="font-bold text-xl text-gray-900 dark:text-white">
                  កែប្រែឈ្មោះសីល
                </h3>
                <button 
                  onClick={() => setIsSeilModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 rounded-full transition-colors focus:outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                    ឈ្មោះសីល (ឧ. សីល ៨រោច)
                  </label>
                  <input
                    type="text"
                    value={seilName}
                    onChange={(e) => setSeilName(e.target.value)}
                    className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    placeholder="បញ្ចូលឈ្មោះសីល..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                    កាលបរិច្ឆេទ (ឧ. ១៤ កុម្ភៈ ២០២៥)
                  </label>
                  <input
                    type="text"
                    value={seilDateRange}
                    onChange={(e) => setSeilDateRange(e.target.value)}
                    className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    placeholder="បញ្ចូលកាលបរិច្ឆេទ..."
                  />
                </div>
              </div>

              <div className="p-5 pt-2 bg-gray-50 dark:bg-slate-800/30 flex gap-3">
                <button
                  onClick={() => setIsSeilModalOpen(false)}
                  className="flex-1 px-4 py-3 text-gray-700 dark:text-slate-300 font-bold bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors focus:outline-none"
                >
                  បោះបង់
                </button>
                <button
                  onClick={handleSaveSeil}
                  disabled={!seilName.trim()}
                  className="flex-1 px-4 py-3 text-white font-bold bg-orange-600 hover:bg-orange-700 rounded-xl transition-all shadow-md shadow-orange-600/20 disabled:opacity-50 focus:outline-none flex justify-center items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  រក្សាទុក
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {isRecordModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsRecordModalOpen(false)}
            className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: "100%", opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: "100%", opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-5 flex justify-between items-center border-b border-gray-100 dark:border-slate-800">
                <h3 className="font-bold text-xl text-gray-900 dark:text-white">
                  {editingRecord ? 'កែប្រែទិន្នន័យ' : 'បញ្ចូលទិន្នន័យថ្មី'}
                </h3>
                <button 
                  onClick={() => setIsRecordModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 rounded-full transition-colors focus:outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-5 space-y-4">
                <div className="flex gap-2 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl mb-2">
                  <button
                    onClick={() => setRecordType('income')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${recordType === 'income' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
                  >
                    ចំណូលបញ្ចី (+)
                  </button>
                  <button
                    onClick={() => setRecordType('expense')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${recordType === 'expense' ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
                  >
                    ចំណាយបញ្ចី (-)
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                    បរិយាយ
                  </label>
                  <input
                    type="text"
                    value={recordDesc}
                    onChange={(e) => setRecordDesc(e.target.value)}
                    className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    placeholder="បញ្ចូលបរិយាយ..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                    ចំនួនថវិកា (រៀល)
                  </label>
                  <input
                    type="number"
                    value={recordAmount}
                    onChange={(e) => setRecordAmount(e.target.value)}
                    className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-bold"
                    placeholder="បញ្ចូលចំនួនថវិកា..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                    ចំណាំ (មិនចាំបាច់ក៏បាន)
                  </label>
                  <input
                    type="text"
                    value={recordNote}
                    onChange={(e) => setRecordNote(e.target.value)}
                    className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    placeholder="កំណត់សម្គាល់ផ្សេងៗ..."
                  />
                </div>
              </div>

              <div className="p-5 pt-2 bg-gray-50 dark:bg-slate-800/30 flex gap-3">
                <button
                  onClick={() => setIsRecordModalOpen(false)}
                  className="flex-1 px-4 py-3 text-gray-700 dark:text-slate-300 font-bold bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors focus:outline-none"
                >
                  បោះបង់
                </button>
                <button
                  onClick={handleSaveRecord}
                  disabled={!recordDesc.trim() || !recordAmount}
                  className={`flex-1 px-4 py-3 text-white font-bold rounded-xl transition-all shadow-md flex justify-center items-center gap-2 disabled:opacity-50 focus:outline-none ${
                    recordType === 'income' 
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' 
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                  }`}
                >
                  <Save className="w-5 h-5" />
                  រក្សាទុក
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
"""

start_idx = content.find("                          ))}")
content = content[:start_idx] + tail

with open('src/components/ManageFinancialRecords.tsx', 'w') as f:
    f.write(content)
