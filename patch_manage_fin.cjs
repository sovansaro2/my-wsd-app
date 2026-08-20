const fs = require('fs');
let content = fs.readFileSync('src/components/ManageFinancialRecords.tsx', 'utf8');

// Container
content = content.replace(
  'className="flex flex-col h-full bg-slate-50 pb-safe font-battambang"',
  'className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 pb-safe font-battambang transition-colors duration-200"'
);

// Header
content = content.replace(
  'className="bg-white shadow-sm z-10 sticky top-0 border-b border-slate-100"',
  'className="bg-white dark:bg-slate-900 shadow-sm z-10 sticky top-0 border-b border-slate-100 dark:border-slate-800 transition-colors"'
);

// Body
content = content.replace(
  /bg-white rounded-2xl p-4 sm:p-5 shadow-\[0_2px_12px_-4px_rgba\(0,0,0,0\.06\)\] border border-slate-100/g,
  'bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] dark:shadow-none border border-slate-100 dark:border-slate-800'
);

content = content.replace(
  /text-slate-900/g,
  'text-slate-900 dark:text-white'
);

content = content.replace(
  /text-slate-800/g,
  'text-slate-800 dark:text-slate-200'
);

content = content.replace(
  /bg-slate-50/g,
  'bg-slate-50 dark:bg-slate-800/50'
);

// Inputs
content = content.replace(
  /className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-\[15px\] rounded-xl px-4 py-3 sm:py-3\.5 focus:ring-2 focus:ring-indigo-500\/20 focus:border-indigo-500 transition-all"/g,
  'className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[15px] rounded-xl px-4 py-3 sm:py-3.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"'
);
content = content.replace(
  /className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-\[15px\] rounded-xl px-4 py-3 sm:py-3\.5 focus:ring-2 focus:ring-indigo-500\/20 focus:border-indigo-500 transition-all appearance-none"/g,
  'className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[15px] rounded-xl px-4 py-3 sm:py-3.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"'
);

// Modals
content = content.replace(
  /bg-white rounded-3xl/g,
  'bg-white dark:bg-slate-900 rounded-3xl'
);

content = content.replace(
  /bg-white rounded-\[24px\]/g,
  'bg-white dark:bg-slate-900 rounded-[24px]'
);

// Bottom sheets
content = content.replace(
  /bg-white rounded-t-3xl/g,
  'bg-white dark:bg-slate-900 rounded-t-3xl'
);

fs.writeFileSync('src/components/ManageFinancialRecords.tsx', content);
