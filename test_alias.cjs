const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');
content = content.replace('Lock, Settings', 'Lock as LockIcon, Settings');
content = content.replace('<Lock ', '<LockIcon ');
fs.writeFileSync('src/components/Dashboard.tsx', content);
