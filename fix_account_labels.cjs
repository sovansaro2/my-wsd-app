const fs = require('fs');
let content = fs.readFileSync('src/components/AccountProfile.tsx', 'utf8');

content = content.replace(/text-gray-700/g, 'text-gray-700 dark:text-slate-300');

// Fix double if they exist
content = content.replace(/dark:text-slate-300 dark:text-slate-300/g, 'dark:text-slate-300');

fs.writeFileSync('src/components/AccountProfile.tsx', content);
