const fs = require('fs');
let content = fs.readFileSync('src/components/NameLists.tsx', 'utf8');

content = content.replace(/text-zinc-900/g, 'text-zinc-900 dark:text-white');
content = content.replace(/text-zinc-500/g, 'text-zinc-500 dark:text-slate-400');
content = content.replace(/text-zinc-400/g, 'text-zinc-400 dark:text-slate-500');
content = content.replace(/hover:text-zinc-900 dark:text-white/g, 'hover:text-zinc-900 dark:hover:text-white'); // Fix any double from the first replace
content = content.replace(/hover:text-zinc-900/g, 'hover:text-zinc-900 dark:hover:text-white');
content = content.replace(/hover:bg-zinc-100/g, 'hover:bg-zinc-100 dark:hover:bg-slate-700');

fs.writeFileSync('src/components/NameLists.tsx', content);
