const fs = require('fs');

let code = fs.readFileSync('src/components/NameLists.tsx', 'utf8');

// The replacement for getCategoryIcon
const folderSvgIcon = `
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-7 h-7">
        <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" fill="#FACC15" stroke="#EAB308" strokeWidth="0.5"/>
      </svg>
    );
`;

const getCategoryIconRegex = /const getCategoryIcon = \(name: string\) => \{[\s\S]*?\};/m;

const newGetCategoryIcon = `const getCategoryIcon = (name: string) => {${folderSvgIcon}  };`;

code = code.replace(getCategoryIconRegex, newGetCategoryIcon);

fs.writeFileSync('src/components/NameLists.tsx', code);
console.log("Patched NameLists.tsx");
