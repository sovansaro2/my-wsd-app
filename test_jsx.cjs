const fs = require('fs');
const content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');
const match = content.match(/return \(([\s\S]*)\n\}/);
if (match) {
  let str = match[1];
  console.log("length:", str.length);
}
