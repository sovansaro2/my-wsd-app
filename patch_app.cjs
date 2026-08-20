const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Nav Bar
content = content.replace(
  'nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2 pb-safe z-50"',
  'nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 px-6 py-2 pb-safe z-50 transition-colors duration-200"'
);

// Body wrapper - already using dark:bg-slate-900 from index.css, but if we have bg-white inside, need to change
content = content.replace(
  'className="h-full w-full max-w-lg mx-auto bg-white relative shadow-2xl overflow-hidden"',
  'className="h-full w-full max-w-lg mx-auto bg-white dark:bg-slate-950 relative shadow-2xl overflow-hidden transition-colors duration-200"'
);

fs.writeFileSync('src/App.tsx', content);
