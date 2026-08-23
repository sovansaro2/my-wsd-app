import re

with open('src/components/Records.tsx', 'r') as f:
    content = f.read()

# Replace the flex row of buttons in the Detail Header
old_header = """          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSelectedPeriod(null)}
              className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight truncate">{selectedPeriod?.name}</h2>
              {selectedPeriod?.date_range_text && (
                 <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{selectedPeriod.date_range_text}</p>
              )}
            </div>
            
            <button 
              onClick={handleDownload}
              disabled={isDownloading || isLoading || records.length === 0}
              className="flex items-center justify-center bg-zinc-100 dark:bg-slate-800 text-zinc-600 dark:text-slate-300 w-12 h-12 rounded-2xl shadow-none dark:shadow-none hover:bg-zinc-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500/50 flex-shrink-0 disabled:opacity-50"
              title="ទាញយកជារូបភាព"
            >
              {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            </button>

            {userRole === 'admin' && (
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center justify-center bg-orange-500 text-white w-12 h-12 rounded-2xl shadow-none dark:shadow-none hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/50 flex-shrink-0"
                title={t('records_add_new')}
              >
                <Plus className="w-6 h-6" />
              </button>
            )}
          </div>"""

new_header = """          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <button 
                onClick={() => setSelectedPeriod(null)}
                className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors shrink-0"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div className="min-w-0">
                <h2 className="text-[20px] sm:text-[22px] leading-tight font-bold text-gray-900 dark:text-white tracking-tight truncate">{selectedPeriod?.name}</h2>
                {selectedPeriod?.date_range_text && (
                   <p className="text-[13px] text-gray-500 dark:text-slate-400 mt-0.5 truncate">{selectedPeriod.date_range_text}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0 pl-2">
              <button 
                onClick={handleDownload}
                disabled={isDownloading || isLoading || records.length === 0}
                className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors focus:outline-none disabled:opacity-50"
                title="ទាញយកជារូបភាព"
              >
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              </button>

              {userRole === 'admin' && (
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="w-10 h-10 flex items-center justify-center bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors shadow-sm focus:outline-none"
                  title={t('records_add_new')}
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>"""

content = content.replace(old_header, new_header)

old_cards = """        {/* Summary Dashboard */}
        <div className="grid grid-cols-2 gap-3 mt-4 max-w-3xl mx-auto">
          {/* Previous Balance */}
          <div className="bg-white dark:bg-slate-900 rounded-[20px] p-4 border border-gray-200 dark:border-slate-800 flex flex-col items-center justify-center text-center shadow-none">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="rounded-full border border-green-600 p-0.5">
                <ArrowDownCircle className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-green-600" strokeWidth={2.5} />
              </div>
              <p className="text-gray-600 dark:text-slate-400 text-[13px] font-semibold">{t('records_prev_balance')}</p>
            </div>
            <p className="text-[22px] font-bold text-green-600">{formatCurrency(previousBalance)}</p>
          </div>
          
          {/* Current Balance */}
          <div className="bg-white dark:bg-slate-900 rounded-[20px] p-4 border border-gray-200 dark:border-slate-800 flex flex-col items-center justify-center text-center shadow-none">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="rounded-full border border-[#ea580c] p-0.5">
                <ArrowUpCircle className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#ea580c]" strokeWidth={2.5} />
              </div>
              <p className="text-gray-600 dark:text-slate-400 text-[13px] font-semibold">{t('records_current_balance')}</p>
            </div>
            <p className="text-[22px] font-bold text-[#ea580c]">{formatCurrency(currentBalance)}</p>
          </div>
        </div>"""

new_cards = """        {/* Summary Dashboard */}
        <div className="grid grid-cols-2 gap-3 mt-4 max-w-3xl mx-auto">
          {/* Previous Balance */}
          <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-[18px] p-3.5 sm:p-4 flex flex-col justify-center border border-emerald-100 dark:border-emerald-500/20">
            <div className="flex items-center gap-1.5 mb-1.5">
              <ArrowDownCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={2.5} />
              <p className="text-emerald-700 dark:text-emerald-400 text-[13px] font-semibold line-clamp-1">{t('records_prev_balance')}</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400 truncate">{formatCurrency(previousBalance)}</p>
          </div>
          
          {/* Current Balance */}
          <div className="bg-orange-50 dark:bg-orange-500/10 rounded-[18px] p-3.5 sm:p-4 flex flex-col justify-center border border-orange-100 dark:border-orange-500/20">
            <div className="flex items-center gap-1.5 mb-1.5">
              <ArrowUpCircle className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" strokeWidth={2.5} />
              <p className="text-orange-700 dark:text-orange-400 text-[13px] font-semibold line-clamp-1">{t('records_current_balance')}</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400 truncate">{formatCurrency(currentBalance)}</p>
          </div>
        </div>"""

content = content.replace(old_cards, new_cards)

with open('src/components/Records.tsx', 'w') as f:
    f.write(content)
