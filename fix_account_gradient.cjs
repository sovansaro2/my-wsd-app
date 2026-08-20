const fs = require('fs');
let content = fs.readFileSync('src/components/AccountProfile.tsx', 'utf8');

content = content.replace(/bg-gradient-to-r from-blue-50 to-indigo-50/g, 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20');
content = content.replace(/border-4 border-white/g, 'border-4 border-white dark:border-slate-800');

fs.writeFileSync('src/components/AccountProfile.tsx', content);
