import re

with open('src/components/Dashboard.tsx', 'r') as f:
    content = f.read()

pattern = r"      \{\/\* Bar Chart \*\/.*?      \{\/\* Password Modal \*\/\}"
replacement = """      {/* Top Donors Section */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors duration-200">
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-orange-50/50 dark:bg-orange-500/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-500/20 text-orange-600 rounded-lg">
              <Trophy className="w-5 h-5" />
            </div>
            <h3 className="text-md font-bold text-gray-800 dark:text-slate-200">សប្បុរសជនឆ្នើម</h3>
          </div>
          <span className="text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-full">
            100,000៛ +
          </span>
        </div>
        
        <div className="divide-y divide-gray-50 dark:divide-slate-800/50">
          {topDonors.length === 0 ? (
            <div className="p-8 text-center text-gray-400 dark:text-slate-500 text-sm">
              មិនទាន់មានទិន្នន័យនៅឡើយទេ
            </div>
          ) : (
            topDonors.map((donor, index) => (
              <div key={index} className="flex flex-col">
                {/* Main Row */}
                <button 
                  onClick={() => toggleDonorExpand(index)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors focus:outline-none"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      index === 1 ? 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300' :
                      index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white text-left">{donor.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {isAmountVisible ? `៛ ${donor.total.toLocaleString()}` : '៛ ***'}
                    </span>
                    {expandedDonorIndex === index ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>
                
                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedDonorIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-slate-50 dark:bg-slate-800/30"
                    >
                      <div className="p-4 pl-12 border-t border-dashed border-gray-200 dark:border-slate-700">
                        <p className="text-xs text-gray-500 dark:text-slate-400 mb-2 font-medium">ព័ត៌មានលម្អិតបច្ច័យ៖</p>
                        <div className="space-y-2">
                          {donor.details.map((detail, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm">
                              <span className="text-gray-700 dark:text-slate-300 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                                {detail.category_name}
                              </span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {isAmountVisible ? `៛ ${detail.amount.toLocaleString()}` : '៛ ***'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          )}
        </div>
      </section>

      </div>
      
      {/* Password Modal */}"""

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(content)

