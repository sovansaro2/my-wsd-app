import re

with open('src/components/Records.tsx', 'r') as f:
    content = f.read()

# Add the checkbox in the Modal if it's missing (it was missing because the hook didn't match correctly)
hook = """                  {/* Date Input */}
                  <div>
                    <label className="block text-[13px] sm:text-[14px] font-bold text-gray-700 dark:text-gray-300 mb-1.5">{t('records_date')}</label>
                    <input
                      type="date"
                      required
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Note Input */}
                  <div>
                    <label className="block text-[13px] sm:text-[14px] font-bold text-gray-700 dark:text-gray-300 mb-1.5">{t('records_note')}</label>
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="w-full border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                      rows={2}
                      placeholder={t('records_note_ph')}
                    />
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

