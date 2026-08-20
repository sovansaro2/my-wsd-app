const fs = require('fs');
let content = fs.readFileSync('src/components/AccountProfile.tsx', 'utf8');

content = content.replace(/border-gray-300 bg-gray-50 dark:bg-slate-800 px-4 py-3 text-gray-900 dark:text-white/g, 'border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 px-4 py-3 text-gray-900 dark:text-white');

fs.writeFileSync('src/components/AccountProfile.tsx', content);
