const fs = require('fs');
const content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');
console.log(content.includes('mt-2'));
