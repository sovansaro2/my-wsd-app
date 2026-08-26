const fs = require('fs');
let code = fs.readFileSync('src/contexts/LanguageContext.tsx', 'utf8');

code = code.replace(/profile_settings: 'ការកំណត់',/, "profile_settings: 'ការគ្រប់គ្រង',");
code = code.replace(/profile_others: 'ផ្សេងៗ',/, "profile_others: 'ការកំណត់',");

code = code.replace(/profile_settings: 'Settings',/, "profile_settings: 'Management',");
code = code.replace(/profile_others: 'Others',/, "profile_others: 'Settings',");

fs.writeFileSync('src/contexts/LanguageContext.tsx', code);
