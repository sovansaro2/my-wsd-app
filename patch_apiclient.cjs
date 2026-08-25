const fs = require('fs');
let content = fs.readFileSync('src/lib/apiClient.ts', 'utf8');

const newMethods = `
  verifyBalancePin: (pin: string) => apiFetch('/api/profiles/me/verify-pin', { method: 'POST', body: JSON.stringify({ pin }) }),
  updateBalancePin: (new_pin: string, current_pin?: string) => apiFetch('/api/profiles/me/balance-pin', { method: 'PUT', body: JSON.stringify({ new_pin, current_pin }) }),
`;

content = content.replace(
  `updateProfile: (data: any) => apiFetch('/api/profiles/me', { method: 'PUT', body: JSON.stringify(data) }),`,
  `updateProfile: (data: any) => apiFetch('/api/profiles/me', { method: 'PUT', body: JSON.stringify(data) }),\n${newMethods}`
);

fs.writeFileSync('src/lib/apiClient.ts', content);
console.log('Patched apiClient.ts');
