with open('src/components/Records.tsx', 'r') as f:
    content = f.read()

old_code = """                              <div className="flex flex-col justify-center">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-[14px] sm:text-[15px] text-gray-900 dark:text-white leading-tight">
                                    {record.description}
                                  </span>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleHighLevel(record);
                                    }}
                                    className={`p-1 rounded-full transition-colors ${record.is_high_level ? 'text-orange-500 bg-orange-50 dark:bg-orange-500/10' : 'text-gray-300 dark:text-slate-600 hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10'}`}"""

new_code = """                              <div className="flex flex-col justify-center">
                                <div className="flex items-start justify-between gap-2">
                                  <span className="font-bold text-[14px] sm:text-[15px] text-gray-900 dark:text-white leading-tight break-words">
                                    {record.description}
                                  </span>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleHighLevel(record);
                                    }}
                                    className={`shrink-0 p-1 rounded-full transition-colors ${record.is_high_level ? 'text-orange-500 bg-orange-50 dark:bg-orange-500/10' : 'text-gray-300 dark:text-slate-600 hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10'}`}"""

content = content.replace(old_code, new_code)

with open('src/components/Records.tsx', 'w') as f:
    f.write(content)
