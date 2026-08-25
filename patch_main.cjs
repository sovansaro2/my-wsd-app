const fs = require('fs');
let main = fs.readFileSync('src/main.tsx', 'utf8');
main = main.replace("import App from './App.tsx';", "import App from './App.tsx';\nimport { ErrorBoundary } from './ErrorBoundary.tsx';");
main = main.replace("<App />", "<ErrorBoundary><App /></ErrorBoundary>");
fs.writeFileSync('src/main.tsx', main);
