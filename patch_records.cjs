const fs = require('fs');
let content = fs.readFileSync('src/components/Records.tsx', 'utf8');

// Container
content = content.replace(
  'className="flex flex-col h-full bg-slate-50 pb-24 font-battambang"',
  'className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 pb-24 font-battambang transition-colors duration-200"'
);

// Header
content = content.replace(
  'className="bg-white shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] z-10 sticky top-0 border-b border-slate-100"',
  'className="bg-white dark:bg-slate-900 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] z-10 sticky top-0 border-b border-slate-100 dark:border-slate-800 transition-colors"'
);

// List items
content = content.replace(
  /className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100/g,
  'className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800'
);

content = content.replace(
  /text-slate-800/g,
  'text-slate-800 dark:text-slate-200'
);

content = content.replace(
  /text-slate-900/g,
  'text-slate-900 dark:text-white'
);

// Dropdown/Filter
content = content.replace(
  'className="w-full bg-slate-100/70 border-none text-slate-800 text-[15px] rounded-xl pl-11 pr-10 py-3 sm:py-3.5 appearance-none focus:ring-2 focus:ring-indigo-500/20 font-bold"',
  'className="w-full bg-slate-100/70 dark:bg-slate-800 border-none text-slate-800 dark:text-slate-200 text-[15px] rounded-xl pl-11 pr-10 py-3 sm:py-3.5 appearance-none focus:ring-2 focus:ring-indigo-500/20 font-bold"'
);

fs.writeFileSync('src/components/Records.tsx', content);
