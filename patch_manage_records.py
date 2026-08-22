import re

with open('src/components/ManageFinancialRecords.tsx', 'r') as f:
    content = f.read()

start_str = "{records.map((record) => ("
end_str = "              </div>\n\n              {/* Floating Add Button */}"
start_idx = content.find(start_str)
if start_idx == -1:
    print("Start not found")
else:
    end_idx = content.find(end_str, start_idx)
    
    replacement = """{records.length === 0 ? (
                  <div className="text-center py-12 text-zinc-400 dark:text-slate-500 text-sm">មិនមានទិន្នន័យ</div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden mt-2">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[500px]">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400 text-[13px] font-bold">
                            <th className="px-4 py-3.5 whitespace-nowrap">បរិយាយ</th>
                            <th className="px-4 py-3.5 whitespace-nowrap text-right">ថវិកា</th>
                            <th className="px-4 py-3.5 w-24 text-right whitespace-nowrap">សកម្មភាព</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                          {records.map((record) => (
                            <tr
                              key={record.id}
                              className="bg-white dark:bg-slate-900 hover:bg-orange-50/50 dark:hover:bg-slate-800/50 transition-colors group"
                            >
                              <td className="px-4 py-3 align-middle">
                                <div className="flex flex-col justify-center">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${record.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                    <span className="font-bold text-[14px] sm:text-[15px] text-gray-900 dark:text-white leading-tight">
                                      {record.description}
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 pl-4">{formatDate(record.record_date)}</span>
                                  {record.note && (
                                    <span className="text-[12px] text-gray-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 pl-4 line-clamp-1">
                                      <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-slate-600 shrink-0"></span>
                                      {record.note}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 align-middle text-right">
                                <span className={`font-bold text-[14px] sm:text-[15px] whitespace-nowrap ${record.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                  {record.type === 'income' ? '+' : '-'}{formatCurrency(record.amount)}
                                </span>
                              </td>
                              <td className="px-4 py-3 align-middle text-right">
                                <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => openEditRecordModal(record)}
                                    className="p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors focus:outline-none"
                                  >
                                    <Edit2 className="w-[18px] h-[18px]" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteRecord(record.id)}
                                    className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-lg transition-colors focus:outline-none"
                                  >
                                    <Trash2 className="w-[18px] h-[18px]" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
"""

    content = content[:start_idx] + replacement + content[end_idx:]

with open('src/components/ManageFinancialRecords.tsx', 'w') as f:
    f.write(content)
