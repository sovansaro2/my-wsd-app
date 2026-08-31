const fs = require('fs');
let content = fs.readFileSync('server/routers/financial.ts', 'utf8');

const rlsCheck = "if (!data || data.length === 0) return res.status(403).json({ detail: 'មានបញ្ហាក្នុងការរក្សាទុកទិន្នន័យ (RLS) សូមពិនិត្យមើល Service Role Key' });";

content = content.replace(/if \(error\) return res\.status\(400\)\.json\(\{ detail: error\.message \}\);\s+res\.json\(data\[0\]\);/g, 
  `if (error) return res.status(400).json({ detail: error.message });\n  ${rlsCheck}\n  res.json(data[0]);`);

// For financial records POST
content = content.replace(/if \(error\) return res\.status\(400\)\.json\(\{ detail: error\.message \}\);\s+if \(notify_public\)/g,
  `if (error) return res.status(400).json({ detail: error.message });\n  ${rlsCheck}\n  if (notify_public)`);

fs.writeFileSync('server/routers/financial.ts', content);
