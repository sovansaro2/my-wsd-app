const fs = require('fs');

const fixRouter = (file) => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/const useMock = !config\.SUPABASE_SERVICE_ROLE_KEY \|\| config\.SUPABASE_SERVICE_ROLE_KEY\.length < 20;/g, 'const useMock = true;');
  fs.writeFileSync(file, content);
};

fixRouter('server/routers/financial.ts');
fixRouter('server/routers/name_lists.ts');
