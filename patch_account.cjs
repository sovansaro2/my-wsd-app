const fs = require('fs');
let code = fs.readFileSync('src/components/AccountProfile.tsx', 'utf8');

code = code.replace(/const \[phone, setPhone\] = useState\(''\);\n/g, '');
code = code.replace(/setPhone\(profile\.phone_number \|\| ''\);\n/g, '');
code = code.replace(/phone_number: phone,\n/g, '');
code = code.replace(/<div>\s*<label className="mb-1\.5 block text-sm font-medium text-gray-700 dark:text-slate-300">\{t\('profile_phone'\)\}<\/label>\s*<input\s*type="tel"\s*value=\{phone\}\s*onChange=\{\(e\) => setPhone\(e\.target\.value\)\}\s*className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800\/50 px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 focus:bg-white dark:bg-slate-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500\/20 transition-all"\s*\/>\s*<\/div>\n/g, '');

const phoneDisplayRegex = /<div className="flex items-center text-\[15px\] text-gray-500 dark:text-slate-400 mb-2\.5">\s*<span>\{phone \|\| t\('profile_no_phone'\)\}<\/span>\s*\{phone && \([\s\S]*?\}\s*<\/div>/g;
code = code.replace(phoneDisplayRegex, '');

fs.writeFileSync('src/components/AccountProfile.tsx', code);
