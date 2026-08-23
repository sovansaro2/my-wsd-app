const fs = require('fs');
let content = fs.readFileSync('src/contexts/LanguageContext.tsx', 'utf8');

content = content.replace(/records_description: 'បរិយាយ \(ឈ្មោះ\/មុខទំនិញ\)',\n    records_description_ph: 'ឧ\. លោកយាយ ក, ទិញទឹកសុទ្ធ\.\.\.',/, 
`records_description_income: 'ឈ្មោះសប្បុរសជន',
    records_description_income_ph: 'សូមបញ្ជូលឈ្មោះ',
    records_description_expense: 'បរិយាយ (មុខទំនិញ)',
    records_description_expense_ph: 'ឧ. ទិញទឹកសុទ្ធ...',`);

content = content.replace(/records_amount: 'ចំនួនទឹកប្រាក់ \(រៀល\)',\n    records_amount_ph: 'ឧ\. 100000',/,
`records_amount: 'ចំនួនទឹកប្រាក់ (រៀល)',
    records_amount_ph: '00,000',`);

content = content.replace(/records_description: 'Description \(Name\/Item\)',\n    records_description_ph: 'Ex: Grandma A, Bought Water\.\.\.',/,
`records_description_income: 'Donor Name',
    records_description_income_ph: 'Enter name',
    records_description_expense: 'Description (Item)',
    records_description_expense_ph: 'Ex: Bought Water...',`);

content = content.replace(/records_amount: 'Amount \(Riel\)',\n    records_amount_ph: 'Ex: 100000',/,
`records_amount: 'Amount (Riel)',
    records_amount_ph: '00,000',`);

fs.writeFileSync('src/contexts/LanguageContext.tsx', content);
console.log('Language context patched');
