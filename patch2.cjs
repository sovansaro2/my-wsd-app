const fs = require('fs');
let content = fs.readFileSync('src/components/NameLists.tsx', 'utf8');

content = content.replace(
  `<Download className="w-5 h-5" />`,
  `{isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}`
);

fs.writeFileSync('src/components/NameLists.tsx', content);
