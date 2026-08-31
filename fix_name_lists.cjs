const fs = require('fs');
let content = fs.readFileSync('server/routers/name_lists.ts', 'utf8');

// I will just add RLS checks for POST and PUT everywhere using regex

const rlsCheck = "if (!data || data.length === 0) return res.status(403).json({ detail: 'មិនអាចកែប្រែបានទេ (RLS)' });";

content = content.replace(/if \(error\) return res\.status\(400\)\.json\(\{ detail: error\.message \}\);\s+res\.json\(data\[0\]\);/g, 
  `if (error) return res.status(400).json({ detail: error.message });\n  ${rlsCheck}\n  res.json(data[0]);`);

// And for records POST
content = content.replace(/if \(error\) return res\.status\(400\)\.json\(\{ detail: error\.message \}\);\s+if \(notify_public\)/g,
  `if (error) return res.status(400).json({ detail: error.message });\n  ${rlsCheck}\n  if (notify_public)`);

fs.writeFileSync('server/routers/name_lists.ts', content);
