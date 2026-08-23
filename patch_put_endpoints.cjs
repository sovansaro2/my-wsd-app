const fs = require('fs');

// Patch name_lists.ts
let nameListsContent = fs.readFileSync('server/routers/name_lists.ts', 'utf8');
nameListsContent = nameListsContent.replace(
`  if (error && (error.code === '42703' || (error.message && error.message.includes('is_100k_donor')))) {
    delete (recordBody as any).is_100k_donor;
    const retry = await supabaseAdmin.from('name_list_records').update(recordBody).eq('id', req.params.id).select();
    data = retry.data;
    error = retry.error;
  }`,
`  if (error && (error.code === '42703' || (error.message && error.message.includes('is_100k_donor')))) {
    delete (recordBody as any).is_100k_donor;
    if (Object.keys(recordBody).length === 0) {
      const existing = await supabaseAdmin.from('name_list_records').select('*').eq('id', req.params.id);
      data = existing.data;
      error = existing.error;
    } else {
      const retry = await supabaseAdmin.from('name_list_records').update(recordBody).eq('id', req.params.id).select();
      data = retry.data;
      error = retry.error;
    }
  }`
);
fs.writeFileSync('server/routers/name_lists.ts', nameListsContent);

// Patch financial.ts
let financialContent = fs.readFileSync('server/routers/financial.ts', 'utf8');
financialContent = financialContent.replace(
`  if (error && (error.code === '42703' || (error.message && error.message.includes('is_high_level')))) {
    delete recordBody.is_high_level;
    const retry = await supabaseAdmin.from('financial_records').update(recordBody).eq('id', req.params.id).select();
    data = retry.data;
    error = retry.error;
  }`,
`  if (error && (error.code === '42703' || (error.message && error.message.includes('is_high_level')))) {
    delete (recordBody as any).is_high_level;
    if (Object.keys(recordBody).length === 0) {
      const existing = await supabaseAdmin.from('financial_records').select('*').eq('id', req.params.id);
      data = existing.data;
      error = existing.error;
    } else {
      const retry = await supabaseAdmin.from('financial_records').update(recordBody).eq('id', req.params.id).select();
      data = retry.data;
      error = retry.error;
    }
  }`
);
fs.writeFileSync('server/routers/financial.ts', financialContent);

console.log("Patched successfully!");
