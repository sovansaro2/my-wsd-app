const fs = require('fs');
let content = fs.readFileSync('src/components/AccountProfile.tsx', 'utf8');

// Container
content = content.replace(
  'className="flex flex-col h-full bg-slate-50 pb-24 overflow-y-auto"',
  'className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 pb-24 overflow-y-auto transition-colors duration-200"'
);

// Header
content = content.replace(
  'className="bg-white px-6 py-8 pb-10 border-b border-gray-100 shadow-sm"',
  'className="bg-white dark:bg-slate-900 px-6 py-8 pb-10 border-b border-gray-100 dark:border-slate-800 shadow-sm transition-colors duration-200"'
);

// Title
content = content.replace(
  'className="text-2xl font-bold text-gray-900 mb-1 font-battambang"',
  'className="text-2xl font-bold text-gray-900 dark:text-white mb-1 font-battambang"'
);

content = content.replace(
  'className="text-sm font-medium text-gray-500 font-battambang"',
  'className="text-sm font-medium text-gray-500 dark:text-slate-400 font-battambang"'
);

content = content.replace(
  'className="bg-orange-50 p-4 rounded-[20px] flex items-center justify-between border border-orange-100/50"',
  'className="bg-orange-50 dark:bg-orange-500/10 p-4 rounded-[20px] flex items-center justify-between border border-orange-100/50 dark:border-orange-500/20"'
);

// Menus container
content = content.replace(
  'className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"',
  'className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors"'
);
content = content.replace(
  'className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"',
  'className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors"'
);

// Text colors in menus
content = content.replace(
  /text-gray-800/g,
  'text-gray-800 dark:text-slate-200'
);

// Text colors in modas
content = content.replace(
  /text-gray-900/g,
  'text-gray-900 dark:text-white'
);

// Modal backgrounds
content = content.replace(
  /bg-white rounded-3xl/g,
  'bg-white dark:bg-slate-900 rounded-3xl'
);
content = content.replace(
  /bg-white rounded-\[24px\]/g,
  'bg-white dark:bg-slate-900 rounded-[24px]'
);

// Modal hover
content = content.replace(
  /hover:bg-gray-50\/50/g,
  'hover:bg-gray-50/50 dark:hover:bg-slate-800/50'
);

content = content.replace(
  /bg-gray-50/g,
  'bg-gray-50 dark:bg-slate-800'
);

content = content.replace(
  /bg-gray-100/g,
  'bg-gray-100 dark:bg-slate-800'
);

fs.writeFileSync('src/components/AccountProfile.tsx', content);
