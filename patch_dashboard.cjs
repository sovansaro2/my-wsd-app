const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// Container
content = content.replace(
  'className="flex flex-col h-full bg-slate-50 pb-24 overflow-y-auto font-battambang"',
  'className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 pb-24 overflow-y-auto font-battambang transition-colors duration-200"'
);

// Title
content = content.replace(
  'className="text-2xl font-bold text-slate-900 tracking-tight"',
  'className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight"'
);

// Subtitle
content = content.replace(
  "className=\"text-[15px] font-bold text-slate-800\"",
  "className=\"text-[15px] font-bold text-slate-800 dark:text-slate-200\""
);

// Stat cards
content = content.replace(
  'bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center',
  'bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-center'
);
// Replace twice (income and expense)
content = content.replace(
  'bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center',
  'bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-center'
);

// Values
content = content.replace(
  /className="text-\[17px\] font-bold text-slate-900"/g,
  'className="text-[17px] font-bold text-slate-900 dark:text-white"'
);

content = content.replace(
  /bg-emerald-50/g,
  'bg-emerald-50 dark:bg-emerald-500/20'
);

content = content.replace(
  /bg-rose-50/g,
  'bg-rose-50 dark:bg-rose-500/20'
);

// Charts Containers
content = content.replace(
  /bg-white p-4 sm:p-6 rounded-2xl shadow-\[0_2px_12px_-4px_rgba\(0,0,0,0\.06\)\] border border-gray-100/g,
  'bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] dark:shadow-none border border-gray-100 dark:border-slate-800 transition-colors'
);

content = content.replace(
  /text-gray-800/g,
  'text-gray-800 dark:text-slate-200'
);

fs.writeFileSync('src/components/Dashboard.tsx', content);
