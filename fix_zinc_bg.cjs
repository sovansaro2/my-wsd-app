const fs = require('fs');
let content = fs.readFileSync('src/components/AccountProfile.tsx', 'utf8');

content = content.replace(/bg-zinc-100/g, 'bg-zinc-100 dark:bg-slate-800');

fs.writeFileSync('src/components/AccountProfile.tsx', content);
