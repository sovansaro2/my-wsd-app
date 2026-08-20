const fs = require('fs');
let code = fs.readFileSync('src/components/ManageFinancialRecords.tsx', 'utf8');

code = code.replace(/setIsSaving\(true\)/g, 'setIsSavingSeil(true)');
code = code.replace(/setIsSaving\(false\)/g, 'setIsSavingSeil(false)');

fs.writeFileSync('src/components/ManageFinancialRecords.tsx', code);
