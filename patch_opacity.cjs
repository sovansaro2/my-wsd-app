const fs = require('fs');
let content = fs.readFileSync('src/components/NameLists.tsx', 'utf8');

content = content.replace(
  `className="print-section absolute left-[-9999px] top-0 w-[559px] bg-white p-8"`,
  `className="print-section absolute top-0 left-0 w-[794px] bg-white p-8 opacity-0 pointer-events-none -z-50"`
);

fs.writeFileSync('src/components/NameLists.tsx', content);
