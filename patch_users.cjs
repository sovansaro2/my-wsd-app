const fs = require('fs');
let code = fs.readFileSync('src/components/Users.tsx', 'utf8');
code = code.replace(
  /\(user\.email\?\.toLowerCase\(\) \|\| ''\)\.includes\(searchQuery\.toLowerCase\(\)\) \|\|/g,
  "(user.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())"
);
fs.writeFileSync('src/components/Users.tsx', code);
