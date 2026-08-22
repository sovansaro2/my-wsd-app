import re

with open('src/components/NameLists.tsx', 'r') as f:
    content = f.read()

pattern = r"          <AnimatePresence mode=\"popLayout\">\n            \{filteredRecords\.length === 0 \? \(\n              <motion\.div[\s\S]*?              \)\)\n            \}\n          </AnimatePresence>"

replacement = """          {filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 dark:text-slate-500 text-sm">
              {t('list_empty')}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-sm dark:shadow-none overflow-hidden mt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400 text-[13px] font-bold">
                      <th className="px-4 py-3.5 w-12 text-center whitespace-nowrap">ល.រ</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">ឈ្មោះសប្បុរសជន</th>
                      <th className="px-4 py-3.5 whitespace-nowrap text-right">ថវិកា</th>
                      <th className="px-4 py-3.5 w-28 text-right whitespace-nowrap">ផ្សេងៗ/សកម្មភាព</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    <AnimatePresence>
                      {filteredRecords.map((record, index) => (
                        <motion.tr
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          key={record.id}
                          className="bg-white dark:bg-slate-900 hover:bg-orange-50/50 dark:hover:bg-slate-800/50 transition-colors group"
                        >
                          <td className="px-4 py-4 text-center align-top">
                            <span className="text-[12px] font-semibold text-gray-500 dark:text-slate-400 mt-1 inline-block">
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <div className="flex flex-col">
                              <span className="font-bold text-[14px] sm:text-[15px] text-gray-900 dark:text-white leading-tight">
                                {record.name}
                              </span>
                              {record.note && (
                                <span className="text-[12px] text-gray-500 dark:text-slate-400 mt-1.5 flex items-center gap-1.5">
                                  <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-slate-600 shrink-0"></span>
                                  {record.note}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top text-right">
                            <span className="font-bold text-[14px] sm:text-[15px] text-orange-600 dark:text-orange-400 whitespace-nowrap">
                              {formatCurrency(record.amount)}
                            </span>
                          </td>
                          <td className="px-4 py-4 align-top text-right">
                            <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => setCertificateRecord(record)}
                                className="p-1.5 text-orange-500 hover:text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-lg transition-colors focus:outline-none"
                                title="ប័ណ្ណអនុមោទនា"
                              >
                                <Award className="w-[18px] h-[18px]" />
                              </button>
                              {userRole === 'admin' && (
                                <>
                                  <button 
                                    onClick={() => openEditModal(record)}
                                    className="p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors focus:outline-none"
                                  >
                                    <Edit2 className="w-[18px] h-[18px]" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteRecord(record.id)}
                                    className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors focus:outline-none"
                                  >
                                    <Trash2 className="w-[18px] h-[18px]" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          )}"""

content = re.sub(pattern, replacement, content)

with open('src/components/NameLists.tsx', 'w') as f:
    f.write(content)
