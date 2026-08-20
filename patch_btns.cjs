const fs = require('fs');
let code = fs.readFileSync('src/components/Records.tsx', 'utf8');

const oldBtns = `<button 
              onClick={handleDownload}
              disabled={isDownloading || isLoading || records.length === 0}
              className="flex items-center justify-center bg-zinc-100 dark:bg-slate-800 text-zinc-600 dark:text-slate-300 w-12 h-12 rounded-2xl shadow-sm dark:shadow-none hover:bg-zinc-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500/50 flex-shrink-0 disabled:opacity-50"
              title="ទាញយកជារូបភាព"
            >
              {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            </button>
            {userRole === 'admin' && (
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center justify-center bg-orange-500 text-white w-12 h-12 rounded-2xl shadow-sm dark:shadow-none hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/50 flex-shrink-0"
                title={t('records_add_new')}
              >
                <Plus className="w-6 h-6" />
              </button>
            )}`;

const newBtns = `<button 
              onClick={handleDownload}
              disabled={isDownloading || isLoading || records.length === 0}
              className="flex items-center justify-center bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 w-[52px] h-[52px] rounded-[16px] shadow-sm hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500/50 flex-shrink-0 disabled:opacity-50"
              title="ទាញយកជារូបភាព"
            >
              {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-[22px] h-[22px]" />}
            </button>
            {userRole === 'admin' && (
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center justify-center bg-[#ea580c] text-white w-[52px] h-[52px] rounded-[16px] shadow-sm hover:bg-[#c2410c] transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/50 flex-shrink-0"
                title={t('records_add_new')}
              >
                <Plus className="w-[26px] h-[26px]" />
              </button>
            )}`;

code = code.replace(oldBtns, newBtns);
fs.writeFileSync('src/components/Records.tsx', code);
