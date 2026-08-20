const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/dark:bg-black/g, 'dark:bg-slate-950');

fs.writeFileSync('src/App.tsx', content);
