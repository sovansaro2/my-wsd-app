const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/border-orange-500"><\/span>/g, 'border-orange-500 dark:border-black"></span>');

fs.writeFileSync('src/App.tsx', content);
