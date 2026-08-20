const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/bg-orange-500\/95 backdrop-blur-md shadow-sm border-b border-orange-600\/20/g, 'bg-orange-500 dark:bg-black backdrop-blur-md shadow-sm border-b border-orange-600/20 dark:border-white/5 transition-colors duration-200');

// Make the text inside the top nav white always, or if it already is, it's fine. It's currently text-white.
fs.writeFileSync('src/App.tsx', content);
