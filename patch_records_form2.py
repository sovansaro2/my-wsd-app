import re

with open('src/components/Records.tsx', 'r') as f:
    content = f.read()

hook = """                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">{t('records_note')}</label>
                      <input
                        type="text"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder={t('records_note_ph')}
                        className="w-full rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 px-4 py-3 text-[15px] text-gray-900 dark:text-white focus:border-orange-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-400"
                      />
                    </div>
                  </div>"""

replacement = hook + """

                  {/* High Level Budget Checkbox */}
                  {newRecordType === 'income' && (
                    <div className="flex items-center gap-3 p-4 mt-2 bg-orange-50 dark:bg-orange-500/10 rounded-2xl border border-orange-100 dark:border-orange-500/20">
                      <input 
                        type="checkbox" 
                        id="isHighLevel" 
                        checked={isHighLevel}
                        onChange={(e) => setIsHighLevel(e.target.checked)}
                        className="w-5 h-5 rounded text-orange-500 focus:ring-orange-500 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 cursor-pointer"
                      />
                      <label htmlFor="isHighLevel" className="text-[14px] font-battambang font-bold text-orange-800 dark:text-orange-300 select-none cursor-pointer">
                        ✅ ថវិកាកម្រិតខ្ពស់
                      </label>
                    </div>
                  )}"""

if "High Level Budget Checkbox" not in content:
    content = content.replace(hook, replacement)

with open('src/components/Records.tsx', 'w') as f:
    f.write(content)
