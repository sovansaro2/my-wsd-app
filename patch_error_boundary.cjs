const fs = require('fs');
let code = fs.readFileSync('src/ErrorBoundary.tsx', 'utf8');
code = code.replace(
  'export class ErrorBoundary extends React.Component {',
  'export class ErrorBoundary extends React.Component<any, any> {'
);
fs.writeFileSync('src/ErrorBoundary.tsx', code);
