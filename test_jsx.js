const fs = require('fs');
const content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');
const match = content.match(/return \(([\s\S]*?)\);\n\}/);
if (match) {
  let depth = 0;
  let code = match[1];
  // Simplistic tag counter
  const openTags = code.match(/<[A-Za-z]+[^>]*(?<!\/)>/g) || [];
  const closeTags = code.match(/<\/[A-Za-z]+>/g) || [];
  console.log('Open tags:', openTags.length);
  console.log('Close tags:', closeTags.length);
}
