const fs = require('fs');
let code = fs.readFileSync('src/components/Records.tsx', 'utf8');

const oldBalance = `{/* Summary Dashboard */}
        <div className="grid grid-cols-2 gap-3 mt-2 max-w-3xl mx-auto">
          <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-gray-100 dark:border-slate-800">
            <p className="text-gray-500 dark:text-slate-400 text-[11px] uppercase tracking-wider mb-1 font-semibold">{t('records_prev_balance')}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(previousBalance)}</p>
          </div>
          <div className="bg-orange-500 rounded-2xl p-4 shadow-md shadow-orange-500/20 relative overflow-hidden">
            <div className="absolute -top-2 -right-2 p-3 opacity-10">
              <Wallet className="w-16 h-16 text-white" />
            </div>
            <p className="text-orange-100 text-[11px] uppercase tracking-wider mb-1 font-semibold relative z-10">{t('records_current_balance')}</p>
            <p className="text-xl font-bold text-white relative z-10">{formatCurrency(currentBalance)}</p>
          </div>
        </div>`;

const newBalance = `{/* Summary Dashboard */}
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
        </div>`;

code = code.replace(oldBalance, newBalance);

fs.writeFileSync('src/components/Records.tsx', code);
