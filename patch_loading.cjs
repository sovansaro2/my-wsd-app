const fs = require('fs');
let code = fs.readFileSync('src/components/ui/LoadingScreen.tsx', 'utf8');

code = code.replace(
  'bg-[#FAFAFA] text-zinc-900',
  'bg-[#FAFAFA] dark:bg-slate-900 text-zinc-900 dark:text-white'
);

fs.writeFileSync('src/components/ui/LoadingScreen.tsx', code);
