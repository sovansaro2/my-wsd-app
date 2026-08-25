const fs = require('fs');
let content = fs.readFileSync('src/components/NameLists.tsx', 'utf8');
content = content.replace('Map, Users', 'Map as MapIcon, Users');
content = content.replace('<Map className=', '<MapIcon className=');
fs.writeFileSync('src/components/NameLists.tsx', content);
