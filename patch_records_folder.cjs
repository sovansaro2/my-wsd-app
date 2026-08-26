const fs = require('fs');

let code = fs.readFileSync('src/components/Records.tsx', 'utf8');

const folderSvg = `                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-7 h-7">
                       <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" fill="#FACC15" stroke="#EAB308" strokeWidth="0.5"/>
                     </svg>`;

code = code.replace(/<Wallet className="w-6 h-6 text-blue-500" \/>/g, folderSvg);

fs.writeFileSync('src/components/Records.tsx', code);
console.log("Patched Records.tsx");
