const fs = require('fs');
let content = fs.readFileSync('src/components/Records.tsx', 'utf8');

content = content.replace(
  `import { ChevronDown, Pencil, Star, ArrowUpCircle, ArrowDownCircle, Wallet, Plus, X, Check, Download, Loader2, Calendar, Bell, Award, Share2 } from 'lucide-react';`,
  `import { ChevronDown, Pencil, Star, ArrowUpCircle, ArrowDownCircle, Wallet, Plus, X, Check, Download, Loader2, Calendar, Bell, Award, Share2, Landmark } from 'lucide-react';`
);

content = content.replace(
  `                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">{t('records_description')}</label>
                    <input
                      type="text"
                      required
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder={t('records_description_ph')}
                      className="w-full rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 px-4 py-3 text-[15px] text-gray-900 dark:text-white focus:border-orange-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-400"
                    />`,
  `                    <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                      {newRecordType === 'income' ? (t('records_description_income') || 'ឈ្មោះសប្បុរសជន') : (t('records_description_expense') || 'បរិយាយ (មុខទំនិញ)')}
                    </label>
                    <input
                      type="text"
                      required
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder={newRecordType === 'income' ? (t('records_description_income_ph') || 'សូមបញ្ជូលឈ្មោះ') : (t('records_description_expense_ph') || 'ឧ. ទិញទឹកសុទ្ធ...')}
                      className="w-full rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 px-4 py-3 text-[15px] text-gray-900 dark:text-white focus:border-orange-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-400"
                    />`
);

content = content.replace(
  `                        <label htmlFor="isHighLevel" className="text-[14px] font-battambang font-bold text-orange-800 dark:text-orange-300 select-none cursor-pointer">
                          ✅ ថវិកាកម្រិតខ្ពស់
                        </label>`,
  `                        <label htmlFor="isHighLevel" className="flex items-center gap-2 text-[14px] font-battambang font-bold text-orange-800 dark:text-orange-300 select-none cursor-pointer">
                          <Star className="w-4 h-4 fill-orange-500 text-orange-500" /> ថវិកាកម្រិតខ្ពស់
                        </label>`
);

content = content.replace(
  `                        <label htmlFor="addToRoofFund" className="text-[14px] font-battambang font-bold text-blue-800 dark:text-blue-300 select-none cursor-pointer">
                          ⛩️ បន្ថែមចូលបញ្ជីកសាងដំបូលព្រះវិហារ
                        </label>`,
  `                        <label htmlFor="addToRoofFund" className="flex items-center gap-2 text-[14px] font-battambang font-bold text-blue-800 dark:text-blue-300 select-none cursor-pointer">
                          <Landmark className="w-4 h-4 text-blue-500" /> បន្ថែមចូលបញ្ជីកសាងដំបូលព្រះវិហារ
                        </label>`
);

fs.writeFileSync('src/components/Records.tsx', content);
console.log('Records context patched');
