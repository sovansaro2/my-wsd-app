const fs = require('fs');
let content = fs.readFileSync('src/components/NameLists.tsx', 'utf8');
content = content.replace(/dark:bg-slate-900 px-4 py-5 shadow-sm dark:shadow-none border-b/g, 'dark:bg-slate-950 px-4 py-5 shadow-sm dark:shadow-none border-b');
fs.writeFileSync('src/components/NameLists.tsx', content);

content = fs.readFileSync('src/components/AccountProfile.tsx', 'utf8');
content = content.replace(/dark:bg-slate-900 transition-colors duration-200 border-b border-gray-100 dark:border-slate-800 shadow-sm sticky top-0/g, 'dark:bg-slate-950 transition-colors duration-200 border-b border-gray-100 dark:border-slate-800 shadow-sm sticky top-0');
fs.writeFileSync('src/components/AccountProfile.tsx', content);

