const fs = require('fs');
let content = fs.readFileSync('src/components/NameLists.tsx', 'utf8');
content = content.replace(/hover:bg-rose-50/g, 'hover:bg-rose-50 dark:hover:bg-rose-900/30');
fs.writeFileSync('src/components/NameLists.tsx', content);

content = fs.readFileSync('src/components/Records.tsx', 'utf8');
content = content.replace(/hover:bg-rose-50/g, 'hover:bg-rose-50 dark:hover:bg-rose-900/30');
fs.writeFileSync('src/components/Records.tsx', content);
