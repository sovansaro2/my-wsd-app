const fs = require('fs');
let code = fs.readFileSync('server/routers/profiles.ts', 'utf8');
code = code.replace(/const crypto = require\('crypto'\);/g, '');
if (!code.includes("import crypto from 'crypto';")) {
  code = "import crypto from 'crypto';\n" + code;
}
fs.writeFileSync('server/routers/profiles.ts', code);
