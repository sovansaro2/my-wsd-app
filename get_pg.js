import fs from 'fs';
const configStr = fs.readFileSync('server/config.ts', 'utf8');
const urlMatch = configStr.match(/SUPABASE_URL.*?\|\|\s*'([^']+)'/);
const keyMatch = configStr.match(/SUPABASE_SERVICE_ROLE_KEY.*?\|\|\s*'([^']+)'/);
console.log("URL:", urlMatch ? urlMatch[1] : '');
// We won't log the key for privacy/security but we can check if it exists
console.log("Key exists?", !!keyMatch);
