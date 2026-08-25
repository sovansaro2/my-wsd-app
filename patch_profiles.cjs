const fs = require('fs');
let code = fs.readFileSync('server/routers/profiles.ts', 'utf8');
code = code.replace(
  'await supabaseAdmin.auth.admin.updateUserById(req.params.id, {',
  'await supabaseAdmin.auth.admin.updateUserById(String(req.params.id), {'
);
fs.writeFileSync('server/routers/profiles.ts', code);
