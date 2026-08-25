const fs = require('fs');
let content = fs.readFileSync('src/lib/apiClient.ts', 'utf8');

content = content.replace(
  `verifyOtp: (email: string, otp: string) => apiFetch('/api/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) }),`,
  `verifyOtp: (email: string, otp: string) => apiFetch('/api/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) }),\n  verifyPassword: (password: string) => apiFetch('/api/auth/verify-password', { method: 'POST', body: JSON.stringify({ password }) }),`
);

fs.writeFileSync('src/lib/apiClient.ts', content);
