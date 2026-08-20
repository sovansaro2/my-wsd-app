import re

with open('src/components/Records.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Selector button
old_button = """              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full text-left bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white py-3.5 px-4 rounded-2xl font-semibold text-[13.5px] sm:text-[14px] outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all flex items-center justify-between"
              >
                <span className="truncate pr-2">
                  {selectedPeriod ? `${selectedPeriod.name} (${selectedPeriod.date_range_text})` : 'ជ្រើសរើស...'}
                </span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>"""

new_button = """              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full text-left bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white py-3.5 px-4 rounded-[16px] font-semibold text-[13.5px] sm:text-[14px] outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <Calendar className="w-5 h-5 text-gray-500 shrink-0" />
                  <span className="truncate">
                    {selectedPeriod ? `${selectedPeriod.name} (${selectedPeriod.date_range_text})` : 'ជ្រើសរើស...'}
                  </span>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>"""

content = content.replace(old_button, new_button)

# 2. Download & Add buttons
# We need to find the download button and add button
old_download_add = """            <div className="flex items-center gap-2 flex-shrink-0">
              <button 
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex items-center justify-center bg-gray-100 dark:bg-slate-800 w-[42px] h-[42px] rounded-xl text-gray-600 dark:text-slate-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-all disabled:opacity-50"
              >
                {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              </button>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center justify-center bg-zinc-900 dark:bg-orange-600 hover:bg-zinc-800 text-white w-[42px] h-[42px] rounded-xl transition-all shadow-sm dark:shadow-none"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>"""

# Let me search for it broadly since it might be slightly different
# I will use regex
import re

content = re.sub(
    r'<button\s+onClick=\{handleDownload\}.*?</button>\s*<button\s+onClick=\{\(\) => setIsAddModalOpen\(true\)\}.*?</button>',
    """<button 
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex items-center justify-center bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 w-[48px] h-[48px] rounded-[16px] text-gray-600 dark:text-slate-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-all disabled:opacity-50"
              >
                {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              </button>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center justify-center bg-[#ea580c] hover:bg-[#c2410c] text-white w-[48px] h-[48px] rounded-[16px] transition-all shadow-sm"
              >
                <Plus className="w-6 h-6" />
              </button>""",
    content,
    flags=re.DOTALL
)


# 3. Summary Dashboard
old_summary = """        {/* Summary Dashboard */}
        <div className="mt-3 max-w-3xl mx-auto">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm dark:shadow-none">
            <div className="flex justify-between items-center p-3.5 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30">
              <span className="text-[14px] font-semibold text-gray-600 dark:text-slate-400">{t('records_prev_balance')}</span>
              <span className="font-bold text-gray-900 dark:text-white text-[15px]">{formatCurrency(previousBalance)}</span>
            </div>
            <div className="flex justify-between items-center p-3.5 bg-orange-50 dark:bg-orange-500/10">
              <span className="text-[14px] font-bold text-orange-700 dark:text-orange-500">{t('records_current_balance')}</span>
              <span className="font-bold text-orange-700 dark:text-orange-400 text-[16px]">{formatCurrency(currentBalance)}</span>
            </div>
          </div>
        </div>"""

new_summary = """        {/* Summary Dashboard */}
        <div className="grid grid-cols-2 gap-3 mt-4 max-w-3xl mx-auto">
          {/* Previous Balance */}
          <div className="bg-white dark:bg-slate-900 rounded-[20px] p-4 border border-gray-100 dark:border-slate-800 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="rounded-full border border-green-600 p-0.5">
                <ArrowDownCircle className="w-4 h-4 text-green-600" strokeWidth={2.5} />
              </div>
              <p className="text-gray-600 dark:text-slate-400 text-[13px] font-semibold">{t('records_prev_balance')}</p>
            </div>
            <p className="text-[22px] font-bold text-green-600">{formatCurrency(previousBalance)}</p>
          </div>
          
          {/* Current Balance */}
          <div className="bg-white dark:bg-slate-900 rounded-[20px] p-4 border border-gray-100 dark:border-slate-800 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="rounded-full border border-[#ea580c] p-0.5">
                <ArrowUpCircle className="w-4 h-4 text-[#ea580c]" strokeWidth={2.5} />
              </div>
              <p className="text-gray-600 dark:text-slate-400 text-[13px] font-semibold">{t('records_current_balance')}</p>
            </div>
            <p className="text-[22px] font-bold text-[#ea580c]">{formatCurrency(currentBalance)}</p>
          </div>
        </div>"""

content = content.replace(old_summary, new_summary)

with open('src/components/Records.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
