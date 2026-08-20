const fs = require('fs');
let content = fs.readFileSync('src/components/Auth.tsx', 'utf8');

// Container
content = content.replace(
  'className="flex flex-col h-full bg-slate-50 font-battambang"',
  'className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 font-battambang transition-colors duration-200"'
);

// Form Container
content = content.replace(
  'className="bg-white px-6 sm:px-8 py-10 pb-12 shadow-2xl rounded-t-[40px] flex-grow flex flex-col justify-center"',
  'className="bg-white dark:bg-slate-900 px-6 sm:px-8 py-10 pb-12 shadow-2xl rounded-t-[40px] flex-grow flex flex-col justify-center transition-colors"'
);

content = content.replace(
  /text-slate-900/g,
  'text-slate-900 dark:text-white'
);

content = content.replace(
  /text-slate-800/g,
  'text-slate-800 dark:text-slate-200'
);

content = content.replace(
  /text-slate-500/g,
  'text-slate-500 dark:text-slate-400'
);

// Inputs
content = content.replace(
  /bg-slate-50/g,
  'bg-slate-50 dark:bg-slate-800'
);

content = content.replace(
  /border-slate-200/g,
  'border-slate-200 dark:border-slate-700'
);

content = content.replace(
  /bg-slate-100/g,
  'bg-slate-100 dark:bg-slate-800'
);

fs.writeFileSync('src/components/Auth.tsx', content);
