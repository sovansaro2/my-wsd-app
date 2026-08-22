import re

with open('src/components/Records.tsx', 'r') as f:
    content = f.read()

pattern = r"          <AnimatePresence mode=\"wait\">\n            <motion\.div\n              key=\{activeTab\}\n              initial=\{\{ opacity: 0, y: 10 \}\}\n              animate=\{\{ opacity: 1, y: 0 \}\}\n              exit=\{\{ opacity: 0, y: -10 \}\}\n              transition=\{\{ duration: 0\.2 \}\}\n              className=\"flex flex-col gap-3\"\n            >\n              \{\(activeTab === 'income' \? incomeRecords : expenseRecords\)\.map\(\(record, index\) => \([\s\S]*?              \}\)\}\n              \n              \{\(activeTab === 'income' \? incomeRecords : expenseRecords\)\.length === 0 && \(\n                <div className=\"text-center py-12 text-zinc-400 dark:text-slate-500 text-sm\">\n                  \{activeTab === 'income' \? t\('records_empty_income'\) : t\('records_empty_expense'\)\}\n                </div>\n              \)\}\n            </motion\.div>\n          </AnimatePresence>"

replacement = """          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {(activeTab === 'income' ? incomeRecords : expenseRecords).length === 0 ? (
                <div className="text-center py-12 text-zinc-400 dark:text-slate-500 text-sm">
                  {activeTab === 'income' ? t('records_empty_income') : t('records_empty_expense')}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400 text-[13px] font-bold">
                          <th className="px-4 py-3.5 w-12 text-center whitespace-nowrap">ល.រ</th>
                          <th className="px-4 py-3.5 whitespace-nowrap">បរិយាយ</th>
                          <th className="px-4 py-3.5 whitespace-nowrap text-right">ថវិកា</th>
                          {activeTab === 'income' && <th className="px-4 py-3.5 w-24 text-right whitespace-nowrap">សកម្មភាព</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                        {(activeTab === 'income' ? incomeRecords : expenseRecords).map((record, index) => (
                          <tr
                            key={record.id}
                            className="bg-white dark:bg-slate-900 hover:bg-orange-50/50 dark:hover:bg-slate-800/50 transition-colors group"
                          >
                            <td className="px-4 py-3 text-center align-middle">
                              <span className="text-[12px] font-semibold text-gray-500 dark:text-slate-400 inline-block">
                                {index + 1}
                              </span>
                            </td>
                            <td className="px-4 py-3 align-middle">
                              <div className="flex flex-col justify-center">
                                <span className="font-bold text-[14px] sm:text-[15px] text-gray-900 dark:text-white leading-tight">
                                  {record.description}
                                </span>
                                <span className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">{formatDate(record.record_date)}</span>
                                {record.note && (
                                  <span className="text-[12px] text-gray-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 line-clamp-1">
                                    <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-slate-600 shrink-0"></span>
                                    {record.note}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 align-middle text-right">
                              <span className={`font-bold text-[14px] sm:text-[15px] whitespace-nowrap ${activeTab === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                {activeTab === 'income' ? '+' : '-'}{formatCurrency(record.amount)}
                              </span>
                            </td>
                            {activeTab === 'income' && (
                              <td className="px-4 py-3 align-middle text-right">
                                <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => setCertificateRecord(record)}
                                    className="p-1.5 text-orange-500 hover:text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-lg transition-colors focus:outline-none"
                                    title="ប័ណ្ណអនុមោទនា"
                                  >
                                    <Award className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>"""

content = re.sub(pattern, replacement, content)

with open('src/components/Records.tsx', 'w') as f:
    f.write(content)
