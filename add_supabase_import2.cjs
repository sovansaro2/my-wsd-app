const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/components/**/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('supabase.') || content.includes('supabase(')) {
    if (!content.includes("import { supabase }")) {
      content = "import { supabase } from '../lib/supabase';\n" + content;
      fs.writeFileSync(file, content);
    }
  }
});
console.log("Added supabase imports");
