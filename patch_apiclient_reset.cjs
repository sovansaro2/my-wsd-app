const fs = require('fs');
let content = fs.readFileSync('src/lib/apiClient.ts', 'utf8');

content = content.replace(
  `updateBalancePin: (new_pin: string, current_pin?: string) => apiFetch('/api/profiles/me/balance-pin', { method: 'PUT', body: JSON.stringify({ new_pin, current_pin }) }),`,
  `updateBalancePin: (new_pin: string, current_pin?: string) => apiFetch('/api/profiles/me/balance-pin', { method: 'PUT', body: JSON.stringify({ new_pin, current_pin }) }),
  resetBalancePin: (new_pin: string, password: string) => apiFetch('/api/profiles/me/reset-balance-pin', { method: 'PUT', body: JSON.stringify({ new_pin, password }) }),`
);

fs.writeFileSync('src/lib/apiClient.ts', content);
