const fs = require('fs');
let content = fs.readFileSync('src/components/Reports.tsx', 'utf8');
content = content.replace('File, X', 'File as FileIcon, X');
content = content.replace('<File className=', '<FileIcon className=');
fs.writeFileSync('src/components/Reports.tsx', content);
