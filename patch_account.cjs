const fs = require('fs');
let content = fs.readFileSync('src/components/AccountProfile.tsx', 'utf8');

// Replace local state with useTheme
content = content.replace(
  "import { useLanguage } from '../contexts/LanguageContext';",
  "import { useLanguage } from '../contexts/LanguageContext';\nimport { useTheme } from '../contexts/ThemeContext';"
);

content = content.replace(
  "const [currentTheme, setCurrentTheme] = useState('light');",
  "const { theme: currentTheme, setTheme: setCurrentTheme } = useTheme();"
);

// Update dark mode button in modal (remove alert)
content = content.replace(
  "alert('មុខងារ Dark Mode នឹងមានឆាប់ៗនេះ!');",
  ""
);

content = content.replace(
  '<span className="text-[10px] text-slate-500 font-medium">Coming soon</span>',
  ''
);

content = content.replace(
  "border-slate-100 hover:border-slate-200 bg-white opacity-70",
  "border-slate-100 hover:border-slate-200 bg-white"
);

fs.writeFileSync('src/components/AccountProfile.tsx', content);
