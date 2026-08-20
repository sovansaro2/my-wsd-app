const fs = require('fs');
let content = fs.readFileSync('server/config.ts', 'utf8');
content = content.replace(/process\.env\.VITE_SUPABASE_ANON_KEY \|\| /g, '');
fs.writeFileSync('server/config.ts', content);
