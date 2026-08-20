const fs = require('fs');
let content = fs.readFileSync('src/components/InstallPrompt.tsx', 'utf8');

content = content.replace(/text-gray-900/g, 'text-gray-900 dark:text-white');
content = content.replace(/text-gray-600/g, 'text-gray-600 dark:text-slate-300');
content = content.replace(/text-gray-500/g, 'text-gray-500 dark:text-slate-400');
content = content.replace(/text-gray-700/g, 'text-gray-700 dark:text-slate-300');
content = content.replace(/text-gray-800/g, 'text-gray-800 dark:text-slate-200');
content = content.replace(/bg-white/g, 'bg-white dark:bg-slate-900');
content = content.replace(/bg-gray-50/g, 'bg-gray-50 dark:bg-slate-800');
content = content.replace(/bg-gray-100/g, 'bg-gray-100 dark:bg-slate-800');
content = content.replace(/border-gray-100/g, 'border-gray-100 dark:border-slate-800');
content = content.replace(/border-gray-200/g, 'border-gray-200 dark:border-slate-700');

fs.writeFileSync('src/components/InstallPrompt.tsx', content);
